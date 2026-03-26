import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { CmsRepository } from "../repository/cms.repository";
import { CreateTopicDto, ContentStatus } from "../dto/create-topic.dto";
import { UpdateTopicDto } from "../dto/update-topic.dto";
import { CreateVocabularyDto } from "../dto/create-vocabulary.dto";
import { UpdateVocabularyDto } from "../dto/update-vocabulary.dto";
import { CreateQuizStructureDto } from "../dto/create-quiz-structure.dto";
import { UpdateQuizStructureDto } from "../dto/update-quiz-structure.dto";
import { ContentValidationService } from "../../media-validation/service/content-validation.service";
import {
  ContentTypeValidation,
  SafetyFlagDto,
} from "../../media-validation/dto/validation.dto";

@Injectable()
export class CmsService {
  private readonly logger = new Logger(CmsService.name);

  constructor(
    private readonly cmsRepository: CmsRepository,
    private readonly contentValidationService: ContentValidationService,
  ) {}

  private toFlagSummary(safetyFlags: SafetyFlagDto[]): string {
    return safetyFlags
      .slice(0, 5)
      .map((flag) => `${flag.type}: ${flag.description}`)
      .join("; ");
  }

  private async enforceChildSafeContent(params: {
    contentId: string;
    contentType: ContentTypeValidation;
    title: string;
    description?: string;
    text?: string;
    imageUrl?: string;
    audioUrl?: string;
  }): Promise<void> {
    const validation = await this.contentValidationService.validateContent({
      contentId: params.contentId,
      contentType: params.contentType,
      title: params.title,
      description: params.description,
      text: params.text,
      imageUrl: params.imageUrl,
      audioUrl: params.audioUrl,
    });

    if (!validation.isApproved || validation.safetyFlags.length > 0) {
      const summary = this.toFlagSummary(validation.safetyFlags);
      throw new BadRequestException(
        summary
          ? `Nội dung không phù hợp với trẻ em. Vui lòng chỉnh sửa: ${summary}`
          : "Nội dung không phù hợp với trẻ em. Vui lòng chỉnh sửa.",
      );
    }
  }

  // ============ TOPIC SERVICE METHODS ============

  async createTopic(dto: CreateTopicDto, userId: number) {
    this.logger.log(`Creating topic: ${dto.name}`);

    // Validation
    if (dto.name.trim().length < 2) {
      throw new BadRequestException("Topic name must be at least 2 characters");
    }

    if (dto.description.length < 10) {
      throw new BadRequestException(
        "Description must be at least 10 characters",
      );
    }

    if (dto.learningLevel < 1 || dto.learningLevel > 5) {
      throw new BadRequestException("Learning level must be between 1 and 5");
    }

    await this.enforceChildSafeContent({
      contentId: `cms:topic:new:${Date.now()}`,
      contentType: ContentTypeValidation.TOPIC,
      title: dto.name,
      description: dto.description,
      text: `${dto.name}\n${dto.description}`,
      imageUrl: dto.imageUrl,
    });

    const topic = await this.cmsRepository.createTopic(dto, userId);

    // Audit log
    await this.cmsRepository.createAuditLog(
      userId,
      "CREATE_TOPIC",
      "topic",
      topic.id,
      {
        name: topic.name,
        description: topic.description,
        learningLevel: dto.learningLevel,
      },
    );

    this.logger.log(`Topic created successfully: ID ${topic.id}`);
    return topic;
  }

