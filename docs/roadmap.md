# ASPA Product Roadmap

This roadmap defines the planned development phases for **ASPA**, a mobile-first fitness and wellness application focused on workout planning, workout tracking, progress analytics, and Iran-specific user needs.

The goal is to keep the product focused, ship a usable MVP quickly, and only add complexity when the previous phase is stable.

---

## Phase 0 — Product Definition and Project Foundation

**Status: In progress — backend foundation complete; frontend and remaining product work pending.**

Checklist legend: `[x]` is implemented and verified in this repository. `[ ]` is
pending or cannot yet be verified.

### Goal

Create the technical and product foundation before feature development begins.

### Product Requirements

- [x] Define the MVP scope. See **MVP Definition** below.
- [x] Define primary target users: Persian-speaking fitness and wellness users in Iran.
- [x] Define the core user journey. See **MVP Definition** below.
- [ ] Finalize product naming and branding direction. The ASPA name is selected;
      the branding direction is not documented yet.
- [x] Define Persian-only and RTL UX requirements throughout the roadmap.
- [x] Define supported platforms:
  - [x] Android first.
  - [x] iOS support planned from the beginning.
- [ ] Define the initial analytics event taxonomy and event properties.
- [ ] Consolidate privacy and data-handling rules into an approved policy.
      Individual privacy requirements exist in later phases.
- [ ] Define measurable success targets for MVP and beta.

### Frontend

- [ ] Create the React Native + Expo project.
- [ ] Configure TypeScript.
- [ ] Configure Expo Router.
- [ ] Configure Persian and RTL support.
- [ ] Create the base design system:
  - [ ] colors
  - [ ] typography
  - [ ] spacing
  - [ ] buttons
  - [ ] inputs
  - [ ] cards
  - [ ] dialogs
  - [ ] loading states
  - [ ] error states
- [ ] Configure:
  - [ ] TanStack Query
  - [ ] Zustand
  - [ ] React Hook Form
  - [ ] Zod
- [ ] Configure environment handling.
- [ ] Add development, staging, and production configurations.
- [ ] Create the initial navigation structure.

### پنل مدیریت

- [x] ایجاد پروژهٔ مستقل SvelteKit در پوشهٔ `admin/` با TypeScript، آداپتور Node و رابط فارسی راست‌به‌چپ.
- [x] افزودن سرویس Docker Compose برای اجرای پنل روی پورت ۳۰۰۱.
- [x] تعریف نقش مدیر و مجوزسنجی مسیرهای مدیریتی در بک‌اند.
- [x] ورود مدیر با نام کاربری و رمز عبور محلی، نشست محافظت‌شده با کوکی سمت سرور و خروج از پنل.
- [ ] تعریف قالب مشترک صفحه‌های مدیریتی، وضعیت‌های بارگذاری و خطا، و تأیید عملیات حساس.
- [x] ثبت رخدادهای حسابرسی برای تغییرات مدیریتی در همان تراکنش پایگاه‌داده.

### Backend

- [x] Create the FastAPI project.
- [x] Use the agreed modular-monolith structure.
- [x] Configure:
  - [x] FastAPI
  - [x] Pydantic
  - [x] pydantic-settings
  - [x] SQLAlchemy 2.x
  - [x] asyncpg
  - [x] Alembic
  - [x] PostgreSQL
  - [x] Redis
- [x] Create application configuration and environment handling.
- [x] Use the shared API prefix `/api`.
- [x] Add health endpoints:
  - [x] `/health` liveness endpoint.
  - [x] `/ready` readiness endpoint with PostgreSQL and Redis checks.
- [x] Configure structured JSON logging.
- [x] Configure global exception handling.
- [x] Create the initial async database connection layer.
- [x] Create and verify the initial Alembic migration setup.
- [x] Configure OpenAPI with API and error schemas.
- [x] Define a consistent API error response format.

### DevOps / Infrastructure

- [x] Create the main repository.
- [ ] Configure branch protection in the Git hosting platform.
- [x] Configure backend CI for pushes and pull requests.
- [x] Add:
  - [x] Ruff linting
  - [x] Ruff formatting checks
  - [x] strict Pyright type checking
  - [x] unit and integration tests
  - [x] Docker image build validation
