export interface QuizSubmittedEventPayload {
  childId: number;
  quizSessionId: string;
  topicId: number;
  questionId: number;
  selectedOptionId: number;
  isCorrect: boolean;
  pointsEarned: number;
  timeTakenMs: number;
}

export interface QuizCompletedEventPayload {
  childId: number;
  quizSessionId: string;
  topicId: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  pointsAwarded: number;
}
