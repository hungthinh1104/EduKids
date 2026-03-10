import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class FlashcardRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Get flashcard with vocabulary details, media, and drag-drop options
   * UC-02: Display flashcard (image + text + audio)
   */
  async getFlashcardByVocabularyId(vocabularyId: number) {
    return await this.prisma.vocabulary.findUnique({
      where: { id: vocabularyId },
      include: {
        media: true,
        topic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get all vocabulary in topic for drag-drop options
   * Options are randomly selected from vocabularies in same topic
   */
  async getVocabulariesByTopicId(topicId: number) {
    return await this.prisma.vocabulary.findMany({
      where: { topicId },
      select: {
        id: true,
        word: true,
        translation: true,
      },
    });
  }

  /**
   * Get drag-drop options (multiple choice)
   * Correct answer + 3 random distractors from same topic
   */
  async generateDragDropOptions(vocabularyId: number, topicId: number) {
    // Get correct vocabulary
    const correct = await this.prisma.vocabulary.findUnique({
      where: { id: vocabularyId },
      select: {
        id: true,
        translation: true,
      },
    });

    if (!correct) return null;

    // Get 3 other vocabularies from same topic for distractors
    const distractors = await this.prisma.vocabulary.findMany({
      where: {
        topicId,
        id: { not: vocabularyId },
      },
      select: {
        id: true,
        translation: true,
      },
      take: 3,
    });

    // Combine and shuffle options
    const options = [
      { id: correct.id, text: correct.translation, isCorrect: true },
      ...distractors.map((d) => ({
        id: d.id,
        text: d.translation,
        isCorrect: false,
      })),
    ];

    // Fisher-Yates shuffle
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    return options;
  }
}
