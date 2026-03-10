import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Throttle } from '../../common/decorators/throttle.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { PronunciationService } from './pronunciation.service';
import { PronunciationSubmitDto, PronunciationFeedbackDto } from './dto/pronunciation.dto';

@ApiTags('Pronunciation - UC-03')
@ApiBearerAuth('JWT-auth')
@Controller('pronunciation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PronunciationController {
  constructor(private readonly pronunciationService: PronunciationService) {}

  /**
   * UC-03 Main Endpoint: Submit pronunciation attempt and receive instant feedback
   * Browser sends Web Speech API confidence score (0-100)
   * Backend returns kid-friendly stars, feedback, and points
   *
   * Request Flow:
   * 1. Child records 5-10 second audio
   * 2. Browser evaluates with Web Speech API
   * 3. Browser sends confidenceScore to backend
   * 4. Backend converts to stars + generates feedback
   * 5. Response includes rewards + progress update
   *
   * NFR-03: Audio NOT stored permanently - only confidence score recorded
   */
  @ApiOperation({
    summary: 'Submit pronunciation attempt with Web Speech API score',
    description: `
      Child records pronunciation, browser evaluates with Web Speech API, sends confidence score.
      Backend converts to stars (1-5), generates kid-friendly feedback, awards points.
      
      Score Conversion:
      - 0-40: 1 star (0 points)
      - 41-60: 2 stars (0 points)
      - 61-75: 3 stars (+10 points)
      - 76-90: 4 stars (+15 points)
      - 91-100: 5 stars (+20 points)
      
      Privacy: Audio is NOT stored (NFR-03). Only confidence score + metadata recorded.
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Pronunciation scored successfully',
    type: PronunciationFeedbackDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid confidence score (not 0-100), vocabulary not found, or microphone permission denied',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - childId missing from JWT or insufficient role',
  })
  @Roles('LEARNER')
  @Throttle(50, 60) // 50 pronunciation attempts per 60 seconds
  @Post(':vocabularyId')
  async submitPronunciation(
    @Param('vocabularyId', ParseIntPipe) vocabularyId: number,
    @Body() dto: PronunciationSubmitDto,
    @CurrentUser() user: User & { childId?: number },
  ): Promise<PronunciationFeedbackDto> {
    if (!user.childId) {
      throw new BadRequestException(
        'Active child profile required. Please select a child profile first.',
      );
    }

    return this.pronunciationService.submitPronunciationAttempt(user.childId, vocabularyId, dto);
  }

  /**
   * Get pronunciation progress for a specific vocabulary
   * Shows best score, stars, attempt count, perfect streak
   */
  @ApiOperation({
    summary: 'Get pronunciation progress for vocabulary',
    description: 'Returns best score, star rating, attempts, and perfect streak for specific word',
  })
  @ApiResponse({
    status: 200,
    description: 'Pronunciation progress retrieved',
  })
  @ApiParam({
    name: 'vocabularyId',
    type: 'number',
    description: 'Vocabulary ID',
  })
  @Roles('LEARNER')
  @Get('progress/:vocabularyId')
  async getPronunciationProgress(
    @Param('vocabularyId', ParseIntPipe) vocabularyId: number,
    @CurrentUser() user: User & { childId?: number },
  ) {
    if (!user.childId) {
      throw new BadRequestException(
        'Active child profile required. Please select a child profile first.',
      );
    }

    return this.pronunciationService.getPronunciationProgress(user.childId, vocabularyId);
  }

  /**
   * Get recent pronunciation attempts
   * Shows last 10 attempts with scores and timestamps
   */
  @ApiOperation({
    summary: 'Get pronunciation attempt history',
    description: 'Returns last 10 pronunciation attempts with scores and feedback',
  })
  @ApiResponse({
    status: 200,
    description: 'Pronunciation history retrieved',
  })
  @Roles('LEARNER')
  @Get('history')
  async getPronunciationHistory(
    @CurrentUser() user: User & { childId?: number },
  ) {
    if (!user.childId) {
      throw new BadRequestException(
        'Active child profile required. Please select a child profile first.',
      );
    }

    return this.pronunciationService.getPronunciationHistory(user.childId, 10);
  }

  /**
   * Get overall pronunciation statistics
   * Shows total attempts, perfect rate, average score
   */
  @ApiOperation({
    summary: 'Get overall pronunciation statistics',
    description:
      'Returns statistics: total attempts, perfect attempts, average score, accuracy rate',
  })
  @ApiResponse({
    status: 200,
    description: 'Pronunciation statistics retrieved',
  })
  @Roles('LEARNER')
  @Get('stats')
  async getPronunciationStats(
    @CurrentUser() user: User & { childId?: number },
  ) {
    if (!user.childId) {
      throw new BadRequestException(
        'Active child profile required. Please select a child profile first.',
      );
    }

    return this.pronunciationService.getPronunciationStats(user.childId);
  }
}