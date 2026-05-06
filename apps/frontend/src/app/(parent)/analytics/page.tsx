'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  TrendingUp,
  Clock,
  BookOpen,
  Mic,
  Trophy,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useChildProfiles } from '@/features/dashboard/hooks/useChildProfiles';
import {
  getAnalyticsOverview,
  getLearningTimeAnalytics,
  getVocabularyAnalytics,
  getPronunciationAnalytics,
  getQuizAnalytics,
  getGamificationAnalytics,
  type AnalyticsOverview,
  type LearningTimeAnalytics,
  type VocabularyRetentionAnalytics,
  type PronunciationAccuracyAnalytics,
  type QuizPerformanceAnalytics,
  type GamificationProgressAnalytics,
  type NoDataResponse,
} from '@/features/analytics/api/analytics.api';
import { Heading, Body, Caption } from '@/shared/components/Typography';

interface AnalyticsState {
  overview: AnalyticsOverview | null;
  learningTime: LearningTimeAnalytics | null;
  vocabulary: VocabularyRetentionAnalytics | null;
  pronunciation: PronunciationAccuracyAnalytics | null;
  quiz: QuizPerformanceAnalytics | null;
  gamification: GamificationProgressAnalytics | null;
}

const isNoDataResponse = (
  value:
    | AnalyticsOverview
    | LearningTimeAnalytics
    | VocabularyRetentionAnalytics
    | PronunciationAccuracyAnalytics
    | QuizPerformanceAnalytics
    | GamificationProgressAnalytics
    | NoDataResponse,
): value is NoDataResponse =>
  typeof value === 'object' &&
  value !== null &&
  'message' in value &&
  'childId' in value &&
  'childNickname' in value;