- [x] Create the backend Dockerfile with locked dependencies and a non-root user.
- [x] Create local Docker Compose services for:
  - [x] PostgreSQL
  - [x] Redis
  - [x] backend
- [x] Create isolated PostgreSQL and Redis integration-test services.
- [x] Create `.env.example` without real secrets.
- [x] Define local, test, staging, and production configuration templates.
- [x] Create basic deployment and rollback documentation.

### Testing Requirements

- [ ] Frontend must build successfully. No frontend project exists yet.
- [x] Backend starts successfully in Docker.
- [x] Database migrations run successfully and have no detected schema drift.
- [ ] CI must pass on pull requests. The workflow is configured, but no remote CI run
      is available in this repository yet.
- [x] `/health` and `/ready` return healthy status in the running stack.
- [x] Backend quality gates pass locally: Ruff linting, Ruff formatting, strict
      Pyright, migration drift checks, and all 77 tests.

### Exit Criteria

Phase 0 is complete when:

- [ ] Both developers have confirmed they can run the project locally.
- [ ] The mobile application can communicate with FastAPI. The frontend is pending.
- [x] PostgreSQL and Redis are available locally through Docker Compose.
- [x] Backend CI is configured to run automatically on pushes and pull requests.
- [x] Backend project structure, architecture, and deployment are documented.

---

# Phase 1 — Authentication and User Foundation

**Status: In progress — phone/OTP authentication, rotating refresh tokens, logout,
and user-profile backend complete; monitoring and frontend work pending.**

### Goal

Allow users to register, authenticate, and maintain a basic ASPA profile.

### Product Requirements

Users must be able to:

- [x] Register with an Iranian phone number, birthdate, and gender through the API.
- [x] Verify a registration OTP and receive an access token.
- [x] Log in using only a phone number and OTP through the API.
- [ ] Stay signed in. Backend refresh-token rotation is complete; frontend secure
      storage and session restoration are pending.
- [ ] Log out. Backend refresh-token invalidation is complete; the frontend flow is
      pending.
- [x] Edit basic profile information through the API.
- [x] Permanently delete their account through the API.

### Frontend

Create:

- splash screen
- onboarding screen
- phone-number login screen
- OTP verification screen
- basic profile setup
- profile screen
- logout flow

Requirements:

- Persian phone-number validation
- loading states
- OTP resend timer
- API error handling
- secure token storage
- automatic session restoration
- RTL-compatible forms
- keyboard-safe layouts

### پنل مدیریت

- [x] صفحهٔ ورود مدیر و محافظت از همهٔ مسیرهای مدیریتی در سمت سرور.
- [x] صفحهٔ فهرست کاربران با جست‌وجو، صفحه‌بندی و فیلتر وضعیت حساب.
- [x] صفحهٔ جزئیات کاربر با حداقل اطلاعات لازم، وضعیت حساب و تاریخ ایجاد.
- [x] امکان فعال و غیرفعال کردن حساب و تغییر سطح اشتراک با تأیید عملیات.
- [x] API مدیریتی کاربران با مجوزسنجی نقش مدیر، اعتبارسنجی ورودی و ثبت رخداد حسابرسی.
- [x] آزمون رد دسترسی کاربر عادی و ثبت صحیح تغییرات مدیر.

### Backend

Create modules:

- [x] `auth/`
- [x] `users/`

Authentication features:

- [x] Iranian phone-number normalization
- [x] OTP generation
- [x] OTP expiration
- [x] OTP retry limits
- [x] OTP rate limiting
- [x] Redis-backed OTP storage
- [x] Access tokens
- [x] Rotating refresh tokens
- [x] Logout / refresh-token invalidation
- [x] Authenticated-user dependency

User features:

- [x] Create user
- [x] Read current user
- [x] Update user profile
- [x] Account status
- [x] Permanently delete user

Initial user fields may include:

- [x] `id`
- [x] `phone_number`
- [x] `username`
- [x] `email`
- [x] `birthdate`
- [x] `gender`
- [x] `account_level` (`free` or `pro`)
- [x] `avatar`
- [x] `created_at`
- [x] `updated_at`

Only collect fields actually needed by the product.

### Infrastructure

- [x] Connect SMS provider abstraction.
- [x] Use a fake/local SMS provider for development.
- [ ] Configure secrets for staging. A staging environment template exists, but
      deployed secrets cannot be verified in this repository.
