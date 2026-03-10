import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { FlashcardRepository } from "./repositories/flashcard.repository";
import { FlashcardActivityRepository } from "./repositories/flashcard-activity.repository";
import { LearningProgressRepository } from "../learning/repositories/learning-progress.repository";
import {
  FlashcardDto,
  DragDropActivityDto,
  FeedbackDto,
} from "./dto/flashcard.dto";
import { DragDropActivityResponseDto } from "./dto/flashcard.dto";

@Injectable()
export class FlashcardService {
  private readonly logger = new Logger(FlashcardService.name);
  private readonly CDN_BASE_URL =
    process.env.CLOUDINARY_BASE_URL || "https://res.cloudinary.com/edukids";
  private readonly PLACEHOLDER_IMAGE = `${this.CDN_BASE_URL}/image/placeholder.png`;

  // Star points calculation
  private readonly CORRECT_ANSWER_BASE_POINTS = 10;
  private readonly SPEED_BONUS_THRESHOLD_MS = 5000; // 5 seconds

  constructor(
    private flashcardRepository: FlashcardRepository,
    private activityRepository: FlashcardActivityRepository,
    private learningProgressRepository: LearningProgressRepository,
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

      // Find audio and image URLs (VocabularyMedia doesn't have activityType, use first available)
      const audioUrl =
        vocabulary.media && vocabulary.media.length > 0
          ? vocabulary.media[0].url
          : this.getFallbackAudioUrl(vocabulary.word);
      const imageUrl =
        vocabulary.media && vocabulary.media.length > 0
          ? vocabulary.media[0].url
          : this.PLACEHOLDER_IMAGE;

      // Generate drag-drop options (correct + 3 distractors)
      const options = await this.flashcardRepository.generateDragDropOptions(
        vocabularyId,
        vocabulary.topicId,
      );

      return {
        id: vocabulary.id,
        vocabularyId: vocabulary.id,
        word: vocabulary.word,
        phonetic: vocabulary.phonetic,
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
    } catch (error) {
      this.logger.error(
        `Failed to get flashcard ${vocabularyId}: ${error.message}`,
        error.stack,
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

      // Validate selected option
      const selectedOption = options.find((o) => o.id === dto.selectedOptionId);
      if (!selectedOption) {
        throw new BadRequestException("Invalid option selected");
      }

      const isCorrect = selectedOption.isCorrect;

      // Save activity
      const activity = await this.activityRepository.createActivity({
        childId,
        vocabularyId: dto.vocabularyId,
        activityType: dto.activityType,
        isCorrect,
        timeTakenMs: dto.timeTakenMs,
        selectedOptionId: dto.selectedOptionId,
      });

      // Calculate points earned
      const pointsEarned = this.calculatePoints(isCorrect, dto.timeTakenMs);

      // Generate feedback
      const feedback = this.generateFeedback(
        vocabulary,
        selectedOption,
        options,
        isCorrect,
      );

      // Update learning progress
      if (isCorrect) {
        await this.learningProgressRepository.upsertProgress(
          childId,
          dto.vocabularyId,
          {
            completedAt: new Date(),
          },
        );
      }

      // Award star points and update child level
      const updatedChild = await this.awardStarPoints(childId, pointsEarned);

      // Check audio playback failure
      const audioPlaybackFailed =
        !vocabulary.media || vocabulary.media.length === 0;

      return {
        activityId: activity.id,
        feedback: {
          ...feedback,
          audioUrl: feedback.audioUrl || "",
        },
        audioPlaybackFailed,
        totalPoints: updatedChild.totalPoints,
        currentLevel: updatedChild.currentLevel,
      };
    } catch (error) {
      this.logger.error(
        `Failed to submit drag-drop activity for child ${childId}: ${error.message}`,
        error.stack,
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
      media?: Array<{ url: string }>;
    },
    selectedOption: { id: number; text: string; isCorrect: boolean },
    options: Array<{ id: number; text: string; isCorrect: boolean }>,
    isCorrect: boolean,
  ): FeedbackDto {
    const audioUrl =
      vocabulary.media && vocabulary.media.length > 0
        ? vocabulary.media[0].url
        : this.getFallbackAudioUrl(vocabulary.word);

    if (isCorrect) {
      return {
        isCorrect: true,
        message: "Excellent! You got it right! 🎉",
        pointsEarned: this.calculatePoints(true),
        audioUrl,
        hint: "Great job! Keep practicing to master this word.",
      };
    } else {
      const correctOption = options.find((o) => o.isCorrect);
      return {
        isCorrect: false,
        message: "Not quite right. Try again!",
        pointsEarned: 0,
        audioUrl,
        hint: `The correct answer is: ${correctOption.text}. Listen to the pronunciation again.`,
      };
    }
  }

  /**
   * Award star points and update child's level
   * Levels: 0-50pts: Level 1, 51-150pts: Level 2, etc.
   */
  private async awardStarPoints(childId: number, points: number) {
    const currentChild = await this.learningProgressRepository[
      "prisma"
    ].childProfile.findUnique({
      where: { id: childId },
      select: { totalPoints: true, currentLevel: true },
    });

    const newTotalPoints = (currentChild?.totalPoints || 0) + points;
    const newLevel = Math.floor(newTotalPoints / 50) + 1;

    // Update child profile
    const updatedChild = await this.learningProgressRepository[
      "prisma"
    ].childProfile.update({
      where: { id: childId },
      data: {
        totalPoints: newTotalPoints,
        currentLevel: newLevel,
      },
      select: { totalPoints: true, currentLevel: true },
    });

    return updatedChild;
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
