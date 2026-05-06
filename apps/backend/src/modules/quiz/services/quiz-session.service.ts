import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { QuizDifficulty } from "../dto/quiz.dto";

export interface QuizSessionState {
  quizSessionId: string;
  childId: number;
  topicId: number;
  topicName: string;
  questions: Array<{
    questionId: number;
    vocabularyId?: number;
    promptText: string;
    word: string;
    translation: string;
    imageUrl?: string;
    correctOptionId: number;
    options: Array<{ id: number; text: string; imageUrl?: string }>;
    difficulty: QuizDifficulty;
    pointsValue: number;
  }>;
  currentQuestionIndex: number;
  answers: Array<{
    questionId: number;
    selectedOptionId: number;
    isCorrect: boolean;
    pointsEarned: number;
    timeTakenMs: number;
  }>;
  currentScore: number;
  currentDifficulty: QuizDifficulty;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  startedAt: Date | string;
  completedAt?: Date | string;
  rewardsGranted?: boolean;
}

@Injectable()
export class QuizSessionService {
  private readonly SESSION_TTL_MS = 60 * 60 * 1000;
  private readonly SESSION_STALE_GRACE_MS = 5 * 60 * 1000;
  private readonly inFlightAnswerLocks = new Set<string>();
  private readonly inFlightRewardLocks = new Set<string>();

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async getSession(quizSessionId: string): Promise<QuizSessionState> {
    const session = await this.cacheManager.get<QuizSessionState>(
      `quiz:session:${quizSessionId}`,
    );

    if (!session) {
      throw new NotFoundException("Quiz session not found or expired");
    }

    this.ensureSessionNotStale(session);
    return session;
  }

  async saveSession(session: QuizSessionState): Promise<void> {
    await this.cacheManager.set(
      `quiz:session:${session.quizSessionId}`,
      session,
      3600000,
    );
  }

  acquireAnswerLock(quizSessionId: string, questionId: number): boolean {
    const key = `${quizSessionId}:${questionId}`;
    if (this.inFlightAnswerLocks.has(key)) {
      return false;
    }

    this.inFlightAnswerLocks.add(key);
    return true;
  }

  releaseAnswerLock(quizSessionId: string, questionId: number): void {
    const key = `${quizSessionId}:${questionId}`;
    this.inFlightAnswerLocks.delete(key);
  }

  acquireRewardGrantLock(quizSessionId: string): boolean {
    if (this.inFlightRewardLocks.has(quizSessionId)) {
      return false;
    }

    this.inFlightRewardLocks.add(quizSessionId);
    return true;
  }

  releaseRewardGrantLock(quizSessionId: string): void {
    this.inFlightRewardLocks.delete(quizSessionId);
  }

  assertOwnership(session: QuizSessionState, childId: number): void {
    if (session.childId !== childId) {
      throw new BadRequestException(
        "Quiz session does not belong to this child",
      );
    }
  }

  assertCurrentQuestionOrder(
    session: QuizSessionState,
    questionId: number,
  ): void {
    const expectedQuestionId = session.currentQuestionIndex + 1;
    if (questionId !== expectedQuestionId) {
      throw new BadRequestException(
        "Answer must be submitted for the current question",
      );
    }
  }

  private normalizeSessionDate(value: Date | string | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private ensureSessionNotStale(session: QuizSessionState): void {
    const startedAt = this.normalizeSessionDate(session.startedAt);
    if (!startedAt) {
      throw new NotFoundException("Quiz session not found or expired");
    }

    const ageMs = Date.now() - startedAt.getTime();
    if (ageMs > this.SESSION_TTL_MS + this.SESSION_STALE_GRACE_MS) {
      throw new NotFoundException("Quiz session not found or expired");
    }
  }
}
