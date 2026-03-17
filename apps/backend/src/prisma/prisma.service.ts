import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  constructor() {
    const datasourceUrl = process.env.DATABASE_URL;
    const useSsl =
      process.env.DB_SSL === "true" ||
      !(datasourceUrl || "").includes("localhost");

    const pool = new Pool({
      connectionString: datasourceUrl,
      max: 5,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    });

    const adapter = new PrismaPg(pool);
    // In production, only log warnings and errors — logging "query" emits every
    // SQL statement to stdout which leaks schema details and adds I/O overhead.
    const isProduction = process.env.NODE_ENV === "production";
    super({
      adapter,
      log: isProduction ? ["warn", "error"] : ["query", "warn", "error"],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log("Database connected");
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log("Database disconnected");
  }
}