  async updateTopic(topicId: number, dto: UpdateTopicDto, userId: number) {
    this.logger.log(`Updating topic: ${topicId}`);

    // Verify topic exists
    const topic = await this.cmsRepository.getTopicById(topicId);
    if (!topic) {
      throw new NotFoundException(`Topic with ID ${topicId} not found`);
    }

    // Validation
    if (dto.name && dto.name.trim().length < 2) {
      throw new BadRequestException("Topic name must be at least 2 characters");
    }

    if (dto.description && dto.description.length < 10) {
      throw new BadRequestException(
        "Description must be at least 10 characters",
      );
    }

    if (dto.learningLevel && (dto.learningLevel < 1 || dto.learningLevel > 5)) {
      throw new BadRequestException("Learning level must be between 1 and 5");
    }

    // Prevent status changes on published content without admin review
    const topicStatus = (topic as { status?: ContentStatus }).status;
    if (
      dto.status &&
      dto.status !== topicStatus &&
      topicStatus === ContentStatus.PUBLISHED
    ) {
      throw new ConflictException(
        "Cannot change status of published content without review process",
      );
    }

    const nextTopicName = dto.name ?? topic.name;
    const nextTopicDescription = dto.description ?? topic.description;
    const nextTopicImageUrl =
      dto.imageUrl !== undefined ? dto.imageUrl : topic.imageUrl;

    await this.enforceChildSafeContent({
      contentId: `cms:topic:${topicId}`,
      contentType: ContentTypeValidation.TOPIC,
      title: nextTopicName,
      description: nextTopicDescription,
      text: `${nextTopicName}\n${nextTopicDescription}`,
      imageUrl:
        typeof nextTopicImageUrl === "string" ? nextTopicImageUrl : undefined,
    });

    const updatedTopic = await this.cmsRepository.updateTopic(topicId, dto);

    // Audit log
    const changes: Record<string, unknown> = {};
    if (dto.name) changes.name = dto.name;
    if (dto.description) changes.description = dto.description;
    if (dto.learningLevel) changes.learningLevel = dto.learningLevel;
    if (dto.status) changes.status = dto.status;

    await this.cmsRepository.createAuditLog(
      userId,
      "UPDATE_TOPIC",
      "topic",
      topicId,
      changes,
    );

    this.logger.log(`Topic updated successfully: ID ${topicId}`);
    return updatedTopic;
  }

  async getTopicById(topicId: number) {
    this.logger.debug(`Fetching topic: ${topicId}`);
    const topic = await this.cmsRepository.getTopicById(topicId);
    if (!topic) {
      throw new NotFoundException(`Topic with ID ${topicId} not found`);
    }
    return topic;
  }

