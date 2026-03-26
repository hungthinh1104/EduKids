import * as Sentry from "@sentry/nestjs";
import { HttpException } from "@nestjs/common";

function parseSampleRate(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, parsed));
}

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    // Tag each error with the exact git SHA / release version so you can
    // pinpoint which deploy introduced a regression in the Sentry UI.
    release:
      process.env.SENTRY_RELEASE ||
      process.env.npm_package_version ||
      undefined,
    enableLogs: true,
    sendDefaultPii: false,
    tracesSampleRate: parseSampleRate(
      process.env.SENTRY_TRACES_SAMPLE_RATE,
      process.env.NODE_ENV === "production" ? 0.1 : 1,
    ),
    environment:
      process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
    // Safety net: never send expected 4xx client errors to Sentry even if
    // something accidentally calls captureException for them upstream.
    beforeSend(event, hint) {
      const err = hint?.originalException;
      if (err instanceof HttpException && err.getStatus() < 500) {
        return null;
      }
      return event;
    },
  });
}
