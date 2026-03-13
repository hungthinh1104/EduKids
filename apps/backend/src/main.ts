import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import {
  Registry,
  Counter,
  Gauge,
  Histogram,
  collectDefaultMetrics,
} from "prom-client";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const httpAdapter = app.getHttpAdapter().getInstance();
  const isProduction = process.env.NODE_ENV === "production";
  const metricsEnabled = process.env.METRICS_ENABLED === "true" || !isProduction;

  httpAdapter.disable?.("x-powered-by");

  httpAdapter.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-DNS-Prefetch-Control", "off");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  });

  // Prometheus metrics registry (single-process)
  const metricsRegistry = new Registry();
  collectDefaultMetrics({
    register: metricsRegistry,
    prefix: "edukids_backend_",
  });

  const httpRequestsTotal = new Counter({
    name: "edukids_http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status_code"] as const,
    registers: [metricsRegistry],
  });

  const httpRequestDuration = new Histogram({
    name: "edukids_http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status_code"] as const,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    registers: [metricsRegistry],
  });

  const httpRequestsInFlight = new Gauge({
    name: "edukids_http_requests_in_flight",
    help: "Current number of in-flight HTTP requests",
    labelNames: ["method", "route"] as const,
    registers: [metricsRegistry],
  });

  if (metricsEnabled) {
    httpAdapter.use((req, res, next) => {
      // Ignore metrics endpoint itself to avoid self-scrape noise
      if (req.path === "/api/metrics") {
        next();
        return;
      }

      const method = req.method;
      const start = process.hrtime.bigint();
      const routeForInFlight = req.path || "unknown";
      httpRequestsInFlight.inc({ method, route: routeForInFlight });

      res.on("finish", () => {
        const statusCode = String(res.statusCode);
        const resolvedRoute = req.route?.path
          ? `${req.baseUrl || ""}${req.route.path}`
          : req.path || "unknown";
        const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;

        httpRequestsInFlight.dec({ method, route: routeForInFlight });
        httpRequestsTotal.inc({ method, route: resolvedRoute, status_code: statusCode });
        httpRequestDuration.observe(
          { method, route: resolvedRoute, status_code: statusCode },
          durationSeconds,
        );
      });

      next();
    });

    httpAdapter.get("/api/metrics", async (_req, res) => {
      res.setHeader("Content-Type", metricsRegistry.contentType);
      res.end(await metricsRegistry.metrics());
    });
  }

  const configuredOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const allowedOrigins = new Set([
    ...configuredOrigins,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);

  // CORS configuration - MUST be set before global prefix
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      console.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global prefix for API
  app.setGlobalPrefix("api");

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global response interceptor for standardized format
  app.useGlobalInterceptors(new ResponseInterceptor());

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  if (metricsEnabled) {
    console.log(`📈 Metrics Endpoint: http://localhost:${port}/api/metrics`);
  }
}

bootstrap();