  async getAllTopics(
    page: number = 1,
    limit: number = 10,
    status?: ContentStatus,
  ): Promise<{
    data: unknown[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    this.logger.debug(`Fetching all topics - page: ${page}, limit: ${limit}`);

    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;

    const skip = (page - 1) * limit;
    const { topics, total } = await this.cmsRepository.getAllTopics(
      skip,
      limit,
      status,
    );

    return {
      data: topics,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteTopic(
    topicId: number,
    userId: number,
  ): Promise<{ message: string }> {
    this.logger.log(`Deleting topic: ${topicId}`);

    const topic = await this.cmsRepository.getTopicById(topicId);
    if (!topic) {
      throw new NotFoundException(`Topic with ID ${topicId} not found`);
    }

    if (
      (topic as { status?: ContentStatus }).status === ContentStatus.PUBLISHED
    ) {
      throw new ConflictException(
        "Cannot delete published content without archiving first",
      );
    }

    await this.cmsRepository.deleteTopic(topicId);

    // Audit log
    await this.cmsRepository.createAuditLog(
      userId,
      "DELETE_TOPIC",
      "topic",
      topicId,
      { name: topic.name },
    );

    this.logger.log(`Topic deleted successfully: ID ${topicId}`);
    return { message: `Topic ${topicId} deleted successfully` };
  }

  async publishTopic(topicId: number, userId: number) {
    this.logger.log(`Publishing topic: ${topicId}`);

    const topic = await this.cmsRepository.getTopicById(topicId);
    if (!topic) {
      throw new NotFoundException(`Topic with ID ${topicId} not found`);
    }

    if (
      (topic as { status?: ContentStatus }).status === ContentStatus.PUBLISHED
    ) {
      throw new ConflictException("Topic is already published");
    }

    // Verify topic has content (flashcards)
    if (!topic.vocabularies || topic.vocabularies.length === 0) {
      throw new BadRequestException(
        "Topic must have at least one vocabulary/flashcard before publishing",
      );
    }

    const publishedTopic = await this.cmsRepository.publishTopic(
      topicId,
      userId,
    );

    // Audit log
    await this.cmsRepository.createAuditLog(
      userId,
      "PUBLISH_TOPIC",
      "topic",
      topicId,
      { status: ContentStatus.PUBLISHED },
    );

    this.logger.log(`Topic published successfully: ID ${topicId}`);
    return publishedTopic;
  }

  async archiveTopic(topicId: number, userId: number) {
    this.logger.log(`Archiving topic: ${topicId}`);

    const topic = await this.cmsRepository.getTopicById(topicId);
    if (!topic) {
      throw new NotFoundException(`Topic with ID ${topicId} not found`);
    }

    const archivedTopic = await this.cmsRepository.updateTopic(topicId, {
      status: ContentStatus.ARCHIVED,
    });

    // Audit log
    await this.cmsRepository.createAuditLog(
      userId,
      "ARCHIVE_TOPIC",
      "topic",
      topicId,
      { status: ContentStatus.ARCHIVED },
    );

    this.logger.log(`Topic archived successfully: ID ${topicId}`);
    return archivedTopic;
  }

  // ============ VOCABULARY SERVICE METHODS ============

  async createVocabulary(dto: CreateVocabularyDto, userId: number) {
    this.logger.log(`Creating vocabulary: ${dto.word}`);

    // Verify topic exists
    const topic = await this.cmsRepository.getTopicById(dto.topicId);
    if (!topic) {
      throw new NotFoundException(`Topic with ID ${dto.topicId} not found`);
    }

    // Validation
    if (dto.word.trim().length < 1) {
      throw new BadRequestException("Word cannot be empty");
    }

    if (dto.definition.length < 5) {
      throw new BadRequestException("Definition must be at least 5 characters");
    }

    await this.enforceChildSafeContent({
      contentId: `cms:vocabulary:new:${Date.now()}`,
      contentType: ContentTypeValidation.VOCABULARY,
      title: dto.word,
      description: dto.definition,
      text: [dto.word, dto.definition, dto.example, dto.phonetic]
        .filter(
          (part): part is string => typeof part === "string" && part.length > 0,
        )
        .join("\n"),
      imageUrl: dto.imageUrl,
      audioUrl: dto.audioUrl,
    });

    const vocabulary = await this.cmsRepository.createVocabulary(dto, userId);

    // Audit log
    await this.cmsRepository.createAuditLog(
      userId,
      "CREATE_VOCABULARY",
      "vocabulary",
      vocabulary.id,
      { word: vocabulary.word, topicId: dto.topicId },
    );

    this.logger.log(`Vocabulary created successfully: ID ${vocabulary.id}`);
    return vocabulary;
  }

  async updateVocabulary(
    vocabularyId: number,
    dto: UpdateVocabularyDto,
    userId: number,
  ) {
    this.logger.log(`Updating vocabulary: ${vocabularyId}`);

    const vocabulary = await this.cmsRepository.getVocabularyById(vocabularyId);
    if (!vocabulary) {
      throw new NotFoundException(
        `Vocabulary with ID ${vocabularyId} not found`,
      );
    }

    // Validation
    if (dto.word && dto.word.trim().length < 1) {
      throw new BadRequestException("Word cannot be empty");
    }

    if (dto.definition && dto.definition.length < 5) {
      throw new BadRequestException("Definition must be at least 5 characters");
    }

    const nextWord = dto.word ?? vocabulary.word;
    const nextDefinition = dto.definition ?? vocabulary.translation;
    const nextExample =
      dto.example !== undefined ? dto.example : vocabulary.exampleSentence;
    const nextPhonetic =
      dto.phonetic !== undefined ? dto.phonetic : vocabulary.phonetic;
    const nextImageUrl =
      dto.imageUrl !== undefined ? dto.imageUrl : vocabulary.imageUrl;
    const nextAudioUrl =
      dto.audioUrl !== undefined ? dto.audioUrl : vocabulary.audioUrl;

    await this.enforceChildSafeContent({
      contentId: `cms:vocabulary:${vocabularyId}`,
      contentType: ContentTypeValidation.VOCABULARY,
      title: typeof nextWord === "string" ? nextWord : "",
      description:
        typeof nextDefinition === "string" ? nextDefinition : undefined,
      text: [nextWord, nextDefinition, nextExample, nextPhonetic]
        .filter(
          (part): part is string => typeof part === "string" && part.length > 0,
        )
        .join("\n"),
      imageUrl: typeof nextImageUrl === "string" ? nextImageUrl : undefined,
      audioUrl: typeof nextAudioUrl === "string" ? nextAudioUrl : undefined,
    });

    const updatedVocabulary = await this.cmsRepository.updateVocabulary(
      vocabularyId,
      dto,
    );

    // Audit log
    await this.cmsRepository.createAuditLog(
      userId,
      "UPDATE_VOCABULARY",
      "vocabulary",
      vocabularyId,
      { ...dto },
    );

    this.logger.log(`Vocabulary updated successfully: ID ${vocabularyId}`);
    return updatedVocabulary;
  }

  async getVocabularyById(vocabularyId: number) {
    this.logger.debug(`Fetching vocabulary: ${vocabularyId}`);
    const vocabulary = await this.cmsRepository.getVocabularyById(vocabularyId);
    if (!vocabulary) {
      throw new NotFoundException(
        `Vocabulary with ID ${vocabularyId} not found`,
      );
    }
    return vocabulary;
  }

  async getVocabulariesByTopicId(
    topicId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: unknown[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    this.logger.debug(`Fetching vocabularies for topic: ${topicId}`);

    // Verify topic exists
    const topic = await this.cmsRepository.getTopicById(topicId);
    if (!topic) {
      throw new NotFoundException(`Topic with ID ${topicId} not found`);
    }

    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 20;

    const skip = (page - 1) * limit;
    const { vocabularies, total } =
      await this.cmsRepository.getVocabulariesByTopicId(topicId, skip, limit);

    return {
      data: vocabularies,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteVocabulary(
    vocabularyId: number,
    userId: number,
  ): Promise<{ message: string }> {
    this.logger.log(`Deleting vocabulary: ${vocabularyId}`);

    const vocabulary = await this.cmsRepository.getVocabularyById(vocabularyId);
    if (!vocabulary) {
      throw new NotFoundException(
        `Vocabulary with ID ${vocabularyId} not found`,
      );
    }

    await this.cmsRepository.deleteVocabulary(vocabularyId);

    // Audit log
    await this.cmsRepository.createAuditLog(
      userId,
      "DELETE_VOCABULARY",
      "vocabulary",
      vocabularyId,
      { word: vocabulary.word },
    );

    this.logger.log(`Vocabulary deleted successfully: ID ${vocabularyId}`);
    return { message: `Vocabulary ${vocabularyId} deleted successfully` };
  }

  async publishVocabulary(vocabularyId: number, userId: number) {
    this.logger.log(`Publishing vocabulary: ${vocabularyId}`);

    const vocabulary = await this.cmsRepository.getVocabularyById(vocabularyId);
    if (!vocabulary) {
      throw new NotFoundException(
        `Vocabulary with ID ${vocabularyId} not found`,
      );
    }

    const publishedVocabulary = await this.cmsRepository.publishVocabulary(
      vocabularyId,
      userId,
    );

    // Audit log
    await this.cmsRepository.createAuditLog(
      userId,
      "PUBLISH_VOCABULARY",
      "vocabulary",
      vocabularyId,
      { status: ContentStatus.PUBLISHED },
    );

    this.logger.log(`Vocabulary published successfully: ID ${vocabularyId}`);
    return publishedVocabulary;
  }

  // ============ QUIZ STRUCTURE SERVICE METHODS ============

  async createQuizStructure(dto: CreateQuizStructureDto, userId: number) {
    this.logger.log(`Creating quiz structure: ${dto.description}`);

    // Verify topic exists
    const topic = await this.cmsRepository.getTopicById(dto.topicId);
    if (!topic) {
      throw new NotFoundException(`Topic with ID ${dto.topicId} not found`);
    }

    // Validation
    if (dto.title.trim().length < 3) {
      throw new BadRequestException("Quiz title must be at least 3 characters");
    }

    if (dto.description.length < 5) {
      throw new BadRequestException(
        "Description must be at least 5 characters",
      );
    }

    if (dto.options.length < 2) {
      throw new BadRequestException("Quiz must have at least 2 options");
    }

    if (dto.options.length > 6) {
      throw new BadRequestException("Quiz cannot have more than 6 options");
    }

    // Validate exactly one correct answer
    const correctCount = dto.options.filter((opt) => opt.isCorrect).length;
    if (correctCount !== 1) {
      throw new BadRequestException(
        "Quiz must have exactly one correct answer",
      );
    }

    if (dto.difficultyLevel < 1 || dto.difficultyLevel > 5) {
      throw new BadRequestException("Difficulty level must be between 1 and 5");
    }

    const quizStructure = await this.cmsRepository.createQuizStructure(
      dto,
      userId,
    );

    // Audit log
    await this.cmsRepository.createAuditLog(
      userId,
      "CREATE_QUIZ",
      "quiz",
      quizStructure.id,
      { title: dto.title ?? dto.description, topicId: dto.topicId },
    );

    this.logger.log(
      `Quiz structure created successfully: ID ${quizStructure.id}`,
    );
    return quizStructure;
  }

  async updateQuizStructure(
    quizId: number,
    dto: UpdateQuizStructureDto,
    userId: number,
  ) {
    this.logger.log(`Updating quiz structure: ${quizId}`);

    const quizStructure = await this.cmsRepository.getQuizStructureById(quizId);
    if (!quizStructure) {
      throw new NotFoundException(`Quiz structure with ID ${quizId} not found`);
    }

    // Validation
    if (dto.title && dto.title.trim().length < 3) {
      throw new BadRequestException("Quiz title must be at least 3 characters");
    }

    if (dto.description && dto.description.length < 5) {
      throw new BadRequestException(
        "Description must be at least 5 characters",
      );
    }

    if (dto.options) {
      if (dto.options.length < 2) {
        throw new BadRequestException("Quiz must have at least 2 options");
      }

      if (dto.options.length > 6) {
        throw new BadRequestException("Quiz cannot have more than 6 options");
      }

      const correctCount = dto.options.filter((opt) => opt.isCorrect).length;
      if (correctCount !== 1) {
        throw new BadRequestException(
          "Quiz must have exactly one correct answer",
        );
      }
    }

    if (
      dto.difficultyLevel &&
      (dto.difficultyLevel < 1 || dto.difficultyLevel > 5)
    ) {
      throw new BadRequestException("Difficulty level must be between 1 and 5");
    }

    const updatedQuizStructure = await this.cmsRepository.updateQuizStructure(
      quizId,
      dto,
    );

    // Audit log
    await this.cmsRepository.createAuditLog(
      userId,
      "UPDATE_QUIZ",
      "quiz",
      quizId,
      { ...dto },
    );

    this.logger.log(`Quiz structure updated successfully: ID ${quizId}`);
    return updatedQuizStructure;
  }

  async getQuizStructureById(quizId: number) {
    this.logger.debug(`Fetching quiz structure: ${quizId}`);
    const quizStructure = await this.cmsRepository.getQuizStructureById(quizId);
    if (!quizStructure) {
      throw new NotFoundException(`Quiz structure with ID ${quizId} not found`);
    }
    return quizStructure;
  }

  async getQuizStructuresByTopicId(
    topicId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: unknown[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    this.logger.debug(`Fetching quiz structures for topic: ${topicId}`);

    // Verify topic exists
    const topic = await this.cmsRepository.getTopicById(topicId);
    if (!topic) {
      throw new NotFoundException(`Topic with ID ${topicId} not found`);
    }

    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;

    const skip = (page - 1) * limit;
    const { quizzes, total } =
      await this.cmsRepository.getQuizStructuresByTopicId(topicId, skip, limit);

    return {
      data: quizzes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteQuizStructure(
    quizId: number,
    userId: number,
  ): Promise<{ message: string }> {
    this.logger.log(`Deleting quiz structure: ${quizId}`);

    const quizStructure = await this.cmsRepository.getQuizStructureById(quizId);
    if (!quizStructure) {
      throw new NotFoundException(`Quiz structure with ID ${quizId} not found`);
    }

    await this.cmsRepository.deleteQuizStructure(quizId);

    // Audit log
    await this.cmsRepository.createAuditLog(
      userId,
      "DELETE_QUIZ",
      "quiz",
      quizId,
      {
        title:
          (quizStructure as { title?: string }).title ??
          (quizStructure as { name?: string }).name ??
          `Quiz ${quizId}`,
      },
    );

    this.logger.log(`Quiz structure deleted successfully: ID ${quizId}`);
    return { message: `Quiz ${quizId} deleted successfully` };
  }

  async publishQuizStructure(quizId: number, userId: number) {
    this.logger.log(`Publishing quiz structure: ${quizId}`);

    const quizStructure = await this.cmsRepository.getQuizStructureById(quizId);
    if (!quizStructure) {
      throw new NotFoundException(`Quiz structure with ID ${quizId} not found`);
    }

    const publishedQuiz = await this.cmsRepository.publishQuizStructure(
      quizId,
      userId,
    );

    // Audit log
    await this.cmsRepository.createAuditLog(
      userId,
      "PUBLISH_QUIZ",
      "quiz",
      quizId,
      { status: ContentStatus.PUBLISHED },
    );

    this.logger.log(`Quiz structure published successfully: ID ${quizId}`);
    return publishedQuiz;
  }

  // ============ AUDIT LOG SERVICE METHODS ============

  async getAuditLogsByEntity(entityType: string, entityId: number) {
    this.logger.debug(`Fetching audit logs for ${entityType}:${entityId}`);
    return this.cmsRepository.getAuditLogsByEntity(entityType, entityId);
  }

  async getAuditLogsByAdmin(adminId: number) {
    this.logger.debug(`Fetching audit logs for admin ${adminId}`);
    return this.cmsRepository.getAuditLogsByAdmin(adminId);
  }

  // ============ VALIDATION HELPERS ============

  validateTopicData(dto: CreateTopicDto): string[] {
    const errors: string[] = [];

    if (!dto.name || dto.name.trim().length < 2) {
      errors.push("Topic name is required and must be at least 2 characters");
    }

    if (!dto.description || dto.description.length < 10) {
      errors.push("Description is required and must be at least 10 characters");
    }

    if (dto.learningLevel < 1 || dto.learningLevel > 5) {
      errors.push("Learning level must be between 1 and 5");
    }

    return errors;
  }

  validateVocabularyData(dto: CreateVocabularyDto): string[] {
    const errors: string[] = [];

    if (!dto.word || dto.word.trim().length < 1) {
      errors.push("Word is required");
    }

    if (!dto.definition || dto.definition.length < 5) {
      errors.push("Definition is required and must be at least 5 characters");
    }

    return errors;
  }

  validateQuizStructureData(dto: CreateQuizStructureDto): string[] {
    const errors: string[] = [];

    if (!dto.description || dto.description.trim().length < 3) {
      errors.push(
        "Quiz description is required and must be at least 3 characters",
      );
    }

    if (!dto.description || dto.description.length < 5) {
      errors.push("Description is required and must be at least 5 characters");
    }

    if (!dto.options || dto.options.length < 2 || dto.options.length > 6) {
      errors.push("Quiz must have between 2 and 6 options");
    }

    if (dto.options) {
      const correctCount = dto.options.filter((opt) => opt.isCorrect).length;
      if (correctCount !== 1) {
        errors.push("Quiz must have exactly one correct answer");
      }
    }

    if (dto.difficultyLevel < 1 || dto.difficultyLevel > 5) {
      errors.push("Difficulty level must be between 1 and 5");
    }

    return errors;
  }
}
