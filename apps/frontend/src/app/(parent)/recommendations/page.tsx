'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, ChevronRight, TrendingUp, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useChildProfiles } from '@/features/dashboard/hooks/useChildProfiles';
import { getRecommendations, type Recommendation } from '@/features/recommendations/api/recommendations.api';


export default function ParentRecommendationsPage() {
  const { profiles, activeProfileId, switchActiveProfile } = useChildProfiles();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

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
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      setRecommendations([]);
    } finally {
      setIsLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 pb-32">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-800">Gợi Ý Học Tập</h1>
        </div>
        <p className="text-gray-600">AI cá nhân hóa dựa trên tiến bộ học của {activeChild?.nickname || 'bé'}</p>
      </motion.div>

      {/* Child Selector */}
      <div className="mb-6 bg-white rounded-2xl shadow-md p-4">
        <p className="text-sm font-bold text-gray-700 mb-3">Xem gợi ý cho</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {profiles.map((child) => (
            <button
              key={child.id}
              onClick={async () => {
                await switchActiveProfile(child.id);
              }}
              className={`px-4 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
                activeProfileId === child.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {child.nickname}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      {profiles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-md">
          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Tài khoản hiện tại chưa có hồ sơ bé</p>
        </div>
      ) : (
      <>
      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Tất Cả
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
                activeCategory === category
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {getRecommendationLabel(category)}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải gợi ý...</p>
        </div>
      ) : filteredRecommendations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-md">
          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Chưa có gợi ý nào</p>
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
              <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden">
                <div className={`bg-gradient-to-r ${getRecommendationColor(rec.type)} h-1`} />
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icon */}
                      <div className="text-3xl">{getRecommendationIcon(rec.type)}</div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-800">{rec.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getRecommendationColor(rec.type)}`}>
                            {getRecommendationLabel(rec.type)}
                          </span>
                        </div>

                        <p className="text-gray-600 text-sm mb-3">{rec.description}</p>

                        {/* Details */}
                        <div className="flex flex-wrap gap-4 text-sm">
                          {rec.difficulty && (
                            <div>
                              <p className="text-gray-500 text-xs">Mức Độ</p>
                              <p className="font-bold text-gray-700">{rec.difficulty}</p>
                            </div>
                          )}
                          {(rec.estimatedMinutes ?? rec.estimatedTime) && (
                            <div>
                              <p className="text-gray-500 text-xs">Thời Gian</p>
                              <p className="font-bold text-gray-700">~{rec.estimatedMinutes ?? rec.estimatedTime} phút</p>
                            </div>
                          )}
                          {rec.masteryPercentage !== undefined && (
                            <div>
                              <p className="text-gray-500 text-xs">Độ Thành Thạo</p>
                              <p className="font-bold text-gray-700">{rec.masteryPercentage}%</p>
                            </div>
                          )}
                        </div>

                        {/* Reason */}
                        {rec.reason && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-700">
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
                      className="ml-4 p-3 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  {rec.masteryPercentage !== undefined && (
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
        className="mt-8 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 border-2 border-purple-200"
      >
        <div className="flex gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-purple-600 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-gray-800 mb-2">Cách Gợi Ý Được Tạo</h3>
            <ul className="space-y-1 text-sm text-gray-700">
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
  );
}
