# EduKids Backend Refactor Blueprint (2026-04-04)

## Scope
Production-grade backend refactor for high-frequency learning workloads:
- quiz submissions
- pronunciation attempts
- flashcard/review events
- progress sync
- recommendation projections
- parent dashboard reads

---

## Phase 1 — Architecture Audit

### A. God services

| Service | Severity | Root cause | Runtime risk | Recommended decomposition |
|---|---|---|---|---|
| `AuthService` | HIGH | mixed concerns: credentials, session store, token lifecycle, password reset, profile switching, audit, Redis rate-limit in one class | token replay gaps, refresh/session inconsistency, high merge conflicts | `AuthenticationService`, `SessionService`, `PasswordService`, `TokenRotationService`, `AuthAuditService`, `RateLimitGuardService`, `OAuthService` |
| `QuizService` | CRITICAL | session lifecycle + adaptive logic + persistence + rewards + result shaping in one service | duplicate submit/reward, race on concurrent answers, stale-session edge cases | `QuizSessionService`, `QuizSubmissionService`, `AdaptiveDifficultyService`, `QuizQuestionSelectionService`, `QuizAttemptPersistenceService`, `QuizEventPublisher` |
| `ProgressSyncService` | HIGH | orchestration + validation + conflict + queue + persistence/caching mixed | replay/idempotency gaps, conflict drift, hot-key redis scan risk | `ProgressRealtimeCacheService`, `ProgressConflictService`, `ProgressFlushWorker`, `ProgressProjectionService` |
| `RecommendationRepository` | HIGH | business policy + AI prompting + persistence + fallback logic in repository layer | heavy sync reads, hard to test, non-deterministic output coupling | `WeakTopicDetectionService`, `RuleEngineService`, `LearningPathService`, `RecommendationProjectionService` |
| `AnalyticsService` + `ReportService` | HIGH | dashboard heavy read aggregation in request path | p95 spikes under parent dashboard fan-out | projection tables + async projection workers |

### B. Boundary violations

1. Domain logic in repositories (`RecommendationRepository`) and services returning fallback business decisions.
2. Cache + business + persistence mixed in `QuizService` and `ProgressSyncService`.
3. Provider selection logic embedded in pronunciation assessment class instead of strategy-resolved providers.
4. Duplicate reward semantics across modules (`quiz`, `pronunciation`, `vocabulary-review`) without shared idempotency contract.
5. Heavy read aggregation done synchronously in API path (`analytics`, `report`).

### C. Runtime risk register

| Risk | Severity | Current signal | Fix |
|---|---|---|---|
| Duplicate quiz reward grant | CRITICAL | `getQuizResults()` can be called repeatedly | one-time grant ledger + idempotency key |
| Duplicate answer submit | CRITICAL | concurrent/duplicate client retries | per-question idempotency lock + answer ledger |
| Streak race condition | HIGH | multiple modules mutate streak/points independently | event-driven reward pipeline + optimistic update rules |
| Session stale/inconsistent | HIGH | cache-only quiz sessions | stale detection + durable completion snapshot |
| Refresh token replay | HIGH | plain token session checks, no family rotation | token family + rotation + revocation policy |
| Event replay duplication | HIGH | no standard idempotency envelope | event schema + consumer idempotency store |

### D. Scalability bottlenecks

1. synchronous DB writes per answer/attempt.
2. request-time parent dashboard aggregation.
3. recommendation over raw activity windows each regenerate call.
4. pronunciation provider path coupled to request cycle.
5. no write/read model split for analytics projections.

---

## Phase 2 — Service Decomposition Plan

### Proposed folder structure

```text
apps/backend/src/modules/
  auth/
    services/
      authentication.service.ts
      session.service.ts
      password.service.ts
      oauth.service.ts
      token-rotation.service.ts
      auth-audit.service.ts
      rate-limit-guard.service.ts
  quiz/
    services/
      quiz-session.service.ts
      quiz-submission.service.ts
      adaptive-difficulty.service.ts
      question-selection.service.ts
      attempt-persistence.service.ts
      quiz-event-publisher.service.ts
    events/
      quiz-submitted.event.ts
  learning-progress-sync/
    services/
      progress-realtime-cache.service.ts
      progress-aggregation.service.ts
      progress-projection.service.ts
      progress-flush.worker.ts
  recommendation/
    services/
      weak-topic-detection.service.ts
      rule-engine.service.ts
      learning-path.service.ts
      recommendation-projection.service.ts
  pronunciation/
    providers/
      pronunciation-provider.interface.ts
      azure-speech.provider.ts
      web-speech.provider.ts
      whisper-local.provider.ts
      mock.provider.ts
```

---

## Phase 3 — Event-Driven Refactor Target

