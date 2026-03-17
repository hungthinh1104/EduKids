import { Injectable, NotFoundException } from "@nestjs/common";
import * as Sentry from "@sentry/nestjs";

@Injectable()
export class SystemService {
  getHealth() {
    return {
      status: "ok",
      service: "edukids-backend",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      monitoring: {
        sentryEnabled: Boolean(process.env.SENTRY_DSN),
      },
    };
  }

  getVersion() {
    return {
      name: "edukids-backend",
      version: process.env.npm_package_version || "1.0.0",
      node: process.version,
      environment: process.env.NODE_ENV || "development",
    };
  }

  getFeatureFlags() {
    return {
      vocabularyReview: true,
      flashcard: true,
      quiz: true,
      gamification: true,
      pronunciation: false,
      analytics: false,
    };
  }

  debugSentry() {
    if (process.env.SENTRY_DEBUG_ENDPOINT_ENABLED !== "true") {
      throw new NotFoundException("Endpoint not found");
    }

    Sentry.captureException(new Error("Manual Sentry debug test"));
    Sentry.logger.info("Manual Sentry debug endpoint triggered", {
      action: "debug_sentry",
      service: "edukids-backend",
    });

    return {
      success: true,
      message: "Sentry test event submitted",
    };
  }
}
