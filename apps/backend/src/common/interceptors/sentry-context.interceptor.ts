import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import * as Sentry from "@sentry/nestjs";
import { Observable } from "rxjs";

type RequestLike = {
  method?: string;
  originalUrl?: string;
  route?: { path?: string };
  baseUrl?: string;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  user?: {
    sub?: number;
    userId?: number;
    childId?: number;
    email?: string;
    role?: string;
  };
};

@Injectable()
export class SentryContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestLike>();
    const scope = Sentry.getIsolationScope();
    const resolvedRoute = request.route?.path
      ? `${request.baseUrl || ""}${request.route.path}`
      : request.originalUrl || "unknown";

    scope.setTag("service", "edukids-backend");
    scope.setTag("http.method", request.method || "UNKNOWN");
    scope.setTag("http.route", resolvedRoute);

    if (request.user?.role) {
      scope.setTag("auth.role", request.user.role);
    }

    if (request.user) {
      const userId = request.user.userId ?? request.user.sub;
      scope.setUser({
        id: userId ? String(userId) : undefined,
        email: request.user.email,
        role: request.user.role,
        childId:
          typeof request.user.childId === "number"
            ? String(request.user.childId)
            : undefined,
      });
    }

    scope.setContext("request", {
      method: request.method,
      route: resolvedRoute,
      params: request.params,
      query: request.query,
    });

    return next.handle();
  }
}
