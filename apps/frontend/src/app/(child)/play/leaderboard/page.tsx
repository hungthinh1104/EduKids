'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trophy, Zap, Award, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { getLeaderboard, type LeaderboardEntry } from '@/features/gamification/api/gamification.api';

type LeaderboardType = 'global' | 'friends' | 'age_group';

export default function LeaderboardPage() {
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('global');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getLeaderboard(leaderboardType);
      setLeaderboard(data);

      // Find current user in leaderboard (use first entry as fallback)
      const currentUser = data[0] || null;
      setUserRank(currentUser);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [leaderboardType]);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-yellow-100 to-yellow-50 border-yellow-200';
      case 2:
        return 'bg-gradient-to-br from-gray-100 to-gray-50 border-gray-200';
      case 3:
        return 'bg-gradient-to-br from-orange-100 to-orange-50 border-orange-200';
      default:
        return 'bg-white';
    }
  };

  const getTextColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-700';
      case 2:
        return 'text-gray-700';
      case 3:
        return 'text-orange-700';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6 pb-32">
      {/* Header */}
      <motion.div
        initial={{ opacity: 1, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-800">Bảng Xếp Hạng</h1>
          <Trophy className="w-8 h-8 text-yellow-500" />
        </div>
        <p className="text-gray-600">Xem thứ hạng của bạn giữa những học sinh khác</p>
      </motion.div>

      {/* Your Rank Card */}
      {userRank && (
        <motion.div
          initial={{ opacity: 1, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Thứ Hạng Của Bạn</p>
              <p className="text-4xl font-bold mt-2">#{userRank.rank}</p>
            </div>
            <div className="text-right">
              <div className="text-5xl mb-2">⭐</div>
              <p className="text-2xl font-bold">{userRank.totalPoints.toLocaleString()}</p>
              <p className="text-blue-100 text-sm">Điểm</p>
            </div>
          </div>
          <div className="mt-4 bg-white/20 rounded-lg p-3">
            <div className="flex justify-between text-sm mb-2">
              <span>Các Huy Hiệu: {userRank.badgesEarned || 0}</span>
              <span>Streak: {userRank.currentStreak || 0} ngày 🔥</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard Type Filter */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {[
          { type: 'global' as LeaderboardType, label: '🌍 Toàn Cục' },
          { type: 'friends' as LeaderboardType, label: '👥 Bạn Bè' },
          { type: 'age_group' as LeaderboardType, label: '👧 Cùng Tuổi' },
        ].map(item => (
          <button
            key={item.type}
            onClick={() => setLeaderboardType(item.type)}
            className={`px-4 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
              leaderboardType === item.type
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải bảng xếp hạng...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <p className="text-gray-500">Chưa có dữ liệu bảng xếp hạng</p>
          </div>
        ) : (
          leaderboard.slice(0, 50).map((entry, index) => (
            <motion.div
              key={entry.childId}
              initial={{ opacity: 1, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`${getMedalColor(entry.rank)} border-2 rounded-2xl p-4 transition-all hover:shadow-lg`}
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${getTextColor(entry.rank)} ${
                  entry.rank <= 3
                    ? 'bg-yellow-200/50'
                    : 'bg-gray-200/50'
                }`}>
                  {getRankMedal(entry.rank) || `#${entry.rank}`}
                </div>

                {/* Avatar & Name */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                      {(entry.childName || entry.nickname || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{entry.childName || entry.nickname || 'User'}</p>
                      <p className="text-xs text-gray-500">{entry.levelName || `Level ${entry.level}`}</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end mb-1">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="font-bold text-gray-800">{entry.totalPoints.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-500">Điểm</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-1 justify-end mb-1">
                      <Award className="w-4 h-4 text-purple-500" />
                      <span className="font-bold text-gray-800">{entry.badgesEarned || 0}</span>
                    </div>
                    <p className="text-xs text-gray-500">Huy Hiệu</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-1 justify-end mb-1">
                      <span className="text-xl">🔥</span>
                      <span className="font-bold text-gray-800">{entry.currentStreak || 0}</span>
                    </div>
                    <p className="text-xs text-gray-500">Streak</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 h-2 bg-gray-300/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  style={{ width: `${Math.min((entry.totalPoints / (leaderboard[0]?.totalPoints || 1000)) * 100, 100)}%` }}
                />
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 1, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 bg-white rounded-2xl shadow-md p-6 border border-gray-200"
      >
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-600" />
          Cách Được Xếp Hạng
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>⭐ <span className="font-bold">Điểm</span> - Hoàn thành các bài học và bài kiểm tra</li>
          <li>🏆 <span className="font-bold">Huy Hiệu</span> - Đạt được các thành tích đặc biệt</li>
          <li>🔥 <span className="font-bold">Streak</span> - Số ngày liên tiếp học bằng ứng dụng</li>
          <li>📈 <span className="font-bold">Mức Độ</span> - Tiến bộ học tập của bạn</li>
        </ul>
      </motion.div>
    </div>
  );
}
