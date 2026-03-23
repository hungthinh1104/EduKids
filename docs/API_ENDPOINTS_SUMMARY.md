# API Endpoints Summary

## Base URL
- Development: `http://localhost:3001/api`
- Production: Configure via `API_BASE_URL` or `NEXT_PUBLIC_API_URL` with `/api`
- Note: Backend global prefix is `/api`, not `/api/v1`

## Authentication
All endpoints (except Public ones) require JWT Bearer token:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. Auth Module (`/auth`)
**Public endpoints - no authentication required**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new parent account | Public |
| POST | `/auth/login` | Login with email/password | Public |
| POST | `/auth/refresh` | Refresh JWT access token | Public |
| POST | `/auth/switch-profile` | Switch to child profile | PARENT |
| POST | `/auth/logout` | Logout and invalidate token | Authenticated |
| GET | `/auth/me` | Get current user profile | Authenticated |
| GET | `/auth/google` | OAuth login with Google | Public |
| GET | `/auth/google/callback` | Google OAuth callback | Public |
| GET | `/auth/facebook` | OAuth login with Facebook | Public |
| GET | `/auth/facebook/callback` | Facebook OAuth callback | Public |

---

## 2. System Module (`/system`)
**Public health check endpoints**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/system/health` | Health check endpoint | Public |
| GET | `/system/version` | Get API version | Public |
| GET | `/system/feature-flags` | Get feature flags | Public |

---

## 3. Content Module (`/content`)
**UC-01: Vocabulary topic browsing**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/content/topics` | Get all vocabulary topics (paginated) | PARENT, LEARNER |
| GET | `/content/topics/:id` | Get topic details with flashcards + video | LEARNER |
| GET | `/content/vocabularies/:id` | Get single vocabulary detail | LEARNER |

---

## 4. Quiz Module (`/quiz`)
**UC-04: Adaptive quiz with image selection**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/quiz/start` | Start new adaptive quiz session | LEARNER |
| POST | `/quiz/answer` | Submit answer and get instant feedback | LEARNER |
| GET | `/quiz/results/:quizSessionId` | Get quiz session results | LEARNER |

---

## 5. Pronunciation Module (`/pronunciation`)
**UC-02: Pronunciation practice with assessment**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/pronunciation/:vocabularyId` | Submit pronunciation attempt | LEARNER |
| GET | `/pronunciation/progress/:vocabularyId` | Get pronunciation progress | LEARNER |
| GET | `/pronunciation/history` | Get pronunciation history | LEARNER |
| GET | `/pronunciation/stats` | Get pronunciation statistics | LEARNER |

---

## 6. Learning Module (`/learning`)
**UC-01: Learning progress tracking**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/learning/progress` | Update viewing progress | LEARNER |

---

## 7. Gamification Module (`/gamification`)
**UC-05: Rewards, badges, virtual shop**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/gamification/rewards/summary` | Get reward summary (points, level, badges) | LEARNER |
| GET | `/gamification/badges` | Get all badges with progress | LEARNER |
| GET | `/gamification/badges/earned` | Get earned badges only | LEARNER |
| GET | `/gamification/shop/items` | Get all virtual shop items | LEARNER |
| POST | `/gamification/shop/purchase` | Purchase shop item | LEARNER |
| POST | `/gamification/shop/equip` | Equip purchased avatar item | LEARNER |
| GET | `/gamification/avatar/customization` | Get current avatar customization | LEARNER |
| GET | `/gamification/leaderboard` | Get global leaderboard | LEARNER |

---

## 8. Recommendation Module (`/recommendations`)
**UC-07: Personalized learning recommendations**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/recommendations/child/:childId` | Get recommendations for child | PARENT |
| POST | `/recommendations/child/:childId/apply` | Apply recommendation | PARENT |
| POST | `/recommendations/child/:childId/regenerate` | Regenerate recommendations | PARENT |
| POST | `/recommendations/child/:childId/regenerate-gemini` | Regenerate with Gemini AI | PARENT |
| GET | `/recommendations/child/:childId/applied-paths` | Get applied learning paths | PARENT |
| GET | `/recommendations/child/:childId/statistics` | Get recommendation statistics | PARENT |
| GET | `/recommendations/child/:childId/insights` | Get recommendation insights | PARENT |
| POST | `/recommendations/child/:childId/feedback` | Submit feedback on recommendation | PARENT |
| POST | `/recommendations/child/:childId/dismiss` | Dismiss recommendations | PARENT |

---

## 9. Flashcard Module (`/flashcard`)
**UC-01: Interactive flashcard viewing**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/flashcard/:vocabularyId` | Get flashcard for vocabulary | LEARNER |
| POST | `/flashcard/:vocabularyId/drag-drop` | Submit drag-drop activity | LEARNER |

---

