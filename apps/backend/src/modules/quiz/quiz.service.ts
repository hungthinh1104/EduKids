import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  Logger,
} from "@nestjs/common";
import * as Sentry from "@sentry/nestjs";
import { SentryTraced } from "@sentry/nestjs";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { randomUUID } from "crypto";
import { QuizRepository } from "./repositories/quiz.repository";
import { PrismaService } from "../../prisma/prisma.service";
import { CmsContentStatus, TopicQuiz, TopicQuizOption } from "@prisma/client";
import {
  QuizStartDto,
  QuizDifficulty,
  QuestionDto,
  QuizAnswerDto,
  QuizAnswerFeedbackDto,
  QuizResultDto,
  QuizSessionDto,
  QuestionType,
  QuizOptionDto,
} from "./dto/quiz.dto";

interface QuizSession {
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
  startedAt: Date;
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
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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

      // Generate questions with options
      const questions = await Promise.all(
        selectedVocabulary.map(async (vocab, index) => {
          const distractors = await this.quizRepository.generateDistractors(
            vocab.id,
            dto.topicId,
            3,
          );

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
            pointsValue: this.calculatePointsValue(initialDifficulty),
          };
        }),
      );

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
      await this.cacheManager.set(
        `quiz:session:${quizSessionId}`,
        session,
        3600000,
      );

      // Return first question
      const firstQuestion = this.buildQuestionDto(
        questions[0],
        1,
        questions.length,
        initialDifficulty,
      );
      const questionDtos = questions.map((question, questionIndex) =>
        this.buildQuestionDto(
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
      Sentry.captureMessage("Adaptive quiz generation fell back to static quiz", {
        level: "warning",
      });
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

    const questions = await Promise.all(
      allVocabulary.map(async (vocab, index) => {
        const distractors = await this.quizRepository.generateDistractors(
          vocab.id,
          dto.topicId,
          3,
        );
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
          pointsValue: 10,
        };
      }),
    );

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

    await this.cacheManager.set(
      `quiz:session:${quizSessionId}`,
      session,
      3600000,
    );

    return {
      quizSessionId,
      topicId: dto.topicId,
      topicName: topic.name,
      totalQuestions: questions.length,
      currentDifficulty: QuizDifficulty.MEDIUM,
      startedAt: session.startedAt,
      currentScore: 0,
      questionsAnswered: 0,
      firstQuestion: this.buildQuestionDto(
        questions[0],
        1,
        questions.length,
        QuizDifficulty.MEDIUM,
      ),
      questions: questions.map((question, questionIndex) =>
        this.buildQuestionDto(
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
      .map((quiz, index) => this.buildCmsQuestion(quiz, index))
      .filter(
        (
          question,
        ): question is NonNullable<ReturnType<typeof this.buildCmsQuestion>> =>
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

    await this.cacheManager.set(
      `quiz:session:${quizSessionId}`,
      session,
      3600000,
    );

    return {
      quizSessionId,
      topicId: dto.topicId,
      topicName: topic.name,
      totalQuestions: questions.length,
      currentDifficulty: session.currentDifficulty,
      startedAt: session.startedAt,
      currentScore: 0,
      questionsAnswered: 0,
      firstQuestion: this.buildQuestionDto(
        questions[0],
        1,
        questions.length,
        questions[0].difficulty,
      ),
      questions: questions.map((question, questionIndex) =>
        this.buildQuestionDto(
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
    const session = await this.cacheManager.get<QuizSession>(
      `quiz:session:${dto.quizSessionId}`,
    );

    if (!session) {
      throw new NotFoundException("Quiz session not found or expired");
    }

    if (session.childId !== childId) {
      throw new BadRequestException(
        "Quiz session does not belong to this child",
      );
    }

    const currentQuestion = session.questions.find(
      (q) => q.questionId === dto.questionId,
    );
    if (!currentQuestion) {
      throw new BadRequestException("Invalid question ID");
    }

    // Check if correct
    const isCorrect = dto.selectedOptionId === currentQuestion.correctOptionId;
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
    await this.cacheManager.set(
      `quiz:session:${dto.quizSessionId}`,
      session,
      3600000,
    );

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
  }

  /**
   * Get quiz results with gamification rewards
   */
  @SentryTraced("quiz.results")
  async getQuizResults(
    childId: number,
    quizSessionId: string,
  ): Promise<QuizResultDto> {
    const session = await this.cacheManager.get<QuizSession>(
      `quiz:session:${quizSessionId}`,
    );

    if (!session) {
      throw new NotFoundException("Quiz session not found or expired");
    }

    if (session.childId !== childId) {
      throw new BadRequestException(
        "Quiz session does not belong to this child",
      );
    }

    const totalQuestions = session.questions.length;
    const correctAnswers = session.answers.filter((a) => a.isCorrect).length;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
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
    const starsEarned = this.calculateStarsFromPercentage(percentageScore);
    const pointsAwarded = this.calculateQuizRewardPoints(
      percentageScore,
      totalQuestions,
    );

    // Award points to child
    await this.prisma.childProfile.update({
      where: { id: childId },
      data: { totalPoints: { increment: pointsAwarded } },
    });

    const child = await this.prisma.childProfile.findUnique({
      where: { id: childId },
      select: { totalPoints: true },
    });

    const currentLevel = Math.floor((child?.totalPoints || 0) / 50) + 1;

    // Check for badges
    const stats = await this.quizRepository.getQuizStats(childId);
    const badgeUnlocked = this.checkQuizBadges(stats.totalQuizzes, accuracy);

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
      averageTimePerQuestion: Math.round(totalTimeMs / totalQuestions),
      performanceMessage: this.generatePerformanceMessage(percentageScore),
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

  private calculatePointsValue(difficulty: QuizDifficulty): number {
    const pointsMap = {
      [QuizDifficulty.EASY]: 5,
      [QuizDifficulty.MEDIUM]: 10,
      [QuizDifficulty.HARD]: 15,
    };
    return pointsMap[difficulty];
  }

  private calculateStarsFromPercentage(percentage: number): number {
    if (percentage >= 90) return 5;
    if (percentage >= 75) return 4;
    if (percentage >= 60) return 3;
    if (percentage >= 40) return 2;
    return 1;
  }

  private calculateQuizRewardPoints(
    percentage: number,
    questionCount: number,
  ): number {
    const basePoints = questionCount * 3;
    const bonusMultiplier = percentage / 100;
    return Math.round(basePoints * bonusMultiplier);
  }

  private generatePerformanceMessage(percentage: number): string {
    if (percentage >= 90) return "Excellent work! You are a quiz champion! 🏆";
    if (percentage >= 75) return "Great job! You did really well! 🎉";
    if (percentage >= 60) return "Good effort! Keep practicing! 🌟";
    if (percentage >= 40) return "Nice try! You are learning! 💪";
    return "Keep practicing! You will get better! 😊";
  }

  private checkQuizBadges(
    totalQuizzes: number,
    accuracy: number,
  ): string | undefined {
    if (totalQuizzes === 10 && accuracy >= 80)
      return "🏅 Quiz Enthusiast: 10 Quizzes Completed!";
    if (totalQuizzes === 25 && accuracy >= 85)
      return "🏆 Quiz Master: 25 Quizzes with Excellence!";
    if (totalQuizzes === 50) return "👑 Quiz Legend: 50 Quizzes Completed!";
    return undefined;
  }

  private buildQuestionDto(
    question: QuizSession["questions"][number],
    questionNumber: number,
    totalQuestions: number,
    difficulty: QuizDifficulty,
  ): QuestionDto {
    return {
      questionId: question.questionId,
      questionNumber,
      totalQuestions,
      questionType: QuestionType.MULTIPLE_CHOICE,
      questionText: question.promptText,
      questionImage: question.imageUrl,
      options: question.options,
      difficulty,
      pointsValue: question.pointsValue,
      timeLimit: 15,
    };
  }

  private buildCmsQuestion(
    quiz: TopicQuiz & { options: TopicQuizOption[] },
    index: number,
  ): QuizSession["questions"][number] | null {
    const options = [...quiz.options];
    const correctOption = options.find((option) => option.isCorrect);

    if (!correctOption || options.length < 2) {
      return null;
    }

    const shuffledOptions = this.shuffleOptions(
      options.map((option, optionIndex) => ({
        id: optionIndex + 1,
        text: option.text,
      })),
    );
    const correctAnswer = shuffledOptions.find(
      (option) => option.text === correctOption.text,
    );
    const difficulty = this.mapDifficultyLevel(quiz.difficultyLevel);

    if (!correctAnswer) {
      return null;
    }

    return {
      questionId: index + 1,
      promptText: quiz.questionText,
      word: correctAnswer.text,
      translation: quiz.questionText,
      correctOptionId: correctAnswer.id,
      options: shuffledOptions,
      difficulty,
      pointsValue: this.calculatePointsValue(difficulty),
    };
  }

  private mapDifficultyLevel(level: number): QuizDifficulty {
    if (level >= 4) {
      return QuizDifficulty.HARD;
    }
    if (level <= 2) {
      return QuizDifficulty.EASY;
    }
    return QuizDifficulty.MEDIUM;
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
