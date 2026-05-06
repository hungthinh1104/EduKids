'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, ChevronRight, TrendingUp, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { useChildProfiles } from '@/features/dashboard/hooks/useChildProfiles';
import {
  applyRecommendation,
  type AppliedLearningPath,
  getRecommendations,
  regenerateRecommendations,
  type Recommendation,
} from '@/features/recommendations/api/recommendations.api';
import { switchProfile } from '@/features/profile/api/profile.api';
import { backupParentSession } from '@/shared/utils/parent-session-handoff';


export default function ParentRecommendationsPage() {
  const { profiles, activeProfileId, switchActiveProfile } = useChildProfiles();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [activatingRecommendationId, setActivatingRecommendationId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [emptyMessage, setEmptyMessage] = useState('Chưa có gợi ý nào');

  const activeChild = profiles.find((p) => p.id === activeProfileId) ?? profiles[0] ?? null;

  useEffect(() => {
    if (activeChild?.id) {
      loadRecommendations(activeChild.id);
    }
  }, [activeChild?.id]);

  const loadRecommendations = async (childId: number) => {
    try {
      setIsLoading(true);
      const data = await getRecommendations(childId);
      setRecommendations(data?.recommendations || []);
      setEmptyMessage(
        data?.noRecommendationMessage ||
          'Bé chưa có gợi ý nào. Nhấn "Tạo gợi ý mới" để bắt đầu!',
      );
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      setRecommendations([]);
      setEmptyMessage('Không thể tải gợi ý học tập lúc này.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!activeChild?.id || isRegenerating) return;
    try {
      setIsRegenerating(true);
      const data = await regenerateRecommendations(activeChild.id);
      const recs = data?.recommendations || [];
      setRecommendations(recs);
      setEmptyMessage(data?.noRecommendationMessage || 'Hệ thống chưa tạo được gợi ý phù hợp.');
      if (recs.length > 0) {
        toast.success(`Đã tạo ${recs.length} gợi ý mới cho ${activeChild?.nickname || 'bé'}.`);
      }
    } catch (error) {
      console.error('Failed to regenerate recommendations:', error);
      toast.error('Không thể tạo gợi ý mới lúc này. Vui lòng thử lại sau.');
      setEmptyMessage('Không thể tạo gợi ý mới lúc này. Vui lòng thử lại sau.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const categories = Array.from(
    new Set(recommendations.map((r) => r.type))
  );

  const filteredRecommendations =
    activeCategory === 'all'
      ? recommendations
      : recommendations.filter((r) => r.type === activeCategory);

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'TOPIC':
        return '📚';
      case 'REVIEW':
        return '🔄';
      case 'PRONUNCIATION':
        return '🎤';
      case 'QUIZ':
        return '📝';
      default:
        return '💡';
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'TOPIC':
        return 'from-primary to-primary-dark';
      case 'REVIEW':
        return 'from-secondary to-secondary-dark';
      case 'PRONUNCIATION':
        return 'from-success to-success-dark';
      case 'QUIZ':
        return 'from-warning to-warning-dark';
      default:
        return 'from-accent to-accent-dark';
    }
  };

  const getRecommendationLabel = (type: string) => {
    switch (type) {
      case 'TOPIC':
        return 'Theo Chủ Đề';
      case 'REVIEW':
        return 'Ôn Tập';
      case 'PRONUNCIATION':
        return 'Phát Âm';
      case 'QUIZ':
        return 'Bài Quiz';
      default:
        return 'Gợi Ý';
    }
  };

  const resolveLearningRoute = (
    recommendation: Recommendation,
    appliedPath?: AppliedLearningPath,
  ) => {
    const primaryTopicId =
      appliedPath?.topics.find((topic) => typeof topic.id === 'number' && topic.id > 0)?.id ??
      recommendation.targetTopics.find((topic) => typeof topic.id === 'number' && topic.id > 0)?.id;

    switch (recommendation.type) {
      case 'QUIZ':
      case 'PRONUNCIATION':
      case 'TOPIC':
        return primaryTopicId ? `/play/topic/${primaryTopicId}` : '/play';
      case 'REVIEW':
      default:
        return '/play/review';
    }
  };

  const handleStartRecommendation = async (recommendation: Recommendation) => {
    if (!activeChild?.id || activatingRecommendationId !== null) return;

    setActivatingRecommendationId(recommendation.id);

    try {
      const appliedPath = await applyRecommendation(activeChild.id, recommendation.id);

      const learningRoute = resolveLearningRoute(recommendation, appliedPath);

      // Guard: if we couldn't resolve a real topic, don't navigate
      if (!learningRoute || learningRoute === '/play/review') {
        const firstTopicId = appliedPath.topics.find((t) => t.id > 0)?.id;
        if (!firstTopicId) {
          toast.error('Bài học này chưa sẵn sàng. Vui lòng thử gợi ý khác hoặc tạo gợi ý mới.');
          setRecommendations((prev) => prev.filter((r) => r.id !== recommendation.id));
          return;
        }
      }

      const restoreRoute = '/session/restore-parent?next=/recommendations';
      backupParentSession();
      window.history.replaceState(window.history.state, '', restoreRoute);

      await switchProfile(activeChild.id);
      toast.success(`Đang mở bài học được gợi ý cho ${activeChild.nickname}.`);
      window.location.assign(learningRoute);
    } catch (error) {
      console.error('Failed to start recommendation:', error);
      const msg = error instanceof Error ? error.message : '';
      if (msg.toLowerCase().includes('playable') || msg.toLowerCase().includes('not found')) {
        toast.error('Bài học trong gợi ý này không còn khả dụng. Vui lòng tạo gợi ý mới.');
        setRecommendations((prev) => prev.filter((r) => r.id !== recommendation.id));
      } else {
        toast.error('Không thể mở bài học được gợi ý lúc này. Vui lòng thử lại.');
      }
    } finally {
      setActivatingRecommendationId(null);
    }
  };

  return (
    <div className="pb-28">
      <div className="max-w-6xl mx-auto pt-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-3xl border border-primary/15 bg-gradient-to-r from-primary-light/45 via-card to-accent-light/35 p-6 md:p-7 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-7 h-7 text-primary" />
          <Heading level={2} className="text-heading text-2xl md:text-3xl">Gợi Ý Học Tập</Heading>
        </div>
        <Body className="text-body">AI cá nhân hóa dựa trên tiến bộ học của {activeChild?.nickname || 'bé'}</Body>
      </motion.div>

      {/* Child Selector */}
      <div className="mb-5 bg-card/90 rounded-2xl border border-border/70 shadow-sm p-4">
        <Caption className="text-sm font-bold text-heading mb-3 block">Xem gợi ý cho</Caption>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {profiles.map((child) => (
            <button
              key={child.id}
              onClick={async () => {
                await switchActiveProfile(child.id);
              }}
              className={`px-4 py-2 rounded-full font-bold transition-all whitespace-nowrap border ${
                activeProfileId === child.id
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-background text-body border-border hover:border-primary/50 hover:text-primary'
              }`}
            >
              {child.nickname}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      {profiles.length === 0 ? (
        <div className="text-center py-12 bg-card/90 rounded-2xl border border-border/70 shadow-sm">
          <Lightbulb className="w-12 h-12 text-caption mx-auto mb-3" />
          <Body className="text-caption">Tài khoản hiện tại chưa có hồ sơ bé</Body>
        </div>
      ) : (
      <>
      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full font-bold transition-all whitespace-nowrap border ${
              activeCategory === 'all'
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-card text-body border-border hover:border-primary/50 hover:text-primary'
            }`}
          >
            Tất Cả
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full font-bold transition-all whitespace-nowrap border ${
                activeCategory === category
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-card text-body border-border hover:border-primary/50 hover:text-primary'
              }`}
            >
              {getRecommendationLabel(category)}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {isLoading || isRegenerating ? (
        <div className="text-center py-12 bg-card/90 rounded-2xl border border-border/70 shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <Body className="mt-4 text-body">{isRegenerating ? 'Đang tạo gợi ý mới...' : 'Đang tải gợi ý...'}</Body>
        </div>
      ) : filteredRecommendations.length === 0 ? (
        <div className="text-center py-12 bg-card/90 rounded-2xl border border-border/70 shadow-sm">
          <Lightbulb className="w-12 h-12 text-caption mx-auto mb-3" />
          <Body className="text-caption">{emptyMessage}</Body>
          <button
            type="button"
            onClick={handleRegenerate}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-dark"
          >
            <Sparkles className="h-4 w-4" /> Tạo gợi ý mới
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecommendations.map((rec, idx) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group"
            >
              <div className="bg-card rounded-2xl border border-border/70 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className={`bg-gradient-to-r ${getRecommendationColor(rec.type)} h-1`} />
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icon */}
                      <div className="text-3xl">{getRecommendationIcon(rec.type)}</div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Heading level={4} className="text-heading text-lg">{rec.title}</Heading>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getRecommendationColor(rec.type)}`}>
                            {getRecommendationLabel(rec.type)}
                          </span>
                        </div>

                        <Body className="text-body text-sm mb-3">{rec.description}</Body>

                        {/* Details */}
                        <div className="flex flex-wrap gap-4 text-sm">
                          {rec.difficulty && (
                            <div>
                              <Caption className="text-caption text-xs">Mức Độ</Caption>
                              <Body className="font-bold text-body">{rec.difficulty}</Body>
                            </div>
                          )}
                          {(rec.estimatedMinutes ?? rec.estimatedTime) && (
                            <div>
                              <Caption className="text-caption text-xs">Thời Gian</Caption>
                              <Body className="font-bold text-body">~{rec.estimatedMinutes ?? rec.estimatedTime} phút</Body>
                            </div>
                          )}
                          {rec.masteryPercentage !== undefined && (
                            <div>
                              <Caption className="text-caption text-xs">Độ Thành Thạo</Caption>
                              <Body className="font-bold text-body">{rec.masteryPercentage}%</Body>
                            </div>
                          )}
                        </div>

                        {/* Reason */}
                        {rec.reason && (
                          <div className="mt-4 p-3 bg-primary-light/40 border border-primary/20 rounded-lg">
                            <Caption className="text-xs text-primary-dark">
                              <span className="font-bold">Lý do: </span>
                              {rec.reason}
                            </Caption>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      disabled={activatingRecommendationId === rec.id}
                      onClick={() => void handleStartRecommendation(rec)}
                      title="Áp dụng gợi ý và mở bài học phù hợp cho bé"
                      className="ml-4 inline-flex items-center gap-2 rounded-xl border border-primary bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-wait disabled:opacity-70"
                    >
                      <span>
                        {activatingRecommendationId === rec.id ? 'Đang mở...' : 'Học ngay'}
                      </span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  {rec.masteryPercentage !== undefined && (
                    <div className="h-2 bg-background rounded-full overflow-hidden border border-border/50">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent"
                        style={{ width: `${rec.masteryPercentage}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 bg-gradient-to-r from-primary-light/45 to-accent-light/45 rounded-2xl p-6 border border-primary/20 shadow-sm"
      >
        <div className="flex gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-primary flex-shrink-0" />
          <div>
            <Heading level={4} className="text-heading text-base mb-2">Cách Gợi Ý Được Tạo</Heading>
            <ul className="space-y-1 text-sm text-body">
              <li>• Phân tích tiến bộ học của {activeChild?.nickname || 'bé'}</li>
              <li>• Xác định các chủ đề yếu và các kỹ năng cần cải thiện</li>
              <li>• Gợi ý bài học tiếp theo để tối đa hóa học tập</li>
              <li>• Tối ưu hóa thời gian học dựa trên kỳ vọng thực tế</li>
            </ul>
          </div>
        </div>
      </motion.div>
      </>
      )}
      </div>
    </div>
  );
}
