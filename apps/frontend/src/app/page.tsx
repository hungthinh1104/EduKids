import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FloatingNavbar } from '@/shared/components/layout/FloatingNavbar';
import { KidButton } from '@/components/edukids/KidButton';
import { HeroSection } from '@/components/landing/HeroSection';

// Lazy load below-the-fold components for better initial performance
const FeaturesSection = dynamic(() => import('@/components/landing/FeaturesSection').then(mod => mod.FeaturesSection), { ssr: true });
const JourneySection = dynamic(() => import('@/components/landing/JourneySection').then(mod => mod.JourneySection), { ssr: true });
const TestimonialsSection = dynamic(() => import('@/components/landing/TestimonialsSection').then(mod => mod.TestimonialsSection), { ssr: true });
const CtaSection = dynamic(() => import('@/components/landing/CtaSection').then(mod => mod.CtaSection), { ssr: true });
const Footer = dynamic(() => import('@/components/landing/Footer').then(mod => mod.Footer), { ssr: true });

// Page-specific SEO Metadata
export const metadata: Metadata = {
  title: 'EduKids - Nền tảng học tiếng Anh vui nhộn cho trẻ em',
  description: 'Giúp bé học tiếng Anh với các trò chơi tương tác, phát âm chuẩn AI và giao diện đầy màu sắc. Học mà chơi, chơi mà học!',
  openGraph: {
    title: 'EduKids - Học tiếng Anh hiệu quả và vui nhộn',
    description: 'Giúp bé học tiếng Anh với các trò chơi tương tác, phát âm chuẩn AI và giao diện đầy màu sắc. Học mà chơi, chơi mà học!',
    url: 'https://edukids.app',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'EduKids Landing Page' }],
  },
};

export default function HomePage() {
  return (
    <main id="main" className="min-h-screen bg-background text-body overflow-hidden font-sans">
      <FloatingNavbar
        links={[
          { href: '#features', label: 'Khám Phá' },
          { href: '#how-it-works', label: 'Phương Pháp' },
          { href: '#parents', label: 'Phụ Huynh' }
        ]}
        showThemeToggle={true}
        rightActions={
          <>
            <Link href="/login" className="hidden sm:block">
              <KidButton variant="ghost" className="text-[17px] font-bold px-5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">Đăng nhập</KidButton>
            </Link>
            <Link href="/register">
              <KidButton variant="default" className="text-[17px] px-7 py-5 group shadow-primary/30 shadow-lg hover:shadow-primary/50 hover:-translate-y-1 transition-all">
                Học ngay <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform inline" />
              </KidButton>
            </Link>
          </>
        }
      />

      <HeroSection />
      <FeaturesSection />
      <JourneySection />
      <TestimonialsSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
