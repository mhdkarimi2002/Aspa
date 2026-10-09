# Backend and admin delivery status

The repository finish line is the backend scope through Phase 4 and the admin scope in Phases 0–2. This is an implementation milestone, not a deployment or mobile offline acceptance claim.

Implemented:

- Backend foundation, authentication, profiles and account deletion.
- Common/private exercise catalog and workout plans with per-set targets, snapshots, sharing and imports.
- Workout starts, restoration, completion/cancellation, actual sets, reps, fixed-precision weight, RPE/RIR, exercise/set additions/removals/reordering through document sync, and paginated workout/exercise history.
- Empty workouts, owner isolation, one active run, transactional synchronization, version conflicts and durable mutation deduplication.
- S3-compatible GIF/MP4/PNG/JPEG uploads with size/type/signature checks, signed previews and review/usage-rights records. Approved exercise demonstrations use short-lived authenticated signed delivery.
- Persian RTL admin navigation, loading/error feedback, user/catalog management, confirmations with exercise-plan impact counts, media upload/review, infrastructure status and request aggregates.
- Production OTP admin login, explicitly enabled local development login, secure cookies, refresh and logout. HTTPS SMS relay adapter with environment configuration.
- CI quality gates, isolated PostgreSQL/Redis/S3-emulator test services, migrations, request IDs, structured request timing and an operator backup script.

## Workout synchronization contract

`POST /api/workouts` accepts an optional `plan_id` and `client_id`. Omitting the plan starts an empty workout; every new run returns a stable client ID. Plan-based starts snapshot exercise names, rest times and per-set targets. Actual values begin empty. Existing pre-migration history cannot acquire performance data retroactively.

`PUT /api/workouts/sync` atomically accepts the complete workout document, including the complete ordered exercise/set lists. Removing an item from a later document removes it from the live run. This endpoint supports both online edits and queued offline updates. No granular set endpoint is necessary.

Example first offline synchronization:

```json
{
  "client_id": "11111111-1111-4111-8111-111111111111",
  "mutation_id": "22222222-2222-4222-8222-222222222222",
  "expected_version": 0,
  "plan_id": null,
  "plan_name": "تمرین آزاد",
  "started_at": "2026-10-09T08:00:00Z",
  "status": "completed",
  "completed_at": "2026-10-09T08:30:00Z",
  "exercises": [
    {
      "client_id": "33333333-3333-4333-8333-333333333333",
      "exercise_id": "44444444-4444-4444-8444-444444444444",
      "rest_seconds": 90,
      "sets": [
        {
          "client_id": "55555555-5555-4555-8555-555555555555",
          "target_reps": 10,
          "target_weight_kg": "40.00",
          "reps": 8,
          "weight_kg": "42.50",
          "rpe": "8.5",
          "rir": 2,
          "completed_at": "2026-10-09T08:20:00Z"
        }
      ]
    }
  ]
}
```

Use a real visible exercise ID. Every exercise and set needs a stable client UUID. Retry the identical document with the same mutation UUID after a network failure. Successful sync increments `version`; send that as `expected_version` for the next change with a new mutation UUID. Reusing a mutation UUID with different content returns 409. Retrying an older accepted mutation returns current server state without undoing subsequent edits. A new stale mutation returns `version_conflict`; fetch the run, reconcile pending changes and retry with a new mutation UUID. Never blindly replace the version in a stale document.

Completed and cancelled runs are immutable; accepted mutation retries still work. Completion timestamps require time zones, ordered valid times and actual reps/weight on completed sets. Use zero actual weight for bodyweight sets. Stored plan targets remain unchanged by actual-set logging. Names and existing set targets stay fixed in a run.

A completed offline run can be imported while a newer run is active. If its source plan was deleted, its reference is cleared and the submitted plan-name snapshot is retained. Deactivated common exercises remain valid historical references for completed offline logs; another user's private exercises are always rejected. Deletion of plans or exercises preserves recorded names, targets and actual performance. Rest timers can derive their deadline from the last completed-set timestamp plus `rest_seconds`; duration derives from persisted run timestamps.

`GET /api/workouts`, `GET /api/workouts/active`, `GET /api/workouts/{id}`, `POST /api/workouts/{id}/complete`, `POST /api/workouts/{id}/cancel` and `GET /api/workouts/exercises/{exercise_id}/history` are available. History uses `limit`/`offset`; exercise history includes only completed runs with a completed actual set for that exercise. It does not calculate Phase 5 personal records or analytics.

## Media configuration

Set `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY` and `S3_SECRET_KEY`. Create a private bucket first and grant the API access only to that bucket's exercise objects. Leave the endpoint empty for AWS S3. For Docker development, root `.env` supplies these values to Compose; backend host development reads `backend/.env`.

The endpoint used for signed previews must be reachable by both the API and the viewing browser. Configure TLS for external storage. Uploads run through authenticated admin server actions; the browser does not need bucket write access or S3 CORS configuration. The default per-file limit is 20 MiB; admin `BODY_SIZE_LIMIT=24M` permits multipart overhead. File signatures supplement content-type checks; this is not a full decoder or transcoder.