- [ ] Add Redis monitoring.

### Security Requirements

- [x] OTPs expire.
- [x] OTP attempts are rate-limited, including resend cooldowns and verification
      attempt limits.
- [x] Tokens and OTPs are not logged by the application or local SMS provider.
- [x] Refresh tokens are opaque, stored through keyed Redis digests, expire, and are
      rotated atomically to prevent replay.
- [x] Secrets come from environment/secrets management and unsafe placeholder
      secrets are rejected.
- [x] User enumeration is minimized for login OTP requests and verification errors.

### Testing Requirements

Backend:

- [x] Request OTP
- [x] Invalid phone number
- [x] Expired OTP
- [x] Invalid OTP
- [x] Successful login
- [x] Token refresh and replay rejection
- [x] Logout and refresh-token invalidation
- [x] Authenticated request
- [x] Unauthorized request

Frontend:

- login happy path
- incorrect OTP
- expired OTP
- reconnect after app restart

### Exit Criteria

- [ ] A new user can install ASPA, authenticate using a phone number, create a
      profile, close the app, reopen it, and remain authenticated. Backend registration
      and login work, but refresh/session restoration and the complete frontend flow
      are pending.

---

# Phase 2 — Exercise Library

**Status: In progress — backend catalog APIs, administrator management, and tests
complete; object-storage integration and remaining frontend work pending.**

### Goal

Create the core exercise database used by workout plans and workout tracking.

### Product Requirements

Users must be able to:

- [x] Browse exercises through the API.
- [x] Search exercises through the API.
- [x] Filter by muscle group through the API.
- [x] Filter by equipment through the API.
- [x] View exercise details through the API.
- [x] Create, edit, view, and delete private custom exercises through the API.
- [x] Keep each custom exercise visible only to its owner.

- [x] مدیران می‌توانند فهرست تمرین‌های عمومی را نگهداری کنند و API نقش مدیر را بررسی می‌کند.

### Frontend

Create:

- exercise list
- search
- filter UI
- exercise detail screen
- exercise image/video support
- muscle and equipment labels
- reusable exercise selector

Exercise detail should support:

- Persian name
- instructions
- primary muscles
- secondary muscles
- equipment
- media

### پنل مدیریت

- [x] صفحهٔ فهرست تمرین‌های عمومی با جست‌وجو، صفحه‌بندی و فیلتر وضعیت.
- [x] فرم ایجاد و ویرایش تمرین عمومی شامل نام فارسی، توضیح، مراحل انجام، عضلات اصلی و فرعی، تجهیزات و درجهٔ سختی.
- [ ] بارگذاری و مدیریت GIF یا MP4 نمایشی و نمایش وضعیت بررسی و حق استفادهٔ رسانه.
- [x] مدیریت گروه‌های عضلانی و تجهیزات در صفحهٔ پنل.
- [ ] فعال و غیرفعال کردن تمرین عمومی با تأیید و نمایش تأثیر آن بر برنامه‌های موجود.
- [x] API مدیریتی تمرین‌های عمومی، عضلات و تجهیزات با مجوزسنجی نقش مدیر و ثبت رخداد حسابرسی.
- [x] تمرین‌های خصوصی کاربران از فهرست و عملیات مدیریتی تمرین‌های عمومی جدا هستند.
- [x] آزمون عملیات مدیر، رد دسترسی کاربر عادی و حفظ حریم خصوصی تمرین‌های سفارشی.

### Backend

Create modules:

- [x] `exercises/`

Entities:

- [x] `Exercise`
- [x] `MuscleGroup`
- [x] `Equipment`
- [x] `ExerciseMuscle`
- [x] `ExerciseInstructionStep`
- [x] `ExerciseMedia`

Example fields:

`Exercise`:

- [x] `id`
- [x] `name_fa`
- [x] `description_fa`
- [x] `equipment_id`
- [x] `difficulty`
- [x] `image_key`
- [x] `video_key`
- [x] `is_active`
- [x] `created_at`
- [x] `updated_at`
- [x] Nullable `owner_user_id` distinguishing common and private custom exercises
- [x] Ordered Persian instruction steps
- [x] Ordered GIF/MP4 object-storage references

Endpoints:

