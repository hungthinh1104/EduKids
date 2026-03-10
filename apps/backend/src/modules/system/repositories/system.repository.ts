import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { SystemConfigEntity } from "../entities/system-config.entity";
import { ISystemRepository } from "./system.repository.interface";

@Injectable()
export class SystemRepository implements ISystemRepository {
  constructor(private prisma: PrismaService) {}

  async getConfig(_key: string): Promise<SystemConfigEntity | null> {
    // TODO: Implement getConfig
    return null;
  }

  async getAllConfigs(): Promise<SystemConfigEntity[]> {
    // TODO: Implement getAllConfigs
    return [];
  }

  async setConfig(key: string, value: string): Promise<SystemConfigEntity> {
    // TODO: Implement setConfig
    return { key, value };
  }
}
