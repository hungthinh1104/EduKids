import { SystemConfigEntity } from "../entities/system-config.entity";

export interface ISystemRepository {
  getConfig(key: string): Promise<SystemConfigEntity | null>;
  getAllConfigs(): Promise<SystemConfigEntity[]>;
  setConfig(key: string, value: string): Promise<SystemConfigEntity>;
}