- [x] `GET /api/exercises`
- [x] `GET /api/exercises/{id}`
- [x] `GET /api/muscle-groups`
- [x] `GET /api/equipment`
- [x] `POST /api/exercises/custom`
- [x] `PATCH /api/exercises/{id}/custom`

Support:

- [x] Pagination
- [x] Persian search
- [x] Filtering by muscle group, equipment, and difficulty
- [x] Sorting by Persian name or creation time

### Storage Requirements

- [ ] Connect S3-compatible storage for:

  - [ ] exercise images
  - [ ] exercise videos

- [ ] Populate every common exercise with reviewed instructions and licensed GIF or
      MP4 demonstration media.

- [x] Do not store large media directly in PostgreSQL. Exercise records store object
      keys only.

### Testing Requirements

- [x] Pagination
- [x] Search
- [x] Filtering
- [x] Invalid exercise ID
- [x] Inactive exercise behavior
- [x] Custom-exercise validation, ownership, and privacy

### Exit Criteria

- [ ] Users can efficiently browse, search, filter, and inspect the exercise catalog.
      The backend supports the full flow; the complete user-facing flow is not yet
      verified.

---

# Phase 3 — Workout Plan Builder

**Status: In progress — backend plan builder, validation, and tests complete;
remaining frontend work pending.**

### Goal

Allow users to create reusable training routines.

### Product Requirements

Users must be able to:

- [x] Create a workout plan through the API.
- [x] Add training days through the API.
- [x] Add exercises through the API.
- [x] Configure sets through the API.
- [x] Configure rep targets through the API.
- [x] Configure rest times through the API.
- [x] Reorder exercises through the API.
- [x] Edit plans through the API.
- [x] Duplicate plans through the API.
- [x] Archive/delete plans through the API.

### Frontend

Create:

- workout plans list
- create-plan flow
- training-day editor
- exercise selector
- exercise reorder UI
- set/rep editor
- rest-time editor
- plan detail screen
- edit plan screen

Example:

```text
Push Day

Bench Press
4 × 8-10
Rest: 120 sec

Incline Dumbbell Press
3 × 10-12
Rest: 90 sec
```

### Backend

Create module:

- [x] `workout_plans/`

Entities:

- [x] `WorkoutPlan`
- [x] `WorkoutPlanDay`
- [x] `WorkoutPlanExercise`

Required functionality:

- [x] CRUD workout plans
- [x] CRUD training days
- [x] Add/remove exercises
- [x] Exercise ordering
- [x] Duplicate workout plan
- [x] Ownership validation

### Validation Requirements

- [x] Users cannot modify another user's plan.
- [x] Sets are positive and bounded.
- [x] Rep ranges are valid and bounded.
- [x] Rest time is bounded.
- [x] Invalid or inactive exercise references are rejected.
- [x] Another user's custom exercise is rejected.
- [x] Workout-plan responses summarize primary and secondary muscle coverage.

### Testing Requirements

- [x] Create plan
- [x] Edit plan
- [x] Reorder exercise
- [x] Duplicate plan
- [x] Unauthorized plan access
- [x] Invalid exercise

### Exit Criteria

- [ ] A user can create and save a complete weekly training routine. The backend
      supports the complete routine model; the complete user-facing flow is not yet
      verified.

---

# Phase 4 — Live Workout Tracking

### Goal

Deliver the core ASPA experience: actually performing and recording workouts.

This is the most important MVP phase.

### Product Requirements

Users must be able to:

- start a workout
- choose a workout plan or start an empty workout
- log sets
- log reps
- log weight
- optionally log RPE/RIR
- mark sets complete
- use a rest timer
- add exercises during a workout
- remove exercises
- finish a workout
- cancel a workout
- see previous performance

### Frontend

Create the active workout experience.

Features:

- active workout screen
- exercise sections
- add set
- remove set
- edit reps
- edit weight
- RPE/RIR input
- completed-set state
- rest timer
- workout duration timer
- previous workout values
- add exercise
- replace exercise
- finish workout confirmation
- cancel workout confirmation

### Offline Requirements

Workout tracking must be offline-first.

Use local SQLite storage.

During an active workout:

```text
User action
   ↓
SQLite
   ↓
UI update
   ↓
Sync queue
   ↓
FastAPI
```

A temporary network failure must not lose workout data.

