import { Injectable } from "@nestjs/common";
import { QuizDifficulty } from "../dto/quiz.dto";

@Injectable()
export class QuizScoringService {
  calculatePointsValue(difficulty: QuizDifficulty): number {
    const pointsMap = {
      [QuizDifficulty.EASY]: 5,
      [QuizDifficulty.MEDIUM]: 10,
      [QuizDifficulty.HARD]: 15,
    };
    return pointsMap[difficulty];
  }

  calculateStarsFromPercentage(percentage: number): number {
    if (percentage >= 90) return 5;
    if (percentage >= 75) return 4;
    if (percentage >= 60) return 3;
    if (percentage >= 40) return 2;
    return 1;
  }

  calculateQuizRewardPoints(percentage: number, questionCount: number): number {
    const basePoints = questionCount * 3;
    const bonusMultiplier = percentage / 100;
    return Math.round(basePoints * bonusMultiplier);
  }

  generatePerformanceMessage(percentage: number): string {
    if (percentage >= 90) return "Excellent work! You are a quiz champion! 🏆";
    if (percentage >= 75) return "Great job! You did really well! 🎉";
    if (percentage >= 60) return "Good effort! Keep practicing! 🌟";
    if (percentage >= 40) return "Nice try! You are learning! 💪";
    return "Keep practicing! You will get better! 😊";
  }

  checkQuizBadges(totalQuizzes: number, accuracy: number): string | undefined {
    if (totalQuizzes === 10 && accuracy >= 80) {
      return "🏅 Quiz Enthusiast: 10 Quizzes Completed!";
    }
    if (totalQuizzes === 25 && accuracy >= 85) {
      return "🏆 Quiz Master: 25 Quizzes with Excellence!";
    }
    if (totalQuizzes === 50) {
      return "👑 Quiz Legend: 50 Quizzes Completed!";
    }
    return undefined;
  }
}
