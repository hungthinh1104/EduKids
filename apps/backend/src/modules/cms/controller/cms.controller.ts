import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { CmsService } from "../service/cms.service";
import { Roles } from "../../../common/decorators/roles.decorator";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { CreateTopicDto, ContentStatus } from "../dto/create-topic.dto";
import { UpdateTopicDto } from "../dto/update-topic.dto";
import { CreateVocabularyDto } from "../dto/create-vocabulary.dto";
import { UpdateVocabularyDto } from "../dto/update-vocabulary.dto";
import { CreateQuizStructureDto } from "../dto/create-quiz-structure.dto";
import { UpdateQuizStructureDto } from "../dto/update-quiz-structure.dto";
import {
  TopicResponseDto,
  VocabularyResponseDto,
  QuizStructureResponseDto,
  AuditLogResponseDto,
} from "../dto/response.dto";

@ApiTags("CMS / Content Management")
@Controller("cms")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  private extractUserId(req: RequestWithUser): number {
    return req.user.userId ?? req.user.sub ?? req.user.id;
  }

  // ============ TOPIC ENDPOINTS ============

  @Post("topics")
  @Roles("ADMIN")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a new topic",
    description: "Admin only: Create a new learning topic with metadata",
  })
  @ApiResponse({
    status: 201,
    description: "Topic created successfully",
    type: TopicResponseDto,
  })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden (admin only)" })
  async createTopic(
    @Body() createTopicDto: CreateTopicDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.extractUserId(req);
    return this.cmsService.createTopic(createTopicDto, userId);
  }

  @Get("topics")
  @Roles("ADMIN")
  @ApiOperation({
    summary: "Get all topics",
    description:
      "Admin only: Retrieve all topics with pagination and optional status filter",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default: 1)",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page (default: 10, max: 100)",
    example: 10,
  })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ContentStatus,
    description: "Filter by status",
  })
  @ApiResponse({
    status: 200,
    description: "Topics retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden (admin only)" })
  async getAllTopics(
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
    @Query("status") status?: ContentStatus,
  ) {
    return this.cmsService.getAllTopics(page, limit, status);
  }

  @Get("topics/:id")
  @Roles("ADMIN")
  @ApiOperation({
    summary: "Get topic by ID",
    description: "Admin only: Retrieve a specific topic with all details",
  })
  @ApiParam({
    name: "id",
    description: "Topic ID",
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Topic retrieved successfully",
    type: TopicResponseDto,
  })
  @ApiResponse({ status: 404, description: "Topic not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden (admin only)" })
  async getTopicById(@Param("id") topicId: number) {
    return this.cmsService.getTopicById(topicId);
  }

  @Put("topics/:id")
  @Roles("ADMIN")
  @ApiOperation({
    summary: "Update a topic",
    description: "Admin only: Update topic information",
  })
  @ApiParam({
    name: "id",
    description: "Topic ID",
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Topic updated successfully",
    type: TopicResponseDto,
  })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 404, description: "Topic not found" })
  @ApiResponse({
    status: 409,
    description: "Conflict (e.g., status change on published content)",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden (admin only)" })
  async updateTopic(
    @Param("id") topicId: number,
    @Body() updateTopicDto: UpdateTopicDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.extractUserId(req);
    return this.cmsService.updateTopic(topicId, updateTopicDto, userId);
  }

  @Delete("topics/:id")
  @Roles("ADMIN")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Delete a topic",
    description: "Admin only: Delete a topic (draft only)",
  })
  @ApiParam({
    name: "id",
    description: "Topic ID",
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Topic deleted successfully",
  })
  @ApiResponse({ status: 404, description: "Topic not found" })
  @ApiResponse({ status: 409, description: "Cannot delete published content" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden (admin only)" })
  async deleteTopic(@Param("id") topicId: number, @Req() req: RequestWithUser) {
    const userId = this.extractUserId(req);
    return this.cmsService.deleteTopic(topicId, userId);
  }

  @Post("topics/:id/publish")
  @Roles("ADMIN")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Publish a topic",
    description: "Admin only: Publish a topic and make it live",
  })
  @ApiParam({
    name: "id",
    description: "Topic ID",
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Topic published successfully",
    type: TopicResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Topic must have content before publishing",
  })
  @ApiResponse({ status: 404, description: "Topic not found" })
  @ApiResponse({ status: 409, description: "Topic already published" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden (admin only)" })
  async publishTopic(
    @Param("id") topicId: number,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.extractUserId(req);
    return this.cmsService.publishTopic(topicId, userId);
  }

  @Post("topics/:id/archive")
  @Roles("ADMIN")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Archive a topic",
    description: "Admin only: Archive a topic (remove from live)",
  })
  @ApiParam({
    name: "id",
    description: "Topic ID",
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Topic archived successfully",
    type: TopicResponseDto,
  })
  @ApiResponse({ status: 404, description: "Topic not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden (admin only)" })
  async archiveTopic(
    @Param("id") topicId: number,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.extractUserId(req);
    return this.cmsService.archiveTopic(topicId, userId);
  }

  // ============ VOCABULARY ENDPOINTS ============

  @Post("vocabularies")
  @Roles("ADMIN")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a new vocabulary/flashcard",
    description: "Admin only: Create a new vocabulary item for a topic",
  })
  @ApiResponse({
    status: 201,
    description: "Vocabulary created successfully",
    type: VocabularyResponseDto,
  })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 404, description: "Topic not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden (admin only)" })
  async createVocabulary(
    @Body() createVocabularyDto: CreateVocabularyDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.extractUserId(req);
    return this.cmsService.createVocabulary(createVocabularyDto, userId);
  }

  @Get("vocabularies/:id")
  @Roles("ADMIN")
  @ApiOperation({
    summary: "Get vocabulary by ID",
    description: "Admin only: Retrieve a specific vocabulary item",
  })
  @ApiParam({
    name: "id",
    description: "Vocabulary ID",
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Vocabulary retrieved successfully",
    type: VocabularyResponseDto,
  })
  @ApiResponse({ status: 404, description: "Vocabulary not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden (admin only)" })
  async getVocabularyById(@Param("id") vocabularyId: number) {
    return this.cmsService.getVocabularyById(vocabularyId);
  }

  @Get("topics/:topicId/vocabularies")
  @Roles("ADMIN")
  @ApiOperation({
    summary: "Get vocabularies by topic",
    description: "Admin only: Retrieve all vocabularies for a topic",
  })
  @ApiParam({
    name: "topicId",
    description: "Topic ID",
    type: Number,
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page (default: 20)",
  })
  @ApiResponse({
    status: 200,
    description: "Vocabularies retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Topic not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden (admin only)" })
  async getVocabulariesByTopicId(
    @Param("topicId") topicId: number,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 20,
  ) {
    return this.cmsService.getVocabulariesByTopicId(topicId, page, limit);
  }

  @Put("vocabularies/:id")
  @Roles("ADMIN")
  @ApiOperation({
    summary: "Update a vocabulary item",
    description: "Admin only: Update vocabulary information",
  })
  @ApiParam({
    name: "id",
    description: "Vocabulary ID",
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Vocabulary updated successfully",
    type: VocabularyResponseDto,
  })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 404, description: "Vocabulary not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden (admin only)" })
  async updateVocabulary(
    @Param("id") vocabularyId: number,
    @Body() updateVocabularyDto: UpdateVocabularyDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.extractUserId(req);
    return this.cmsService.updateVocabulary(
      vocabularyId,
      updateVocabularyDto,
      userId,
    );
  }

  @Delete("vocabularies/:id")
  @Roles("ADMIN")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Delete a vocabulary item",
    description: "Admin only: Delete a vocabulary item",
  })
  @ApiParam({
    name: "id",
    description: "Vocabulary ID",
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Vocabulary deleted successfully",
  })
  @ApiResponse({ status: 404, description: "Vocabulary not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden (admin only)" })
  async deleteVocabulary(
    @Param("id") vocabularyId: number,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.extractUserId(req);
    return this.cmsService.deleteVocabulary(vocabularyId, userId);
  }

  @Post("vocabularies/:id/publish")
  @Roles("ADMIN")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Publish a vocabulary item",
    description: "Admin only: Publish a vocabulary and make it live",
  })
  @ApiParam({
    name: "id",
    description: "Vocabulary ID",
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Vocabulary published successfully",
    type: VocabularyResponseDto,
  })
  @ApiResponse({ status: 404, description: "Vocabulary not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden (admin only)" })
  async publishVocabulary(
    @Param("id") vocabularyId: number,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.extractUserId(req);
    return this.cmsService.publishVocabulary(vocabularyId, userId);
  }

  // ============ QUIZ STRUCTURE ENDPOINTS ============

  @Post("quizzes")
  @Roles("ADMIN")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a new quiz",
    description: "Admin only: Create a new quiz structure for a topic",
  })
  @ApiResponse({
    status: 201,
    description: "Quiz created successfully",
    type: QuizStructureResponseDto,
  })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 404, description: "Topic not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden (admin only)" })
  async createQuizStructure(
    @Body() createQuizStructureDto: CreateQuizStructureDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.extractUserId(req);
    return this.cmsService.createQuizStructure(createQuizStructureDto, userId);
  }

  @Get("quizzes/:id")
  @Roles("ADMIN")
  @ApiOperation({
    summary: "Get quiz by ID",
    description: "Admin only: Retrieve a specific quiz",
  })
  @ApiParam({
    name: "id",
    description: "Quiz ID",
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Quiz retrieved successfully",
    type: QuizStructureResponseDto,
  })
  @ApiResponse({ status: 404, description: "Quiz not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden (admin only)" })
  async getQuizStructureById(@Param("id") quizId: number) {
    return this.cmsService.getQuizStructureById(quizId);
  }

  @Get("topics/:topicId/quizzes")
  @Roles("ADMIN")
  @ApiOperation({
    summary: "Get quizzes by topic",
    description: "Admin only: Retrieve all quizzes for a topic",
  })
  @ApiParam({
    name: "topicId",
    description: "Topic ID",
    type: Number,
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page (default: 10)",
  })
  @ApiResponse({
    status: 200,
    description: "Quizzes retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Topic not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden (admin only)" })
  async getQuizStructuresByTopicId(
    @Param("topicId") topicId: number,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
  ) {
    return this.cmsService.getQuizStructuresByTopicId(topicId, page, limit);
  }

  @Put("quizzes/:id")
  @Roles("ADMIN")
  @ApiOperation({
    summary: "Update a quiz",
    description: "Admin only: Update quiz information",
  })
  @ApiParam({
    name: "id",
    description: "Quiz ID",
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Quiz updated successfully",
    type: QuizStructureResponseDto,
  })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 404, description: "Quiz not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden (admin only)" })
  async updateQuizStructure(
    @Param("id") quizId: number,
    @Body() updateQuizStructureDto: UpdateQuizStructureDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.extractUserId(req);
    return this.cmsService.updateQuizStructure(
      quizId,
      updateQuizStructureDto,
      userId,
    );
  }

  @Delete("quizzes/:id")
  @Roles("ADMIN")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Delete a quiz",
    description: "Admin only: Delete a quiz",
  })
  @ApiParam({
    name: "id",
    description: "Quiz ID",
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Quiz deleted successfully",
  })
  @ApiResponse({ status: 404, description: "Quiz not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden (admin only)" })
  async deleteQuizStructure(
    @Param("id") quizId: number,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.extractUserId(req);
    return this.cmsService.deleteQuizStructure(quizId, userId);
  }

  @Post("quizzes/:id/publish")
  @Roles("ADMIN")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Publish a quiz",
    description: "Admin only: Publish a quiz and make it live",
  })
  @ApiParam({
    name: "id",
    description: "Quiz ID",
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Quiz published successfully",
    type: QuizStructureResponseDto,
  })
  @ApiResponse({ status: 404, description: "Quiz not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden (admin only)" })
  async publishQuizStructure(
    @Param("id") quizId: number,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.extractUserId(req);
    return this.cmsService.publishQuizStructure(quizId, userId);
  }

  // ============ AUDIT LOG ENDPOINTS ============

  @Get("audit-logs/entity/:entityType/:entityId")
  @Roles("ADMIN")
  @ApiOperation({
    summary: "Get audit logs for entity",
    description: "Admin only: Retrieve audit trail for a specific entity",
  })
  @ApiParam({
    name: "entityType",
    description: "Entity type (topic, vocabulary, quiz)",
    type: String,
  })
  @ApiParam({
    name: "entityId",
    description: "Entity ID",
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Audit logs retrieved successfully",
    type: [AuditLogResponseDto],
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden (admin only)" })
  async getAuditLogsByEntity(
    @Param("entityType") entityType: string,
    @Param("entityId") entityId: number,
  ) {
    return this.cmsService.getAuditLogsByEntity(entityType, entityId);
  }

  @Get("audit-logs/admin/:adminId")
  @Roles("ADMIN")
  @ApiOperation({
    summary: "Get audit logs by admin",
    description:
      "Admin only: Retrieve all actions performed by a specific admin",
  })
  @ApiParam({
    name: "adminId",
    description: "Admin user ID",
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Audit logs retrieved successfully",
    type: [AuditLogResponseDto],
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden (admin only)" })
  async getAuditLogsByAdmin(@Param("adminId") adminId: number) {
    return this.cmsService.getAuditLogsByAdmin(adminId);
  }
}

type RequestWithUser = Request & {
  user: {
    userId?: number;
    sub?: number;
    id?: number;
  };
};