### Backend

Create module:

```text
workouts/
```

Entities:

```text
Workout
WorkoutExercise
WorkoutSet
```

Suggested fields:

```text
Workout

id
client_id
user_id
workout_plan_id
started_at
completed_at
duration_seconds
status
created_at
updated_at
```

```text
WorkoutSet

id
client_id
workout_exercise_id
set_number
weight
reps
rpe
rir
completed_at
```

### Sync Requirements

Mobile-generated `client_id` values should be used for idempotency.

Repeated synchronization of the same workout must not create duplicates.

Support:

```text
POST /api/workouts
PATCH /api/workouts/{id}
POST /api/workouts/{id}/complete
GET /api/workouts
GET /api/workouts/{id}
```

Potentially add a dedicated sync endpoint if needed.

### Testing Requirements

Test:

- online workout
- temporary network failure
- app background/foreground
- sync retry
- duplicate sync attempt
- editing sets
- completing workout
- cancelling workout
- previous performance retrieval

### Exit Criteria

A user can complete an entire workout with no internet connection and the workout safely synchronizes when connectivity returns.

---

# Phase 5 — Progress and Workout Analytics

### Goal

Give users a reason to return by showing measurable improvement.

### Product Requirements

Users should see:

- workout history
- exercise history
- personal records
- training volume
- workout frequency
- estimated 1RM
- body-weight history
- progress trends

Exercise-specific progress scope:

- [ ] Paginated completed-workout history for each exercise
- [ ] Heaviest-weight, repetition, estimated-1RM, set-volume, and workout-volume records
- [ ] Time-series progress data suitable for a later graph
- [ ] Bodyweight and assisted-exercise load-calculation rules

### Frontend

Create:

- workout history screen
- workout detail/history view
- progress dashboard
- exercise progress screen
- PR indicators
- charts
- body-weight chart

Example metrics:

```text
Weekly workouts
Weekly training volume
Bench press progress
Estimated 1RM
Personal records
Workout duration
```

### Backend

Create module:

```text
analytics/
```

Initial analytics can be calculated using PostgreSQL.

Do not introduce ClickHouse yet.

Endpoints may include:

```text
GET /api/analytics/overview
GET /api/analytics/exercises/{id}
GET /api/analytics/volume
GET /api/analytics/personal-records
```

Implement:

- volume calculations
- estimated 1RM
- PR detection
- weekly training frequency
- exercise history

### Performance Requirements

- Avoid N+1 queries.
- Add indexes based on real query patterns.
- Paginate history endpoints.
- Cache expensive queries only when needed.

### Testing Requirements

Validate analytics calculations with deterministic test data.

### Exit Criteria

A user can clearly see whether their training performance is improving.

---

# Phase 6 — Body Progress Tracking

### Goal

Allow users to track physical changes alongside workout performance.

### Product Requirements

Users must be able to log:

- weight
- waist
- chest
- arms
- hips
- thighs
- optional custom measurements
- progress photos

### Frontend

Create:

- measurement entry
- measurement history
- body-weight chart
- progress photo capture/upload
- progress photo timeline

### Backend

Create/update module:

```text
progress/
```

Entities:

```text
BodyMeasurement
ProgressPhoto
```

Store photo files in S3-compatible object storage.

PostgreSQL should store:

```text
object_key
measurement_date
metadata
```

not image binaries.

### Privacy Requirements

Progress photos must be private by default.

Use authenticated or signed access.

Never expose predictable public object paths for private media.

### Exit Criteria

Users can track body changes securely over time.

---

# Phase 7 — Beta Readiness

### Goal

Prepare ASPA for a controlled group of real users.

### Product Requirements

Before beta:

- no critical workout-data-loss bugs
- onboarding must be understandable
- core APIs must be stable
- basic privacy policy must exist
- user feedback mechanism must exist

### Frontend

Add:

- onboarding improvements
- empty states
- skeleton loaders
- consistent error handling
- crash reporting
- feedback flow
- update-required flow
- network-status handling
- polished Persian copy

### Backend

Add:

- [ ] Request IDs
- [ ] Audit logging where appropriate
- [ ] Stricter rate limiting. Authentication rate limiting exists, but beta-wide
      limits have not been implemented.
