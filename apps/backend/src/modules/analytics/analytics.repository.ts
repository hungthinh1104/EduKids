import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsPeriod, ChartDataPointDto } from './analytics.dto';
import { subDays, format, startOfDay, differenceInDays } from 'date-fns';

/**
 * Repository for analytics data aggregation
 * Queries Activity table for learning metrics
 */
@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get date range for analytics period
   * @param period - Time period enum
   * @returns Start and end dates
   */
  getDateRange(period: AnalyticsPeriod): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    let startDate: Date;

    switch (period) {
      case AnalyticsPeriod.WEEK:
        startDate = subDays(endDate, 7);
        break;
      case AnalyticsPeriod.MONTH:
        startDate = subDays(endDate, 30);
        break;
      case AnalyticsPeriod.QUARTER:
        startDate = subDays(endDate, 90);
        break;
      case AnalyticsPeriod.YEAR:
        startDate = subDays(endDate, 365);
        break;
      case AnalyticsPeriod.ALL:
        startDate = new Date(0); // Unix epoch (all time)
        break;
      default:
        startDate = subDays(endDate, 7);
    }

    return { startDate, endDate };
  }

  /**
   * Get all activities for child in period
   * @param childId - Child profile ID
   * @param period - Time period
   * @returns List of activities
   */
  async getActivitiesInPeriod(childId: number, period: AnalyticsPeriod) {
    const { startDate, endDate } = this.getDateRange(period);

    return this.prisma.activityLog.findMany({
      where: {
        childId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        activityType: true,
        durationSec: true,
        score: true,
        vocabularyId: true,
        contentId: true,
        createdAt: true,
        metadata: true,
        pointsEarned: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Calculate learning time metrics
   * @param childId - Child profile ID
   * @param period - Time period
   * @returns Learning time data
   */
  async getLearningTimeMetrics(childId: number, period: AnalyticsPeriod) {
    const activities = await this.getActivitiesInPeriod(childId, period);

    if (activities.length === 0) {
      return null;
    }

    // Calculate total minutes (durationSec / 60)
    const totalMinutes = activities.reduce(
      (sum, activity) => sum + (activity.durationSec || 0) / 60,
      0,
    );

    // Count unique days
    const uniqueDates = new Set(
      activities.map((a) => format(a.createdAt, 'yyyy-MM-dd')),
    );
    const daysActive = uniqueDates.size;

    // Calculate average session time
    const averageSessionMinutes = totalMinutes / activities.length;

    // Calculate current streak
    const currentStreak = await this.calculateStreak(childId);

    // Generate chart data (daily learning time)
    const chartData = this.generateLearningTimeChartData(activities, period);

    return {
      totalMinutes: Math.round(totalMinutes),
      averageSessionMinutes: Math.round(averageSessionMinutes),
      totalSessions: activities.length,
      daysActive,
      currentStreak,
      chartData,
    };
  }

  /**
   * Calculate vocabulary retention metrics
   * @param childId - Child profile ID
   * @param period - Time period
   * @returns Vocabulary retention data
   */
  async getVocabularyRetentionMetrics(
    childId: number,
    period: AnalyticsPeriod,
  ) {
    const activities = await this.getActivitiesInPeriod(childId, period);

    // Filter flashcard and pronunciation activities (vocabulary-related)
    const vocabActivities = activities.filter(
      (a) => a.activityType === 'FLASHCARD' || a.activityType === 'PRONUNCIATION',
    );

    if (vocabActivities.length === 0) {
      return null;
    }

    const keyOf = (activity: {
      id?: number;
      vocabularyId?: number | null;
      contentId?: string | null;
    }) => {
      if (typeof activity.vocabularyId === 'number') {
        return `v:${activity.vocabularyId}`;
      }

      if (activity.contentId) {
        return `c:${activity.contentId}`;
      }

      return `a:${activity.id ?? 0}`;
    };

    // Aggregate attempts by unique vocabulary/content key
    const perWord = new Map<string, { total: number; count: number }>();
    for (const activity of vocabActivities) {
      const key = keyOf(activity);
      const score = Number(activity.score ?? 0);
      const current = perWord.get(key) || { total: 0, count: 0 };
      current.total += score;
      current.count += 1;
      perWord.set(key, current);
    }

    const totalWordsEncountered = perWord.size;

    const wordsMastered = Array.from(perWord.values()).filter(
      (entry) => entry.count > 0 && entry.total / entry.count >= 80,
    ).length;

    const learningCount = Array.from(perWord.values()).filter((entry) => {
      if (entry.count === 0) return false;
      const avg = entry.total / entry.count;
      return avg > 0 && avg < 80;
    }).length;

    const newCount = Math.max(totalWordsEncountered - wordsMastered - learningCount, 0);

    // Retention rate on unique words
    const retentionRate =
      totalWordsEncountered > 0
        ? Math.round((wordsMastered / totalWordsEncountered) * 100)
        : 0;

    const wordsByLevel = {
      mastered: wordsMastered,
      learning: learningCount,
      new: newCount,
    };

    // Chart data (retention rate over time)
    const chartData = this.generateRetentionChartData(
      vocabActivities,
      period,
    );

    return {
      totalWordsEncountered,
      wordsMastered,
      retentionRate,
      wordsReviewed: vocabActivities.length,
      chartData,
      wordsByLevel,
    };
  }

  /**
   * Calculate pronunciation accuracy metrics
   * @param childId - Child profile ID
   * @param period - Time period
   * @returns Pronunciation accuracy data
   */
  async getPronunciationAccuracyMetrics(
    childId: number,
    period: AnalyticsPeriod,
  ) {
    const activities = await this.getActivitiesInPeriod(childId, period);

    // Filter pronunciation activities
    const pronunciationActivities = activities.filter(
      (a) => a.activityType === 'PRONUNCIATION',
    );

    if (pronunciationActivities.length === 0) {
      return null;
    }

    const vocabularyWordMap =
      await this.getVocabularyWordMap(pronunciationActivities);

    // Calculate average accuracy (confidence score)
    const totalAccuracy = pronunciationActivities.reduce(
      (sum, a) => sum + Number(a.score || 0),
      0,
    );
    const averageAccuracy = Math.round(
      totalAccuracy / pronunciationActivities.length,
    );

    // High accuracy count (76%+ = 4 stars)
    const highAccuracyCount = pronunciationActivities.filter(
      (a) => Number(a.score || 0) >= 76,
    ).length;

    // Most improved words (compare first vs last attempt)
    const mostImprovedWords = this.calculateMostImprovedWords(
      pronunciationActivities,
      vocabularyWordMap,
    );

    // Words needing practice (low accuracy)
    const wordsNeedingPractice = this.calculateWordsNeedingPractice(
      pronunciationActivities,
      vocabularyWordMap,
    );

    // Chart data (accuracy over time)
    const chartData = this.generateAccuracyChartData(
      pronunciationActivities,
      period,
    );

    return {
      averageAccuracy,
      totalPractices: pronunciationActivities.length,
      highAccuracyCount,
      challengingSoundsCount: wordsNeedingPractice.length,
      chartData,
      mostImprovedWords,
      wordsNeedingPractice,
    };
  }

  /**
   * Calculate quiz performance metrics
   * @param childId - Child profile ID
   * @param period - Time period
   * @returns Quiz performance data
   */
  async getQuizPerformanceMetrics(childId: number, period: AnalyticsPeriod) {
    const activities = await this.getActivitiesInPeriod(childId, period);

    // Filter quiz activities
    const quizActivities = activities.filter((a) => a.activityType === 'QUIZ');

    if (quizActivities.length === 0) {
      return null;
    }

    // Calculate average score
    const totalScore = quizActivities.reduce(
      (sum, a) => sum + Number(a.score || 0),
      0,
    );
    const averageScore = Math.round(totalScore / quizActivities.length);

    // Highest score
    const highestScore = Math.max(
      ...quizActivities.map((a) => Number(a.score || 0)),
    );

    // Quizzes passed (80%+)
    const quizzesPassed = quizActivities.filter((a) => Number(a.score || 0) >= 80)
      .length;

    // Scores by difficulty (from metadata)
    const scoresByDifficulty = {
      easy: this.calculateAverageScoreByDifficulty(quizActivities, 'EASY'),
      medium: this.calculateAverageScoreByDifficulty(quizActivities, 'MEDIUM'),
      hard: this.calculateAverageScoreByDifficulty(quizActivities, 'HARD'),
    };

    // Chart data (quiz scores over time)
    const chartData = this.generateQuizScoreChartData(quizActivities, period);

    return {
      totalQuizzes: quizActivities.length,
      averageScore,
      highestScore,
      quizzesPassed,
      chartData,
      scoresByDifficulty,
    };
  }

  /**
   * Calculate gamification progress metrics
   * @param childId - Child profile ID
   * @param period - Time period
   * @returns Gamification progress data
   */
  async getGamificationMetrics(childId: number, period: AnalyticsPeriod) {
    const childProfile = await this.prisma.childProfile.findUnique({
      where: { id: childId },
      include: {
        badges: {
          include: {
            badge: {
              select: { name: true },
            },
          },
          orderBy: {
            earnedAt: 'desc',
          },
          take: 5, // Recent badges
        },
      },
    });

    if (!childProfile) {
      return null;
    }

    // Get activities in period for charting
    const activities = await this.getActivitiesInPeriod(childId, period);

    // Count purchases
    const purchases = await this.prisma.purchase.count({
      where: { childId },
    });

    const [totalBadges, badgesEarned] = await Promise.all([
      this.prisma.badge.count(),
      this.prisma.childBadge.count({ where: { childId } }),
    ]);

    // Calculate level
    const currentLevel = Math.floor(childProfile.totalPoints / 50) + 1;

    // Chart data (points over time)
    const chartData = this.generatePointsChartData(activities, period);

    return {
      totalPoints: childProfile.totalPoints,
      currentLevel,
      badgesEarned,
      totalBadges,
      itemsPurchased: purchases,
      chartData,
      recentBadges: childProfile.badges.map((b) => ({
        name: b.badge.name,
        earnedAt: b.earnedAt,
      })),
    };
  }

  async getTotalBadgesCount(): Promise<number> {
    return this.prisma.badge.count();
  }

  private async getVocabularyWordMap(
    activities: Array<{ vocabularyId?: number | null }>,
  ): Promise<Map<number, string>> {
    const vocabularyIds = Array.from(
      new Set(
        activities
          .map((activity) => activity.vocabularyId)
          .filter((id): id is number => typeof id === 'number'),
      ),
    );

    if (vocabularyIds.length === 0) {
      return new Map<number, string>();
    }

    const vocabularies = await this.prisma.vocabulary.findMany({
      where: { id: { in: vocabularyIds } },
      select: { id: true, word: true },
    });

    return new Map<number, string>(
      vocabularies.map((vocabulary) => [vocabulary.id, vocabulary.word]),
    );
  }

  /**
   * Calculate current streak (consecutive days)
   * @param childId - Child profile ID
   * @returns Streak count
   */
  private async calculateStreak(childId: number): Promise<number> {
    const childProfile = await this.prisma.childProfile.findUnique({
      where: { id: childId },
      select: { streakCount: true },
    });

    return childProfile?.streakCount || 0;
  }

  /**
   * Generate daily learning time chart data
   */
  private generateLearningTimeChartData(
    activities: any[],
    period: AnalyticsPeriod,
  ): ChartDataPointDto[] {
    const { startDate, endDate } = this.getDateRange(period);
    const days = differenceInDays(endDate, startDate);

    const dailyMinutes = new Map<string, number>();

    // Aggregate minutes by day
    activities.forEach((activity) => {
      const dateKey = format(activity.createdAt, 'yyyy-MM-dd');
      const minutes = (activity.durationSec || 0) / 60;
      dailyMinutes.set(dateKey, (dailyMinutes.get(dateKey) || 0) + minutes);
    });

    // Generate chart points for each day
    const chartData: ChartDataPointDto[] = [];
    for (let i = 0; i <= days; i++) {
      const date = subDays(endDate, days - i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const minutes = dailyMinutes.get(dateKey) || 0;

      chartData.push({
        date: dateKey,
        value: Math.round(minutes),
        label: format(date, 'EEE'), // Mon, Tue, Wed
      });
    }

    return chartData;
  }

  /**
   * Generate retention rate chart data
   */
  private generateRetentionChartData(
    activities: any[],
    period: AnalyticsPeriod,
  ): ChartDataPointDto[] {
    // Group by week and calculate retention rate
    const weeklyData = new Map<string, { total: number; mastered: number }>();

    activities.forEach((activity) => {
      const weekKey = format(activity.createdAt, 'yyyy-MM-ww');
      const data = weeklyData.get(weekKey) || { total: 0, mastered: 0 };
      data.total++;
      if (Number(activity.score || 0) >= 80) data.mastered++;
      weeklyData.set(weekKey, data);
    });

    const chartData: ChartDataPointDto[] = [];
    weeklyData.forEach((data, weekKey) => {
      const retentionRate = Math.round((data.mastered / data.total) * 100);
      chartData.push({
        date: weekKey,
        value: retentionRate,
        label: `Week ${weekKey.split('-')[1]}`,
      });
    });

    return chartData;
  }

  /**
   * Generate pronunciation accuracy chart data
   */
  private generateAccuracyChartData(
    activities: any[],
    period: AnalyticsPeriod,
  ): ChartDataPointDto[] {
    // Group by day and calculate average accuracy
    const dailyAccuracy = new Map<string, { total: number; count: number }>();

    activities.forEach((activity) => {
      const dateKey = format(activity.createdAt, 'yyyy-MM-dd');
      const data = dailyAccuracy.get(dateKey) || { total: 0, count: 0 };
      data.total += Number(activity.score || 0);
      data.count++;
      dailyAccuracy.set(dateKey, data);
    });

    const chartData: ChartDataPointDto[] = [];
    dailyAccuracy.forEach((data, dateKey) => {
      const avgAccuracy = Math.round(data.total / data.count);
      const date = new Date(dateKey);
      chartData.push({
        date: dateKey,
        value: avgAccuracy,
        label: format(date, 'MMM d'), // Mar 5
      });
    });

    return chartData;
  }

  /**
   * Generate quiz score chart data
   */
  private generateQuizScoreChartData(
    activities: any[],
    period: AnalyticsPeriod,
  ): ChartDataPointDto[] {
    return activities.map((activity, index) => ({
      date: format(activity.createdAt, 'yyyy-MM-dd'),
      value: Math.round(Number(activity.score || 0)),
      label: `Quiz ${index + 1}`,
    }));
  }

  /**
   * Generate points earned chart data
   */
  private generatePointsChartData(
    activities: any[],
    period: AnalyticsPeriod,
  ): ChartDataPointDto[] {
    const dailyPoints = new Map<string, number>();

    activities.forEach((activity) => {
      const dateKey = format(activity.createdAt, 'yyyy-MM-dd');
      const points = Number(activity.pointsEarned || 0);
      dailyPoints.set(dateKey, (dailyPoints.get(dateKey) || 0) + points);
    });

    const chartData: ChartDataPointDto[] = [];
    dailyPoints.forEach((points, dateKey) => {
      const date = new Date(dateKey);
      chartData.push({
        date: dateKey,
        value: points,
        label: format(date, 'MMM d'),
      });
    });

    return chartData;
  }

  /**
   * Calculate most improved words
   */
  private calculateMostImprovedWords(
    activities: any[],
    vocabularyWordMap: Map<number, string>,
  ): Array<{ word: string; improvement: number }> {
    const wordProgress = new Map<
      string,
      { first: number; last: number; word: string }
    >();

    activities.forEach((activity) => {
      const word =
        activity.metadata?.word ||
        (activity.vocabularyId
          ? vocabularyWordMap.get(activity.vocabularyId) ||
            `Vocabulary #${activity.vocabularyId}`
          : `Activity #${activity.id}`);
      const score = Number(activity.score || 0);

      if (!wordProgress.has(word)) {
        wordProgress.set(word, { first: score, last: score, word });
      } else {
        const progress = wordProgress.get(word)!;
        progress.last = score;
        wordProgress.set(word, progress);
      }
    });

    // Calculate improvement and sort
    const improvements = Array.from(wordProgress.values())
      .map((p) => ({ word: p.word, improvement: p.last - p.first }))
      .filter((i) => i.improvement > 0)
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 5); // Top 5

    return improvements;
  }

  /**
   * Calculate words needing practice
   */
  private calculateWordsNeedingPractice(
    activities: any[],
    vocabularyWordMap: Map<number, string>,
  ): Array<{ word: string; accuracy: number }> {
    const wordAccuracy = new Map<string, { total: number; count: number }>();

    activities.forEach((activity) => {
      const word =
        activity.metadata?.word ||
        (activity.vocabularyId
          ? vocabularyWordMap.get(activity.vocabularyId) ||
            `Vocabulary #${activity.vocabularyId}`
          : `Activity #${activity.id}`);
      const score = Number(activity.score || 0);

      const data = wordAccuracy.get(word) || { total: 0, count: 0 };
      data.total += score;
      data.count++;
      wordAccuracy.set(word, data);
    });

    // Calculate average and filter low accuracy
    const needsPractice = Array.from(wordAccuracy.entries())
      .map(([word, data]) => ({
        word,
        accuracy: Math.round(data.total / data.count),
      }))
      .filter((w) => w.accuracy < 70)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5); // Top 5 challenging

    return needsPractice;
  }

  /**
   * Calculate average score by difficulty
   */
  private calculateAverageScoreByDifficulty(
    activities: any[],
    difficulty: string,
  ): number {
    const filtered = activities.filter(
      (a) => String(a.metadata?.difficulty || '').toUpperCase() === difficulty,
    );

    if (filtered.length === 0) return 0;

    const totalScore = filtered.reduce(
      (sum, a) => sum + Number(a.score || 0),
      0,
    );
    return Math.round(totalScore / filtered.length);
  }
}
