import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FloatingNavbar } from '@/shared/components/layout/FloatingNavbar';
import { KidButton } from '@/components/edukids/KidButton';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { JourneySection } from '@/components/landing/JourneySection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { CtaSection } from '@/components/landing/CtaSection';
import { Footer } from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <main id="main" className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
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