- [x] Account deletion
- [ ] User data export strategy
- [x] Production-compatible structured JSON logging
- [ ] Database backups
- [ ] API metrics
- [ ] Background-job monitoring

### Observability

Add:

- Prometheus
- Grafana
- Loki
- OpenTelemetry where valuable
- error tracking

Monitor:

```text
API latency
5xx errors
login failures
OTP failures
workout sync failures
database connections
Redis availability
worker failures
```

### Beta Testing Requirements

Run testing with real users.

Track:

- onboarding completion
- first workout creation
- first workout completion
- workout-sync success
- 7-day retention
- crashes
- user feedback

### Exit Criteria

A small group of users can use ASPA for several weeks without critical data-loss or stability problems.

---

# Phase 8 — Public MVP Launch

### Goal

Release the first production-ready version of ASPA.

### MVP Scope

The launch version should contain:

```text
Authentication
User profile

Exercise library

Workout plan builder

Live workout tracking
Offline workout support

Workout history

Progress analytics

Body measurements

Persian-only / RTL experience
```

Do not delay launch for advanced features.

### Frontend

Production requirements:

- app icon
- splash assets
- screenshots
- store listing
- privacy links
- production analytics
- crash reporting
- stable update mechanism

### Backend

Production requirements:

- [x] Production-ready Alembic migrations
- [ ] Automated backups
- [x] Environment-provided secrets with placeholder-secret rejection
- [x] Configurable, tested CORS allowlist
- [ ] HTTPS only
- [ ] Application-wide rate limiting. Authentication endpoints are rate-limited.
- [ ] Monitoring
- [ ] Alerts
- [ ] Worker health monitoring
- [ ] Database performance monitoring

### Infrastructure

Production should support at minimum:

```text
Load Balancer / Reverse Proxy

FastAPI
FastAPI Worker(s)

PostgreSQL
Redis

Background Worker

S3-compatible storage
```

Kubernetes can be used if operationally justified, but the application architecture must not depend on Kubernetes.

### Exit Criteria

ASPA is available to public users and all core user journeys are monitored.

---

# Phase 9 — Retention and Engagement

### Goal

Increase long-term usage after validating the MVP.

Possible features:

### Frontend

- workout streaks
- achievements
- training reminders
- weekly summaries
- goals
- home-screen personalization
- challenge UI
- notification settings

### Backend

Add:

- goals
- achievements
- streak calculation
- scheduled notifications
- weekly summaries
- notification preferences

### Requirements

Do not add gamification until real usage data shows which behaviors should be encouraged.

### Exit Criteria

Retention features are based on observed user behavior rather than assumptions.

---

# Phase 10 — Health Platform Integration

### Goal

Connect ASPA with phone and wearable health ecosystems.

### Android

Integrate:

```text
Health Connect
```

Potential data:

- steps
- body weight
- heart rate
- workouts
- sleep

### iOS

Integrate:

```text
Apple HealthKit
```

### Frontend

Create:

- health permission screens
- data-source settings
- health-sync status
- permission explanation
- sync-error handling

### Backend

Add health-data ingestion models where server-side storage is necessary.

Do not upload health data unless ASPA actually needs it.

### Privacy Requirements

- explicit user consent
- minimum necessary permissions
- clear explanation of data use
- easy disconnect/revoke flow

### Exit Criteria

Users can optionally connect supported health sources without affecting normal ASPA usage.

---

# Phase 11 — Subscription and Monetization

### Goal

Introduce monetization only after the core product provides enough value.

Possible paid features:

- advanced analytics
- premium workout plans
- AI recommendations
- coach-created programs
- premium progress insights

### Frontend

Create:

- pricing
- premium feature indicators
- subscription management
- purchase flow
- payment states
- invoice/payment history where needed

### Backend

Create/update:

```text
subscriptions/
payments/
```

Support:

- plans
- subscriptions
- payment sessions
- payment verification
- webhooks
- subscription expiration
- entitlement checks

### Iran-Specific Requirements

Support appropriate Iranian payment providers.

Payment provider logic must be isolated behind an integration interface.

### Exit Criteria

Payments are idempotent, validated server-side, monitored, and users receive the correct entitlements.

---

# Phase 12 — AI and Personalization

### Goal

Use user data to make ASPA more useful without making AI a requirement for the basic product.

Potential features:

