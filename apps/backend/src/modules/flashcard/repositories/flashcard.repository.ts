import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CmsContentStatus } from "@prisma/client";

@Injectable()
export class FlashcardRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Get flashcard with vocabulary details, media, and drag-drop options
   * UC-02: Display flashcard (image + text + audio)
   */
  async getFlashcardByVocabularyId(vocabularyId: number) {
    return await this.prisma.vocabulary.findFirst({
      where: {
        id: vocabularyId,
        status: CmsContentStatus.PUBLISHED,
        deletedAt: null,
        topic: {
          status: CmsContentStatus.PUBLISHED,
          deletedAt: null,
        },
      },
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
      where: {
        topicId,
        status: CmsContentStatus.PUBLISHED,
        deletedAt: null,
        topic: {
          status: CmsContentStatus.PUBLISHED,
          deletedAt: null,
        },
      },
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
    const correct = await this.prisma.vocabulary.findFirst({
      where: {
        id: vocabularyId,
        topicId,
        status: CmsContentStatus.PUBLISHED,
        deletedAt: null,
        topic: {
          status: CmsContentStatus.PUBLISHED,
          deletedAt: null,
        },
      },
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
        status: CmsContentStatus.PUBLISHED,
        deletedAt: null,
        topic: {
          status: CmsContentStatus.PUBLISHED,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        translation: true,
      },
      orderBy: { id: "asc" },
      take: 3,
    });

    // Deterministic option order so submit validation stays stable across requests.
    const distractorOptions = distractors.map((d) => ({
      id: d.id,
      text: d.translation,
      isCorrect: false,
    }));
    const insertIndex =
      distractorOptions.length === 0
        ? 0
        : vocabularyId % (distractorOptions.length + 1);

    const options = [...distractorOptions];
    options.splice(insertIndex, 0, {
      id: correct.id,
      text: correct.translation,
      isCorrect: true,
    });

    return options;
  }
}
