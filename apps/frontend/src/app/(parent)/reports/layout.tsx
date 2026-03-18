import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Báo cáo học tập',
  description:
    'Xem báo cáo chi tiết tiến độ học tập của bé, bao gồm từ vựng đã học, điểm phát âm, huy hiệu và thống kê học tập hàng ngày.',
  keywords: [
    'báo cáo học tập',
    'thống kê học tập',
    'tiến độ học',
    'điểm phát âm',
    'từ vựng',
  ],
  openGraph: {
    title: 'Báo cáo học tập | EduKids',
    description:
      'Xem báo cáo chi tiết tiến độ học tập của bé với thống kê và huy hiệu.',
    type: 'website',
  },
};

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <div id="main">{children}</div>;
}
