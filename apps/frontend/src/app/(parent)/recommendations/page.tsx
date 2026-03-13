'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, ChevronRight, TrendingUp, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { useChildProfiles } from '@/features/dashboard/hooks/useChildProfiles';
import { getRecommendations, regenerateRecommendations, type Recommendation } from '@/features/recommendations/api/recommendations.api';


export default function ParentRecommendationsPage() {
  const { profiles, activeProfileId, switchActiveProfile } = useChildProfiles();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
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
      setEmptyMessage(data?.noRecommendationMessage || 'Chưa có gợi ý nào');

      if ((data?.recommendations?.length ?? 0) === 0) {
        try {
          setIsRegenerating(true);
          const regenerated = await regenerateRecommendations(childId);
          setRecommendations(regenerated?.recommendations || []);
          setEmptyMessage(regenerated?.noRecommendationMessage || 'Hệ thống chưa tạo được gợi ý phù hợp.');
        } catch (regenerateError) {
          console.error('Failed to regenerate recommendations:', regenerateError);
        } finally {
          setIsRegenerating(false);
        }
      }
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
      setRecommendations(data?.recommendations || []);
      setEmptyMessage(data?.noRecommendationMessage || 'Hệ thống chưa tạo được gợi ý phù hợp.');
    } catch (error) {
      console.error('Failed to regenerate recommendations:', error);
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
    switch (type?.toLowerCase()) {
      case 'topic':
        return '📚';
      case 'review':
        return '🔄';
      case 'pronunciation':
        return '🎤';
      case 'quiz':
        return '📝';
      default:
        return '💡';
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'topic':
        return 'from-blue-500 to-cyan-500';
      case 'review':
        return 'from-purple-500 to-pink-500';
      case 'pronunciation':
        return 'from-green-500 to-emerald-500';
      case 'quiz':
        return 'from-orange-500 to-red-500';
      default:
        return 'from-indigo-500 to-blue-500';
    }
  };

  const getRecommendationLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'topic':
        return 'Theo Chủ Đề';
      case 'review':
        return 'Ôn Tập';
      case 'pronunciation':
        return 'Phát Âm';
      case 'quiz':
        return 'Bài Quiz';
      default:
        return 'Gợi Ý';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-light/25 via-background to-background pb-28">
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6">
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
                              <p className="font-bold text-body">{rec.difficulty}</p>
                            </div>
                          )}
                          {(rec.estimatedMinutes ?? rec.estimatedTime) && (
                            <div>
                              <Caption className="text-caption text-xs">Thời Gian</Caption>
                              <p className="font-bold text-body">~{rec.estimatedMinutes ?? rec.estimatedTime} phút</p>
                            </div>
                          )}
                          {rec.masteryPercentage !== undefined && (
                            <div>
                              <Caption className="text-caption text-xs">Độ Thành Thạo</Caption>
                              <p className="font-bold text-body">{rec.masteryPercentage}%</p>
                            </div>
                          )}
                        </div>

                        {/* Reason */}
                        {rec.reason && (
                          <div className="mt-4 p-3 bg-primary-light/40 border border-primary/20 rounded-lg">
                            <p className="text-xs text-primary-dark">
                              <span className="font-bold">Lý do: </span>
                              {rec.reason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      disabled
                      title="Tính năng chi tiết sẽ mở ở bản tiếp theo"
                      className="ml-4 p-3 rounded-lg bg-background border border-border text-caption cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  {rec.masteryPercentage !== undefined && (
                    <div className="h-2 bg-background rounded-full overflow-hidden border border-border/50">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
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
