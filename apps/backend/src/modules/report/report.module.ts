import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Report Module
 * Handles automated weekly progress reports with email/Zalo delivery
 * Features:
 * - Weekly scheduled report generation (@Cron)
 * - Email delivery with HTML templates
 * - Zalo messaging integration
 * - In-app notification fallback
 * - Parent subscription management
 * - Preference customization (day/hour/channel)
 */
@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [ReportController],
  providers: [ReportService, PrismaService],
  exports: [ReportService],
})
export class ReportModule {}