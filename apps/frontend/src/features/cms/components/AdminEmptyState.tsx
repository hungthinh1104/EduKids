import { Heading, Body } from '@/shared/components/Typography';

interface AdminEmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
}

export function AdminEmptyState({ 
  icon = '📭', 
  title = 'Không có dữ liệu', 
  description = 'Chưa có mục nào được tìm thấy hoặc tạo mới trong hệ thống.' 
}: AdminEmptyStateProps) {
  return (
    <div className="m-1 rounded-3xl border border-dashed border-border/80 bg-card/90 py-20 text-center shadow-sm">
      <div className="text-6xl mb-6 opacity-80 hover:scale-110 transition-transform cursor-default">{icon}</div>
      <Heading level={3} className="mb-2 text-heading text-xl">{title}</Heading>
      <Body className="mx-auto max-w-sm leading-relaxed text-caption">{description}</Body>
    </div>
  );
}
