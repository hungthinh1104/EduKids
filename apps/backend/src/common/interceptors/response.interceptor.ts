import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface ApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  data?: T;
  timestamp?: string;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<ApiResponse<unknown> | unknown> {
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;

        // If already wrapped, return as-is
        if (data && typeof data === "object" && "statusCode" in data) {
          return data;
        }

        // Standard response wrapper
        return {
          statusCode,
          message: this.getDefaultMessage(statusCode),
          data: data || null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }

  private getDefaultMessage(statusCode: number): string {
    const messages = {
      200: "Success",
      201: "Created",
      204: "No Content",
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      409: "Conflict",
      429: "Too Many Requests",
      500: "Internal Server Error",
    };
    return messages[statusCode] || "Unknown";
  }
}
