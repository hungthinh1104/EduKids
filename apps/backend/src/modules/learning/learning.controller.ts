import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { LearningService } from "./learning.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UpdateProgressDto, ProgressResponseDto } from "./dto/progress.dto";

@ApiTags("Learning")
@ApiBearerAuth("JWT-auth")
@Controller("learning")
@UseGuards(JwtAuthGuard, RolesGuard)
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  /**
   * UC-01: Update viewing progress (Post-condition: Viewing progress updated if completed)
   */
  @Post("progress")
  @Roles("LEARNER")
  @ApiOperation({
    summary: "Update viewing progress",
    description:
      "UC-01 Post-condition: Update viewing progress when child completes viewing flashcard or video. Requires LEARNER JWT with childId.",
  })
  @ApiResponse({
    status: 200,
    description: "Progress updated successfully",
    type: ProgressResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token missing or invalid",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Requires LEARNER role",
  })
  async updateProgress(
    @Body() dto: UpdateProgressDto,
    @Request() req,
  ): Promise<ProgressResponseDto> {
    const childId = req.user?.childId;

    if (!childId) {
      throw new HttpException(
        "Child profile required. Please switch to child profile first (POST /api/profiles/switch).",
        HttpStatus.FORBIDDEN,
      );
    }

    return await this.learningService.updateViewingProgress(childId, dto);
  }

  // @ApiOperation({ summary: 'Get learning progress for child' })
  // @Get('progress/:childId')
  // async getProgress() { }

  // @ApiOperation({ summary: 'Complete flashcard and update progress' })
  // @Post('flashcards/complete')
  // async completeFlashcard() { }

  // @ApiOperation({ summary: 'Get review queue (spaced repetition)' })
  // @ApiResponse({ status: 200, description: 'Vocabularies ready for review' })
  // @Get('review')
  // async getReviewQueue() { }

  // @ApiOperation({ summary: 'Submit vocabulary review' })
  // @Post('review')
  // async submitReview() { }

  // @ApiOperation({ summary: 'Get learning statistics' })
  // @Get('stats')
  // async getStats() { }
}