Upload in the admin media page, record rights and review, then attach the returned object key to an exercise. GIF/MP4 demonstrations belong in the ordered media list; PNG/JPEG keys belong in the image field. Approval requires a known rights status and a nonempty rights reference. Unapproved demonstrations are not delivered by `GET /api/exercises/{exercise_id}/media/{media_id}`. Signed preview/delivery URLs expire after five minutes. Removing an exercise reference does not delete its reusable uploaded object.

Catalog content is not automatically certified: existing seed references do not point to actual licensed uploaded files. An operator must populate and approve real content. Custom exercise media uploaded outside this managed library needs its own verified storage workflow; arbitrary keys are never signed by this delivery endpoint.

## Authentication and deployment

Set `SMS_PROVIDER=http`, an HTTPS `SMS_HTTP_URL` and `SMS_HTTP_TOKEN` in staging/production. The relay accepts `POST` JSON `{ "phone_number": "+989...", "code": "..." }` with `Authorization: Bearer <token>`, and returns a 2xx response after accepting delivery. Adapt your actual SMS vendor behind that relay. Delivery errors return 503 without exposing provider bodies or OTPs. Local SMS is rejected outside local/test environments.

Admin OTP login uses an existing active user with the admin role. Grant the role with the documented operator command. Set the admin's `ORIGIN` to its exact public HTTPS origin, `API_BASE_URL` to the internal API address, and `ADMIN_LOCAL_LOGIN=false`. The seeded password login is available only with an explicit admin opt-in and the API's local environment. Terminate TLS at a trusted proxy and configure forwarded-header trust explicitly.

Before deployment, inject unique JWT/database/Redis/SMS/storage secrets; run `alembic upgrade head` once before launching replicas. Build both images with the committed locks. Verify `/ready`, login, signed-media retrieval and a complete workout sync against staging. CI is configured in `.github/workflows/ci.yml`; remote CI success and branch protection require the Git hosting platform.

`GET /api/admin/system` reports PostgreSQL/Redis availability, safe Redis counters and per-process request count/time aggregates. The storage indicator describes configuration, not remote bucket health. Every request carries a generated `X-Request-ID` and structured timing log. Send logs to your deployment's collector and alert on readiness failures, errors, Redis evictions/memory, and database disk/capacity. Process-local request aggregates reset on restart and must be scraped per replica. This repository has no background workers yet.

## Backup and recovery

From the repository root, run `backend/scripts/backup.sh /absolute/path/to/new-backup.dump` against the local Compose deployment. The script refuses to overwrite files and removes an incomplete dump on failure. Schedule backups through your deployment's operator tooling, encrypt copies off-host, and establish retention and restoration drills. For managed PostgreSQL, use the provider's backup and point-in-time recovery facilities instead.

Restore only into a dedicated empty recovery database, using a matching PostgreSQL version:

```sh
pg_restore --no-owner --no-acl --exit-on-error --dbname="$RECOVERY_DATABASE_URL" /path/to/backup.dump
```

Verify migrations and representative account, plan and workout data before switching traffic. For rollback, prefer the prior API/admin images with the additive schema retained. The Phase 4 migration downgrade deletes logged-set/media metadata, so use it only on disposable databases or after an explicit recovery decision and verified backup.

## Verification and next phase

Verified locally on 2026-10-09: 115 backend tests and 7 admin tests pass; Ruff,
strict Pyright, admin type/lint/build checks and Alembic drift checks pass.
Both production Docker images build and start. The backend image passes readiness,
imports the application, registers ORM models and generates OpenAPI without development
dependencies; the admin image renders OTP login with local password login disabled.
The admin browser smoke test covers route protection, local/OTP login, shared
navigation, 375px layouts, media upload/review, cookie flags and logout with no
page errors. The additive migration was downgraded/reapplied on a disposable test
database; a PostgreSQL dump was restored into a separate disposable recovery
database and its seeded users, exercises, plans and media metadata verified.
The admin dependency audit reports zero known advisories after the targeted
cookie override and source-map-js patch. These local results do not assert a
remote CI run, real SMS delivery, licensed content or production deployment.

Use the isolated stack, never a development/production database:

```sh
docker compose -f docker-compose.test.yml up -d --wait
cd backend
uv sync --locked
TEST_DATABASE_URL=postgresql+asyncpg://aspa:aspa-test-only@127.0.0.1:55432/aspa_test \
TEST_REDIS_URL=redis://127.0.0.1:56379/0 \
S3_ENDPOINT=http://127.0.0.1:59000 S3_BUCKET=aspa-test-media \
S3_ACCESS_KEY=aspa-test S3_SECRET_KEY=aspa-test-storage-secret uv run pytest
```

Run Ruff, strict Pyright, `alembic check` against that test database, and admin check/lint/test/build as CI does. The S3 test service is a disposable Moto emulator; use a real configured bucket for deployment acceptance.

The next backend feature phase is **Phase 5 — Progress and Workout Analytics**. Actual logged performance and exercise history are now available as its inputs. Mobile SQLite, the client queue/reconciliation UI, mobile timer behavior and offline device acceptance remain outside this backend/admin milestone. Deployed secrets, a working SMS vendor/relay, licensed catalog content, remote CI/branch protection and scheduled backups/alerts remain external release tasks.
