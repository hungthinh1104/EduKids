import { BadgeEntity } from "../entities/badge.entity";

export interface IGamificationRepository {
  awardBadge(childId: string, badgeId: string): Promise<void>;
  getBadgesByChild(childId: string): Promise<BadgeEntity[]>;
  addStars(childId: string, stars: number): Promise<void>;
  getChildStats(childId: string): Promise<{ stars: number; level: number }>;
}
