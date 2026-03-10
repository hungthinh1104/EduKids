import { Injectable } from "@nestjs/common";

@Injectable()
export class SystemService {
  getHealth() {
    return {
      status: "ok",
      service: "edukids-backend",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
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
}
