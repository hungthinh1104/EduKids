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

## GitHub Actions — required secrets and vars

Configure these in **GitHub → Settings → Environments → production** before running the deploy workflow.

### Secrets (sensitive — never commit)

| Secret | Description |
|--------|-------------|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub personal access token (Read & Write) |
| `DATABASE_URL` | Full PostgreSQL connection string for production DB |
| `REDIS_URL` | Redis connection string |
| `REDIS_HOST` | Redis host |
| `REDIS_PORT` | Redis port |
| `REDIS_PASSWORD` | Redis password |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `SMTP_USER` | SMTP login email |
| `SMTP_PASSWORD` | SMTP app password |
| `AZURE_SPEECH_KEY` | Azure Cognitive Services key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `GEMINI_API_KEY` | Google Gemini API key |
| `ADMIN_SEED_PASSWORD` | Password for seeded admin account |
| `METRICS_TOKEN` | Bearer token to protect `/api/metrics` |
| `SENTRY_DSN` | Sentry DSN for error tracking |
| `VM_HOST` | SSH host of Azure VM (VM deploy only) |
| `VM_USERNAME` | SSH username of Azure VM (VM deploy only) |
| `VM_SSH_PRIVATE_KEY` | SSH private key for VM access (VM deploy only) |
| `AZURE_CREDENTIALS` | Azure service principal JSON (Container Apps deploy only) |

### Variables (non-sensitive — visible in logs)

| Variable | Example value | Description |
|----------|---------------|-------------|
| `DEPLOY_TARGET` | `vm` | `vm` for Azure VM, `container-app` for Container Apps |
| `FRONTEND_URL` | `https://edukids.app` | Public frontend URL |
| `CORS_ORIGIN` | `https://edukids.app` | Allowed CORS origin |
| `PUBLIC_API_BASE_URL` | `https://your-backend.azurecontainerapps.io/api` | Backend public base URL |
| `JWT_EXPIRY` | `24h` | JWT token expiry |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server host |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_FROM` | `noreply@edukids.com` | Sender email address |
| `AZURE_SPEECH_REGION` | `southeastasia` | Azure Speech region |
| `AZURE_SPEECH_LANGUAGE` | `en-US` | Default speech language |
| `CLOUDINARY_BASE_URL` | `https://res.cloudinary.com` | Cloudinary base URL |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model name |
| `GEMINI_BASE_URL` | `https://generativelanguage.googleapis.com` | Gemini API base URL |
| `SENTRY_ENVIRONMENT` | `production` | Sentry environment tag |
| `CONTAINER_APP_NAME` | `edukids-backend` | Azure Container App name (Container Apps deploy only) |
| `AZURE_RESOURCE_GROUP` | `edukids-rg` | Azure resource group (Container Apps deploy only) |

### Frontend secrets and vars (GitHub → Environments → production)

These are used by the `deploy-frontend-vercel.yml` workflow:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel personal access token |
| `VERCEL_ORG_ID` | Vercel org/team ID (from `vercel link`) |
| `VERCEL_PROJECT_ID` | Vercel project ID (from `vercel link`) |

| Variable | Example value | Description |
|----------|---------------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.azurecontainerapps.io/api` | Backend API URL for browser |
| `NEXT_PUBLIC_WS_URL` | `wss://your-backend.azurecontainerapps.io` | WebSocket URL for browser |
| `NEXT_PUBLIC_BASE_URL` | `https://edukids.app` | Frontend public URL (sitemap, robots) |

### First-time production setup checklist

```
[ ] Add all secrets above to GitHub Environment "production"
[ ] Set DEPLOY_TARGET = vm (or container-app)
[ ] Set PUBLIC_API_BASE_URL, FRONTEND_URL, CORS_ORIGIN vars
[ ] Run deploy workflow manually via workflow_dispatch once to seed DB
[ ] Verify /api/system/health returns 200 after deploy
[ ] Verify Google OAuth callback URL matches PUBLIC_API_BASE_URL/auth/google/callback
```

## Notes for coding agents

- Prefer reading `apps/backend/.env.development` and `apps/backend/src/main.ts` before changing config behavior.
- Do not trust older comments claiming some modules are disabled; `apps/backend/src/app.module.ts` is the source of truth for currently wired modules.
- If env behavior seems inconsistent, verify whether the app is being run through Docker Compose or directly from `apps/backend`.
