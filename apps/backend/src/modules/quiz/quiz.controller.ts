import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { Throttle } from "../../common/decorators/throttle.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "@prisma/client";
import { QuizService } from "./quiz.service";
import { RedisAnalyticsService } from "../admin-analytics/service/redis-analytics.service";
import {
  QuizStartDto,
  QuizAnswerDto,
  QuizSessionDto,
  QuizAnswerFeedbackDto,
  QuizResultDto,
} from "./dto/quiz.dto";

@ApiTags("Quiz - UC-04")
@ApiBearerAuth("JWT-auth")
@Controller("quiz")
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuizController {
  constructor(
    private readonly quizService: QuizService,
    private readonly redisAnalytics: RedisAnalyticsService,
  ) {}

  /**
   * UC-04 Main Endpoint: Start adaptive quiz session
   * Generates questions based on learner history and difficulty adaptation
   */
  @ApiOperation({
    summary: "Start new adaptive quiz session",
    description: `
      Starts adaptive quiz based on vocabulary topics.
      Difficulty adapts according to learner's historical performance.
      
      Adaptive Algorithm:
      - Analyzes last 20 quiz attempts
      - Prioritizes vocabulary with lower mastery scores
      - Adjusts difficulty: accuracy >80% → harder, <50% → easier
      - Falls back to static quiz if adaptive generation fails
      
      NFR-01: Response < 500ms via Redis caching
    `,
  })
  @ApiResponse({
    status: 201,
    description: "Quiz session started with first question",
    type: QuizSessionDto,
  })
  @ApiResponse({
    status: 400,
    description: "No vocabulary available or invalid topic",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT missing or invalid",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - childId missing from JWT",
  })
  @Roles("LEARNER")
  @Throttle(10, 60) // 10 quiz starts per 60 seconds
  @Post("start")
  async startQuiz(
    @Body() dto: QuizStartDto,
    @CurrentUser() user: User & { childId?: number },
  ): Promise<QuizSessionDto> {
    if (!user.childId) {
      throw new BadRequestException(
        "Active child profile required. Please select a child profile first.",
      );
    }

    const session = await this.quizService.startQuiz(user.childId, dto);
    void this.redisAnalytics.trackContentView(String(dto.topicId), 'QUIZ', String(user.id)).catch(() => {});
    return session;
  }

  /**
   * Submit answer to current question and receive instant feedback
   * Difficulty adapts based on consecutive correct/incorrect answers
   */
  @ApiOperation({
    summary: "Submit quiz answer and get instant feedback",
    description: `
      Submit answer to quiz question and receive immediate feedback.
      
      Adaptive Difficulty Adjustment:
      - 3 consecutive correct → increase difficulty
      - 2 consecutive incorrect → decrease difficulty
      - Points: Easy=5, Medium=10, Hard=15
      
      Records activity and updates learning progress.
    `,
  })
  @ApiResponse({
    status: 200,
    description: "Answer feedback with adapted difficulty",
    type: QuizAnswerFeedbackDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid quiz session or question ID",
  })
  @ApiResponse({
    status: 404,
    description: "Quiz session not found or expired",
  })
  @Roles("LEARNER")
  @Throttle(30, 60) // 30 answer submissions per 60 seconds
  @Post("answer")
  async submitAnswer(
    @Body() dto: QuizAnswerDto,
    @CurrentUser() user: User & { childId?: number },
  ): Promise<QuizAnswerFeedbackDto> {
    if (!user.childId) {
      throw new BadRequestException(
        "Active child profile required. Please select a child profile first.",
      );
    }

    return this.quizService.submitAnswer(user.childId, dto);
  }

  /**
   * Get complete quiz results with gamification rewards
   * Called after all questions answered
   */
  @ApiOperation({
    summary: "Get quiz results with stars and rewards",
    description: `
      Retrieve final quiz results with performance metrics and rewards.
      
      Scoring:
      - Percentage = (correct / total) * 100
      - Stars: 90%+=5★, 75%+=4★, 60%+=3★, 40%+=2★, <40%=1★
      - Reward Points = questionCount * 3 * (percentage / 100)
      
      Triggers gamification badges and level progression.
    `,
  })
  @ApiResponse({
    status: 200,
    description: "Quiz results with breakdown and rewards",
    type: QuizResultDto,
  })
  @ApiResponse({
    status: 404,
    description: "Quiz session not found or expired",
  })
  @ApiParam({
    name: "quizSessionId",
    type: "string",
    description: "Quiz session UUID",
  })
  @Roles("LEARNER")
  @Get("results/:quizSessionId")
  async getQuizResults(
    @Param("quizSessionId") quizSessionId: string,
    @CurrentUser() user: User & { childId?: number },
  ): Promise<QuizResultDto> {
    if (!user.childId) {
      throw new BadRequestException(
        "Active child profile required. Please select a child profile first.",
      );
    }

    return this.quizService.getQuizResults(user.childId, quizSessionId);
  }
}
