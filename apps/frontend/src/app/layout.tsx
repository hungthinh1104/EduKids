import type { Metadata, Viewport } from 'next';
import { Baloo_2, Lexend } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

const IS_VERCEL = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;

// ==========================================
// FONT LOADING CONFIGURATION
// ==========================================
// Using next/font/google for optimal performance
// - font-display: 'swap' prevents FOIT (Flash of Invisible Text)
// - Preloads fonts for better LCP (Largest Contentful Paint)
// - Supports offline usage with fallbacks
// ==========================================

// Primary font for headings: Baloo 2
// Properties:
// - Weights: 400, 500, 600, 700, 800
// - Excellent for children (playful, legible)
// - Used for: h1, h2, h3, titles, buttons
const baloo2 = Baloo_2({
  variable: '--font-baloo-2',
  subsets: ['latin', 'vietnamese'], // Support Vietnamese characters
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap', // Show fallback while loading, swap when ready
  preload: true,   // Preload for faster display
});

// Body font: Lexend
// Properties:
// - Weights: 400, 500, 600, 700
// - Designed for reading speed and accessibility
// - Used for: body text, captions, descriptions
const lexend = Lexend({
  variable: '--font-lexend',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: true,
});

// ==========================================
// METADATA (SEO & Accessibility)
// ==========================================
export const metadata: Metadata = {
  title: {
    template: '%s | EduKids',
    default: 'EduKids - Học Tiếng Anh Vui Nhộn',
  },
  description:
    'Nền tảng học tiếng Anh tương tác dành cho trẻ em với các trò chơi, flashcards, và luyện phát âm thú vị.',
  keywords: [
    'Học tiếng Anh',
    'Giáo dục trẻ em',
    'Học tương tác',
    'Gamification',
    'Luyện phát âm',
    'Tiếng Anh cho bé',
  ],
  authors: [{ name: 'EduKids Team' }],
  creator: 'EduKids',
  publisher: 'EduKids',

  // Open Graph (Social sharing)
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: 'https://edukids.app',
    siteName: 'EduKids',
    title: 'EduKids - Học Tiếng Anh Vui Nhộn',
    description: 'Nền tảng học tiếng Anh tương tác dành cho trẻ em với các trò chơi, flashcards, và luyện phát âm thú vị.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'EduKids - Học Tiếng Anh Vui Nhộn',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'EduKids - Học Tiếng Anh Vui Nhộn',
    description: 'Nền tảng học tiếng Anh tương tác dành cho trẻ em.',
    images: ['/twitter-image.png'],
  },

  // Icons
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },

  // Manifest (PWA)
  manifest: '/manifest.json',

  // Additional metadata
  referrer: 'strict-origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
  },
};

// ==========================================
// VIEWPORT CONFIGURATION
// ==========================================
// Optimized for mobile-first design
// ==========================================
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  colorScheme: 'light dark',
};

// ==========================================
// ROOT LAYOUT
// ==========================================
interface RootLayoutProps {
  children: React.ReactNode;
}

import { ThemeProvider } from '@/providers/ThemeProvider';
import { Toaster } from 'sonner';

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${baloo2.variable} ${lexend.variable}`}
    >
      <head>
        {/* Preconnect to external services for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* DNS Prefetch for API calls */}
        <link rel="dns-prefetch" href="https://api.edukids.app" />

        {/* Additional meta tags for accessibility */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="EduKids" />
      </head>

      <body
        // Font family using CSS variables set by next/font
        className="font-body bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-100"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          {IS_VERCEL && <SpeedInsights />}
          {/* Global Toast Notifications */}
          <Toaster
            position="bottom-center"
            richColors
            closeButton
            toastOptions={{
              style: { fontFamily: 'var(--font-baloo-2)', borderRadius: '1rem' },
            }}
          />
        </ThemeProvider>

        {/* Skip to main content link (accessibility) */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-0 focus:top-0 focus:z-50 focus:bg-blue-600 focus:p-4 focus:text-white"
        >
          Skip to main content
        </a>
      </body>
    </html>
  );
}
