import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { NotFoundException } from "@nestjs/common";
import { QuizDifficulty } from "../dto/quiz.dto";
import { QuizSessionService, QuizSessionState } from "./quiz-session.service";

describe("QuizSessionService", () => {
  let service: QuizSessionService;
  let cacheManager: {
    get: ReturnType<typeof jest.fn>;
    set: ReturnType<typeof jest.fn>;
  };

  const createSession = (startedAt: Date | string): QuizSessionState => ({
    quizSessionId: "session-1",
    childId: 1,
    topicId: 10,
    topicName: "Animals",
    questions: [
      {
        questionId: 1,
        promptText: "What is this?",
        word: "dog",
        translation: "chó",
        correctOptionId: 1,
        options: [{ id: 1, text: "dog" }],
        difficulty: QuizDifficulty.MEDIUM,
        pointsValue: 10,
      },
    ],
    currentQuestionIndex: 0,
    answers: [],
    currentScore: 0,
    currentDifficulty: QuizDifficulty.MEDIUM,
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    startedAt,
  });

  beforeEach(() => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    service = new QuizSessionService(cacheManager as any);
  });

  it("acquireAnswerLock blocks duplicate in-flight question", () => {
    expect(service.acquireAnswerLock("s1", 1)).toBe(true);
    expect(service.acquireAnswerLock("s1", 1)).toBe(false);

    service.releaseAnswerLock("s1", 1);

    expect(service.acquireAnswerLock("s1", 1)).toBe(true);
  });

  it("throws NotFoundException when session is missing", async () => {
    cacheManager.get.mockResolvedValue(null);

    await expect(service.getSession("missing")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("returns session when it is valid and not stale", async () => {
    const fresh = createSession(new Date());
    cacheManager.get.mockResolvedValue(fresh);

    const result = await service.getSession("session-1");

    expect(result.quizSessionId).toBe("session-1");
  });

  it("throws NotFoundException for stale sessions", async () => {
    const staleStartedAt = new Date(Date.now() - 70 * 60 * 1000).toISOString();
    cacheManager.get.mockResolvedValue(createSession(staleStartedAt));

    await expect(service.getSession("session-1")).rejects.toThrow(
      NotFoundException,
    );
  });
});
