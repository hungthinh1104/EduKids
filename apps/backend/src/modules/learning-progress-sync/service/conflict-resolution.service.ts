import { Injectable, Logger } from "@nestjs/common";
import { ConflictDto } from "../dto/sync-response.dto";
import { ProgressUpdateDto } from "../dto/progress-update.dto";

/**
 * Conflict Resolution Service
 * Implements last-write-wins (LWW) policy with timestamp validation
 * Handles conflicts between concurrent updates from multiple devices
 */
@Injectable()
export class ConflictResolutionService {
  private readonly logger = new Logger(ConflictResolutionService.name);

  /**
   * Resolve conflict using last-write-wins strategy
   * @param serverUpdate Latest update on server
   * @param clientUpdate Incoming update from client
   * @returns Resolution with winner and conflict details
   */
  resolveLastWriteWins(
    serverUpdate: ProgressUpdateDto,
    clientUpdate: ProgressUpdateDto,
    serverDbTimestamp?: number,
  ): {
    winner: "SERVER" | "CLIENT";
    conflict: ConflictDto;
    shouldApply: boolean;
  } {
    const clientTimestamp = clientUpdate.timestamp || 0;

    // Prefer the authoritative DB timestamp; fall back to DTO only as last resort
    const serverTime =
      serverDbTimestamp && serverDbTimestamp > 0
        ? serverDbTimestamp
        : serverUpdate.timestamp && serverUpdate.timestamp > 0
          ? serverUpdate.timestamp
          : Date.now() - 10000;
    const clientTime = clientTimestamp > 0 ? clientTimestamp : Date.now();

    const winner = clientTime > serverTime ? "CLIENT" : "SERVER";
    const timeDiff = Math.abs(clientTime - serverTime);

    const conflict: ConflictDto = {
      conflictId: this.generateConflictId(
        String(serverUpdate.userId),
        serverUpdate.deviceId,
        clientUpdate.deviceId,
      ),
      userId: serverUpdate.userId,
      type: serverUpdate.type,
      serverValue: this.extractValue(serverUpdate),
      clientValue: this.extractValue(clientUpdate),
      serverTimestamp: serverTime,
      clientTimestamp: clientTime,
      resolvedValue: winner,
      reason: `Last-write-wins: ${winner} update is ${timeDiff}ms newer`,
      resolvedAt: new Date().toISOString(),
    };

    this.logger.debug(
      `Conflict resolved: ${conflict.conflictId} → ${winner} wins (time diff: ${timeDiff}ms)`,
    );

    return {
      winner,
      conflict,
      shouldApply: winner === "CLIENT",
    };
  }

  /**
   * Resolve conflicts with clock skew tolerance
   * Accounts for small clock differences between devices
   */
  resolveWithClockSkew(
    serverUpdate: ProgressUpdateDto,
    clientUpdate: ProgressUpdateDto,
    maxClockSkew: number = 5000, // 5 seconds default
    serverDbTimestamp?: number,
  ): {
    winner: "SERVER" | "CLIENT" | "MERGE";
    conflict: ConflictDto;
    shouldApply: boolean;
  } {
    const serverTime =
      serverDbTimestamp ?? serverUpdate.timestamp ?? Date.now();
    const clientTime = clientUpdate.timestamp ?? Date.now();
    const timeDiff = Math.abs(clientTime - serverTime);

    // If times are very close, attempt merge
    if (timeDiff <= maxClockSkew) {
      return this.attemptMerge(serverUpdate, clientUpdate);
    }

    // Otherwise use last-write-wins
    return this.resolveLastWriteWins(
      serverUpdate,
      clientUpdate,
      serverDbTimestamp,
    );
  }

