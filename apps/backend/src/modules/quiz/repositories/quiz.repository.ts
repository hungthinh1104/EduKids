import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { QuizDifficulty } from "../dto/quiz.dto";
import {
  CmsContentStatus,
  TopicQuiz,
  TopicQuizOption,
  Vocabulary,
} from "@prisma/client";

interface LearnerPerformance {
  averageScore: number;
  accuracyRate: number;
  recentErrorRate: number;
  vocabularyMastery: Map<number, number>;
}

@Injectable()
export class QuizRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * UC-04: Analyze learner's historical performance for adaptive difficulty
   */
  async analyzeLearnerPerformance(
    childId: number,
    topicId: number,
  ): Promise<LearnerPerformance> {
    // First get vocabularies for this topic
    const topicVocabularies = await this.prisma.vocabulary.findMany({
      where: {
        topicId,
        status: CmsContentStatus.PUBLISHED,
        deletedAt: null,
        topic: {
          status: CmsContentStatus.PUBLISHED,
          deletedAt: null,
        },
      },
      select: { id: true },
    });
    const vocabIds = topicVocabularies.map((v) => v.id);

    const recentQuizzes = await this.prisma.activityLog.findMany({
      where: {
        childId,
        activityType: "QUIZ",
        vocabularyId: { in: vocabIds },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    if (recentQuizzes.length === 0) {
      return {
        averageScore: 50,
        accuracyRate: 50,
        recentErrorRate: 50,
        vocabularyMastery: new Map(),
      };
    }

    const scoreList = recentQuizzes
      .map((quiz) => Number(quiz.score ?? 0))
      .filter((value) => Number.isFinite(value));

    const averageScore =
      scoreList.length > 0
        ? scoreList.reduce((sum, value) => sum + value, 0) / scoreList.length
        : 0;

    const correctCount = recentQuizzes.filter(
      (quiz) =>
        (quiz.metadata as { isCorrect?: unknown } | null)?.isCorrect === true,
    ).length;
    const accuracyRate = (correctCount / recentQuizzes.length) * 100;

    const recentWindow = recentQuizzes.slice(0, Math.min(10, recentQuizzes.length));
    const recentIncorrect = recentWindow.filter(
      (quiz) =>
        (quiz.metadata as { isCorrect?: unknown } | null)?.isCorrect !== true,
    ).length;
    const recentErrorRate = (recentIncorrect / recentWindow.length) * 100;

    const vocabularyMastery = new Map<number, number>();
    const progressRecords = await this.prisma.learningProgress.findMany({
      where: {
        childId,
        vocabulary: {
          topicId,
          status: CmsContentStatus.PUBLISHED,
          deletedAt: null,
          topic: {
            status: CmsContentStatus.PUBLISHED,
            deletedAt: null,
          },
        },
      },
    });

    progressRecords.forEach((p) => {
      const masteryScore = p.pronunciationScore || 0;
      vocabularyMastery.set(p.vocabularyId, masteryScore);
    });

    return {
      averageScore: Math.round(averageScore),
      accuracyRate: Math.round(accuracyRate),
      recentErrorRate: Math.round(recentErrorRate),
      vocabularyMastery,
    };
  }

  /**
   * Calculate adaptive difficulty based on performance
   */
  calculateAdaptiveDifficulty(
    performance: LearnerPerformance,
    currentDifficulty: QuizDifficulty,
    consecutiveCorrect: number,
    consecutiveIncorrect: number,
  ): QuizDifficulty {
    if (consecutiveCorrect >= 3 && currentDifficulty !== QuizDifficulty.HARD) {
      return currentDifficulty === QuizDifficulty.EASY
        ? QuizDifficulty.MEDIUM
        : QuizDifficulty.HARD;
    }

    if (
      consecutiveIncorrect >= 2 &&
      currentDifficulty !== QuizDifficulty.EASY
    ) {
      return currentDifficulty === QuizDifficulty.HARD
        ? QuizDifficulty.MEDIUM
        : QuizDifficulty.EASY;
    }

    if (performance.accuracyRate >= 80 && performance.recentErrorRate < 20) {
      if (currentDifficulty === QuizDifficulty.EASY)
        return QuizDifficulty.MEDIUM;
      if (currentDifficulty === QuizDifficulty.MEDIUM)
        return QuizDifficulty.HARD;
    }

    if (performance.accuracyRate < 50 || performance.recentErrorRate > 50) {
      if (currentDifficulty === QuizDifficulty.HARD)
        return QuizDifficulty.MEDIUM;
      if (currentDifficulty === QuizDifficulty.MEDIUM)
        return QuizDifficulty.EASY;
    }

    return currentDifficulty;
  }

  /**
   * Select adaptive questions prioritizing lower mastery vocabulary
   */
  async selectAdaptiveQuestions(
    topicId: number,
    difficulty: QuizDifficulty,
    questionCount: number,
    vocabularyMastery: Map<number, number>,
  ): Promise<Vocabulary[]> {
    const allVocabulary = await this.prisma.vocabulary.findMany({
      where: {
        topicId,
        status: CmsContentStatus.PUBLISHED,
        deletedAt: null,
        topic: {
          status: CmsContentStatus.PUBLISHED,
          deletedAt: null,
        },
      },
      include: {
        media: {
          where: { type: "IMAGE" },
          take: 1,
        },
      },
    });

    if (allVocabulary.length === 0) return [];

    const scoredVocabulary = allVocabulary.map((vocab) => {
      const masteryScore = vocabularyMastery.get(vocab.id) || 0;
      const priorityScore = 100 - masteryScore;
      return { vocab, priorityScore };
    });

    scoredVocabulary.sort((a, b) => {
      const scoreDiff = b.priorityScore - a.priorityScore;
      return Math.abs(scoreDiff) < 10 ? Math.random() - 0.5 : scoreDiff;
    });

    return scoredVocabulary.slice(0, questionCount).map((s) => s.vocab);
  }

  /**
   * Generate distractor options for multiple choice
   */
  async generateDistractors(
    correctVocabularyId: number,
    topicId: number,
    count: number = 3,
  ): Promise<Vocabulary[]> {
    return this.prisma.vocabulary.findMany({
      where: {
        topicId,
        id: { not: correctVocabularyId },
        status: CmsContentStatus.PUBLISHED,
        deletedAt: null,
        topic: {
          status: CmsContentStatus.PUBLISHED,
          deletedAt: null,
        },
      },
      take: count,
      orderBy: { id: "asc" },
      skip: Math.floor(Math.random() * 10),
    });
  }

  async getTopicById(topicId: number) {
    return this.prisma.topic.findFirst({
      where: {
        id: topicId,
        status: CmsContentStatus.PUBLISHED,
        deletedAt: null,
      },
      select: { id: true, name: true, description: true },
    });
  }

  async getPublishedTopicQuizzes(
    topicId: number,
    limit: number,
  ): Promise<Array<TopicQuiz & { options: TopicQuizOption[] }>> {
    return this.prisma.topicQuiz.findMany({
      where: {
        topicId,
        status: CmsContentStatus.PUBLISHED,
        topic: {
          status: CmsContentStatus.PUBLISHED,
          deletedAt: null,
        },
      },
      include: {
        options: {
          orderBy: { id: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  }

  async recordQuizAttempt(
    childId: number,
    vocabularyId: number,
    isCorrect: boolean,
    score: number,
    timeTakenMs: number,
    difficulty: QuizDifficulty,
  ) {
    return this.prisma.activityLog.create({
      data: {
        childId,
        vocabularyId,
        activityType: "QUIZ",
        score,
        metadata: {
          isCorrect,
          difficulty,
        },
        durationSec: Math.round(timeTakenMs / 1000),
      },
    });
  }

  async updateQuizProgress(
    childId: number,
    vocabularyId: number,
    _isCorrect: boolean,
  ) {
    const existing = await this.prisma.learningProgress.findUnique({
      where: { childId_vocabularyId: { childId, vocabularyId } },
    });

    if (existing) {
      return this.prisma.learningProgress.update({
        where: { childId_vocabularyId: { childId, vocabularyId } },
        data: {
          lastReviewedAt: new Date(),
        },
      });
    } else {
      return this.prisma.learningProgress.create({
        data: {
          childId,
          vocabularyId,
          lastReviewedAt: new Date(),
        },
      });
    }
  }

  async getQuizStats(childId: number) {
    const quizActivities = await this.prisma.activityLog.findMany({
      where: { childId, activityType: "QUIZ" },
    });

    const totalQuizzes = quizActivities.length;
    const correctAnswers = quizActivities.filter(
      (activity) =>
        (activity.metadata as { isCorrect?: unknown } | null)?.isCorrect ===
        true,
    ).length;

    const scores = quizActivities
      .map((activity) => Number(activity.score ?? 0))
      .filter((value) => Number.isFinite(value));
    const averageScore =
      scores.length > 0
        ? scores.reduce((sum, value) => sum + value, 0) / scores.length
        : 0;

    const accuracy =
      totalQuizzes > 0 ? Math.round((correctAnswers / totalQuizzes) * 100) : 0;

    return {
      totalQuizzes,
      correctAnswers,
      incorrectAnswers: totalQuizzes - correctAnswers,
      accuracy,
      averageScore: Math.round(averageScore),
    };
  }
}