### Standard event envelope

```ts
interface DomainEventEnvelope<TPayload> {
  eventName: string;
  version: number;
  correlationId: string;
  idempotencyKey: string;
  timestamp: string;
  payload: TPayload;
}
```

### Core events
- `QuizSubmittedEvent`
- `PronunciationAttemptedEvent`
- `LessonCompletedEvent`
- `StreakUpdatedEvent`
- `WeakTopicDetectedEvent`
- `RewardGrantedEvent`
- `ChildProfileUpdatedEvent`

### Consumers
- reward projection
- badge projection
- analytics projection
- recommendation projection
- parent dashboard projection

---

## Phase 4 — Data Access Optimization

### Read-model tables
- `parent_dashboard_stats`
- `child_learning_summary`
- `weak_topic_projection`
- `streak_projection`
- `daily_xp_projection`

### Index priorities
1. quiz attempts by `(childId, createdAt desc)`
2. pronunciation attempts by `(childId, vocabularyId, createdAt desc)`
3. learning progress by `(childId, vocabularyId)`
4. dashboard projection by `(childId, weekStart)`

### Redis hot state
- `quiz:session:{sessionId}`
- `quiz:lock:{sessionId}:{questionId}`
- `progress:live:{childId}`
- `streak:live:{childId}:{date}`
- `xp:live:{childId}:{date}`

---

## Phase 5 — Provider Extensibility

Define:

```ts
export interface PronunciationProvider {
  assess(audio: Buffer, target: string): Promise<AssessmentResult>;
}
```

Provider registry selected by config (no provider if/else in domain service):
- `AzureSpeechProvider`
- `WebSpeechProvider`
- `WhisperLocalProvider`
- `MockProvider`

---

## Phase 6 — Safety + Correctness

Mandatory protections:
- reward idempotency ledger per completed session
- duplicate submission guard per `(quizSessionId, questionId)`
- stale session rejection policy
- refresh token family rotation + replay blocklist
- DLQ for failed projections
- audit events for auth/security mutations

---

## Phase 7 — Testing Matrix

1. Unit: decomposition services and adapters.
2. Integration: API contract compatibility.
3. Concurrency: duplicate `quiz/answer`, duplicate `quiz/results`.
4. Cache consistency: redis cache miss/fallback and stale keys.
5. Duplicate request tests (idempotency).
6. Event replay tests (consumer idempotency).
7. Projection rebuild tests from event history.

---

## Exact files to change (priority wave)

### Wave 0 (done in this iteration)
- `apps/backend/src/modules/quiz/quiz.service.ts`
  - added stale-session check
  - question-order guard
  - duplicate answer idempotent return
  - one-time reward grant in session cache

### Wave 1 (next)
- `apps/backend/src/modules/quiz/quiz.module.ts`
- `apps/backend/src/modules/quiz/services/*`
- `apps/backend/src/modules/auth/auth.module.ts`
- `apps/backend/src/modules/auth/services/*`
- `apps/backend/src/modules/pronunciation/providers/*`
- `apps/backend/src/modules/recommendation/services/*`
- `apps/backend/src/modules/learning-progress-sync/service/*`

---

## Migration sequence

1. Introduce new services behind existing facades (no controller contract changes).
2. Add idempotency ledger tables and dual-write guards.
3. Introduce event envelope and publish from existing services.
4. Build projection consumers and backfill scripts.
5. Switch dashboard/recommendation reads to projections.
6. Enable token family rotation + replay prevention.
7. Remove legacy synchronous side-effects.

---

## Risk mitigation checklist

- keep API DTOs stable
- feature flags for event consumers
- deploy with dual-write period
- run projection parity checks
- add retry with DLQ and replay tooling
- monitor p95, error rate, duplicate reward counter

---

## Rollback strategy

1. Disable projection reads via feature flag.
2. Fall back to current direct-query services.
3. Keep event writes enabled for forensic replay.
4. Roll back idempotency guards only if hard failure; preserve ledgers.

---

## Expected performance impact

- Quiz submit p95: -20% to -35% (reduced sync side effects)
- Parent dashboard p95: -40% to -70% (projection reads)
- Recommendation generation latency: -30% to -60% after weak-topic projection
- Reduced duplicate reward incidents to near-zero with idempotency ledger

---

## Deferred technical debt

- full outbox pattern with transactional event publishing
- distributed lock provider abstraction
- full analytics multi-tenant partition strategy
- cost-aware pronunciation provider routing

---

## Future AI-agent integration hooks

- event stream tap for learning-state agents
- recommendation policy simulation endpoint
- provider routing hook for dynamic budget/latency optimization
- projection diagnostics endpoint for autonomous repair/rebuild
