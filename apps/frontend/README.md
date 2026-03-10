# EduKids Frontend

Production-grade Next.js frontend with **production-ready design system** optimized for children's learning.

## 📋 Quick Start

### Install Dependencies

```bash
cd apps/frontend
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## 🎨 Design System

### Features

✅ **Production-Grade Typography**
- Scale: 1.25 ratio (Major Third) - optimized for UI
- Fonts: Baloo 2 (headings) + Lexend (body)
- Line Height: 1.65 default (child-friendly)
- Letter Spacing: 0.02em for readability

✅ **Color Psychology**
- Blue (trust, focus, learning)
- Green (growth, achievement, success)
- Orange (energy, fun, engagement)
- Purple (creativity, imagination, joy)

✅ **Semantic Tokens**
- Typography tokens (display, title, heading, body, caption)
- Color tokens (primary, secondary, accent, semantic)
- Spacing tokens (8-point grid)
- Shadow tokens (depth levels)
- Transition tokens (smooth motion)

✅ **Reusable Components**
- Display, Title, Heading typography components
- Body, Caption, Label, Button text components
- Semantic HTML structure
- Accessibility-first design

✅ **Accessibility (WCAG 2.1 AA)**
- Contrast ratio: 4.5:1+ (normal text)
- Focus indicators: visible blue ring
- Keyboard navigation: fully supported
- Screen reader: semantic HTML

### Using the Design System

```typescript
import { Display, Title, Heading, Body, Caption } from '@/shared/components/Typography'
import { semanticColors } from '@/shared/utils/design-tokens'

// Typography
<Display>Hero Title</Display>
<Title>Page Title</Title>
<Heading level={2}>Section Title</Heading>
<Body>Body text with generous line height</Body>
<Caption>Helper text, hints, labels</Caption>

// Colors
<div style={{ color: semanticColors.primary }}>
  Primary color
</div>

// Tailwind utilities
<div className="text-display font-heading text-blue-600">
  Hero text
</div>
```

### Design System Documentation

See [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) for:
- Complete typography scale
- Color palette with psychology
- Spacing and grid system
- Component best practices
- Accessibility guidelines
- Implementation checklist

## 📁 Project Structure

```
src/
├── app/                      # Next.js app directory
│   ├── layout.tsx           # Root layout with font loading
│   ├── page.tsx             # Home page example
│   └── globals.css          # Global styles + design tokens
│
├── features/                # Feature modules
│   ├── auth/                # Authentication
│   ├── dashboard/           # Learning dashboard
│   ├── gamification/        # Badges, rewards, levels
│   ├── learning/            # Learning features
│   └── profile/             # User profiles
│
└── shared/                  # Shared code
    ├── components/          # Reusable components
    │   └── Typography.tsx   # Typography component system
    ├── hooks/               # Custom React hooks
    ├── services/            # API services
    └── utils/               # Utility functions
        └── design-tokens.ts # Design system tokens
```

## 🔧 Configuration Files

- **tailwind.config.ts** - Tailwind CSS configuration with design tokens
- **next.config.ts** - Next.js configuration with optimization
- **postcss.config.mjs** - PostCSS configuration
- **tsconfig.json** - TypeScript configuration
- **package.json** - Dependencies and scripts

## 📦 Dependencies

### Core
- **next**: ^14.1.0 - React framework
- **react**: ^18.2.0 - UI library
- **react-dom**: ^18.2.0 - DOM rendering

### UI & Styling
- **tailwindcss**: ^3.4.1 - Utility CSS
- **lucide-react**: ^0.312.0 - Icons
- **clsx**: ^2.1.0 - Conditional classNames
- **tailwind-merge**: ^2.2.0 - Merge Tailwind classes

### State Management
- **zustand**: ^4.5.0 - Lightweight state management

### Utilities
- **axios**: ^1.6.5 - HTTP client
- **date-fns**: ^3.2.0 - Date utilities
- **zod**: ^3.22.4 - Schema validation
- **next-themes**: ^0.2.1 - Theme switching

### Development
- **typescript**: ^5.3.3
- **eslint**: ^8.56.0
- **prettier**: ^3.2.4
- **@tailwindcss/eslint-plugin**: Built-in

## 🚀 Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm start                # Start production server

# Code Quality
npm run lint             # ESLint check and fix
npm run type-check       # TypeScript check
npm run format           # Prettier format

# Testing
npm test                 # Jest tests
npm run test:watch       # Watch mode
npm run test:e2e         # Playwright E2E tests
```

## 🌐 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Design System Guide](./DESIGN-SYSTEM.md)

## ✨ Features

- ✅ Server-side rendering (SSR)
- ✅ Static site generation (SSG)
- ✅ Image optimization
- ✅ Font optimization (next/font/google)
- ✅ API routes
- ✅ TypeScript support
- ✅ ESLint & Prettier
- ✅ Dark mode ready
- ✅ Mobile-first responsive design
- ✅ PWA support

## 🔐 Security

- CSRF protection with Next.js built-in
- XSS protection via React's auto-escaping
- Content Security Policy headers
- Secure headers configuration
- Input validation with Zod

## 📊 Performance

- Code splitting by route
- Bundle optimization
- Image lazy loading
- Font preloading
- Critical CSS inlining
- Gzip compression

## 🎯 Next Steps

1. ✅ Design system setup
2. ⏳ Component library development
3. ⏳ Feature module implementation
4. ⏳ API integration
5. ⏳ Testing setup
6. ⏳ Deployment configuration

## 📝 Notes

- Design system uses **1.25 font scale** (Major Third) optimized for UI products
- Typography defaults to **1.65 line-height** for children's comfort
- Colors chosen with **psychology for children** in mind
- All components follow **WCAG 2.1 AA accessibility** standards

## License

Proprietary - EduKids © 2026

