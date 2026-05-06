'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Medal, Sparkles, Star, Trophy } from 'lucide-react';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { LoadingScreen } from '@/components/edukids/LoadingScreen';
import { GameHUD } from '@/features/learning/components/GameHUD';
import { BottomNav } from '@/features/learning/components/BottomNav';
import { useCurrentChild } from '@/features/learning/hooks/useCurrentChild';
import { gamificationApi, type LeaderboardEntry } from '@/features/learning/api/gamification.api';

const PODIUM_STYLES = [
  {
    wrapper: 'from-warning-light/40 via-warning-light/20 to-warning-light/10 border-warning/40',
    badge: 'bg-warning text-white',
    text: 'text-warning',
    icon: '👑',
    label: 'Hạng 1',
  },
  {
    wrapper: 'from-muted/20 via-muted/10 to-card border-border',
    badge: 'bg-muted text-white',
    text: 'text-heading',
    icon: '🥈',
    label: 'Hạng 2',
  },
  {
    wrapper: 'from-accent-light/40 via-accent-light/20 to-card border-accent/50',
    badge: 'bg-accent text-white',
    text: 'text-accent',
    icon: '🥉',
    label: 'Hạng 3',
  },
] as const;

function LeaderboardSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-24 animate-pulse rounded-[1.75rem] border border-border/70 bg-card/80"
        />
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  const { child, loading: childLoading } = useCurrentChild();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await gamificationApi.getLeaderboard(50);
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setLoadError('Không thể tải bảng xếp hạng lúc này.');
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  if (childLoading || !child) {
    return <LoadingScreen text="Đang tải bảng xếp hạng..." />;
  }

  const currentUser = leaderboard.find((entry) => entry.isCurrentUser) ?? null;
  const podium = leaderboard.slice(0, 3);
  const restOfBoard = leaderboard.slice(3);
  const leaderPoints = leaderboard[0]?.totalPoints ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-warning-light/35 via-background to-background pb-24 md:pb-8">
      <div className="hidden md:block">
        <GameHUD
          nickname={child.nickname}
          avatar={child.avatar}
          rewards={child.rewards}
          activeNav="leaderboard"
        />
      </div>

      <div className="sticky top-0 z-30 bg-card/90 backdrop-blur-xl border-b-2 border-border md:hidden">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/play">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-9 h-9 rounded-full bg-background border-2 border-border flex items-center justify-center">
              <ArrowLeft size={16} className="text-body" />
            </motion.div>
          </Link>
          <Medal size={20} className="text-warning" />
          <Heading level={3} className="text-heading text-xl">Bảng Xếp Hạng</Heading>
        </div>
      </div>

      <div className="max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto px-4 md:px-6 pt-5 space-y-5">
        <motion.div
          initial={{ opacity: 1, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-warning/30 bg-gradient-to-r from-warning to-warning-dark p-5 text-white shadow-lg shadow-warning/20"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-card/20 px-3 py-1 text-xs font-heading font-black">
                <Sparkles size={14} />
                Top học viên tuần này
              </div>
              <Heading level={2} color="textInverse" className="mt-3 text-2xl md:text-3xl">
                Đua top, săn sao và mở huy hiệu
              </Heading>
              <Body color="textInverse" className="mt-2 text-sm md:text-base text-white/85">
                Bảng xếp hạng hiển thị top học viên toàn hệ thống theo tổng điểm tích lũy.
              </Body>
            </div>

            {currentUser && (
              <div className="min-w-[112px] rounded-[1.5rem] bg-card/20 px-4 py-3 text-center backdrop-blur-sm">
                <Caption color="textInverse" className="text-xs text-white/75">Thứ hạng của bé</Caption>
                <div className="mt-1 text-3xl font-heading font-black">#{currentUser.rank}</div>
                <Caption color="textInverse" className="text-xs text-white/85">{currentUser.totalPoints.toLocaleString()} điểm</Caption>
              </div>
            )}
          </div>
        </motion.div>

        {loadError ? (
          <div className="rounded-[2rem] border-2 border-error/20 bg-card p-8 text-center">
            <div className="text-5xl mb-3">😵</div>
            <Heading level={4} className="text-heading text-lg mb-2">Chưa tải được bảng xếp hạng</Heading>
            <Body className="text-caption">{loadError}</Body>
          </div>
        ) : isLoading ? (
          <LeaderboardSkeleton />
        ) : (
          <>
            {currentUser && (
              <motion.div
                initial={{ opacity: 1, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[2rem] border border-primary/30 bg-card/95 p-5 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-2xl font-heading font-black text-white shadow-lg">
                    {(currentUser.childName || child.nickname).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Heading level={4} className="text-heading text-lg">
                        {currentUser.childName || child.nickname}
                      </Heading>
                      <span className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-heading font-black text-primary">
                        Bạn
                      </span>
                    </div>
                    <Caption className="text-caption text-sm">
                      Level {currentUser.currentLevel} • {currentUser.badgesEarned || 0} huy hiệu
                    </Caption>
                    <div className="mt-3 h-2.5 rounded-full bg-background border border-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                        style={{
                          width: `${leaderPoints > 0 ? Math.min((currentUser.totalPoints / leaderPoints) * 100, 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-heading font-black text-primary">#{currentUser.rank}</div>
                    <Caption className="text-caption">{currentUser.totalPoints.toLocaleString()} điểm</Caption>
                  </div>
                </div>
              </motion.div>
            )}

            {podium.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Crown size={18} className="text-warning" />
                  <Heading level={4} className="text-heading text-lg">Top dẫn đầu</Heading>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {podium.map((entry, index) => {
                    const style = PODIUM_STYLES[index] ?? PODIUM_STYLES[2];
                    return (
                      <motion.div
                        key={entry.childId}
                        initial={{ opacity: 1, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className={`rounded-[2rem] border bg-gradient-to-b p-5 shadow-sm ${style.wrapper} ${entry.isCurrentUser ? 'ring-2 ring-primary/40' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-heading font-black ${style.badge}`}>
                              {style.label}
                            </div>
                            <Heading level={4} className="mt-3 text-heading text-lg">
                              {entry.childName || 'User'}
                            </Heading>
                            <Caption className="text-caption text-sm">
                              Level {entry.currentLevel}
                            </Caption>
                          </div>
                          <div className="text-4xl">{style.icon}</div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <div className="rounded-2xl bg-card/70 px-3 py-3 text-center">
                            <div className={`text-xl font-heading font-black ${style.text}`}>
                              {entry.totalPoints.toLocaleString()}
                            </div>
                            <Caption className="text-[11px] text-caption">Điểm</Caption>
                          </div>
                          <div className="rounded-2xl bg-card/70 px-3 py-3 text-center">
                            <div className={`text-xl font-heading font-black ${style.text}`}>
                              {entry.badgesEarned || 0}
                            </div>
                            <Caption className="text-[11px] text-caption">Huy hiệu</Caption>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-primary" />
                <Heading level={4} className="text-heading text-lg">Bảng xếp hạng chi tiết</Heading>
              </div>

              <div className="space-y-3">
                {leaderboard.length === 0 ? (
                  <div className="rounded-[2rem] border border-dashed border-border bg-card/90 p-8 text-center">
                    <Body className="text-caption">Chưa có dữ liệu bảng xếp hạng.</Body>
                  </div>
                ) : (
                  (restOfBoard.length > 0 ? restOfBoard : leaderboard).map((entry, index) => (
                    <motion.div
                      key={entry.childId}
                      initial={{ opacity: 1, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`rounded-[1.75rem] border p-4 shadow-sm ${
                        entry.isCurrentUser
                          ? 'border-primary/40 bg-primary-light/40 ring-2 ring-primary/20'
                          : 'border-border/70 bg-card/95'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background border-2 border-border font-heading font-black text-heading">
                          #{entry.rank}
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent-light to-accent text-lg font-heading font-black text-white">
                          {(entry.childName || 'U').charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Heading level={4} className="truncate text-heading text-base">
                              {entry.childName || 'User'}
                            </Heading>
                            {entry.isCurrentUser && (
                              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-heading font-black text-white">
                                Bạn
                              </span>
                            )}
                          </div>
                          <Caption className="text-caption text-xs">
                            Level {entry.currentLevel} • {entry.badgesEarned || 0} huy hiệu
                          </Caption>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1 text-warning">
                            <Star size={14} className="fill-warning" />
                            <span className="font-heading font-black text-heading">
                              {entry.totalPoints.toLocaleString()}
                            </span>
                          </div>
                          <Caption className="text-[11px] text-caption">Tổng điểm</Caption>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </section>

            <div className="rounded-[2rem] border border-border/70 bg-card/95 p-5 shadow-sm">
              <Heading level={4} className="text-heading text-lg mb-3">Bảng này tính như thế nào?</Heading>
              <div className="space-y-2 text-sm text-body">
                <div>⭐ Điểm tăng lên khi hoàn thành bài học, quiz và phát âm.</div>
                <div>🏅 Huy hiệu cho biết bé đã mở được bao nhiêu cột mốc.</div>
                <div>📈 Level tăng theo tổng điểm tích lũy trong hành trình học.</div>
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav active="leaderboard" />
    </div>
  );
}
