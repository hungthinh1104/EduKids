import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString, IsEnum, IsOptional, Min, Max } from "class-validator";

export enum QuizDifficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
}

export enum QuestionType {
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  TRUE_FALSE = "TRUE_FALSE",
  MATCHING = "MATCHING",
}

export class QuizStartDto {
  @ApiProperty({
    example: 1,
    description: "Topic ID to generate quiz from",
  })
  @IsInt()
  topicId: number;

  @ApiProperty({
    example: 10,
    description: "Number of questions in quiz (5-20)",
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(20)
  questionCount?: number;

  @ApiProperty({
    enum: QuizDifficulty,
    example: QuizDifficulty.MEDIUM,
    description: "Initial difficulty level (will adapt based on performance)",
    required: false,
  })
  @IsOptional()
  @IsEnum(QuizDifficulty)
  initialDifficulty?: QuizDifficulty;
}

export class QuizOptionDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "A picture of a dog" })
  text: string;

  @ApiProperty({
    example: "https://cdn.edukids.com/images/dog.jpg",
    required: false,
  })
  imageUrl?: string;
}

export class QuestionDto {
  @ApiProperty({ example: 1 })
  questionId: number;

  @ApiProperty({ example: 5 })
  questionNumber: number;

  @ApiProperty({ example: 10 })
  totalQuestions: number;

  @ApiProperty({
    enum: QuestionType,
    example: QuestionType.MULTIPLE_CHOICE,
  })
  questionType: QuestionType;

  @ApiProperty({ example: "What is this animal called?" })
  questionText: string;

  @ApiProperty({
    example: "https://cdn.edukids.com/images/dog.jpg",
    required: false,
  })
  questionImage?: string;

  @ApiProperty({
    type: [QuizOptionDto],
    description: "4 options for multiple choice questions",
  })
  options: QuizOptionDto[];

  @ApiProperty({
    enum: QuizDifficulty,
    example: QuizDifficulty.MEDIUM,
  })
  difficulty: QuizDifficulty;

  @ApiProperty({ example: 10, description: "Points for correct answer" })
  pointsValue: number;

  @ApiProperty({ example: 15, description: "Time limit in seconds" })
  timeLimit: number;
}

export class QuizAnswerDto {
  @ApiProperty({
    example: "quiz-session-uuid-123",
    description: "Quiz session ID from start quiz response",
  })
  @IsString()
  quizSessionId: string;

  @ApiProperty({
    example: 1,
    description: "Question ID being answered",
  })
  @IsInt()
  questionId: number;

  @ApiProperty({
    example: 3,
    description: "Selected option ID",
  })
  @IsInt()
  selectedOptionId: number;

  @ApiProperty({
    example: 8500,
    description: "Time taken to answer in milliseconds",
  })
  @IsInt()
  @Min(0)
  timeTakenMs: number;
}

export class QuizAnswerFeedbackDto {
  @ApiProperty({ example: true })
  isCorrect: boolean;

  @ApiProperty({ example: "Correct! 🎉" })
  feedbackMessage: string;

  @ApiProperty({ example: 2, description: "Option ID of correct answer" })
  correctAnswerId: number;

  @ApiProperty({ example: "dog" })
  correctAnswer: string;

  @ApiProperty({ example: 10, description: "Points earned for this question" })
  pointsEarned: number;

  @ApiProperty({ example: 15, description: "Total points so far in quiz" })
  currentScore: number;

  @ApiProperty({ example: 5, description: "Questions answered so far" })
  questionsAnswered: number;

  @ApiProperty({ example: 10, description: "Total questions in quiz" })
  totalQuestions: number;

  @ApiProperty({ example: 4, description: "Correct answers so far" })
  correctCount: number;

  @ApiProperty({
    enum: QuizDifficulty,
    example: QuizDifficulty.HARD,
    description: "Next question difficulty (adapted)",
  })
  nextDifficulty: QuizDifficulty;
}

export class QuizResultDto {
  @ApiProperty({ example: "quiz-session-uuid-123" })
  quizSessionId: string;

  @ApiProperty({ example: 1 })
  topicId: number;

  @ApiProperty({ example: "Animals" })
  topicName: string;

  @ApiProperty({ example: 85, description: "Total points scored" })
  finalScore: number;

  @ApiProperty({ example: 100, description: "Maximum possible points" })
  maxScore: number;

  @ApiProperty({ example: 85, description: "Percentage score" })
  percentageScore: number;

  @ApiProperty({ example: 10, description: "Total questions" })
  totalQuestions: number;

  @ApiProperty({ example: 8, description: "Correct answers" })
  correctAnswers: number;

  @ApiProperty({ example: 2, description: "Incorrect answers" })
  incorrectAnswers: number;

  @ApiProperty({ example: 80, description: "Accuracy percentage" })
  accuracy: number;

  @ApiProperty({ example: 120000, description: "Total time in milliseconds" })
  totalTimeMs: number;

  @ApiProperty({
    example: 12000,
    description: "Average time per question in ms",
  })
  averageTimePerQuestion: number;

  @ApiProperty({
    example: "Excellent work! You are a quiz champion! 🏆",
    description: "Kid-friendly performance message",
  })
  performanceMessage: string;

  @ApiProperty({
    example: 5,
    description: "Stars earned (1-5 based on percentage)",
  })
  starsEarned: number;

  @ApiProperty({ example: "⭐⭐⭐⭐⭐" })
  starEmoji: string;

  @ApiProperty({ example: "+50 Star Points!" })
  rewardMessage: string;

  @ApiProperty({ example: 420 })
  totalPoints: number;

  @ApiProperty({ example: 8 })
  currentLevel: number;

  @ApiProperty({
    example: "🏅 Quiz Master: Completed 10 Quizzes!",
    required: false,
  })
  badgeUnlocked?: string;

  @ApiProperty({
    type: [Object],
    description: "Breakdown of questions with answers",
  })
  questionBreakdown: Array<{
    questionId: number;
    questionText: string;
    isCorrect: boolean;
    selectedAnswer: string;
    correctAnswer: string;
    pointsEarned: number;
    timeTaken: number;
  }>;

  @ApiProperty({ example: "2024-03-05T10:30:00Z" })
  completedAt: Date;
}

export class QuizSessionDto {
  @ApiProperty({ example: "quiz-session-uuid-123" })
  quizSessionId: string;

  @ApiProperty({ example: 1 })
  topicId: number;

  @ApiProperty({ example: "Animals" })
  topicName: string;

  @ApiProperty({ example: 10 })
  totalQuestions: number;

  @ApiProperty({
    enum: QuizDifficulty,
    example: QuizDifficulty.MEDIUM,
  })
  currentDifficulty: QuizDifficulty;

  @ApiProperty({ example: "2024-03-05T10:30:00Z" })
  startedAt: Date;

  @ApiProperty({ example: 0, description: "Current score" })
  currentScore: number;

  @ApiProperty({ example: 0, description: "Questions answered so far" })
  questionsAnswered: number;

  @ApiProperty({
    type: QuestionDto,
    description: "First question",
  })
  firstQuestion: QuestionDto;
}
