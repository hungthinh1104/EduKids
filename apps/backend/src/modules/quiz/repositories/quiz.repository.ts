import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { QuizQuestionEntity } from "../entities/quiz-question.entity";
import { IQuizRepository } from "./quiz.repository.interface";
import { QuizDifficulty } from "../dto/quiz.dto";
import { Vocabulary } from "@prisma/client";

interface LearnerPerformance {
  averageScore: number;
  accuracyRate: number;
  recentErrorRate: number;
  vocabularyMastery: Map<number, number>;
}

@Injectable()
export class QuizRepository implements IQuizRepository {
  constructor(private prisma: PrismaService) {}

  async createQuestion(
    question: QuizQuestionEntity,
  ): Promise<QuizQuestionEntity> {
    // Legacy method - kept for interface compatibility
    return question;
  }

  async findQuizByVocabulary(
    _vocabularyId: string,
  ): Promise<QuizQuestionEntity | null> {
    // Legacy method - kept for interface compatibility
    return null;
  }

  async findRandomQuiz(_limit: number): Promise<QuizQuestionEntity[]> {
    // Legacy method - kept for interface compatibility
    return [];
  }

  /**
   * UC-04: Analyze learner's historical performance for adaptive difficulty
   */
  async analyzeLearnerPerformance(
    childId: number,
    topicId: number,
  ): Promise<LearnerPerformance> {
    // First get vocabularies for this topic
    const topicVocabularies = await this.prisma.vocabulary.findMany({
      where: { topicId },
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

    // ActivityLog doesn't have score/metadata fields, estimate based on attempts
    const averageScore = 70; // Placeholder

    const accuracyRate = 100; // Placeholder

    const recentErrorRate = 0; // Placeholder

    const vocabularyMastery = new Map<number, number>();
    const progressRecords = await this.prisma.learningProgress.findMany({
      where: { childId, vocabulary: { topicId } },
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
      where: { topicId },
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
      where: { topicId, id: { not: correctVocabularyId } },
      take: count,
      orderBy: { id: "asc" },
      skip: Math.floor(Math.random() * 10),
    });
  }

  async getTopicById(topicId: number) {
    return this.prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, name: true, description: true },
    });
  }

  async recordQuizAttempt(
    childId: number,
    _vocabularyId: number,
    _isCorrect: boolean,
    _score: number,
    timeTakenMs: number,
    _difficulty: QuizDifficulty,
  ) {
    return this.prisma.activityLog.create({
      data: {
        childId,
        vocabularyId: _vocabularyId,
        activityType: "QUIZ",
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
    // ActivityLog doesn't have score/metadata fields
    const correctAnswers = totalQuizzes; // Placeholder
    const averageScore = 75; // Placeholder

    return {
      totalQuizzes,
      correctAnswers,
      incorrectAnswers: 0,
      accuracy: 100, // Placeholder
      averageScore: Math.round(averageScore),
    };
  }
}
