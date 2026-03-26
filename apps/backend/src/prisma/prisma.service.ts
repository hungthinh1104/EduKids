import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
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
    // Query logs are noisy and can leak SQL details. Keep them off by default
    // for all environments, and only enable when troubleshooting.
    const prismaQueryLogEnabled = process.env.PRISMA_LOG_QUERY === "true";
    super({
      adapter,
      log: prismaQueryLogEnabled
        ? ["query", "warn", "error"]
        : ["warn", "error"],
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
