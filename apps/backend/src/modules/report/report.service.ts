import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { MailTemplateService } from '../mail/mail-template.service';
import {
  DeliveryChannel,
  ProgressReportDto,
  ReportChildSummaryDto,
  ReportFrequency,
  ReportPreferenceDto,
  ReportRange,
  ReportSendResultDto,
  NotificationDto,
  UpdateReportPreferenceDto,
} from './report.dto';

/**
 * Service for progress report preferences and generation
 * Uses Prisma for database persistence
 */
@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly mailTemplateService: MailTemplateService,
  ) {}

  private toDateRangeStart(range: ReportRange, now: Date): Date | null {
    const start = new Date(now);
    if (range === ReportRange.WEEK) {
      start.setDate(start.getDate() - 7);
      return start;
    }
    if (range === ReportRange.MONTH) {
      start.setDate(start.getDate() - 30);
      return start;
    }
    return null;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private buildAiInsight(summary: {
    sessionsCompleted: number;
    pronunciationAccuracy: number;
    averageQuizScore: number;
    vocabularyRetention: number;
  }): string {
    if (summary.sessionsCompleted === 0) {
      return 'Tuần này bé chưa có nhiều hoạt động. Bắt đầu với 10-15 phút mỗi ngày để tạo nhịp học đều đặn nhé.';
    }
    if (summary.pronunciationAccuracy < 70) {
      return 'Phát âm đang là điểm cần ưu tiên. Mỗi ngày luyện 5 phút có thể cải thiện rõ rệt trong 1-2 tuần.';
    }
    if (summary.averageQuizScore < 70) {
      return 'Điểm quiz còn dao động. Hãy tăng tần suất ôn tập từ đã học trước khi làm bài mới.';
    }
    if (summary.vocabularyRetention < 70) {
      return 'Khả năng ghi nhớ từ cần củng cố. Nên xen kẽ ôn tập ngắn sau mỗi buổi học mới.';
    }
    return 'Bé đang tiến bộ tốt và ổn định. Duy trì nhịp học hiện tại để tăng tốc trong giai đoạn tiếp theo.';
  }

  private normalizeFrequency(value?: string | null): ReportFrequency {
    return String(value || '').toUpperCase() === ReportFrequency.WEEKLY
      ? ReportFrequency.WEEKLY
      : ReportFrequency.WEEKLY;
  }

  private normalizeChannel(value?: string | null): DeliveryChannel {
    const channel = String(value || '').toUpperCase();
    if (channel === DeliveryChannel.ZALO) {
      return DeliveryChannel.ZALO;
    }
    if (channel === DeliveryChannel.IN_APP) {
      return DeliveryChannel.IN_APP;
    }
    return DeliveryChannel.EMAIL;
  }

  private normalizeReportDay(value?: number | null): number {
    return this.clamp(Number.isInteger(value) ? Number(value) : 1, 0, 6);
  }

  private normalizeReportHour(value?: number | null): number {
    return this.clamp(Number.isInteger(value) ? Number(value) : 9, 0, 23);
  }

  private async resolveEmailForPreference(
    parentId: number,
    preferredChannel: DeliveryChannel,
    explicitEmail?: string,
    existingEmail?: string | null,
  ): Promise<string | null> {
    if (preferredChannel !== DeliveryChannel.EMAIL) {
      return null;
    }
    if (explicitEmail) {
      return explicitEmail;
    }
    if (existingEmail) {
      return existingEmail;
    }
    const user = await this.prisma.user.findUnique({
      where: { id: parentId },
      select: { email: true },
    });
    return user?.email ?? null;
  }

  private async toDto(
    pref: {
      enabled: boolean;
      frequency: string;
      preferredChannel: string;
      email: string | null;
      zaloPhoneNumber: string | null;
      reportDay: number;
      reportHour: number;
      lastReportSentAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    },
    parentId: number,
  ): Promise<ReportPreferenceDto> {
    const preferredChannel = this.normalizeChannel(pref.preferredChannel);
    const user = await this.prisma.user.findUnique({
      where: { id: parentId },
      select: { email: true },
    });

    return {
      parentId,
      isSubscribed: pref.enabled,
      preferredChannel,
      email:
        preferredChannel === DeliveryChannel.EMAIL
          ? pref.email || user?.email
          : pref.email || undefined,
      zaloPhoneNumber: pref.zaloPhoneNumber || undefined,
      frequency: this.normalizeFrequency(pref.frequency),
      reportDay: this.normalizeReportDay(pref.reportDay),
      reportHour: this.normalizeReportHour(pref.reportHour),
      lastReportSentAt: pref.lastReportSentAt || undefined,
      createdAt: pref.createdAt,
      updatedAt: pref.updatedAt,
    };
  }

  async subscribeToReports(
    parentId: number,
    preferredChannel: DeliveryChannel,
    email?: string,
    zaloPhoneNumber?: string,
    reportDay?: number,
    reportHour?: number,
  ): Promise<ReportPreferenceDto> {
    const resolvedEmail = await this.resolveEmailForPreference(
      parentId,
      preferredChannel,
      email,
    );
    const pref = await this.prisma.reportPreference.upsert({
      where: { userId: parentId },
      update: {
        enabled: true,
        frequency: ReportFrequency.WEEKLY,
        preferredChannel,
        email: resolvedEmail,
        zaloPhoneNumber:
          preferredChannel === DeliveryChannel.ZALO
            ? (zaloPhoneNumber ?? undefined)
            : null,
        reportDay: this.normalizeReportDay(reportDay),
        reportHour: this.normalizeReportHour(reportHour),
      },
      create: {
        userId: parentId,
        frequency: ReportFrequency.WEEKLY,
        preferredChannel,
        email: resolvedEmail,
        zaloPhoneNumber:
          preferredChannel === DeliveryChannel.ZALO
            ? (zaloPhoneNumber ?? undefined)
            : null,
        reportDay: this.normalizeReportDay(reportDay),
        reportHour: this.normalizeReportHour(reportHour),
        enabled: true,
      },
    });

    return this.toDto(pref, parentId);
  }

  async unsubscribeFromReports(parentId: number): Promise<ReportPreferenceDto> {
    const pref = await this.prisma.reportPreference.upsert({
      where: { userId: parentId },
      update: { enabled: false },
      create: {
        userId: parentId,
        frequency: ReportFrequency.WEEKLY,
        preferredChannel: DeliveryChannel.EMAIL,
        reportDay: 1,
        reportHour: 9,
        enabled: false,
      },
    });

    return this.toDto(pref, parentId);
  }

  async getPreferences(parentId: number): Promise<ReportPreferenceDto> {
    const pref = await this.prisma.reportPreference.findUnique({
      where: { userId: parentId },
    });

    if (!pref) {
      // Create default preference
      const created = await this.prisma.reportPreference.create({
        data: {
          userId: parentId,
          frequency: ReportFrequency.WEEKLY,
          preferredChannel: DeliveryChannel.EMAIL,
          reportDay: 1,
          reportHour: 9,
          enabled: false,
        },
      });
      return this.toDto(created, parentId);
    }

    return this.toDto(pref, parentId);
  }

  async updatePreferences(
    parentId: number,
    dto: UpdateReportPreferenceDto,
  ): Promise<ReportPreferenceDto> {
    const existing = await this.prisma.reportPreference.findUnique({
      where: { userId: parentId },
    });
    const nextPreferredChannel = dto.preferredChannel
      ? this.normalizeChannel(dto.preferredChannel)
      : this.normalizeChannel(existing?.preferredChannel);
    const nextReportDay = this.normalizeReportDay(dto.reportDay ?? existing?.reportDay);
    const nextReportHour = this.normalizeReportHour(
      dto.reportHour ?? existing?.reportHour,
    );
    const nextFrequency = this.normalizeFrequency(existing?.frequency);
    const nextEmail = await this.resolveEmailForPreference(
      parentId,
      nextPreferredChannel,
      dto.email,
      existing?.email,
    );
    const nextZaloPhoneNumber =
      nextPreferredChannel === DeliveryChannel.ZALO
        ? (dto.zaloPhoneNumber ?? existing?.zaloPhoneNumber ?? null)
        : null;

    const pref = await this.prisma.reportPreference.upsert({
      where: { userId: parentId },
      update: {
        enabled: dto.isSubscribed ?? undefined,
        frequency: nextFrequency,
        preferredChannel: nextPreferredChannel,
        email: nextEmail,
        zaloPhoneNumber: nextZaloPhoneNumber,
        reportDay: nextReportDay,
        reportHour: nextReportHour,
      },
      create: {
        userId: parentId,
        frequency: nextFrequency,
        preferredChannel: nextPreferredChannel,
        email: nextEmail,
        zaloPhoneNumber: nextZaloPhoneNumber,
        reportDay: nextReportDay,
        reportHour: nextReportHour,
        enabled: dto.isSubscribed ?? false,
      },
    });

    return this.toDto(pref, parentId);
  }

  async generateReport(
    parentId: number,
    childId: number,
    range: ReportRange = ReportRange.WEEK,
  ): Promise<ProgressReportDto> {
    const now = new Date();
    const startAt = this.toDateRangeStart(range, now);
    const createdAtFilter = startAt ? { gte: startAt, lte: now } : undefined;
    const dayFilter = startAt ? { gte: startAt, lte: now } : undefined;

    const [
      child,
      dailyProgressAgg,
      quizAgg,
      pronunciationAgg,
      activityCount,
      activityDurationAgg,
      wordsLearned,
      reviewAgg,
      newBadges,
    ] = await Promise.all([
      this.prisma.childProfile.findUnique({
        where: { id: childId },
        select: {
          id: true,
          nickname: true,
          age: true,
          avatar: true,
          totalPoints: true,
          currentLevel: true,
        },
      }),
      this.prisma.dailyProgress.aggregate({
        where: {
          childId,
          ...(dayFilter ? { date: dayFilter } : {}),
        },
        _sum: {
          totalTimeSec: true,
          pointsEarned: true,
        },
        _count: {
          _all: true,
        },
      }),
      this.prisma.activityLog.aggregate({
        where: {
          childId,
          activityType: 'QUIZ',
          ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
        },
        _avg: { score: true },
        _count: { _all: true },
      }),
      this.prisma.activityLog.aggregate({
        where: {
          childId,
          activityType: 'PRONUNCIATION',
          ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
        },
        _avg: { score: true },
      }),
      this.prisma.activityLog.count({
        where: {
          childId,
          ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
        },
      }),
      this.prisma.activityLog.aggregate({
        where: {
          childId,
          ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
        },
        _sum: { durationSec: true },
      }),
      this.prisma.learningProgress.count({
        where: {
          childId,
          ...(createdAtFilter ? { updatedAt: createdAtFilter } : {}),
        },
      }),
      this.prisma.vocabularyReview.aggregate({
        where: {
          childId,
          ...(createdAtFilter ? { updatedAt: createdAtFilter } : {}),
        },
        _avg: { easeFactor: true },
        _count: { _all: true },
      }),
      this.prisma.childBadge.count({
        where: {
          childId,
          ...(createdAtFilter ? { earnedAt: createdAtFilter } : {}),
        },
      }),
    ]);

    if (!child) {
      throw new NotFoundException('Child profile not found');
    }

    const minutesFromDailyProgress = Math.round(
      (dailyProgressAgg._sum.totalTimeSec || 0) / 60,
    );
    const minutesFromActivityLog = Math.round(
      (activityDurationAgg._sum.durationSec || 0) / 60,
    );
    // DailyProgress.totalTimeSec is currently not guaranteed to be updated by all learning flows,
    // so fallback to ActivityLog duration when needed.
    const minutesLearned =
      minutesFromDailyProgress > 0
        ? minutesFromDailyProgress
        : minutesFromActivityLog;
    const sessionsCompleted = activityCount;
    const quizzesCompleted = quizAgg._count._all;
    const averageQuizScore = Math.round(quizAgg._avg.score || 0);
    const pronunciationAccuracy = Math.round(pronunciationAgg._avg.score || 0);
    const totalPoints = child.totalPoints || 0;
    const currentLevel = child.currentLevel || Math.floor(totalPoints / 50) + 1;
    const vocabularyRetention = reviewAgg._count._all
      ? this.clamp(Math.round((Number(reviewAgg._avg.easeFactor || 0) / 3) * 100), 0, 100)
      : 0;
    const summaryInput = {
      sessionsCompleted,
      pronunciationAccuracy,
      averageQuizScore,
      vocabularyRetention,
    };

    const childSummary: ReportChildSummaryDto = {
      childId,
      childName: child.nickname || `Bé #${childId}`,
      childAge: child.age,
      avatar: child.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=child-${childId}`,
      minutesLearned,
      sessionsCompleted,
      pronunciationAccuracy,
      quizzesCompleted,
      averageQuizScore,
      wordsLearned,
      vocabularyRetention,
      totalPoints,
      currentLevel,
      newBadges,
      aiInsight: this.buildAiInsight(summaryInput),
    };

    const report: ProgressReportDto = {
      reportId: Date.now(),
      parentId,
      weekEndingDate: now,
      children: [childSummary],
      summaryMessage: `Báo cáo ${range.toLowerCase()}: bé đã hoàn thành ${childSummary.sessionsCompleted} phiên học với điểm quiz trung bình ${childSummary.averageQuizScore}%.`,
      recommendations: 'Ưu tiên luyện phát âm 5 phút/ngày và ôn lại từ sắp quên để cải thiện độ ghi nhớ.',
      generatedAt: now,
      sentAt: undefined,
      deliveryChannel: undefined,
    };

    // Save report to database
    await this.prisma.progressReport.create({
      data: {
        userId: parentId,
        content: report as any,
      },
    });

    return report;
  }

  async sendReport(
    parentId: number,
    childId: number,
  range: ReportRange = ReportRange.WEEK,
  ): Promise<ReportSendResultDto> {
    const pref = await this.getPreferences(parentId);
    const report = await this.generateReport(parentId, childId, range);
    const sentAt = new Date();

    report.sentAt = sentAt;
    report.deliveryChannel = pref.preferredChannel;

    let deliveryMessage = `Report sent via ${pref.preferredChannel}`;

    if (pref.preferredChannel === DeliveryChannel.EMAIL && pref.email) {
      const parent = await this.prisma.user.findUnique({
        where: { id: parentId },
        select: { firstName: true },
      });
      const childSummary = report.children.find((child) => child.childId === childId);
      const emailTemplate = this.mailTemplateService.renderWeeklyProgressReportEmail({
        parentName: parent?.firstName,
        childName: childSummary?.childName || "bé",
        report,
      });
      const emailResult = await this.mailService.sendMail({
        to: pref.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      if (!emailResult.sent) {
        deliveryMessage = "Report generated, but email delivery could not be completed.";
        report.deliveryChannel = DeliveryChannel.IN_APP;
      }
    } else if (pref.preferredChannel === DeliveryChannel.EMAIL) {
      deliveryMessage = "Report generated, but no delivery email is configured.";
      report.deliveryChannel = DeliveryChannel.IN_APP;
    }

    // Update preference with last sent time
    await this.prisma.reportPreference.update({
      where: { userId: parentId },
      data: { lastReportSentAt: sentAt },
    });

    await this.prisma.notification.create({
      data: {
        userId: parentId,
        title: 'Progress Report Ready',
        message: `Your ${range.toLowerCase()} report is ready to view.`,
        isRead: false,
      },
    });

    return {
      success: true,
      message: deliveryMessage,
      reportId: report.reportId,
      report,
    };
  }

  async getReportHistory(parentId: number, limit = 10): Promise<ProgressReportDto[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const reports = await this.prisma.progressReport.findMany({
      where: { userId: parentId },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
    });

    return reports.map((report, index) => {
      const content = (report.content as Record<string, any> | null) ?? null;
      return {
        reportId:
          typeof content?.reportId === 'number' ? content.reportId : index + 1,
        parentId,
        weekEndingDate: content?.weekEndingDate
          ? new Date(content.weekEndingDate)
          : report.createdAt,
        children: Array.isArray(content?.children) ? content.children : [],
        summaryMessage:
          typeof content?.summaryMessage === 'string'
            ? content.summaryMessage
            : 'Progress report generated.',
        recommendations:
          typeof content?.recommendations === 'string'
            ? content.recommendations
            : '',
        generatedAt: content?.generatedAt
          ? new Date(content.generatedAt)
          : report.createdAt,
        sentAt: content?.sentAt ? new Date(content.sentAt) : undefined,
        deliveryChannel: content?.deliveryChannel,
      };
    });
  }

  async getUnreadNotifications(parentId: number): Promise<NotificationDto[]> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId: parentId,
        isRead: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return notifications.map((notification) => ({
      notificationId: notification.id,
      parentId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: 'REPORT',
      relatedId: undefined,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      readAt: undefined,
    }));
  }

  async markNotificationAsRead(
    parentId: number,
    notificationId: string,
  ): Promise<NotificationDto> {
    const updated = await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: parentId,
      },
      data: {
        isRead: true,
      },
    });

    if (updated.count === 0) {
      throw new NotFoundException('Notification not found');
    }

    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return {
      notificationId: notification.id,
      parentId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: 'REPORT',
      relatedId: undefined,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      readAt: notification.isRead ? new Date() : undefined,
    };
  }

}
