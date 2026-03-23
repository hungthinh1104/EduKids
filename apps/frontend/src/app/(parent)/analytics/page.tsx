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
import { Heading, Body } from '@/shared/components/Typography';

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-8 pb-8">
      <div className="max-w-7xl mx-auto mb-8">
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
              className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    period === p
                      ? 'bg-purple-600 text-white'
                      : 'bg-muted/10 text-body hover:bg-gray-200'
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-body">Đang tải dữ liệu...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-8">
          {analytics.overview && (
            <motion.div
              initial={{ opacity: 1, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <div className="bg-card rounded-2xl shadow-md p-6 text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {analytics.overview.learningTime.totalSessions}
                </div>
                <p className="text-body text-sm">Buổi học</p>
              </div>
              <div className="bg-card rounded-2xl shadow-md p-6 text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {analytics.overview.learningTime.totalMinutes}m
                </div>
                <p className="text-body text-sm">Thời gian học</p>
              </div>
              <div className="bg-card rounded-2xl shadow-md p-6 text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {analytics.overview.vocabulary.wordsMastered}
                </div>
                <p className="text-body text-sm">Từ nắm vững</p>
              </div>
              <div className="bg-card rounded-2xl shadow-md p-6 text-center">
                <div className="text-4xl font-bold text-pink-600 mb-2">
                  {analytics.overview.quizPerformance.averageScore}%
                </div>
                <p className="text-body text-sm">Điểm TB Quiz</p>
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
                <Clock className="w-6 h-6 text-blue-600" />
                <h3 className="text-2xl font-bold text-heading">Thời gian học</h3>
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
                    <div className="flex-1 h-6 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full relative overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                        style={{ width: `${Math.min((day.value / 60) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-blue-600 w-12 text-right">
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
                <BookOpen className="w-6 h-6 text-green-600" />
                <h3 className="text-2xl font-bold text-heading">Tiến độ từ vựng</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {analytics.vocabulary.totalWordsEncountered}
                  </div>
                  <p className="text-body">Từ đã gặp</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {analytics.vocabulary.wordsReviewed}
                  </div>
                  <p className="text-body">Đã ôn tập</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {analytics.vocabulary.wordsMastered}
                  </div>
                  <p className="text-body">Nắm vững</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <p className="text-sm text-body font-medium">Phân bố mức độ:</p>
                {Object.entries(analytics.vocabulary.wordsByLevel).map(([level, count]) => (
                  <div key={level} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-body w-20">{level}</span>
                    <div className="flex-1 h-6 bg-muted/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all"
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
                <Mic className="w-6 h-6 text-pink-600" />
                <h3 className="text-2xl font-bold text-heading">Phát âm</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-pink-50 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-pink-600 mb-2">
                    {analytics.pronunciation.totalPractices}
                  </div>
                  <p className="text-body">Lần luyện tập</p>
                </div>
                <div className="bg-pink-50 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-pink-600 mb-2">
                    {analytics.pronunciation.averageAccuracy}%
                  </div>
                  <p className="text-body">Điểm TB</p>
                </div>
                <div className="bg-pink-50 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-pink-600 mb-2">
                    {analytics.pronunciation.highAccuracyCount}
                  </div>
                  <p className="text-body">Lần đạt cao</p>
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
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h3 className="text-2xl font-bold text-heading">Kiểm tra</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {analytics.quiz.totalQuizzes}
                  </div>
                  <p className="text-xs text-body">Bài kiểm tra</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {analytics.quiz.quizzesPassed}
                  </div>
                  <p className="text-xs text-body">Đạt chuẩn</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    {analytics.quiz.averageScore}%
                  </div>
                  <p className="text-xs text-body">Điểm TB</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {analytics.quiz.highestScore}%
                  </div>
                  <p className="text-xs text-body">Điểm cao nhất</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-body font-medium">Phân tích theo độ khó:</p>
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
                <Trophy className="w-6 h-6 text-yellow-600" />
                <h3 className="text-2xl font-bold text-heading">Gamification</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {analytics.gamification.totalPoints}
                  </div>
                  <p className="text-body">Tổng sao</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    Level {analytics.gamification.currentLevel}
                  </div>
                  <p className="text-body">Cấp độ hiện tại</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {analytics.gamification.badgesEarned}
                  </div>
                  <p className="text-body">Huy hiệu</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm text-body font-medium mb-3">Tiến độ huy hiệu:</p>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
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
                <p className="text-xs text-muted mt-1 text-right">
                  {analytics.gamification.badgesEarned}/{analytics.gamification.totalBadges}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
