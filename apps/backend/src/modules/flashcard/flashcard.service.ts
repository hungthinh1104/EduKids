import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { FlashcardRepository } from "./repositories/flashcard.repository";
import { FlashcardActivityRepository } from "./repositories/flashcard-activity.repository";
import { LearningProgressRepository } from "../learning/repositories/learning-progress.repository";
import { PrismaService } from "../../prisma/prisma.service";
import {
  FlashcardDto,
  DragDropActivityDto,
  FeedbackDto,
} from "./dto/flashcard.dto";
import { DragDropActivityResponseDto } from "./dto/flashcard.dto";
import { GamificationService } from "../gamification/gamification.service";

@Injectable()
export class FlashcardService {
  private readonly logger = new Logger(FlashcardService.name);
  private readonly CDN_BASE_URL =
    process.env.CLOUDINARY_BASE_URL || "https://res.cloudinary.com/edukids";
  private readonly PLACEHOLDER_IMAGE = `${this.CDN_BASE_URL}/image/placeholder.png`;

  private readonly CORRECT_ANSWER_BASE_POINTS = 10;
  private readonly SPEED_BONUS_THRESHOLD_MS = 5000;

  constructor(
    private flashcardRepository: FlashcardRepository,
    private activityRepository: FlashcardActivityRepository,
    private learningProgressRepository: LearningProgressRepository,
    private prisma: PrismaService,
    private readonly gamificationService: GamificationService,
  ) {}

