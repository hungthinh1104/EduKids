import "./instrument";
import { NestFactory } from "@nestjs/core";
import { RequestMethod, ValidationPipe, Logger } from "@nestjs/common";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { SentryContextInterceptor } from "./common/interceptors/sentry-context.interceptor";
import helmet from "helmet";
import express from "express";
import {
  Registry,
  Counter,
  Gauge,
  Histogram,
  collectDefaultMetrics,
} from "prom-client";

function isPlaceholder(value: string) {
  const normalized = value.trim();
  if (!normalized) return true;

  return (
    normalized.includes("<") ||
    normalized.includes(">") ||
    /^(change_me|replace_me|your_|example|test|dummy)/i.test(normalized)
  );
}

function validateCriticalEnv(logger: Logger) {
  const requiredInProduction = [
    "JWT_SECRET",
    "DATABASE_URL",
    "REDIS_URL",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];

  const missingOrInvalid = requiredInProduction.filter((key) => {
    const value = process.env[key] || "";
    return isPlaceholder(value);
  });

  if (missingOrInvalid.length > 0) {
    throw new Error(
      `Invalid production environment variables: ${missingOrInvalid.join(", ")}. ` +
        "Use real secrets from secure secret manager (not placeholders).",
    );
  }

  logger.log("Production environment validation passed");
}

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || "10mb";

  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });
  const httpAdapter = app.getHttpAdapter().getInstance();
  const isProduction = process.env.NODE_ENV === "production";
  const metricsEnabled = process.env.METRICS_ENABLED === "true" || !isProduction;
  const metricsToken = process.env.METRICS_TOKEN?.trim() || "";

  if (isProduction) {
    validateCriticalEnv(logger);
  }

  app.use(express.json({ limit: requestBodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: requestBodyLimit }));
  logger.log(`Request body limit configured: ${requestBodyLimit}`);

  // ── Security: Helmet (HSTS, CSP, X-Frame-Options, etc.) ──────────────────
  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:", "https:"],
              connectSrc: ["'self'"],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              upgradeInsecureRequests: [],
            },
          }
        : false, // Disable CSP in dev so Swagger UI works
      hsts: isProduction
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
      crossOriginEmbedderPolicy: false, // Needed for Swagger UI assets
    }),
  );

  httpAdapter.disable?.("x-powered-by");

  httpAdapter.use((req, res, next) => {
    // Remaining manual headers not covered by helmet above
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

    httpAdapter.get("/api/metrics", async (req, res) => {
      // Require bearer token in production when METRICS_TOKEN is configured
      if (isProduction && metricsToken) {
        const authHeader: string = req.headers["authorization"] || "";
        const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
        if (provided !== metricsToken) {
          res.statusCode = 401;
          res.setHeader("WWW-Authenticate", 'Bearer realm="metrics"');
          res.end("Unauthorized");
          return;
        }
      }
      res.setHeader("Content-Type", metricsRegistry.contentType);
      res.end(await metricsRegistry.metrics());
    });
  }

  const defaultCorsOrigins =
    process.env.NODE_ENV === "production"
      ? ""
      : "http://localhost:3000,http://127.0.0.1:3000";

  const normalizeOrigin = (value: string) => value.trim().replace(/\/+$/, "").toLowerCase();

  const configuredOriginEntries = [
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL,
    defaultCorsOrigins,
  ]
    .filter(Boolean)
    .flatMap((entry) => (entry || "").split(","))
    .map((origin) => origin.trim())
    .filter(Boolean);

  const exactAllowedOrigins = new Set(
    configuredOriginEntries
      .filter((origin) => !origin.includes("*"))
      .map((origin) => normalizeOrigin(origin)),
  );

  const wildcardAllowedOrigins = configuredOriginEntries
    .filter((origin) => origin.includes("*"))
    .map((origin) => {
      const normalized = normalizeOrigin(origin)
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*");
      return new RegExp(`^${normalized}$`);
    });

  logger.log(
    `CORS whitelist (exact=${exactAllowedOrigins.size}, wildcard=${wildcardAllowedOrigins.length})`,
  );

  // CORS configuration - MUST be set before global prefix
  app.enableCors({
    origin: (origin, callback) => {
      // In production: block requests with no Origin header
      // In dev: allow no-origin (Postman, curl, etc.)
      if (!origin) {
        if (isProduction) {
          callback(null, false);
          return;
        }
        callback(null, true);
        return;
      }

      const normalizedRequestOrigin = normalizeOrigin(origin);
      const exactMatch = exactAllowedOrigins.has(normalizedRequestOrigin);
      const wildcardMatch = wildcardAllowedOrigins.some((pattern) =>
        pattern.test(normalizedRequestOrigin),
      );

      if (exactMatch || wildcardMatch) {
        callback(null, true);
        return;
      }

      logger.warn(`CORS blocked for origin: ${origin}`);
      callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global prefix for API (except root landing endpoint)
  app.setGlobalPrefix("api", {
    exclude: [{ path: "/", method: RequestMethod.GET }],
  });

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
  app.useGlobalInterceptors(
    new SentryContextInterceptor(),
    new ResponseInterceptor(),
  );

  const bindHost = process.env.APP_HOST || "0.0.0.0";
  const port = process.env.PORT || 3001;
  await app.listen(port, bindHost);

  const publicApiBase = process.env.PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  const metricsPublicUrl = publicApiBase
    ? `${publicApiBase}${publicApiBase.endsWith("/api") ? "" : "/api"}/metrics`
    : `http://${bindHost}:${port}/api/metrics`;

  if (publicApiBase) {
    logger.log(`Application is running on: ${publicApiBase}`);
  } else {
    logger.log(`Application is running on: http://${bindHost}:${port}`);
  }

  if (metricsEnabled) {
    logger.log(`Metrics Endpoint: ${metricsPublicUrl}`);
  }
}

bootstrap();
