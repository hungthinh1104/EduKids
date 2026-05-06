import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import * as Sentry from "@sentry/nestjs";
import { SentryTraced } from "@sentry/nestjs";
import { randomUUID } from "crypto";
import { QuizRepository } from "./repositories/quiz.repository";
import { PrismaService } from "../../prisma/prisma.service";
import { CmsContentStatus, TopicQuiz, TopicQuizOption } from "@prisma/client";
import {
  QuizSessionService,
  QuizSessionState,
} from "./services/quiz-session.service";
import { QuizScoringService } from "./services/quiz-scoring.service";
import { QuizQuestionService } from "./services/quiz-question.service";
import {
  QuizStartDto,
  QuizDifficulty,
  QuizAnswerDto,
  QuizAnswerFeedbackDto,
  QuizResultDto,
  QuizSessionDto,
  QuizOptionDto,
} from "./dto/quiz.dto";
import { QuizEventPublisherService } from "./services/quiz-event-publisher.service";
import { GamificationService } from "../gamification/gamification.service";

interface QuizSession extends QuizSessionState {
  currentDifficulty: QuizDifficulty;
  startedAt: Date;
  completedAt?: Date;
}

/**
 * UC-04 Service: Take Adaptive Quiz
 * Generates quizzes with adaptive difficulty based on learner performance
 */
