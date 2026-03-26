import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
  BadRequestException,
} from "@nestjs/common";
import { Request as ExpressRequest } from "express";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { VocabularyReviewService } from "../service/vocabulary-review.service";
import {
  SubmitReviewRequestDto,
  ReviewSessionDto,
  ReviewResultDto,
  ReviewProgressDto,
  ReviewStatsDto,
} from "../dto/vocabulary-review.dto";

@ApiTags("Vocabulary Review")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("vocabulary/review")
export class VocabularyReviewController {
  constructor(private reviewService: VocabularyReviewService) {}

  private getChildId(req: RequestWithUser): number {
    if (!req.user.childId) {
      throw new BadRequestException(
        "Active child profile required. Please switch profile first.",
      );
    }
    return req.user.childId;
  }

  /**
   * Get items due for review
   */
  @Get("session")
  @ApiOperation({ summary: "Get vocabulary items due for review" })
  @ApiResponse({ status: 200, type: ReviewSessionDto })
  async getReviewSession(
    @Request() req: RequestWithUser,
    @Query("limit", new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const childId = this.getChildId(req);
    return this.reviewService.getReviewSession(childId, limit || 20);
  }

  /**
   * Submit review result for single item
   */
  @Post("submit")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Submit review result for vocabulary item" })
  @ApiResponse({ status: 200, type: ReviewResultDto })
  async submitReview(
    @Request() req: RequestWithUser,
    @Body() dto: SubmitReviewRequestDto,
  ) {
    const childId = this.getChildId(req);
    return this.reviewService.submitReview(childId, dto);
  }

  /**
   * Submit multiple reviews
   */
  @Post("submit-bulk")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Submit multiple review results" })
  @ApiResponse({ status: 200, description: "Array of review results" })
  async submitBulkReviews(
    @Request() req: RequestWithUser,
    @Body()
    body: SubmitReviewRequestDto[] | { reviews?: SubmitReviewRequestDto[] },
  ) {
    const childId = this.getChildId(req);

    const reviews = Array.isArray(body) ? body : body?.reviews;
    if (!Array.isArray(reviews)) {
      throw new BadRequestException(
        "Invalid payload. Expected an array of reviews or { reviews: [...] }",
      );
    }

    return this.reviewService.submitBulkReviews(childId, reviews);
  }

  /**
   * Get review progress
   */
  @Get("progress")
  @ApiOperation({ summary: "Get today review progress" })
  @ApiResponse({ status: 200, type: ReviewProgressDto })
  async getProgress(@Request() req: RequestWithUser) {
    const childId = this.getChildId(req);
    return this.reviewService.getProgress(childId);
  }

  /**
   * Get review statistics
   */
  @Get("stats")
  @ApiOperation({ summary: "Get review statistics" })
  @ApiResponse({ status: 200, type: ReviewStatsDto })
  async getStatistics(@Request() req: RequestWithUser) {
    const childId = this.getChildId(req);
    return this.reviewService.getStatistics(childId);
  }

  /**
   * Get review history for item
   */
  @Get("history/:vocabularyId")
  @ApiOperation({ summary: "Get review history for vocabulary item" })
  @ApiResponse({ status: 200, description: "Review history" })
  async getHistory(
    @Request() req: RequestWithUser,
    @Param("vocabularyId", ParseIntPipe) vocabularyId: number,
  ) {
    const childId = this.getChildId(req);
    return this.reviewService.getHistory(childId, vocabularyId);
  }

  /**
   * Get mastered vocabulary
   */
  @Get("mastered")
  @ApiOperation({ summary: "Get mastered vocabulary items" })
  @ApiResponse({ status: 200, description: "Mastered vocabulary list" })
  async getMastered(@Request() req: RequestWithUser) {
    const childId = this.getChildId(req);
    return this.reviewService.getMasteredVocabulary(childId);
  }

  /**
   * Get suggested vocabulary to learn
   */
  @Get("suggestions")
  @ApiOperation({ summary: "Get suggested vocabulary to learn" })
  @ApiResponse({ status: 200, description: "Suggested vocabulary" })
  async getSuggestions(
    @Request() req: RequestWithUser,
    @Query("limit", new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const childId = this.getChildId(req);
    return this.reviewService.getSuggestions(childId, limit || 10);
  }

  /**
   * Get all review items
   */
  @Get("items")
  @ApiOperation({ summary: "Get all vocabulary review items" })
  @ApiResponse({ status: 200, description: "All review items" })
  async getAllItems(@Request() req: RequestWithUser) {
    const childId = this.getChildId(req);
    return this.reviewService.getAllReviewItems(childId);
  }
}

type RequestWithUser = ExpressRequest & {
  user: {
    childId?: number;
  };
};