## 10. Vocabulary Review Module (`/vocabulary/review`)
**UC-16: Spaced repetition vocabulary review**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/vocabulary/review/session` | Get review session (due vocabularies) | LEARNER |
| POST | `/vocabulary/review/submit` | Submit single vocabulary review | LEARNER |
| POST | `/vocabulary/review/submit-bulk` | Submit bulk vocabulary reviews | LEARNER |
| GET | `/vocabulary/review/stats` | Get review statistics | LEARNER |

---

## 11. Child Profile Module (`/profiles`)
**Child profile management**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/profiles` | Create new child profile | PARENT |
| GET | `/profiles` | Get all child profiles for parent | PARENT |
| GET | `/profiles/:id` | Get child profile details | PARENT |
| PUT | `/profiles/:id` | Update child profile | PARENT |
| DELETE | `/profiles/:id` | Delete child profile | PARENT |
| POST | `/profiles/switch` | Switch active child profile | PARENT |
| POST | `/profiles/active` | Set active child profile (parent session) | PARENT |
| GET | `/profiles/active/current` | Get currently active child profile | PARENT, LEARNER |

---

## 12. Avatar Customization Module (`/gamification/avatar`)
**UC-15: Avatar customization with shop items**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/gamification/avatar/customization` | Get current avatar customization | LEARNER |
| POST | `/gamification/shop/equip` | Equip purchased avatar item | LEARNER |

---

## 13. Analytics Module (`/analytics`)
**UC-08: Learning analytics and insights**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/analytics/overview` | Get analytics overview (supports `childId`, `period` query) | PARENT |
| GET | `/analytics/learning-time` | Get learning time analytics | PARENT |
| GET | `/analytics/vocabulary` | Get vocabulary retention analytics | PARENT |
| GET | `/analytics/pronunciation` | Get pronunciation analytics | PARENT |
| GET | `/analytics/quiz` | Get quiz performance analytics | PARENT |
| GET | `/analytics/gamification` | Get gamification analytics | PARENT |

---

## 14. Report Module (`/reports`)
**UC-09: Progress reports for parents**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/reports/generate` | Generate progress report | PARENT |
| POST | `/reports/send` | Generate and send report | PARENT |
| POST | `/reports/subscribe` | Subscribe to recurring reports | PARENT |
| POST | `/reports/unsubscribe` | Unsubscribe from recurring reports | PARENT |
| GET | `/reports/preferences` | Get report preferences | PARENT |
| PUT | `/reports/preferences` | Update report preferences | PARENT |
| GET | `/reports/history` | Get report history | PARENT |
| GET | `/reports/notifications` | Get report notifications | PARENT |
| PATCH | `/reports/notifications/:id/read` | Mark report notification as read | PARENT |

---

## 15. Media Module (`/media`)
**Media upload and management**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/media/upload` | Upload media file (Cloudinary) | PARENT, ADMIN |
| GET | `/media/:id` | Get media metadata | Authenticated |
| DELETE | `/media/:id` | Delete media file | PARENT, ADMIN |

---

## 16. Media Validation Module (`/media/validation`)
**Content moderation for user-generated media**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/media/validation/validate` | Submit media/content for validation | ADMIN, MODERATOR |
| POST | `/media/validation/validate-batch` | Submit batch validation | ADMIN, MODERATOR |
| GET | `/media/validation/:validationId` | Get validation result | ADMIN, MODERATOR |
| GET | `/media/validation/content/:contentId/history` | Get validation history | ADMIN, MODERATOR |
| POST | `/media/validation/:contentId/approve` | Approve content | ADMIN, MODERATOR |
| POST | `/media/validation/:contentId/reject` | Reject content | ADMIN, MODERATOR |

---

## 17. CMS Module (`/cms`)
**Content management for admin**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/cms/topics` | Create new topic | ADMIN |
| PUT | `/cms/topics/:id` | Update topic | ADMIN |
| DELETE | `/cms/topics/:id` | Delete topic | ADMIN |
| POST | `/cms/vocabularies` | Create vocabulary | ADMIN |
| PUT | `/cms/vocabularies/:id` | Update vocabulary | ADMIN |
| DELETE | `/cms/vocabularies/:id` | Delete vocabulary | ADMIN |

---

## 18. Admin Analytics Module (`/admin/analytics`)
**System-wide analytics for admin**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/admin/analytics/dashboard` | Get admin dashboard metrics | ADMIN |
| GET | `/admin/analytics/dau` | Get daily active users metrics | ADMIN |
| GET | `/admin/analytics/session-length` | Get session length metrics | ADMIN |
| GET | `/admin/analytics/content-popularity` | Get content popularity metrics | ADMIN |
| GET | `/admin/analytics/db-stats` | Get DB-backed platform statistics | ADMIN |

---

## Rate Limiting
- Registration: 5 attempts per 60 seconds
- Login: 10 attempts per 60 seconds
- Quiz start: 10 attempts per 60 seconds
- General API: Configured per endpoint

## Response Format
All responses follow standard format:
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... }
}
```

Error responses:
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "BadRequest"
}
```

## Pagination
Endpoints supporting pagination use:
- `?page=1` (default: 1)
- `?limit=20` (default: 20)

Response includes:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

**Status:** ✅ All core UC APIs integrated
**Last Updated:** March 9, 2026
