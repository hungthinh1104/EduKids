import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AdminAnalyticsService } from "../service/admin-analytics.service";
import {
  AnalyticsQueryDto,
  ContentPopularityQueryDto,
} from "../dto/analytics-query.dto";
import {
  DAUResponseDto,
  SessionLengthResponseDto,
  ContentPopularityResponseDto,
  DashboardSummaryDto,
  InsufficientDataResponseDto,
} from "../dto/analytics-response.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";

@ApiTags("Admin Platform Analytics")
@Controller("admin/analytics")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AdminAnalyticsService) {}

  @Get("dashboard")
  @Roles("admin")
  @ApiOperation({
    summary: "Get dashboard summary",
    description:
      "Get real-time dashboard metrics including DAU, sessions, and top content",
  })
  @ApiResponse({
    status: 200,
    description: "Dashboard summary retrieved successfully",
    type: DashboardSummaryDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin role required",
  })
  async getDashboardSummary(): Promise<DashboardSummaryDto> {
    return this.analyticsService.getDashboardSummary();
  }

  @Get("dau")
  @Roles("admin")
  @ApiOperation({
    summary: "Get Daily Active Users (DAU)",
    description:
      "Retrieve daily active users metrics with trends and comparisons",
  })
  @ApiResponse({
    status: 200,
    description: "DAU metrics retrieved successfully",
    type: DAUResponseDto,
  })
  @ApiResponse({
    status: 200,
    description: "Insufficient data available",
    type: InsufficientDataResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid query parameters",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin role required",
  })
  async getDailyActiveUsers(
    @Query() queryDto: AnalyticsQueryDto,
  ): Promise<DAUResponseDto | InsufficientDataResponseDto> {
    return this.analyticsService.getDailyActiveUsers(queryDto);
  }

  @Get("session-length")
  @Roles("admin")
  @ApiOperation({
    summary: "Get average session length",
    description: "Retrieve average session duration metrics over time",
  })
  @ApiResponse({
    status: 200,
    description: "Session length metrics retrieved successfully",
    type: SessionLengthResponseDto,
  })
  @ApiResponse({
    status: 200,
    description: "Insufficient data available",
    type: InsufficientDataResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid query parameters",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin role required",
  })
  async getSessionLength(
    @Query() queryDto: AnalyticsQueryDto,
  ): Promise<SessionLengthResponseDto | InsufficientDataResponseDto> {
    return this.analyticsService.getSessionLength(queryDto);
  }

  @Get("content-popularity")
  @Roles("admin")
  @ApiOperation({
    summary: "Get content popularity rankings",
    description:
      "Retrieve most popular content with views, engagement, and completion stats",
  })
  @ApiResponse({
    status: 200,
    description: "Content popularity metrics retrieved successfully",
    type: ContentPopularityResponseDto,
  })
  @ApiResponse({
    status: 200,
    description: "Insufficient data available",
    type: InsufficientDataResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid query parameters",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin role required",
  })
  async getContentPopularity(
    @Query() queryDto: ContentPopularityQueryDto,
  ): Promise<ContentPopularityResponseDto | InsufficientDataResponseDto> {
    return this.analyticsService.getContentPopularity(queryDto);
  }
}
