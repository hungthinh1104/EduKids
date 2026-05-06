# Backend Environment Setup

This document is the practical env guide for `apps/backend`.

Use it together with:

- [apps/backend/package.json](./apps/backend/package.json)
- [docker-compose.yml](./docker-compose.yml)
- [apps/backend/src/main.ts](./apps/backend/src/main.ts)

## How backend env is used

There are two common ways to run the backend:

- Direct local run from `apps/backend` using `.env.development` or `.env.production`
- Docker Compose run from repo root using the root `.env`

Do not assume the root `.env.example` fully replaces `apps/backend/.env.development`; they serve different entrypoints.

## Core variables

These are the most important variables to set correctly.

### Required for most local work

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`

### Commonly needed in real environments

- `FRONTEND_URL`
- `PUBLIC_API_BASE_URL`
- `APP_HOST`
- `PORT`

### Needed only if the related feature is used

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_BASE_URL`
- `AZURE_SPEECH_KEY`
- `AZURE_SPEECH_REGION`
- `GEMINI_API_KEY`
- `SENTRY_DSN`

## Minimum local example

```bash
NODE_ENV=development
PORT=3001
APP_HOST=0.0.0.0

DATABASE_URL=postgresql://edukids:password@localhost:5432/edukids_db
REDIS_URL=redis://:redis_password@localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

JWT_SECRET=replace_with_a_real_secret
JWT_EXPIRY=24h

CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
PUBLIC_API_BASE_URL=http://localhost:3001/api

PRONUNCIATION_PROVIDER=CUSTOM
```

## Feature-specific notes

### Auth

- `JWT_SECRET` must be a real secret in any shared or production environment
- Google OAuth is only active when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are present

### Redis and progress sync

- `REDIS_URL` is the main connection string
- Some codepaths also read `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD`
- Keep both the URL-style and split variables aligned

### Media

Media upload paths rely on Cloudinary credentials. If those values are absent, media-related flows may fail or remain partially usable only in local/mock scenarios.

### Pronunciation

- `PRONUNCIATION_PROVIDER` supports `CUSTOM` and `AZURE_SPEECH` in the current repo context
- Set Azure credentials only when using the Azure-backed provider

### Recommendations

Gemini-backed recommendation paths require `GEMINI_API_KEY` and related config.

### Metrics and monitoring

- `/api/metrics` is enabled by default outside strict production
- In production, use `METRICS_TOKEN` if you want to protect the metrics endpoint

## Production checks

`apps/backend/src/main.ts` validates several env vars in production and will fail fast if placeholder values are still present.

At minimum, production should have real values for:

- `JWT_SECRET`
- `DATABASE_URL`
- `REDIS_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Recommended startup flow

```bash
cd apps/backend
npm install
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

Health check after boot:

```bash
curl http://localhost:3001/api/system/health
```

## Notes for coding agents

- Prefer reading `apps/backend/.env.development` and `apps/backend/src/main.ts` before changing config behavior.
- Do not trust older comments claiming some modules are disabled; `apps/backend/src/app.module.ts` is the source of truth for currently wired modules.
- If env behavior seems inconsistent, verify whether the app is being run through Docker Compose or directly from `apps/backend`.