  /**
   * Attempt to merge conflicting updates
   * For example, merge two different star point awards
   */
  private attemptMerge(
    serverUpdate: ProgressUpdateDto,
    clientUpdate: ProgressUpdateDto,
  ): {
    winner: "SERVER" | "CLIENT" | "MERGE";
    conflict: ConflictDto;
    shouldApply: boolean;
  } {
    // Merge logic for specific types
    // activityType property doesn't exist on ProgressUpdateDto
    if (
      serverUpdate.type === "STARS_EARNED" &&
      clientUpdate.type === "STARS_EARNED"
    ) {
      // Both are star awards - can be merged
      return {
        winner: "MERGE",
        conflict: {
          conflictId: this.generateConflictId(
            String(serverUpdate.userId),
            serverUpdate.deviceId,
            clientUpdate.deviceId,
          ),
          userId: serverUpdate.userId,
          type: serverUpdate.type,
          serverValue: serverUpdate.starPoints?.earned || 0,
          clientValue: clientUpdate.starPoints?.earned || 0,
          serverTimestamp: serverUpdate.timestamp || 0,
          clientTimestamp: clientUpdate.timestamp || 0,
          resolvedValue: "MERGE",
          reason: `Merged both star awards: ${serverUpdate.starPoints?.earned || 0} + ${clientUpdate.starPoints?.earned || 0} = ${(serverUpdate.starPoints?.earned || 0) + (clientUpdate.starPoints?.earned || 0)}`,
          resolvedAt: new Date().toISOString(),
        },
        shouldApply: true, // Apply the merged value
      };
    }

    // Default to last-write-wins for non-mergeable types
    return this.resolveLastWriteWins(serverUpdate, clientUpdate);
  }

  /**
   * Detect conflict based on version vector
   * Useful for detecting true concurrent updates
   */
  detectConcurrencyConflict(
    serverVersion: number,
    clientVersion: number,
    serverTimestamp: number,
    clientTimestamp: number,
  ): boolean {
    // Conflict if both have made independent changes (versions differ)
    // AND they happened at similar times (clock skew)
    const timeDiff = Math.abs(serverTimestamp - clientTimestamp);
    const versionDiff = Math.abs(serverVersion - clientVersion);

    return versionDiff > 0 && timeDiff < 10000; // 10 second window
  }

  /**
   * Validate update consistency
   * Check for logical conflicts (e.g., star points going backwards)
   */
  validateUpdateConsistency(
    previousValue: number | undefined,
    newValue: number,
    updateType: string,
  ): { isValid: boolean; reason?: string } {
    if (previousValue === undefined) {
      return { isValid: true }; // First update
    }

    // Star points should never decrease
    if (updateType === "STARS_EARNED" && newValue < previousValue) {
      return {
        isValid: false,
        reason: "Star points cannot decrease",
      };
    }

    // Streak should not jump by more than 1
    if (
      updateType === "STREAK_UPDATED" &&
      Math.abs(newValue - previousValue) > 1
    ) {
      return {
        isValid: false,
        reason: "Streak cannot change by more than 1",
      };
    }

    return { isValid: true };
  }

  /**
   * Create version vector for tracking causality
   * Used in distributed systems to detect happens-before relationships
   */
  createVersionVector(
    deviceId: string,
    logicalClock: number,
  ): Map<string, number> {
    const vector = new Map<string, number>();
    vector.set(deviceId, logicalClock);
    return vector;
  }

  /**
   * Merge version vectors to track all updates
   */
  mergeVersionVectors(
    v1: Map<string, number>,
    v2: Map<string, number>,
  ): Map<string, number> {
    const merged = new Map(v1);
    v2.forEach((value, key) => {
      merged.set(key, Math.max(merged.get(key) || 0, value));
    });
    return merged;
  }

  /**
   * Generate unique conflict ID
   */
  private generateConflictId(
    userId: string,
    deviceId1: string,
    deviceId2: string,
  ): string {
    const sorted = [deviceId1, deviceId2].sort().join(":");
    return `conflict:${userId}:${sorted}:${Date.now()}`;
  }

  /**
   * Extract numeric value from update for comparison
   */
  private extractValue(update: ProgressUpdateDto): number {
    if (update.starPoints?.current) return update.starPoints.current;
    if (update.score?.score) return update.score.score;
    if (update.streak?.currentStreak) return update.streak.currentStreak;
    return 0;
  }

  /**
   * Get conflict resolution metrics
   */
  getResolutionStats(): {
    lastWriteWinsCount: number;
    mergedCount: number;
    conflictRate: number;
  } {
    // This would be populated from a repository in production
    return {
      lastWriteWinsCount: 0,
      mergedCount: 0,
      conflictRate: 0,
    };
  }
}
