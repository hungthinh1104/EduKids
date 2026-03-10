import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
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
    super({
      adapter,
      log: ["query", "error"],
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log("✅ Database connected");
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log("❌ Database disconnected");
  }
}