export default function ParentAnalyticsPage() {
  const router = useRouter();
  const { profiles } = useChildProfiles();
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsState>({
    overview: null,
    learningTime: null,
    vocabulary: null,
    pronunciation: null,
    quiz: null,
    gamification: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const activeChild = useMemo(
    () => profiles.find((p) => p.id === selectedChildId) ?? profiles[0],
    [profiles, selectedChildId],
  );

  useEffect(() => {
    if (!profiles.length) return;
    if (selectedChildId === null || !profiles.some((p) => p.id === selectedChildId)) {
      setSelectedChildId(profiles[0].id);
    }
  }, [profiles, selectedChildId]);

  const loadAnalytics = useCallback(async () => {
    if (!activeChild?.id) return;
    setIsLoading(true);

    try {
      const [overview, learningTime, vocabulary, pronunciation, quiz, gamification] =
        await Promise.all([
          getAnalyticsOverview(activeChild.id, period),
          getLearningTimeAnalytics(activeChild.id, period),
          getVocabularyAnalytics(activeChild.id, period),
          getPronunciationAnalytics(activeChild.id, period),
          getQuizAnalytics(activeChild.id, period),
          getGamificationAnalytics(activeChild.id, period),
        ]);

      setAnalytics({
        overview: isNoDataResponse(overview) ? null : overview,
        learningTime: isNoDataResponse(learningTime) ? null : learningTime,
        vocabulary: isNoDataResponse(vocabulary) ? null : vocabulary,
        pronunciation: isNoDataResponse(pronunciation) ? null : pronunciation,
        quiz: isNoDataResponse(quiz) ? null : quiz,
        gamification: isNoDataResponse(gamification) ? null : gamification,
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeChild?.id, period]);

  useEffect(() => {
    if (!activeChild?.id) return;
    void loadAnalytics();
  }, [activeChild?.id, period, loadAnalytics]);

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-card rounded-lg transition"
            >
              <ArrowLeft className="w-6 h-6 text-body" />
            </button>
            <div>
              <Heading level={2} className="text-3xl mb-1">
                Chi tiết học tập
              </Heading>
              <Body className="text-body">
                Phân tích chi tiết tiến bộ học tập
              </Body>
            </div>
          </div>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-background transition"
          >
            <Download className="w-5 h-5" />
            <span>Xuất PDF</span>
          </button>
        </div>

        <div className="bg-card rounded-2xl shadow-md p-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <label className="text-sm font-bold text-heading block mb-2">Chọn bé</label>
            <select
              value={selectedChildId ?? ''}
              onChange={(e) =>
                setSelectedChildId(e.target.value ? Number(e.target.value) : null)
              }
              className="px-4 py-2 border border-border rounded-lg bg-card text-body focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nickname}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-heading block mb-2">
              Khoảng thời gian
            </label>
            <div className="flex gap-2">
              {(['7d', '30d', '90d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg font-medium transition border-2 ${
                    period === p
                      ? 'bg-primary-light border-primary text-primary'
                      : 'bg-card border-border text-body hover:border-primary/40'
                  }`}
                >
                  {p === '7d' ? '7 ngày' : p === '30d' ? '30 ngày' : '90 ngày'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="max-w-7xl mx-auto text-center py-12">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <Body className="mt-4 text-body">Đang tải dữ liệu...</Body>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {analytics.overview && (
            <motion.div
              initial={{ opacity: 1, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6 text-center">
                <div className="text-4xl font-heading font-black text-primary mb-2">
                  {analytics.overview.learningTime.totalSessions}
                </div>
                <Caption className="text-body text-sm font-bold">Buổi học</Caption>
              </div>
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6 text-center">
                <div className="text-4xl font-heading font-black text-secondary mb-2">
                  {analytics.overview.learningTime.totalMinutes}m
                </div>
                <Caption className="text-body text-sm font-bold">Thời gian học</Caption>
              </div>
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6 text-center">
                <div className="text-4xl font-heading font-black text-success mb-2">
                  {analytics.overview.vocabulary.wordsMastered}
                </div>
                <Caption className="text-body text-sm font-bold">Từ nắm vững</Caption>
              </div>
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6 text-center">
                <div className="text-4xl font-heading font-black text-accent mb-2">
                  {analytics.overview.quizPerformance.averageScore}%
                </div>
                <Caption className="text-body text-sm font-bold">Điểm TB Quiz</Caption>
              </div>
            </motion.div>
          )}

          {analytics.learningTime && (
            <motion.div
              initial={{ opacity: 1, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl shadow-md p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-6 h-6 text-secondary" />
                <Heading level={3} className="text-2xl font-bold text-heading">Thời gian học</Heading>
              </div>

              <div className="space-y-4">
                <div className="text-sm text-body">
                  Trung bình: {analytics.learningTime.averageSessionMinutes} phút/phiên
                </div>
                {analytics.learningTime.chartData.slice(-7).map((day) => (
                  <div key={day.date} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-body w-20">
                      {day.label}
                    </span>
                    <div className="flex-1 h-6 bg-secondary-light rounded-full relative overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-secondary to-secondary-dark rounded-full transition-all"
                        style={{ width: `${Math.min((day.value / 60) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-secondary w-12 text-right">
                      {day.value}m
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {analytics.vocabulary && (
            <motion.div
              initial={{ opacity: 1, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl shadow-md p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="w-6 h-6 text-primary" />
                <Heading level={3} className="text-2xl font-bold text-heading">Tiến độ từ vựng</Heading>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {analytics.vocabulary.totalWordsEncountered}
                  </div>
                  <Caption className="text-body font-bold text-sm">Từ đã gặp</Caption>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-warning mb-2">
                    {analytics.vocabulary.wordsReviewed}
                  </div>
                  <Caption className="text-body font-bold text-sm">Đã ôn tập</Caption>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-success mb-2">
                    {analytics.vocabulary.wordsMastered}
                  </div>
                  <Caption className="text-body font-bold text-sm">Nắm vững</Caption>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Body className="text-sm text-body font-medium">Phân bố mức độ:</Body>
                {Object.entries(analytics.vocabulary.wordsByLevel).map(([level, count]) => (
                  <div key={level} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-body w-20">{level}</span>
                    <div className="flex-1 h-6 bg-muted/10 rounded-full overflow-hidden border border-border">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full transition-all"
                        style={{ width: `${Math.min((count / 100) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-heading w-12 text-right">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {analytics.pronunciation && (
            <motion.div
              initial={{ opacity: 1, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-2xl shadow-md p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <Mic className="w-6 h-6 text-accent" />
                <Heading level={3} className="text-2xl font-bold text-heading">Phát âm</Heading>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-accent-light border border-accent/20 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-accent mb-2">
                    {analytics.pronunciation.totalPractices}
                  </div>
                  <Caption className="text-accent-dark font-bold text-sm">Lần luyện tập</Caption>
                </div>
                <div className="bg-accent-light border border-accent/20 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-accent mb-2">
                    {analytics.pronunciation.averageAccuracy}%
                  </div>
                  <Caption className="text-accent-dark font-bold text-sm">Điểm TB</Caption>
                </div>
                <div className="bg-accent-light border border-accent/20 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-accent mb-2">
                    {analytics.pronunciation.highAccuracyCount}
                  </div>
                  <Caption className="text-accent-dark font-bold text-sm">Lần đạt cao</Caption>
                </div>
              </div>
            </motion.div>
          )}

          {analytics.quiz && (
            <motion.div
              initial={{ opacity: 1, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card rounded-2xl shadow-md p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-secondary" />
                <Heading level={3} className="text-2xl font-bold text-heading">Kiểm tra</Heading>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary mb-1">
                    {analytics.quiz.totalQuizzes}
                  </div>
                  <Caption className="text-xs text-body font-bold">Bài kiểm tra</Caption>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success mb-1">
                    {analytics.quiz.quizzesPassed}
                  </div>
                  <Caption className="text-xs text-body font-bold">Đạt chuẩn</Caption>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning mb-1">
                    {analytics.quiz.averageScore}%
                  </div>
                  <Caption className="text-xs text-body font-bold">Điểm TB</Caption>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {analytics.quiz.highestScore}%
                  </div>
                  <Caption className="text-xs text-body font-bold">Điểm cao nhất</Caption>
                </div>
              </div>

              <div className="space-y-3">
                <Body className="text-sm text-body font-medium">Phân tích theo độ khó:</Body>
                {Object.entries(analytics.quiz.scoresByDifficulty).map(([difficulty, score]) => (
                  <div key={difficulty} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-body">{difficulty}</span>
                    <span className="text-sm text-heading">{score}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {analytics.gamification && (
            <motion.div
              initial={{ opacity: 1, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card rounded-2xl shadow-md p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-6 h-6 text-warning" />
                <Heading level={3} className="text-2xl font-bold text-heading">Gamification</Heading>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-warning mb-2">
                    {analytics.gamification.totalPoints}
                  </div>
                  <Caption className="text-body font-bold text-sm">Tổng sao</Caption>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    Level {analytics.gamification.currentLevel}
                  </div>
                  <Caption className="text-body font-bold text-sm">Cấp độ hiện tại</Caption>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent mb-2">
                    {analytics.gamification.badgesEarned}
                  </div>
                  <Caption className="text-body font-bold text-sm">Huy hiệu</Caption>
                </div>
              </div>

              <div className="mt-6">
                <Body className="text-sm text-body font-medium mb-3">Tiến độ huy hiệu:</Body>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-warning to-warning-dark rounded-full transition-all"
                    style={{
                      width: `${
                        analytics.gamification.totalBadges > 0
                          ? Math.round(
                              (analytics.gamification.badgesEarned /
                                analytics.gamification.totalBadges) *
                                100,
                            )
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
                <Caption className="text-xs text-muted mt-1 text-right">
                  {analytics.gamification.badgesEarned}/{analytics.gamification.totalBadges}
                </Caption>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
