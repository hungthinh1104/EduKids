import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cài đặt',
  description:
    'Quản lý tài khoản, thông báo, gói cước, và cài đặt bảo mật của bạn trên EduKids.',
  keywords: [
    'cài đặt',
    'tài khoản',
    'thông báo',
    'gói cước',
    'bảo mật',
    'tùy chỉnh',
  ],
  openGraph: {
    title: 'Cài đặt | EduKids',
    description: 'Quản lý cài đặt tài khoản và các tùy chọn cá nhân hóa.',
    type: 'website',
  },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <div id="main">{children}</div>;
}
