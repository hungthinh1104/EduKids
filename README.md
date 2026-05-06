# EduKids

EduKids is a monorepo for a kid-focused English learning platform with a Next.js frontend, a NestJS backend, PostgreSQL, Redis, and a local monitoring stack.

This file is the main entrypoint for humans and coding agents. If you are using Claude or another agent to continue the repo, read [CLAUDE.md](./CLAUDE.md) right after this.

## Repo shape

```text
.
├── apps/
│   ├── frontend/   # Next.js app
│   └── backend/    # NestJS API
├── docs/           # Supporting docs, plans, test notes, deploy guides
├── docker/         # Dockerfiles + monitoring config
├── scripts/        # Utility scripts
└── docker-compose.yml
```

## Current stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind, Zustand
- Backend: NestJS 11, Prisma 7, PostgreSQL, Redis, Bull
- Monitoring: Prometheus, Grafana, Alertmanager, Blackbox exporter
- Infra: Docker Compose for local full-stack runs

## Source of truth

Use these files first when figuring out the repo:

- [CLAUDE.md](./CLAUDE.md): repo handoff, working agreements, and next priorities
- [apps/frontend/package.json](./apps/frontend/package.json): frontend scripts and dependency versions
- [apps/backend/package.json](./apps/backend/package.json): backend scripts and dependency versions
- [apps/backend/src/app.module.ts](./apps/backend/src/app.module.ts): backend modules currently wired in
- [apps/backend/prisma/schema.prisma](./apps/backend/prisma/schema.prisma): data model source of truth
- [docker-compose.yml](./docker-compose.yml): local stack topology and ports

Treat some older docs in `docs/` as reference material, not guaranteed source of truth.

## Quick start

### Option 1: run the full stack with Docker

1. Copy the root env file:

```bash
cp .env.example .env
```

2. Fill in required values in `.env`, especially:

- `REDIS_PASSWORD`
- `JWT_SECRET`
- any external service credentials you actually want to use

3. Start the stack:

```bash
docker compose up -d --build
```

4. Run backend migrations:

```bash
docker compose exec backend npm run prisma:migrate
```

5. Optional seed:

```bash
docker compose exec backend npm run prisma:seed
```

### Default local URLs

- Frontend: `http://localhost:3000`
- Backend root: `http://localhost:3001`
- Backend health: `http://localhost:3001/api/system/health`
- Metrics: `http://localhost:3001/api/metrics`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3003`

### Option 2: run apps directly without Docker

Start PostgreSQL and Redis yourself first, then:

```bash
cd apps/backend
npm install
npm run start:dev
```

In another terminal:

```bash
cd apps/frontend
npm install
npm run dev
```

The frontend expects the backend at `http://localhost:3001/api` by default.

## App-specific commands

### Frontend

```bash
cd apps/frontend
npm run dev
npm run lint
npm run type-check
npm run test
npm run test:e2e
```

More frontend context: [apps/frontend/README.md](./apps/frontend/README.md)

### Backend

```bash
cd apps/backend
npm run start:dev
npm run lint
npm run test
npm run test:e2e
npm run prisma:migrate
npm run prisma:seed
```

Backend env notes: [BACKEND_ENV_SETUP.md](./BACKEND_ENV_SETUP.md)

## Environment model

There are two layers of env files in this repo:

- Root `.env.example`: values used by `docker compose`
- App env files inside `apps/backend` and `apps/frontend`: values used when running apps directly

Key frontend variables:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`

Key backend variables:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `FRONTEND_URL`
- `PUBLIC_API_BASE_URL`
- `PRONUNCIATION_PROVIDER`
- Cloudinary credentials if media upload is used

See [BACKEND_ENV_SETUP.md](./BACKEND_ENV_SETUP.md) for the backend-specific breakdown.

## Architecture notes

- Backend global prefix is `/api`
- Frontend axios client resolves backend base URL from `NEXT_PUBLIC_API_URL`
- In production browser contexts, frontend code routes API traffic through same-origin `/api` to avoid CORS issues
- Backend exposes `/api/system/health` and `/api/metrics`
- CORS is configured dynamically from `CORS_ORIGIN` and `FRONTEND_URL`

## Documentation map

Useful supporting docs:

- [docs/API_ENDPOINTS_SUMMARY.md](./docs/API_ENDPOINTS_SUMMARY.md): manual API summary, useful for orientation
- [docs/BACKEND_REFACTOR_BLUEPRINT_2026-04-04.md](./docs/BACKEND_REFACTOR_BLUEPRINT_2026-04-04.md): backend refactor direction and risk register
- [docs/MONITORING_SETUP.md](./docs/MONITORING_SETUP.md): Prometheus and Grafana setup
- [docs/AZURE_BACKEND_DEMO_DEPLOY.md](./docs/AZURE_BACKEND_DEMO_DEPLOY.md): backend-only Azure deployment notes
- [docs/Test Plan.md](./docs/Test%20Plan.md): test coverage checklist and manual/automation mapping
- [docs/Usecase document.md](./docs/Usecase%20document.md): product/use-case reference

## Notes for handoff

- The repo already has uncommitted changes in some frontend and test files. Do not revert unrelated work casually.
- Some docs in the repo are older than the current codebase. Prefer package files, app wiring, Prisma schema, and `CLAUDE.md` when there is a mismatch.
