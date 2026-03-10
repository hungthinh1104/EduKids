import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportService } from './report.service';
import {
  SubscribeToReportsDto,
  SubscriptionResultDto,
  UnsubscriptionResultDto,
  ReportPreferenceDto,
  UpdateReportPreferenceDto,
  NotificationDto,
  GenerateReportDto,
  SendReportDto,
  ReportRange,
  ReportSendResultDto,
  ProgressReportDto,
} from './report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Report Controller
 * Manages parent subscriptions to automated progress reports
 * Handles email/Zalo delivery preferences and notification management
 */
@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly prisma: PrismaService,
  ) {}

  private async assertChildOwnership(
    childId: number,
    parentId: number,
  ): Promise<void> {
    const childProfile = await this.prisma.childProfile.findFirst({
      where: {
        id: childId,
        parentId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!childProfile) {
      throw new NotFoundException('Child profile not found');
    }
  }

  @Post('generate')
  @Roles('PARENT')
  @HttpCode(201)
  @ApiOperation({ summary: 'Generate progress report now' })
  @ApiResponse({
    status: 201,
    description: 'Report generated successfully',
    type: ProgressReportDto,
  })
  async generateReport(
    @CurrentUser('id') parentId: number,
    @Body() dto: GenerateReportDto,
  ): Promise<ProgressReportDto> {
    await this.assertChildOwnership(dto.childId, parentId);
    return this.reportService.generateReport(
      parentId,
      dto.childId,
      dto.range ?? ReportRange.WEEK,
    );
  }

  @Post('send')
  @Roles('PARENT')
  @HttpCode(200)
  @ApiOperation({ summary: 'Generate and send progress report immediately' })
  @ApiResponse({
    status: 200,
    description: 'Report sent successfully',
    type: ReportSendResultDto,
  })
  async sendReport(
    @CurrentUser('id') parentId: number,
    @Body() dto: SendReportDto,
  ): Promise<ReportSendResultDto> {
    await this.assertChildOwnership(dto.childId, parentId);
    return this.reportService.sendReport(
      parentId,
      dto.childId,
      dto.range ?? ReportRange.WEEK,
    );
  }

  /**
   * Subscribe to weekly reports
   * @param parentId - Parent user ID from JWT
   * @param dto - Subscription preferences
   * @returns Subscription confirmation with preferences
   */
  @Post('subscribe')
  @Roles('PARENT')
  @HttpCode(201)
  @ApiOperation({ summary: 'Subscribe to weekly progress reports' })
  @ApiResponse({
    status: 201,
    description: 'Successfully subscribed to reports',
    type: SubscriptionResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid email or Zalo phone number',
  })
  async subscribeToReports(
    @CurrentUser('id') parentId: number,
    @Body() dto: SubscribeToReportsDto,
  ): Promise<SubscriptionResultDto> {
    // Validate required fields based on channel
    if (dto.preferredChannel === 'EMAIL' && !dto.email) {
      throw new BadRequestException('Email address is required for EMAIL channel');
    }
    if (dto.preferredChannel === 'ZALO' && !dto.zaloPhoneNumber) {
      throw new BadRequestException('Zalo phone number is required for ZALO channel');
    }

    const preference = await this.reportService.subscribeToReports(
      parentId,
      dto.preferredChannel,
      dto.email,
      dto.zaloPhoneNumber,
      dto.reportDay,
      dto.reportHour,
    );

    return {
      success: true,
      message: 'Successfully subscribed to weekly reports',
      preference,
    };
  }

  /**
   * Unsubscribe from reports
   * @param parentId - Parent user ID from JWT
   * @returns Unsubscription confirmation
   */
  @Post('unsubscribe')
  @Roles('PARENT')
  @HttpCode(200)
  @ApiOperation({ summary: 'Unsubscribe from weekly progress reports' })
  @ApiResponse({
    status: 200,
    description: 'Successfully unsubscribed from reports',
    type: UnsubscriptionResultDto,
  })
  async unsubscribeFromReports(
    @CurrentUser('id') parentId: number,
  ): Promise<UnsubscriptionResultDto> {
    await this.reportService.unsubscribeFromReports(parentId);

    return {
      success: true,
      message: 'Successfully unsubscribed from weekly reports',
    };
  }

  /**
   * Get report preferences for current parent
   * @param parentId - Parent user ID from JWT
   * @returns Current subscription preferences
   */
  @Get('preferences')
  @Roles('PARENT')
  @ApiOperation({ summary: 'Get current report preferences' })
  @ApiResponse({
    status: 200,
    description: 'Report preferences retrieved',
    type: ReportPreferenceDto,
  })
  async getPreferences(
    @CurrentUser('id') parentId: number,
  ): Promise<ReportPreferenceDto> {
    return this.reportService.getPreferences(parentId);
  }

  /**
   * Update report preferences
   * @param parentId - Parent user ID from JWT
   * @param dto - Preference updates
   * @returns Updated preferences
   */
  @Put('preferences')
  @Roles('PARENT')
  @ApiOperation({ summary: 'Update report preferences' })
  @ApiResponse({
    status: 200,
    description: 'Preferences updated successfully',
    type: ReportPreferenceDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid preference data',
  })
  async updatePreferences(
    @CurrentUser('id') parentId: number,
    @Body() dto: UpdateReportPreferenceDto,
  ): Promise<ReportPreferenceDto> {
    return this.reportService.updatePreferences(parentId, dto);
  }

  /**
   * Get report history for parent
   * @param parentId - Parent user ID from JWT
   * @param limit - Max reports to return (default 10)
   * @returns List of recent reports
   */
  @Get('history')
  @Roles('PARENT')
  @ApiOperation({ summary: 'Get report history' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of reports to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Report history retrieved',
  })
  async getReportHistory(
    @CurrentUser('id') parentId: number,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    if (Number.isNaN(parsedLimit) || parsedLimit <= 0) {
      throw new BadRequestException('Invalid limit value');
    }

    const reports = await this.reportService.getReportHistory(parentId, parsedLimit);
    return {
      reports,
      total: reports.length,
    };
  }

  /**
   * Get unread notifications for parent
   * @param parentId - Parent user ID from JWT
   * @returns List of unread notifications
   */
  @Get('notifications')
  @Roles('PARENT')
  @ApiOperation({ summary: 'Get unread report notifications' })
  @ApiResponse({
    status: 200,
    description: 'Unread notifications retrieved',
    type: [NotificationDto],
  })
  async getNotifications(
    @CurrentUser('id') parentId: number,
  ): Promise<NotificationDto[]> {
    return this.reportService.getUnreadNotifications(parentId);
  }

  /**
   * Mark notification as read
   * @param notificationId - Notification ID
   * @param parentId - Parent user ID from JWT (for authorization)
   * @returns Updated notification
   */
  @Patch('notifications/:id/read')
  @Roles('PARENT')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Notification ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    type: NotificationDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  async markNotificationAsRead(
    @Param('id') notificationId: string,
    @CurrentUser('id') parentId: number,
  ): Promise<NotificationDto> {
    if (!notificationId || typeof notificationId !== 'string') {
      throw new BadRequestException('Invalid notification ID');
    }

    return this.reportService.markNotificationAsRead(parentId, notificationId);
  }

  // @Get('history/:childId')
  // async getReportHistory() { }
}
