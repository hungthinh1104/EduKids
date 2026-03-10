# EduKids Root README

<div align="center">
  <h1>🎓 EduKids</h1>
  <p><strong>An AI-powered English learning platform with gamification for kids</strong></p>
  
  ![Tech Stack](https://img.shields.io/badge/Next.js-Nest.js-blue?style=flat-square)
  ![Database](https://img.shields.io/badge/PostgreSQL-Redis-green?style=flat-square)
  ![Infrastructure](https://img.shields.io/badge/Docker-Docker%20Compose-blue?style=flat-square)
</div>

---

## 📋 Project Overview

EduKids is a comprehensive English language learning platform designed specifically for children. It combines interactive learning modules, AI-powered speech recognition, and gamification elements to make language learning engaging and fun.

### 🎯 Key Features

- **Interactive Learning**: Flashcards, lessons, quizzes with immediate feedback
- **Speech Recognition**: Web Speech API integration for pronunciation practice
- **Gamification**: Points, badges, achievements, and leaderboards
- **Parent Dashboard**: Monitor child progress and learning analytics
- **Real-time Progress**: Track vocabulary mastery and learning paths
- **Responsive Design**: Mobile-first UI for kids (6-12 years old)

---

## 🏗️ Tech Stack

### Frontend
- **Framework**: [Next.js 14+](https://nextjs.org/) with App Router
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Type Safety**: TypeScript
- **Speech API**: Web Speech API for voice recording & recognition

### Backend
- **Runtime**: [Node.js 20+](https://nodejs.org/)
- **Framework**: [NestJS](https://nestjs.com/) with DDD architecture
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: PostgreSQL
- **Caching**: Redis
- **Job Queue**: BullMQ (async tasks)
- **Authentication**: JWT + Passport

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Development**: Hot reload for both frontend & backend

---

## 📁 Project Structure

```
EduKids/
├── apps/
│   ├── frontend/          # Next.js application
│   └── backend/           # NestJS application
├── shared/                # Shared types & constants
├── docker/                # Docker configurations
├── docs/                  # Documentation
├── docker-compose.yml     # Local development setup
└── .env.example          # Environment template
```

**Detailed structure**: See [PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- npm/yarn

### Setup (Recommended - with Docker)

```bash
# 1. Clone the repository
git clone <repository-url>
cd EduKids

# 2. Setup environment
cp .env.example .env.local

# 3. Start all services
docker-compose up -d

# 4. Run migrations
docker-compose exec backend npm run prisma:migrate

# 5. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001/api
# pgAdmin: http://localhost:5050
```

For detailed setup instructions, see [QUICK_START.md](./docs/QUICK_START.md)

---

## 📚 Documentation

- **[Quick Start Guide](./docs/QUICK_START.md)** - Get up and running
- **[Project Structure](./docs/PROJECT_STRUCTURE.md)** - Architecture and directory organization
- **[Docker Setup](./docker-compose.yml)** - Infrastructure configuration

---

## 🔧 Development

### Run Full Stack
```bash
docker-compose up -d
```

### Run Individual Services

**Backend Only**
```bash
cd apps/backend
npm install
npm run start:dev
```

**Frontend Only**
```bash
cd apps/frontend
npm install
npm run dev
```

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Next.js Frontend (3000)                 │  │
│  │  • Zustand State Management                          │  │
│  │  • Web Speech API Integration                        │  │
│  │  • Responsive UI (Tailwind CSS)                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│              NestJS Backend (3001)                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Authentication │ Users │ Content │ Learning        │   │
│  │  Gamification  │ Analytics │ Notifications          │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PostgreSQL (5432)  │  Redis (6379)                │   │
│  │  • User Data        │ • Cache Layer               │   │
│  │  • Learning Content │ • Session Store             │   │
│  │  • Progress Logs    │ • Job Queue (BullMQ)        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Features

- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Password hashing with bcrypt
- ✅ CORS configuration
- ✅ Environment variable protection
- ✅ Input validation & sanitization
- ✅ SQL injection prevention (via Prisma)

---

## 📈 Database Schema

The application uses **Domain-Driven Design** with Prisma ORM:

### Main Domains
- **auth**: User authentication & authorization
- **users**: Parent and child user profiles
- **content**: Topics and vocabulary
- **learning-progress**: Lesson and quiz progress
- **gamification**: Points, badges, achievements
- **analytics**: Activity logs and user insights

See `apps/backend/prisma/schema.prisma` for full schema details.

---

## 🔄 Redis & BullMQ

### Cache Strategy
- Learning content cached for 24 hours
- Session data stored in Redis
- Real-time leaderboard updates

### Job Queues
- Email notifications
- Weekly progress reports
- Monthly analytics generation

---

## 🧪 Testing

### Backend
```bash
cd apps/backend
npm run test              # Unit tests
npm run test:e2e         # Integration tests
npm run test:cov         # Coverage report
```

### Frontend
```bash
cd apps/frontend
npm run test              # Unit tests
npm run test:e2e         # E2E tests (Playwright)
```

---

## 🚀 Deployment

### Production Build

```bash
# Backend
cd apps/backend
npm run build

# Frontend
cd apps/frontend
npm run build
```

### Docker Images

```bash
# Build and push to registry
docker build -f docker/Dockerfile.backend -t edukids-backend:latest ./apps/backend
docker build -f docker/Dockerfile.frontend -t edukids-frontend:latest ./apps/frontend
```

---

## 📝 Environment Variables

See `.env.example` for all available variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/edukids_db

# Redis
REDIS_URL=redis://:password@localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/new-feature`
2. Commit changes: `git commit -am 'Add new feature'`
3. Push to branch: `git push origin feature/new-feature`
4. Submit pull request

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 📞 Support

For issues or questions:
- Check [QUICK_START.md](./docs/QUICK_START.md)
- Review Docker logs: `docker-compose logs <service>`
- Contact development team

---

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] AI-powered tutoring module
- [ ] Video lessons
- [ ] Multilingual support
- [ ] Advanced analytics dashboard
- [ ] Parent-child messaging system
- [ ] Integration with popular learning standards

---

<div align="center">
  <p><strong>Built with ❤️ for kids learning English</strong></p>
  <p>© 2024 EduKids Platform. All rights reserved.</p>
</div>
