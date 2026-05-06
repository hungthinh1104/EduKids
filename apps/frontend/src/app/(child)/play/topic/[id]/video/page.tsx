'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PlayCircle } from 'lucide-react';
import { Heading, Body } from '@/shared/components/Typography';
import { contentApi, Topic } from '@/features/learning/api/content.api';
import { LearningModeShell, ModeStatePanel } from '@/features/learning/components/LearningModeShell';

export default function TopicVideoPage() {
  const params = useParams<{ id: string }>();
  const topicId = Number.parseInt(params?.id ?? '', 10);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);

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
        console.error('Failed to load topic video:', error);
        setTopic(null);
      } finally {
        setLoading(false);
      }
    }

    void loadTopic();
  }, [topicId]);

  return (
    <LearningModeShell
      backHref={`/play/topic/${params?.id ?? ''}`}
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
            <video
              key={topic.videoUrl}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full bg-black"
              src={topic.videoUrl}
            >
              Trình duyệt hiện tại chưa hỗ trợ phát video.
            </video>
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