- workout-plan generation
- workout progression recommendations
- exercise replacement suggestions
- weekly summaries
- plateau detection
- personalized coaching

### Backend

Add AI services behind a clear abstraction.

Example:

```text
FastAPI
   ↓
Recommendation Service
   ↓
AI Provider / Models
```

AI output must be validated before being stored or used.

### Frontend

AI should appear as assistance, not unexplained automation.

Users should be able to:

- review
- edit
- accept
- reject

AI-generated plans.

### Requirements

Do not allow an LLM to directly modify critical user data without explicit confirmation.

### Exit Criteria

AI features improve measurable user outcomes or engagement instead of existing only as a marketing feature.

---

# Phase 13 — Advanced Analytics and Scale

### Goal

Introduce specialized infrastructure only when real scale requires it.

Possible changes:

- ClickHouse for event/product analytics
- read replicas
- dedicated workers
- CDN for exercise media
- more aggressive caching
- search engine
- service extraction

### Backend Requirements

Before introducing a new system, identify a measurable bottleneck.

Examples:

```text
PostgreSQL analytics query too slow
→ evaluate ClickHouse

Exercise search limitations
→ evaluate OpenSearch

API module independently scaling
→ consider service extraction
```

Do not introduce infrastructure only because it may be useful later.

### Architecture Principle

Scale based on measurements.

Do not automatically move from:

```text
modular monolith
```

to:

```text
microservices
```

because the user count increases.

Extract services only where operational or organizational boundaries justify it.

---

# Cross-Phase Engineering Requirements

These rules apply throughout the project.

## Backend

- Use FastAPI.
- Use async SQLAlchemy correctly.
- Use Alembic for schema changes.
- Use PostgreSQL as the primary source of truth.
- Use Redis only for temporary/fast state.
- Keep routers thin.
- Put business logic in services.
- Use repositories only when useful.
- Keep modules domain-oriented.
- Maintain API versioning.
- Maintain backward compatibility where practical.
- Use pagination for list endpoints.
- Use database indexes intentionally.
- Validate ownership on user resources.
- Use idempotency for retryable operations.
- Do not store large media in PostgreSQL.

## Frontend

- Use React Native + Expo.
- Use TypeScript.
- Design exclusively for Persian and RTL.
- Use TanStack Query for server state.
- Use Zustand for local UI/application state.
- Use SQLite where offline persistence is required.
- Handle loading, empty, offline, and error states.
- Avoid duplicated backend models by generating or deriving frontend API types from OpenAPI when practical.
- Keep feature code grouped by domain.

## Security

- Never commit secrets.
- Use HTTPS in production.
- Rate-limit sensitive endpoints.
- Protect private user data.
- Encrypt traffic.
- Validate all server-side input.
- Do not trust frontend authorization checks.
- Log security-relevant events without leaking secrets.
- Apply least privilege to infrastructure credentials.

## Observability

At minimum monitor:

- availability
- API error rate
- latency
- database health
- Redis health
- background-job failures
- authentication failures
- workout-sync failures

## CI Requirements

Every pull request should run:

### Backend

```bash
uv run ruff check .
uv run ruff format --check .
uv run pyright
uv run pytest
```

### Frontend

```bash
npm run lint
npm run typecheck
npm run test
```

Add build validation where appropriate.

---

# Suggested Release Sequence

```text
Phase 0
Foundation

Phase 1
Authentication + Users

Phase 2
Exercise Library

Phase 3
Workout Plan Builder

Phase 4
Live Workout Tracking

Phase 5
Workout Analytics

Phase 6
Body Progress

Phase 7
Private Beta

Phase 8
Public MVP

Phase 9
Retention

Phase 10
Health Integrations

Phase 11
Subscriptions

Phase 12
AI / Personalization

Phase 13
Advanced Scale
```

---

# MVP Definition

The MVP is complete when a Persian-speaking user can:

1. Register using a phone number.
2. Create a profile.
3. Browse exercises.
4. Create a workout routine.
5. Start a workout.
6. Track sets, reps, and weight.
7. Finish the workout even with unreliable connectivity.
8. View workout history.
9. View basic performance analytics.
10. Track body weight and measurements.
11. Use the entire core flow comfortably in Persian and RTL.

Anything beyond this should be justified by user feedback, retention data, or business needs.
