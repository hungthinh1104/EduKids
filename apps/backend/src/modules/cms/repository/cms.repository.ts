import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateTopicDto, ContentStatus } from "../dto/create-topic.dto";
import { UpdateTopicDto } from "../dto/update-topic.dto";
import { CreateVocabularyDto } from "../dto/create-vocabulary.dto";
import { UpdateVocabularyDto } from "../dto/update-vocabulary.dto";
import { CreateQuizStructureDto } from "../dto/create-quiz-structure.dto";
import { UpdateQuizStructureDto } from "../dto/update-quiz-structure.dto";

@Injectable()
export class CmsRepository {
  private readonly logger = new Logger(CmsRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============ TOPIC OPERATIONS ============

  async createTopic(dto: CreateTopicDto, _createdByUserId: number) {
    this.logger.debug(`Creating topic: ${dto.name}`);
    return this.prisma.topic.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async updateTopic(topicId: number, dto: UpdateTopicDto) {
    this.logger.debug(`Updating topic ID: ${topicId}`);
    const updateData: Record<string, unknown> = {};

    if (dto.name) updateData.name = dto.name;
    if (dto.description) updateData.description = dto.description;

    return this.prisma.topic.update({
      where: { id: topicId },
      data: updateData,
    });
  }

  async getTopicById(topicId: number) {
    this.logger.debug(`Fetching topic ID: ${topicId}`);
    return this.prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        vocabularies: true,
      },
    });
  }

  async getAllTopics(
    skip: number = 0,
    take: number = 10,
    status?: ContentStatus,
  ) {
    this.logger.debug(
      `Fetching topics - skip: ${skip}, take: ${take}, status: ${status}`,
    );
    const where: Record<string, unknown> = {};

    const [topics, total] = await Promise.all([
      this.prisma.topic.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { vocabularies: true },
          },
        },
      }),
      this.prisma.topic.count({ where }),
    ]);

    return { topics, total };
  }

  async deleteTopic(topicId: number): Promise<void> {
    this.logger.debug(`Deleting topic ID: ${topicId}`);

    // Delete topic (vocabularies cascade deleted)
    await this.prisma.topic.delete({
      where: { id: topicId },
    });
  }

  async publishTopic(topicId: number, _userId: number) {
    this.logger.debug(`Publishing topic ID: ${topicId}`);
    return this.prisma.topic.update({
      where: { id: topicId },
      data: {
        description: "Published",
      },
    });
  }

  // ============ VOCABULARY OPERATIONS ============

  async createVocabulary(dto: CreateVocabularyDto, _createdByUserId: number) {
    this.logger.debug(`Creating vocabulary: ${dto.word}`);
    return this.prisma.vocabulary.create({
      data: {
        word: dto.word,
        topicId: dto.topicId,
        translation: dto.definition,
        exampleSentence: dto.example || null,
      },
    });
  }

  async updateVocabulary(vocabularyId: number, dto: UpdateVocabularyDto) {
    this.logger.debug(`Updating vocabulary ID: ${vocabularyId}`);
    const updateData: Record<string, unknown> = {};

    if (dto.word) updateData.word = dto.word;
    if (dto.definition) updateData.definition = dto.definition;
    if (dto.example !== undefined) updateData.example = dto.example;
    if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl;
    if (dto.audioUrl !== undefined) updateData.audioUrl = dto.audioUrl;
    if (dto.status) updateData.status = dto.status;

    return this.prisma.vocabulary.update({
      where: { id: vocabularyId },
      data: updateData,
    });
  }

  async getVocabularyById(vocabularyId: number) {
    this.logger.debug(`Fetching vocabulary ID: ${vocabularyId}`);
    return this.prisma.vocabulary.findUnique({
      where: { id: vocabularyId },
      include: { topic: true },
    });
  }

  async getVocabulariesByTopicId(
    topicId: number,
    skip: number = 0,
    take: number = 20,
  ) {
    this.logger.debug(
      `Fetching vocabularies for topic ${topicId} - skip: ${skip}, take: ${take}`,
    );

    const [vocabularies, total] = await Promise.all([
      this.prisma.vocabulary.findMany({
        where: { topicId },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.vocabulary.count({ where: { topicId } }),
    ]);

    return { vocabularies, total };
  }

  async deleteVocabulary(vocabularyId: number): Promise<void> {
    this.logger.debug(`Deleting vocabulary ID: ${vocabularyId}`);
    await this.prisma.vocabulary.delete({
      where: { id: vocabularyId },
    });
  }

  async publishVocabulary(vocabularyId: number, _userId: number) {
    this.logger.debug(`Publishing vocabulary ID: ${vocabularyId}`);
    return this.prisma.vocabulary.update({
      where: { id: vocabularyId },
      data: {
        difficulty: 1,
      },
    });
  }

  // ============ QUIZ STRUCTURE OPERATIONS ============

  async createQuizStructure(
    dto: CreateQuizStructureDto,
    _createdByUserId: number,
  ) {
    this.logger.debug(`Creating quiz structure (stub)`);
    return { id: 0, topicId: dto.topicId };
  }

  async updateQuizStructure(quizId: number, _dto: UpdateQuizStructureDto) {
    this.logger.debug(`Updating quiz structure ID: ${quizId}`);
    return { id: quizId };
  }

  async getQuizStructureById(quizId: number) {
    this.logger.debug(`Fetching quiz structure ID: ${quizId}`);
    return { id: quizId };
  }

  async getQuizStructuresByTopicId(
    topicId: number,
    skip: number = 0,
    take: number = 10,
  ) {
    this.logger.debug(
      `Fetching quizzes for topic ${topicId} - skip: ${skip}, take: ${take}`,
    );
    return { quizzes: [], total: 0 };
  }

  async deleteQuizStructure(quizId: number): Promise<void> {
    this.logger.debug(`Deleting quiz structure ID: ${quizId}`);
  }

  async publishQuizStructure(quizId: number, _userId: number) {
    this.logger.debug(`Publishing quiz structure ID: ${quizId}`);
    return { id: quizId };
  }

  // ============ AUDIT LOG OPERATIONS ============

  async createAuditLog(
    adminId: number,
    action: string,
    entityType: string,
    _entityId: number,
    _changes: Record<string, unknown>,
  ) {
    this.logger.debug(
      `Creating audit log - admin: ${adminId}, action: ${action}`,
    );
    return this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action,
        entity: entityType,
      },
    });
  }

  async getAuditLogsByEntity(entityType: string, entityId: number) {
    this.logger.debug(`Fetching audit logs for ${entityType}:${entityId}`);
    return [];
  }

  async getAuditLogsByAdmin(adminId: number, limit: number = 100) {
    this.logger.debug(`Fetching audit logs for admin ${adminId}`);
    return this.prisma.auditLog.findMany({
      where: { userId: adminId },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }
}
