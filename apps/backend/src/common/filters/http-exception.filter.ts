import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import * as Sentry from "@sentry/nestjs";
import { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const isPayloadTooLarge =
      exception instanceof Error &&
      (exception.name === "PayloadTooLargeError" ||
        exception.message.toLowerCase().includes("request entity too large"));
    const status = isHttpException
      ? exception.getStatus()
      : isPayloadTooLarge
        ? HttpStatus.PAYLOAD_TOO_LARGE
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = isHttpException
      ? exception.message
      : isPayloadTooLarge
        ? "Request body too large"
        : "Internal server error";

    // Only report 5xx errors to Sentry — 4xx (401/403/404/422) are expected
    // client errors and create noise in the Sentry dashboard.
    if (status >= 500) {
      Sentry.captureException(exception);
    }

    if (!isHttpException) {
      this.logger.error(
        `Unhandled exception: ${String(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
