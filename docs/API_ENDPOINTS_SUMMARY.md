# API Endpoints Summary

## Base URL
- Development: `http://localhost:3001/api/v1`
- Production: Configure via `API_BASE_URL` environment variable

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
| GET | `/content/topics/:id/progress` | Get viewing progress for topic | LEARNER |
| POST | `/content/topics/:topicId/media-error` | Report media loading error | LEARNER |

---

## 4. Quiz Module (`/quiz`)
**UC-04: Adaptive quiz with image selection**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/quiz/start` | Start new adaptive quiz session | LEARNER |
| POST | `/quiz/submit-answer` | Submit answer and get instant feedback | LEARNER |
| GET | `/quiz/session/:sessionId` | Get current quiz session state | LEARNER |

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
| POST | `/gamification/avatar/equip` | Equip avatar item | LEARNER |
| POST | `/gamification/avatar/unequip` | Unequip avatar item | LEARNER |
| GET | `/gamification/avatar/customization` | Get current avatar customization | LEARNER |
| GET | `/gamification/leaderboard/class` | Get class leaderboard | LEARNER |
| GET | `/gamification/leaderboard/global` | Get global leaderboard | LEARNER |

---

## 8. Recommendation Module (`/recommendations`)
**UC-07: Personalized learning recommendations**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/recommendations/child/:childId` | Get recommendations for child | PARENT |
| POST | `/recommendations/child/:childId/apply` | Apply recommendation | PARENT |
| POST | `/recommendations/child/:childId/regenerate-gemini` | Regenerate with Gemini AI | PARENT |
| GET | `/recommendations/child/:childId/applied-paths` | Get applied learning paths | PARENT |
| GET | `/recommendations/child/:childId/statistics` | Get recommendation statistics | PARENT |
| POST | `/recommendations/feedback` | Submit feedback on recommendation | PARENT |
| POST | `/recommendations/dismiss` | Dismiss recommendations | PARENT |

---

## 9. Flashcard Module (`/flashcard`)
**UC-01: Interactive flashcard viewing**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/flashcard/topic/:topicId` | Get flashcards for topic | LEARNER |
| POST | `/flashcard/:vocabularyId/complete` | Mark flashcard as completed | LEARNER |
| GET | `/flashcard/progress/:topicId` | Get flashcard progress | LEARNER |

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
| PATCH | `/profiles/:id` | Update child profile | PARENT |
| DELETE | `/profiles/:id` | Delete child profile | PARENT |
| GET | `/profiles/:childId/analytics` | Get child analytics | PARENT |

---

## 12. Avatar Customization Module (`/gamification/avatar`)
**UC-15: Avatar customization with shop items**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/gamification/avatar` | Get current avatar state | LEARNER |
| POST | `/gamification/avatar/equip` | Equip avatar item | LEARNER |
| POST | `/gamification/avatar/unequip/:itemId` | Unequip avatar item | LEARNER |
| GET | `/gamification/avatar/inventory` | Get purchased items inventory | LEARNER |
| GET | `/gamification/avatar/history` | Get avatar change history | LEARNER |

---

## 13. Analytics Module (`/analytics`)
**UC-08: Learning analytics and insights**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/analytics/child/:childId/overview` | Get analytics overview | PARENT |
| GET | `/analytics/child/:childId/topic/:topicId` | Get topic-specific analytics | PARENT |
| GET | `/analytics/child/:childId/streak` | Get learning streak data | PARENT |
| GET | `/analytics/child/:childId/time-series` | Get time-series analytics | PARENT |

---

## 14. Report Module (`/reports`)
**UC-09: Progress reports for parents**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/reports/child/:childId/weekly` | Get weekly progress report | PARENT |
| GET | `/reports/child/:childId/monthly` | Get monthly progress report | PARENT |
| GET | `/reports/child/:childId/overall` | Get overall progress report | PARENT |
| POST | `/reports/child/:childId/export` | Export report as PDF/CSV | PARENT |

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
| POST | `/media/validation/submit` | Submit media for validation | PARENT |
| GET | `/media/validation/pending` | Get pending validations | ADMIN |
| POST | `/media/validation/:id/approve` | Approve media | ADMIN |
| POST | `/media/validation/:id/reject` | Reject media | ADMIN |

---

## 17. CMS Module (`/cms`)
**Content management for admin**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/cms/topics` | Create new topic | ADMIN |
| PATCH | `/cms/topics/:id` | Update topic | ADMIN |
| DELETE | `/cms/topics/:id` | Delete topic | ADMIN |
| POST | `/cms/vocabularies` | Create vocabulary | ADMIN |
| PATCH | `/cms/vocabularies/:id` | Update vocabulary | ADMIN |
| DELETE | `/cms/vocabularies/:id` | Delete vocabulary | ADMIN |

---

## 18. Admin Analytics Module (`/admin/analytics`)
**System-wide analytics for admin**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/admin/analytics/dashboard` | Get admin dashboard metrics | ADMIN |
| GET | `/admin/analytics/users` | Get user statistics | ADMIN |
| GET | `/admin/analytics/content` | Get content usage statistics | ADMIN |
| GET | `/admin/analytics/performance` | Get system performance metrics | ADMIN |

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
