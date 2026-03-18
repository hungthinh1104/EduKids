import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bảng điều khiển',
  description:
    'Xem tổng quan tiến độ học tập của bé với các thống kê, biểu đồ, và huy hiệu gần đây.',
  keywords: [
    'bảng điều khiển',
    'tổng quan',
    'thống kê',
    'tiến độ học',
    'hồ sơ bé',
  ],
  openGraph: {
    title: 'Bảng điều khiển | EduKids',
    description: 'Xem tổng quan tiến độ học tập của bé một cách trực quan.',
    type: 'website',
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div id="main">{children}</div>;
}
