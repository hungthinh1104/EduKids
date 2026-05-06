# EduKids Frontend

Next.js frontend for EduKids. This app contains the public marketing pages, auth flows, parent portal, child play flows, and admin screens.

## Current stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Zustand
- Axios
- Vitest + Playwright

## Run locally

```bash
cd apps/frontend
npm install
npm run dev
```

Default URL: `http://localhost:3000`

## Important scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run type-check
npm run test
npm run test:e2e
npm run format
```

## Environment

The app reads:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

When running in a production browser context, the API client prefers same-origin `/api` to avoid CORS issues. In local development it calls `NEXT_PUBLIC_API_URL` directly.

Relevant files:

- [src/shared/services/api.client.ts](./src/shared/services/api.client.ts)
- [src/proxy.ts](./src/proxy.ts)
- [.env.development](./.env.development)

## Route model

- Public: `/`, `/faq`, `/contact`, `/privacy`, `/terms`
- Auth: `/login`, `/register`, `/forgot-password`, `/reset-password`
- Parent: `/dashboard`, `/analytics`, `/reports`, `/settings`, `/recommendations`, `/onboarding`
- Child: `/play`
- Admin: `/admin`

Access control is enforced in [src/proxy.ts](./src/proxy.ts).

## Code layout

```text
src/
├── app/         # App Router pages/layouts
├── components/  # shared UI building blocks
├── features/    # feature-oriented modules
├── shared/      # cross-cutting utilities, store, services
└── providers/   # app-level providers
```

## Design and testing references

- [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)
- [UI_TEST_PLAN.md](./UI_TEST_PLAN.md)

## Notes for coding agents

- Do not assume older version numbers from legacy docs; `package.json` is the source of truth.
- There are existing auth-cookie and role-based redirect conventions in `src/proxy.ts`; preserve them when editing route flows.
- Frontend work often depends on backend response envelopes from the NestJS `ResponseInterceptor`, so verify payload shape before refactoring API calls.
