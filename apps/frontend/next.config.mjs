/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  productionBrowserSourceMaps: false,
  // ==========================================
  // Image Optimization
  // ==========================================
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      }
    ],
    // Optimize images with external service
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },

  // ==========================================
  // Environment variables
  // ==========================================
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },

  // ==========================================
  // Security Headers
  // ==========================================
  async headers() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || '';

    const safeOriginFromUrl = (value) => {
      if (!value) return null;
      try {
        return new URL(value).origin;
      } catch {
        return null;
      }
    };

    const apiOrigin = safeOriginFromUrl(apiUrl);
    const wsOrigin = safeOriginFromUrl(wsUrl);
    const connectSrc = [
      "'self'",
      'https:',
      apiOrigin,
      wsOrigin,
      'ws:',
      'wss:',
    ]
      .filter(Boolean)
      .join(' ');

    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live blob:",
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src ${connectSrc}`,
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Enable XSS protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=86400',
          },
        ],
      },
      // API proxy routes must never be cached — they forward to the backend
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },

  // ==========================================
  // Redirects (SEO)
  // ==========================================
  async redirects() {
    return [];
  },

  // ==========================================
  // Rewrites
  // ==========================================
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },

  // ==========================================
  // Experimental Optimizations
  // ==========================================
  experimental: {
    optimizePackageImports: ['lucide-react', 'clsx', 'framer-motion'],
  },

  // ==========================================
  // Turbopack Configuration (Next.js 16+)
  // ==========================================
  turbopack: {
    // Fix: silence 'inferred workspace root' warning
    root: import.meta.dirname,
  },

  // ==========================================
  // TypeScript Configuration
  // ==========================================
  typescript: {
    tsconfigPath: './tsconfig.json',
  },

  // ==========================================
  // React Configuration
  // ==========================================
  reactStrictMode: true,

  // ==========================================
  // Performance & Other
  // ==========================================
  poweredByHeader: false,
  output: 'standalone',

  // ==========================================
  // Webpack Optimization
  // ==========================================
  webpack: (config, { isServer }) => {
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Framework
          framework: {
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            name: 'framework',
            priority: 40,
            reuseExistingChunk: true,
          },
          // Lucide icons
          lucide: {
            test: /[\\/]node_modules[\\/]lucide-react/,
            name: 'lucide',
            priority: 30,
            reuseExistingChunk: true,
          },
          // Framer Motion
          framer: {
            test: /[\\/]node_modules[\\/]framer-motion/,
            name: 'framer-motion',
            priority: 25,
            reuseExistingChunk: true,
          },
          // Other libraries
          libs: {
            test: /[\\/]node_modules[\\/]/,
            name: 'libs',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
    };

    return config;
  },
};

export default nextConfig;
