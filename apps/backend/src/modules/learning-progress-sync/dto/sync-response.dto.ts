import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
  IsISO8601,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * Sync state response with current progress
 */
export class SyncStateDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsNumber()
  syncTimestamp: number;

  @IsNumber()
  clientTimestamp: number;

  @IsNumber()
  @IsOptional()
  starPoints?: number;

  @IsArray()
  @IsOptional()
  badges?: string[];

  @IsNumber()
  @IsOptional()
  totalScore?: number;

  @IsNumber()
  @IsOptional()
  currentStreak?: number;

  @IsString()
  @IsOptional()
  syncStatus?: "SUCCESS" | "CONFLICT" | "FAILED";

  @IsString()
  @IsOptional()
  message?: string;
}

/**
 * Conflict information
 */
export class ConflictDto {
  @IsString()
  @IsNotEmpty()
  conflictId: string;

  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  type: string; // Type of conflict (e.g., 'STAR_POINTS_DISCREPANCY')

  @IsNumber()
  serverValue: number;

  @IsNumber()
  clientValue: number;

  @IsNumber()
  serverTimestamp: number;

  @IsNumber()
  clientTimestamp: number;

  @IsString()
  resolvedValue: string; // Resolution: 'SERVER' | 'CLIENT' | 'MERGE'

  @IsString()
  @IsOptional()
  reason?: string;

  @IsISO8601()
  resolvedAt: string;
}

/**
 * Sync conflict response
 */
export class SyncConflictResponseDto {
  @IsString()
  @IsNotEmpty()
  conflictId: string;

  @IsString()
  type: string;

  @ValidateNested()
  @Type(() => ConflictDto)
  conflict: ConflictDto;

  @IsString()
  @IsOptional()
  suggestedResolution?: string;

  @IsNumber()
  @IsOptional()
  retryAfter?: number; // Milliseconds to wait before retry
}

/**
 * Sync acknowledgment
 */
export class SyncAcknowledgmentDto {
  @IsString()
  @IsNotEmpty()
  updateId: string;

  @IsString()
  @IsNotEmpty()
  status: "RECEIVED" | "PROCESSING" | "APPLIED" | "REJECTED";

  @IsNumber()
  timestamp: number;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

/**
 * Batch sync acknowledgment
 */
export class BatchSyncAcknowledgmentDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  batchId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncAcknowledgmentDto)
  acknowledgments: SyncAcknowledgmentDto[];

  @IsNumber()
  totalUpdates: number;

  @IsNumber()
  successCount: number;

  @IsNumber()
  failureCount: number;

  @IsNumber()
  timestamp: number;
}

/**
 * Sync health status
 */
export class SyncHealthDto {
  @IsString()
  @IsNotEmpty()
  status: "HEALTHY" | "DEGRADED" | "UNHEALTHY";

  @IsNumber()
  pendingUpdates: number;

  @IsNumber()
  failedUpdates: number;

  @IsNumber()
  conflictCount: number;

  @IsNumber()
  lastSyncTime: number;

  @IsNumber()
  @IsOptional()
  averageSyncLatency?: number;

  @IsString()
  @IsOptional()
  message?: string;
}

/**
 * Device session information
 */
export class DeviceSessionDto {
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsString()
  @IsNotEmpty()
  deviceName: string;

  @IsString()
  deviceType: "MOBILE" | "TABLET" | "WEB" | "DESKTOP";

  @IsNumber()
  lastSyncTime: number;

  @IsString()
  status: "ONLINE" | "OFFLINE" | "IDLE";

  @IsNumber()
  pendingUpdates: number;

  @IsString()
  @IsOptional()
  userAgent?: string;
}

/**
 * User sync profile (all devices)
 */
export class UserSyncProfileDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  lastGlobalSync: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeviceSessionDto)
  devices: DeviceSessionDto[];

  @IsNumber()
  totalPendingUpdates: number;

  @IsNumber()
  conflictCount: number;

  @ValidateNested()
  @Type(() => SyncHealthDto)
  health: SyncHealthDto;
}

/**
 * Progress snapshot for rollback/audit
 */
export class ProgressSnapshotDto {
  @IsString()
  @IsNotEmpty()
  snapshotId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsISO8601()
  timestamp: string;

  @IsNumber()
  @IsOptional()
  starPoints?: number;

  @IsArray()
  @IsOptional()
  badges?: string[];

  @IsNumber()
  @IsOptional()
  totalScore?: number;

  @IsNumber()
  @IsOptional()
  currentStreak?: number;

  @IsString()
  @IsOptional()
  reason?: string; // Why snapshot was created

  @IsString()
  @IsOptional()
  metadata?: string; // JSON metadata
}
