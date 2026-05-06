# CLAUDE.md

This file is the fast handoff for Claude or any coding agent continuing work in this repo.

## Start here

Read these first, in order:

1. [README.md](./README.md)
2. [apps/frontend/package.json](./apps/frontend/package.json)
3. [apps/backend/package.json](./apps/backend/package.json)
4. [apps/backend/src/app.module.ts](./apps/backend/src/app.module.ts)
5. [apps/backend/prisma/schema.prisma](./apps/backend/prisma/schema.prisma)

## What this repo is

EduKids is a monorepo for a kid-focused English learning product.

- `apps/frontend`: Next.js frontend
- `apps/backend`: NestJS API
- `docker-compose.yml`: local full-stack orchestration
- `docs/`: reference docs, plans, and deploy notes

## Current reality to trust

If docs disagree with code, trust these in this order:

1. `package.json` scripts and dependencies
2. `apps/backend/src/app.module.ts`
3. `apps/backend/prisma/schema.prisma`
4. actual controllers/services in `apps/backend/src/modules`
5. frontend route and API wiring in `apps/frontend/src`

Some legacy docs were written earlier and are not fully synchronized with the latest code.

## Local run commands

### Frontend

```bash
cd apps/frontend
npm install
npm run dev
```

### Backend

```bash
cd apps/backend
npm install
npm run prisma:migrate
npm run start:dev
```

### Full stack with Docker

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec backend npm run prisma:migrate
```

## Important URLs

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:3001/api/system/health`
- Backend metrics: `http://localhost:3001/api/metrics`
- Grafana: `http://localhost:3003`

## Frontend implementation notes

- The frontend API client is in [apps/frontend/src/shared/services/api.client.ts](./apps/frontend/src/shared/services/api.client.ts).
- In production browser contexts it prefers same-origin `/api`.
- Route protection and role redirects are in [apps/frontend/src/proxy.ts](./apps/frontend/src/proxy.ts).
- Auth state is cookie-driven and role-sensitive; avoid casual refactors there.

## Backend implementation notes

- Global API prefix is `/api`.
- Main bootstrap behavior is in [apps/backend/src/main.ts](./apps/backend/src/main.ts).
- The backend wires many modules already; do not assume modules are disabled unless they are actually removed from `AppModule`.
- Health endpoint: `/api/system/health`
- Metrics endpoint: `/api/metrics`

## Known documentation caveats

- Older docs referenced missing files such as `docs/QUICK_START.md` and `docs/PROJECT_STRUCTURE.md`; use `README.md` instead.
- `docs/API_ENDPOINTS_SUMMARY.md` is useful for orientation but should be verified against live controllers before large refactors.
- `docs/BACKEND_REFACTOR_BLUEPRINT_2026-04-04.md` is a planning document, not evidence that every refactor step already landed.

## Good next checks before editing code

Run these when starting a task:

```bash
git status --short
rg --files apps/frontend apps/backend docs
```

Then inspect only the modules related to the task.

## Current repo state to keep in mind

- There are already uncommitted changes in some frontend and test files.
- Avoid reverting unrelated edits.
- Root `package.json` is not the operational source of truth for running the apps; use app-level `package.json` files.

## High-value follow-up work

If you are picking up implementation work, likely high-value areas are:

- reconciling docs/API summaries with actual controllers
- tightening env/config consistency between Docker and direct local runs
- finishing backend refactor steps described in `docs/BACKEND_REFACTOR_BLUEPRINT_2026-04-04.md`
- verifying frontend pages against actual backend response contracts

## Suggested working style

- Prefer small, verifiable changes
- Run app-specific lint/tests for touched areas
- Treat docs as part of the deliverable when behavior changes