  /**
   * UC-02: Get flashcard with image, audio, and drag-drop options
   * Main Success Scenario Step 1: System displays flashcard (image + text)
   * Step 2: Prepare drag-drop options
   */
  async getFlashcard(
    vocabularyId: number,
  ): Promise<FlashcardDto & { options: Array<{ id: number; text: string }> }> {
    try {
      const vocabulary =
        await this.flashcardRepository.getFlashcardByVocabularyId(vocabularyId);

      if (!vocabulary) {
        throw new NotFoundException(
          `Vocabulary with ID ${vocabularyId} not found`,
        );
      }

      const audioMedia = vocabulary.media.find((m) => m.type === "AUDIO");
      const imageMedia = vocabulary.media.find((m) => m.type === "IMAGE");
      const audioUrl =
        audioMedia?.url || this.getFallbackAudioUrl(vocabulary.word);
      const imageUrl = imageMedia?.url || this.PLACEHOLDER_IMAGE;

      // Generate drag-drop options (correct + 3 distractors)
      const options = await this.flashcardRepository.generateDragDropOptions(
        vocabularyId,
        vocabulary.topicId,
      );

      if (!options || options.length < 2) {
        throw new BadRequestException(
          "At least two drag-drop options are required for this vocabulary",
        );
      }

      return {
        id: vocabulary.id,
        vocabularyId: vocabulary.id,
        word: vocabulary.word,
        phonetic: vocabulary.phonetic,
        exampleSentence: vocabulary.exampleSentence,
        translation: vocabulary.translation,
        difficulty: vocabulary.difficulty,
        media: vocabulary.media.map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
        })),
        audioUrl,
        imageUrl,
        options: options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          // Don't expose isCorrect to client
        })),
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to get flashcard ${vocabularyId}: ${message}`,
        stack,
      );
      throw error;
    }
  }

  /**
   * UC-02: Validate and score drag-drop activity
   * Main Success Scenario Step 3: Performs drag-and-drop activity
   * Step 4: Immediate correct/incorrect feedback
   */
  async submitDragDropActivity(
    childId: number,
    dto: DragDropActivityDto,
  ): Promise<DragDropActivityResponseDto> {
    try {
      // Get vocabulary and options
      const vocabulary =
        await this.flashcardRepository.getFlashcardByVocabularyId(
          dto.vocabularyId,
        );

      if (!vocabulary) {
        throw new NotFoundException(
          `Vocabulary with ID ${dto.vocabularyId} not found`,
        );
      }

      // Generate options to validate answer
      const options = await this.flashcardRepository.generateDragDropOptions(
        dto.vocabularyId,
        vocabulary.topicId,
      );

      if (!options || options.length < 2) {
        throw new BadRequestException(
          "At least two drag-drop options are required for this vocabulary",
        );
      }

      // Validate selected option
      const selectedOption = options.find((o) => o.id === dto.selectedOptionId);
      if (!selectedOption) {
        throw new BadRequestException("Invalid option selected");
      }

      const isCorrect = selectedOption.isCorrect;

      // Calculate points earned
      const pointsEarned = this.calculatePoints(isCorrect, dto.timeTakenMs);

      // Generate feedback
      const feedback = this.generateFeedback(
        vocabulary,
        selectedOption,
        options,
        isCorrect,
      );

      const result = await this.prisma.$transaction(async (tx) => {
        const activity = await tx.activityLog.create({
          data: {
            childId,
            vocabularyId: dto.vocabularyId,
            activityType: "FLASHCARD",
            pointsEarned,
            score: isCorrect ? 100 : 0,
            metadata: {
              selectedOptionId: dto.selectedOptionId,
              isCorrect,
              activityType: dto.activityType,
              timeTakenMs: dto.timeTakenMs ?? null,
            },
            durationSec: dto.timeTakenMs
              ? Math.floor(dto.timeTakenMs / 1000)
              : 0,
          },
        });

        if (isCorrect) {
          const existingProgress = await tx.learningProgress.findUnique({
            where: {
              childId_vocabularyId: {
                childId,
                vocabularyId: dto.vocabularyId,
              },
            },
            select: { completedAt: true },
          });

          if (!existingProgress?.completedAt) {
            await tx.learningProgress.upsert({
              where: {
                childId_vocabularyId: {
                  childId,
                  vocabularyId: dto.vocabularyId,
                },
              },
              create: {
                childId,
                vocabularyId: dto.vocabularyId,
                completedAt: new Date(),
              },
              update: {
                completedAt: new Date(),
              },
            });
          }
        }

        const updatedPoints = await tx.childProfile.update({
          where: { id: childId },
          data: {
            totalPoints: { increment: pointsEarned },
          },
          select: { totalPoints: true, currentLevel: true },
        });

        const calculatedLevel = Math.floor(updatedPoints.totalPoints / 50) + 1;
        const updatedChild =
          updatedPoints.currentLevel === calculatedLevel
            ? updatedPoints
            : await tx.childProfile.update({
                where: { id: childId },
                data: { currentLevel: calculatedLevel },
                select: { totalPoints: true, currentLevel: true },
              });

        return { activity, updatedChild };
      });

      void this.gamificationService.checkAndAwardBadges(childId).catch(() => {});

      const audioPlaybackFailed = !vocabulary.media?.some(
        (media) => media.type === "AUDIO",
      );

      return {
        activityId: result.activity.id,
        feedback: {
          ...feedback,
          pointsEarned,
          audioUrl: feedback.audioUrl || "",
        },
        audioPlaybackFailed,
        totalPoints: result.updatedChild.totalPoints,
        currentLevel: result.updatedChild.currentLevel,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to submit drag-drop activity for child ${childId}: ${message}`,
        stack,
      );
      throw error;
    }
  }

  /**
   * Calculate star points based on correctness and speed
   * UC-02 Post-condition: Potential Star Points awarded
   */
  private calculatePoints(isCorrect: boolean, timeTakenMs?: number): number {
    if (!isCorrect) {
      return 0; // No points for incorrect
    }

    let points = this.CORRECT_ANSWER_BASE_POINTS;

    // Speed bonus: 5 extra points if answered in < 5 seconds
    if (timeTakenMs && timeTakenMs < this.SPEED_BONUS_THRESHOLD_MS) {
      points += 5;
    }

    return points;
  }

  /**
   * Generate immediate feedback
   * Main Success Scenario Step 4: Immediate correct/incorrect feedback
   */
  private generateFeedback(
    vocabulary: {
      id: number;
      word: string;
      translation?: string;
      media?: Array<{ url: string; type?: string }>;
    },
    selectedOption: { id: number; text: string; isCorrect: boolean },
    options: Array<{ id: number; text: string; isCorrect: boolean }>,
    isCorrect: boolean,
  ): FeedbackDto {
    const audioUrl =
      vocabulary.media?.find((m) => m.type === "AUDIO")?.url ||
      this.getFallbackAudioUrl(vocabulary.word);

    if (isCorrect) {
      return {
        isCorrect: true,
        message: "Excellent! You got it right! 🎉",
        audioUrl,
        hint: "Great job! Keep practicing to master this word.",
      };
    } else {
      const correctOption = options.find((o) => o.isCorrect);
      const resolvedCorrectAnswer =
        correctOption?.text || vocabulary.translation || vocabulary.word;
      return {
        isCorrect: false,
        message: "Not quite right. Try again!",
        pointsEarned: 0,
        correctAnswer: resolvedCorrectAnswer,
        audioUrl,
        hint: `The correct answer is: ${resolvedCorrectAnswer}. Listen to the pronunciation again.`,
      };
    }
  }

  /**
   * UC-02 Exception: Audio playback fails → Fallback to browser TTS + notification
   * Generate fallback TTS URL
   */
  private getFallbackAudioUrl(word: string): string {
    // This will be handled by frontend with Web Speech API
    // Backend returns a placeholder that signals frontend to use TTS
    return `tts:///${word}`;
  }
}
