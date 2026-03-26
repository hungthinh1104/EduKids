import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
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
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { ContentService } from "./content.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import {
  TopicDetailResponseDto,
  MediaLoadErrorDto,
} from "./dto/content-response.dto";
import { PaginatedResponseDto } from "../../common/dto/pagination.dto";
import { TopicDto } from "./dto/topic.dto";
import { VocabularyDto } from "./dto/vocabulary.dto";

@ApiTags("Content")
@ApiBearerAuth("JWT-auth")
@Controller("content")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  /**
   * UC-01: Get all vocabulary topics (with pagination)
   * Accessible by PARENT and LEARNER roles
   */
  @Get("topics")
  @Roles("PARENT", "LEARNER")
  @ApiOperation({
    summary: "Get all vocabulary topics",
    description:
      "UC-01: Child selects vocabulary topic. Returns paginated list of all available topics with vocabulary count.",
  })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: "Topics retrieved successfully",
    type: PaginatedResponseDto<TopicDto>,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token missing or invalid",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient role permissions",
  })
  async getTopics(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Request() req,
  ): Promise<PaginatedResponseDto<TopicDto>> {
    const childId =
      req.user?.role === "LEARNER" && req.user?.childId
        ? Number(req.user.childId)
        : undefined;
    return await this.contentService.getTopicsPaginated(page, limit, childId);
  }

  /**
   * UC-01: Get topic detail with flashcards + video + progress
   * Requires LEARNER role (JWT must have childId claim)
   */
  @Get("topics/:id")
  @Roles("LEARNER")
  @ApiOperation({
    summary: "View immersive vocabulary content",
    description:
      "UC-01: System displays flashcards + short video. Returns topic with vocabularies (flashcards), media URLs, video lesson, and viewing progress.",
  })
  @ApiParam({ name: "id", description: "Topic ID", type: "number" })
  @ApiResponse({
    status: 200,
    description: "Topic content retrieved successfully",
    type: TopicDetailResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token missing or invalid",
  })
  @ApiResponse({
    status: 403,
    description:
      "Forbidden - Requires LEARNER role (must switch to child profile first)",
  })
  @ApiResponse({
    status: 404,
    description: "Topic not found",
  })
  @ApiResponse({
    status: 500,
    description: "Media loading failed - Connection is slow, try again!",
    type: MediaLoadErrorDto,
  })
  async getTopicById(
    @Param("id", ParseIntPipe) topicId: number,
    @Request() req,
  ): Promise<TopicDetailResponseDto> {
    // Get childId from JWT (set by switch-profile in UC-00)
    const childId = req.user?.childId;

    if (!childId) {
      throw new HttpException(
        "Child profile required. Please switch to child profile first (POST /api/profiles/switch).",
        HttpStatus.FORBIDDEN,
      );
    }

    try {
      return await this.contentService.getTopicById(topicId, childId);
    } catch (error) {
      // UC-01 Exception: Media loading fails
      if (
        error instanceof Error &&
        error.message === "Connection is slow, try again!"
      ) {
        throw new HttpException(
          {
            errorCode: "MEDIA_LOAD_FAILED",
            message: "Connection is slow, try again!",
            placeholderUrl:
              "https://res.cloudinary.com/edukids/image/placeholder.png",
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw error;
    }
  }

  @Get("vocabularies/:id")
  @Roles("LEARNER")
  @ApiOperation({
    summary: "Get vocabulary detail",
    description:
      "Returns a single vocabulary item with media so the learner UI can load pronunciation practice content.",
  })
  @ApiParam({ name: "id", description: "Vocabulary ID", type: "number" })
  @ApiResponse({
    status: 200,
    description: "Vocabulary retrieved successfully",
    type: VocabularyDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token missing or invalid",
  })
  @ApiResponse({
    status: 403,
    description:
      "Forbidden - Requires LEARNER role (must switch to child profile first)",
  })
  @ApiResponse({
    status: 404,
    description: "Vocabulary not found",
  })
  async getVocabularyById(
    @Param("id", ParseIntPipe) vocabularyId: number,
  ): Promise<VocabularyDto> {
    return await this.contentService.getVocabularyById(vocabularyId);
  }

  // @ApiOperation({ summary: 'Create new vocabulary (Admin only)' })
  // @Post('vocabularies')
  // async createVocabulary() { }

  // Media
  // @ApiOperation({ summary: 'Upload media file' })
  // @Post('media/upload')
  // async uploadMedia() { }
}
