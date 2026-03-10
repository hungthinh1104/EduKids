import { ActivityLogEntity } from '../entities/activity-log.entity';

export interface IAnalyticsRepository {
  logActivity(log: ActivityLogEntity): Promise<ActivityLogEntity>;
  getActivityLog(childId: string, limit: number): Promise<ActivityLogEntity[]>;
  getDailyStats(childId: string, date: Date): Promise<any>;
  getWeeklyStats(childId: string): Promise<any>;
}