@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    private readonly quizRepository: QuizRepository,
    private readonly prisma: PrismaService,
    private readonly quizSessionService: QuizSessionService,
    private readonly quizScoringService: QuizScoringService,
    private readonly quizQuestionService: QuizQuestionService,
    private readonly quizEventPublisher: QuizEventPublisherService,
    private readonly gamificationService: GamificationService,
  ) {}

  private recordBreadcrumb(
    action: string,
    data: Record<string, string | number | boolean | undefined>,
    level: "info" | "warning" = "info",
  ): void {
    Sentry.addBreadcrumb({
      category: "quiz",
      message: action,
      level,
      data,
    });
  }

  /**
   * Start a new adaptive quiz
   * Analyzes learner history and generates questions
   */
  @SentryTraced("quiz.start")
  async startQuiz(childId: number, dto: QuizStartDto): Promise<QuizSessionDto> {
    this.recordBreadcrumb("quiz.start.requested", {
      childId,
      topicId: dto.topicId,
      questionCount: dto.questionCount,
      initialDifficulty: dto.initialDifficulty,
    });

    const topic = await this.quizRepository.getTopicById(dto.topicId);
    if (!topic) {
      throw new NotFoundException(`Topic ${dto.topicId} not found`);
    }

    const questionCount = dto.questionCount || 10;
    const initialDifficulty = dto.initialDifficulty || QuizDifficulty.MEDIUM;
    const publishedTopicQuizzes =
      await this.quizRepository.getPublishedTopicQuizzes(
        dto.topicId,
        questionCount,
      );

    if (publishedTopicQuizzes.length > 0) {
      this.recordBreadcrumb("quiz.start.cms_selected", {
        childId,
        topicId: dto.topicId,
        availableQuestions: publishedTopicQuizzes.length,
      });
      return this.startCmsQuiz(topic, childId, dto, publishedTopicQuizzes);
    }

    try {
      // Analyze learner performance for adaptive difficulty
      const performance = await this.quizRepository.analyzeLearnerPerformance(
        childId,
        dto.topicId,
      );

      // Select questions prioritizing weak vocabulary
      const selectedVocabulary =
        await this.quizRepository.selectAdaptiveQuestions(
          dto.topicId,
          initialDifficulty,
          questionCount,
          performance.vocabularyMastery,
        );

      if (selectedVocabulary.length === 0) {
        throw new BadRequestException(
          `No vocabulary available for topic ${dto.topicId}. Please complete lessons first.`,
        );
      }

      const distractorsByVocabulary =
        await this.quizRepository.generateDistractorsBatch(
          selectedVocabulary.map((vocab) => vocab.id),
          dto.topicId,
          3,
        );

      // Generate questions with options
      const questions = selectedVocabulary.map((vocab, index) => {
        const distractors = [...(distractorsByVocabulary.get(vocab.id) || [])];
        const correctOptionId = Math.floor(Math.random() * 4) + 1;
        const options: QuizOptionDto[] = [];
        for (let i = 1; i <= 4; i++) {
          if (i === correctOptionId) {
            options.push({
              id: i,
              text: vocab.word,
              imageUrl: undefined,
            });
          } else {
            const distractor = distractors.shift();
            options.push({
              id: i,
              text: distractor?.word || "Unknown",
              imageUrl: undefined,
            });
          }
        }

        return {
          questionId: index + 1,
          vocabularyId: vocab.id,
          promptText: "What is this in English?",
          word: vocab.word,
          translation: vocab.translation,
          imageUrl: undefined,
          correctOptionId,
          options,
          difficulty: initialDifficulty,
          pointsValue:
            this.quizScoringService.calculatePointsValue(initialDifficulty),
        };
      });

      // Create quiz session
      const quizSessionId = randomUUID();
      const session: QuizSession = {
        quizSessionId,
        childId,
        topicId: dto.topicId,
        topicName: topic.name,
        questions,
        currentQuestionIndex: 0,
        answers: [],
        currentScore: 0,
        currentDifficulty: initialDifficulty,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 0,
        startedAt: new Date(),
      };

      // Store session in cache (1 hour expiry)
      await this.quizSessionService.saveSession(session);

      // Return first question
      const firstQuestion = this.quizQuestionService.buildQuestionDto(
        questions[0],
        1,
        questions.length,
        initialDifficulty,
      );
      const questionDtos = questions.map((question, questionIndex) =>
        this.quizQuestionService.buildQuestionDto(
          question,
          questionIndex + 1,
          questions.length,
          question.difficulty,
        ),
      );

      return {
        quizSessionId,
        topicId: dto.topicId,
        topicName: topic.name,
        totalQuestions: questions.length,
        currentDifficulty: initialDifficulty,
        startedAt: session.startedAt,
        currentScore: 0,
        questionsAnswered: 0,
        firstQuestion,
        questions: questionDtos,
      };
    } catch (error) {
      this.logger.error(
        "Adaptive quiz generation failed, falling back to static",
        error instanceof Error ? error.stack : undefined,
      );
      this.recordBreadcrumb(
        "quiz.start.adaptive_fallback",
        { childId, topicId: dto.topicId },
        "warning",
      );
      Sentry.captureMessage(
        "Adaptive quiz generation fell back to static quiz",
        {
          level: "warning",
        },
      );
      return this.startStaticQuiz(childId, dto);
    }
  }

  /**
   * Fallback: Generate static quiz without adaptation
   */
  @SentryTraced("quiz.start.static")
  private async startStaticQuiz(
    childId: number,
    dto: QuizStartDto,
  ): Promise<QuizSessionDto> {
    const topic = await this.quizRepository.getTopicById(dto.topicId);
    const questionCount = dto.questionCount || 10;

    const allVocabulary = await this.prisma.vocabulary.findMany({
      where: {
        topicId: dto.topicId,
        status: CmsContentStatus.PUBLISHED,
        deletedAt: null,
        topic: {
          status: CmsContentStatus.PUBLISHED,
          deletedAt: null,
        },
      },
      take: questionCount,
      include: { media: { where: { type: "IMAGE" }, take: 1 } },
    });

    if (allVocabulary.length === 0) {
      throw new BadRequestException(
        `No vocabulary available for topic ${dto.topicId}. Please complete lessons first.`,
      );
    }

    const distractorsByVocabulary =
      await this.quizRepository.generateDistractorsBatch(
        allVocabulary.map((vocab) => vocab.id),
        dto.topicId,
        3,
      );
    const questions = allVocabulary.map((vocab, index) => {
      const distractors = [...(distractorsByVocabulary.get(vocab.id) || [])];
      const correctOptionId = Math.floor(Math.random() * 4) + 1;
      const options: QuizOptionDto[] = [];

      for (let i = 1; i <= 4; i++) {
        if (i === correctOptionId) {
          options.push({
            id: i,
            text: vocab.word,
            imageUrl: vocab.media?.[0]?.url,
          });
        } else {
          const distractor = distractors.shift();
          options.push({
            id: i,
            text: distractor?.word || "Unknown",
            imageUrl: undefined,
          });
        }
      }

      return {
        questionId: index + 1,
        vocabularyId: vocab.id,
        promptText: "What is this in English?",
        word: vocab.word,
        translation: vocab.translation,
        imageUrl: vocab.media?.[0]?.url,
        correctOptionId,
        options,
        difficulty: QuizDifficulty.MEDIUM,
        pointsValue: this.quizScoringService.calculatePointsValue(
          QuizDifficulty.MEDIUM,
        ),
      };
    });

    const quizSessionId = randomUUID();
    const session: QuizSession = {
      quizSessionId,
      childId,
      topicId: dto.topicId,
      topicName: topic.name,
      questions,
      currentQuestionIndex: 0,
      answers: [],
      currentScore: 0,
      currentDifficulty: QuizDifficulty.MEDIUM,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      startedAt: new Date(),
    };

    await this.quizSessionService.saveSession(session);

    return {
      quizSessionId,
      topicId: dto.topicId,
      topicName: topic.name,
      totalQuestions: questions.length,
      currentDifficulty: QuizDifficulty.MEDIUM,
      startedAt: session.startedAt,
      currentScore: 0,
      questionsAnswered: 0,
      firstQuestion: this.quizQuestionService.buildQuestionDto(
        questions[0],
        1,
        questions.length,
        QuizDifficulty.MEDIUM,
      ),
      questions: questions.map((question, questionIndex) =>
        this.quizQuestionService.buildQuestionDto(
          question,
          questionIndex + 1,
          questions.length,
          question.difficulty,
        ),
      ),
    };
  }

  private async startCmsQuiz(
    topic: { id: number; name: string; description: string | null },
    childId: number,
    dto: QuizStartDto,
    quizzes: Array<TopicQuiz & { options: TopicQuizOption[] }>,
  ): Promise<QuizSessionDto> {
    this.recordBreadcrumb("quiz.start.cms_session_created", {
      childId,
      topicId: dto.topicId,
      questionCount: quizzes.length,
    });

    const questions = quizzes
      .map((quiz, index) =>
        this.quizQuestionService.buildCmsQuestion(quiz, index),
      )
      .filter(
        (question): question is QuizSession["questions"][number] =>
          question !== null,
      );

    if (questions.length === 0) {
      throw new BadRequestException(
        `No published quiz questions available for topic ${dto.topicId}.`,
      );
    }

    const quizSessionId = randomUUID();
    const session: QuizSession = {
      quizSessionId,
      childId,
      topicId: dto.topicId,
      topicName: topic.name,
      questions,
      currentQuestionIndex: 0,
      answers: [],
      currentScore: 0,
      currentDifficulty: questions[0].difficulty,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      startedAt: new Date(),
    };

    await this.quizSessionService.saveSession(session);

    return {
      quizSessionId,
      topicId: dto.topicId,
      topicName: topic.name,
      totalQuestions: questions.length,
      currentDifficulty: session.currentDifficulty,
      startedAt: session.startedAt,
      currentScore: 0,
      questionsAnswered: 0,
      firstQuestion: this.quizQuestionService.buildQuestionDto(
        questions[0],
        1,
        questions.length,
        questions[0].difficulty,
      ),
      questions: questions.map((question, questionIndex) =>
        this.quizQuestionService.buildQuestionDto(
          question,
          questionIndex + 1,
          questions.length,
          question.difficulty,
        ),
      ),
    };
  }

  /**
   * Submit answer and get instant feedback with adaptive difficulty
   */
  @SentryTraced("quiz.answer.submit")
  async submitAnswer(
    childId: number,
    dto: QuizAnswerDto,
  ): Promise<QuizAnswerFeedbackDto> {
    const session = await this.quizSessionService.getSession(dto.quizSessionId);
    this.quizSessionService.assertOwnership(session, childId);
    this.quizSessionService.assertCurrentQuestionOrder(session, dto.questionId);

    const lockAcquired = this.quizSessionService.acquireAnswerLock(
      dto.quizSessionId,
      dto.questionId,
    );

    if (!lockAcquired) {
      throw new BadRequestException(
        "Answer for this question is being processed. Please retry shortly.",
      );
    }

    try {
      const existingAnswer = session.answers.find(
        (answer) => answer.questionId === dto.questionId,
      );
      if (existingAnswer) {
        const answeredQuestion = session.questions.find(
          (q) => q.questionId === dto.questionId,
        );
        const previousCorrectAnswer = answeredQuestion?.options.find(
          (o) => o.id === answeredQuestion.correctOptionId,
        );

        return {
          isCorrect: existingAnswer.isCorrect,
          feedbackMessage: existingAnswer.isCorrect
            ? "Correct! 🎉"
            : "Not quite! Keep learning! 💪",
          correctAnswerId: answeredQuestion?.correctOptionId || 0,
          correctAnswer:
            previousCorrectAnswer?.text || answeredQuestion?.word || "",
          pointsEarned: existingAnswer.pointsEarned,
          currentScore: session.currentScore,
          questionsAnswered: session.answers.length,
          totalQuestions: session.questions.length,
          correctCount: session.answers.filter((a) => a.isCorrect).length,
          nextDifficulty: session.currentDifficulty,
        };
      }

      const currentQuestion = session.questions.find(
        (q) => q.questionId === dto.questionId,
      );
      if (!currentQuestion) {
        throw new BadRequestException("Invalid question ID");
      }

      // Check if correct
      const isCorrect =
        dto.selectedOptionId === currentQuestion.correctOptionId;
      const pointsEarned = isCorrect ? currentQuestion.pointsValue : 0;

      // Update session
      session.answers.push({
        questionId: dto.questionId,
        selectedOptionId: dto.selectedOptionId,
        isCorrect,
        pointsEarned,
        timeTakenMs: dto.timeTakenMs,
      });
      session.currentScore += pointsEarned;
      session.currentQuestionIndex++;

      // Update streaks for adaptive difficulty
      if (isCorrect) {
        session.consecutiveCorrect++;
        session.consecutiveIncorrect = 0;
      } else {
        session.consecutiveIncorrect++;
        session.consecutiveCorrect = 0;
      }

      // Calculate next difficulty (adaptive)
      const performance = await this.quizRepository.analyzeLearnerPerformance(
        childId,
        session.topicId,
      );
      const nextDifficulty = this.quizRepository.calculateAdaptiveDifficulty(
        performance,
        session.currentDifficulty,
        session.consecutiveCorrect,
        session.consecutiveIncorrect,
      );
      session.currentDifficulty = nextDifficulty;

      // Record attempt in database
      if (currentQuestion.vocabularyId) {
        await this.quizRepository.recordQuizAttempt(
          childId,
          currentQuestion.vocabularyId,
          isCorrect,
          pointsEarned,
          dto.timeTakenMs,
          currentQuestion.difficulty,
        );

        // Update learning progress only for vocabulary-backed quiz questions.
        await this.quizRepository.updateQuizProgress(
          childId,
          currentQuestion.vocabularyId,
          isCorrect,
        );
      }

      // Update cache
      await this.quizSessionService.saveSession(session);

      await this.quizEventPublisher.publishQuizSubmitted({
        childId,
        quizSessionId: dto.quizSessionId,
        topicId: session.topicId,
        questionId: dto.questionId,
        selectedOptionId: dto.selectedOptionId,
        isCorrect,
        pointsEarned,
        timeTakenMs: dto.timeTakenMs,
      });

      const correctAnswer = currentQuestion.options.find(
        (o) => o.id === currentQuestion.correctOptionId,
      );

      this.recordBreadcrumb("quiz.answer.submitted", {
        childId,
        quizSessionId: dto.quizSessionId,
        questionId: dto.questionId,
        isCorrect,
        pointsEarned,
        nextDifficulty,
        questionsAnswered: session.answers.length,
      });

      Sentry.logger.info("Quiz answer submitted", {
        childId,
        topicId: session.topicId,
        quizSessionId: dto.quizSessionId,
        questionId: dto.questionId,
        isCorrect,
        pointsEarned,
        nextDifficulty,
      });

      return {
        isCorrect,
        feedbackMessage: isCorrect
          ? "Correct! 🎉"
          : "Not quite! Keep learning! 💪",
        correctAnswerId: currentQuestion.correctOptionId,
        correctAnswer: correctAnswer?.text || currentQuestion.word,
        pointsEarned,
        currentScore: session.currentScore,
        questionsAnswered: session.answers.length,
        totalQuestions: session.questions.length,
        correctCount: session.answers.filter((a) => a.isCorrect).length,
        nextDifficulty,
      };
    } finally {
      this.quizSessionService.releaseAnswerLock(
        dto.quizSessionId,
        dto.questionId,
      );
    }
  }

  /**
   * Get quiz results with gamification rewards
   */
  @SentryTraced("quiz.results")
  async getQuizResults(
    childId: number,
    quizSessionId: string,
  ): Promise<QuizResultDto> {
    const session = await this.quizSessionService.getSession(quizSessionId);
    this.quizSessionService.assertOwnership(session, childId);

    const totalQuestions = session.questions.length;
    const correctAnswers = session.answers.filter((a) => a.isCorrect).length;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const percentageScore = accuracy;
    const maxScore = session.questions.reduce(
      (sum, q) => sum + q.pointsValue,
      0,
    );
    const totalTimeMs = session.answers.reduce(
      (sum, a) => sum + a.timeTakenMs,
      0,
    );

    // Calculate stars and rewards
    const starsEarned =
      this.quizScoringService.calculateStarsFromPercentage(percentageScore);
    const pointsAwarded = this.quizScoringService.calculateQuizRewardPoints(
      percentageScore,
      totalQuestions,
    );

    if (!session.rewardsGranted) {
      const rewardLockAcquired =
        this.quizSessionService.acquireRewardGrantLock(quizSessionId);

      if (rewardLockAcquired) {
        try {
          const latestSession =
            await this.quizSessionService.getSession(quizSessionId);

          if (!latestSession.rewardsGranted) {
            await this.prisma.$transaction(async (tx) => {
              await tx.childProfile.update({
                where: { id: childId },
                data: { totalPoints: { increment: pointsAwarded } },
              });
            });

            latestSession.rewardsGranted = true;
            latestSession.completedAt = new Date();
            Object.assign(session, latestSession);

            await this.quizSessionService.saveSession(latestSession);

            await this.quizEventPublisher.publishQuizCompleted({
              childId,
              quizSessionId,
              topicId: session.topicId,
              totalQuestions,
              correctAnswers,
              accuracy,
              pointsAwarded,
            });

            void this.gamificationService.checkAndAwardBadges(childId).catch(() => {});
          }
        } finally {
          this.quizSessionService.releaseRewardGrantLock(quizSessionId);
        }
      } else {
        const latestSession = await this.quizSessionService.getSession(quizSessionId);
        Object.assign(session, latestSession);
      }
    }

    const child = await this.prisma.childProfile.findUnique({
      where: { id: childId },
      select: { totalPoints: true },
    });

    const currentLevel = Math.floor((child?.totalPoints || 0) / 50) + 1;

    // Check for badges
    const stats = await this.quizRepository.getQuizStats(childId);
    const badgeUnlocked = this.quizScoringService.checkQuizBadges(
      stats.totalQuizzes,
      accuracy,
    );

    // Build question breakdown
    const questionBreakdown = session.answers.map((answer) => {
      const question = session.questions.find(
        (q) => q.questionId === answer.questionId,
      );
      const selectedOption = question?.options.find(
        (o) => o.id === answer.selectedOptionId,
      );
      const correctOption = question?.options.find(
        (o) => o.id === question.correctOptionId,
      );

      return {
        questionId: answer.questionId,
        questionText: question?.promptText || "",
        isCorrect: answer.isCorrect,
        selectedAnswer: selectedOption?.text || "",
        correctAnswer: correctOption?.text || "",
        pointsEarned: answer.pointsEarned,
        timeTaken: answer.timeTakenMs,
      };
    });

    this.recordBreadcrumb("quiz.results.generated", {
      childId,
      quizSessionId,
      topicId: session.topicId,
      accuracy,
      starsEarned,
      totalQuestions,
      pointsAwarded,
    });

    Sentry.logger.info("Quiz results generated", {
      childId,
      quizSessionId,
      topicId: session.topicId,
      accuracy,
      starsEarned,
      pointsAwarded,
      totalQuestions,
    });

    return {
      quizSessionId,
      topicId: session.topicId,
      topicName: session.topicName,
      finalScore: session.currentScore,
      maxScore,
      percentageScore,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      accuracy,
      totalTimeMs,
      averageTimePerQuestion: totalQuestions > 0 ? Math.round(totalTimeMs / totalQuestions) : 0,
      performanceMessage:
        this.quizScoringService.generatePerformanceMessage(percentageScore),
      starsEarned,
      starEmoji: "⭐".repeat(starsEarned) + "✨".repeat(5 - starsEarned),
      rewardMessage: `+${pointsAwarded} Star Points!`,
      totalPoints: child?.totalPoints || 0,
      currentLevel,
      badgeUnlocked,
      questionBreakdown,
      completedAt: new Date(),
    };
  }

  private shuffleOptions(
    options: Array<{ id: number; text: string; imageUrl?: string }>,
  ): Array<{ id: number; text: string; imageUrl?: string }> {
    const shuffled = [...options];

    for (let index = shuffled.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [
        shuffled[swapIndex],
        shuffled[index],
      ];
    }

    return shuffled.map((option, index) => ({
      ...option,
      id: index + 1,
    }));
  }
}
