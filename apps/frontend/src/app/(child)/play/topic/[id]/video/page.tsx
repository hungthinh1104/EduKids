'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { PlayCircle } from 'lucide-react';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { contentApi, Topic } from '@/features/learning/api/content.api';
import { apiClient } from '@/shared/services/api.client';
import { LearningModeShell, ModeStatePanel } from '@/features/learning/components/LearningModeShell';
import { GameCompleteScreen } from '@/features/learning/components/GameCompleteScreen';
import { markTopicModeCompleted } from '@/features/learning/utils/topic-mode-progress';

export default function TopicVideoPage() {
  const params = useParams<{ id: string }>();
  const topicId = Number.parseInt(params?.id ?? '', 10);
  const topicIdStr = params?.id ?? '';

  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Track real watch time
  const watchStartRef = useRef<number | null>(null);
  const totalWatchedSecRef = useRef(0);
  const hasLoggedRef = useRef(false);

  useEffect(() => {
    async function loadTopic() {
      try {
        if (!Number.isInteger(topicId) || topicId <= 0) {
          setTopic(null);
          return;
        }
        const detail = await contentApi.getTopicById(topicId);
        setTopic(detail);
      } catch (error) {
        setTopic(null);
      } finally {
        setLoading(false);
      }
    }
    void loadTopic();
  }, [topicId]);

  const logActivity = useCallback(async (durationSec: number) => {
    if (hasLoggedRef.current || !Number.isInteger(topicId) || topicId <= 0) return;
    hasLoggedRef.current = true;
    try {
      await apiClient.post('/learning/video-activity', { topicId, durationSec });
    } catch {
      // non-critical — don't block the completion screen
    }
  }, [topicId]);

  const handleEnded = useCallback(async () => {
    if (watchStartRef.current !== null) {
      totalWatchedSecRef.current += Math.round((Date.now() - watchStartRef.current) / 1000);
      watchStartRef.current = null;
    }
    await logActivity(totalWatchedSecRef.current);
    markTopicModeCompleted(topicId, 'video');
    setDone(true);
  }, [topicId, logActivity]);

  const handlePlay = useCallback(() => {
    watchStartRef.current = Date.now();
  }, []);

  const handlePause = useCallback(() => {
    if (watchStartRef.current !== null) {
      totalWatchedSecRef.current += Math.round((Date.now() - watchStartRef.current) / 1000);
      watchStartRef.current = null;
    }
  }, []);

  const handleVideoError = useCallback(() => {
    setVideoError('Không thể phát video. Vui lòng thử lại sau hoặc kiểm tra kết nối mạng.');
  }, []);

  if (done) {
    return (
      <LearningModeShell
        backHref={`/play/topic/${topicIdStr}`}
        progressCurrent={1}
        progressTotal={1}
        title="Video Bài Giảng"
        subtitle="Xem lại phần minh họa sinh động cho chủ đề này"
        progressFromClass="from-warning"
        progressToClass="to-primary"
        contentMaxWidthClass="max-w-3xl"
        headerRight={<PlayCircle className="text-warning" size={22} />}
      >
        <GameCompleteScreen
          emoji="🎬"
          title="Xem xong rồi!"
          subtitle={`Bé đã xem video${totalWatchedSecRef.current > 0 ? ` (${totalWatchedSecRef.current}s)` : ''}`}
          starsEarned={3}
          topicId={topicIdStr}
          onRestart={() => {
            hasLoggedRef.current = false;
            totalWatchedSecRef.current = 0;
            watchStartRef.current = null;
            setDone(false);
          }}
          restartLabel="Xem lại"
          stats={[]}
        />
      </LearningModeShell>
    );
  }

  return (
    <LearningModeShell
      backHref={`/play/topic/${topicIdStr}`}
      progressCurrent={1}
      progressTotal={1}
      title="Video Bài Giảng"
      subtitle="Xem lại phần minh họa sinh động cho chủ đề này"
      progressFromClass="from-warning"
      progressToClass="to-primary"
      contentMaxWidthClass="max-w-3xl"
      headerRight={<PlayCircle className="text-warning" size={22} />}
    >
      {loading ? (
        <ModeStatePanel
          title="Đang chuẩn bị video"
          description="Tải bài giảng cho bé..."
          emoji="🎬"
        />
      ) : topic?.videoUrl ? (
        <div className="space-y-5">
          <div className="rounded-[2rem] border border-border/70 bg-card/90 p-5 shadow-sm">
            <Heading level={2} className="font-heading text-xl font-black text-heading">{topic.name}</Heading>
            {topic.description && (
              <Body className="mt-2 text-sm text-body">{topic.description}</Body>
            )}
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-lg">
            {videoError ? (
              <div className="aspect-video w-full bg-black flex flex-col items-center justify-center gap-3 p-6">
                <span className="text-5xl">📼</span>
                <Caption className="text-white/70 text-center">{videoError}</Caption>
              </div>
            ) : (
              <video
                key={topic.videoUrl}
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full bg-black"
                src={topic.videoUrl}
                onPlay={handlePlay}
                onPause={handlePause}
                onEnded={handleEnded}
                onError={handleVideoError}
              >
                Trình duyệt hiện tại chưa hỗ trợ phát video.
              </video>
            )}
          </div>
        </div>
      ) : (
        <ModeStatePanel
          title="Chưa có video bài giảng"
          description="Chủ đề này hiện chưa có video để xem."
          emoji="📼"
        />
      )}
    </LearningModeShell>
  );
}
