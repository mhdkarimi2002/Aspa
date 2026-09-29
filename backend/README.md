# ASPA Backend

FastAPI modular monolith for ASPA.

Docker uses Python 3.14.7, PostgreSQL 18.6, and Redis 8.10.1.
Local tooling targets Python 3.14 through `.python-version`.

## Configuration

Copy `.env.example` to `.env`, then generate a secret with:

```bash
uv run --no-project python -c 'import secrets; print(secrets.token_hex(32))'
```

Set `JWT_SECRET_KEY` to that value. Missing, short, and documented placeholder
secrets prevent startup. `.env` is ignored by Git and excluded from Docker builds.
Keep credentials out of source control.

## Docker development

```bash
docker compose up --build -d --wait
docker compose logs -f api
```

Compose provides service hostnames for database and Redis connections, applies
Alembic migrations, then starts the API. Dependencies come from `uv.lock` and the
API runs as a non-root user. PostgreSQL and Redis host ports bind to loopback.

For a production deployment with multiple API replicas, run `alembic upgrade head`
once in a deployment job, then launch replicas with the Dockerfile's Uvicorn command.
The supplied Compose credentials are for local development only. Configure deployment
credentials and TLS separately. Only trust proxy headers from your own reverse proxy:
authentication rate limiting uses the resolved client IP.

## Local development

1. Install [uv](https://docs.astral.sh/uv/) and configure `.env` as above.
   For the host-run API, `DATABASE_URL` and `REDIS_URL` must use `localhost`,
   as shown in `.env.example`, rather than Docker service names.
2. Start PostgreSQL and Redis: `docker compose up -d postgres redis`.
3. Install dependencies: `uv sync --locked`.
4. Apply migrations: `uv run alembic upgrade head`.
5. Run the API: `uv run uvicorn app.main:app --reload`.

OpenAPI is available at `http://localhost:8000/docs`. Run checks with:

```bash
uv run ruff check .
uv run ruff format --check .
uv run pyright
uv run pytest
```

Pyright checks application code and migrations in strict mode. Tests treat warnings
as errors. CI runs the same checks, including integration tests. Add dependencies
with `uv add` / `uv add --dev` and commit both `pyproject.toml` and `uv.lock`.

## Integration tests

Unit tests run without services. Database tests skip unless the following variables
are supplied. Use the isolated test stack; do not point tests at development data:

```bash
docker compose -f docker-compose.test.yml up -d --wait
TEST_DATABASE_URL=postgresql+asyncpg://aspa:aspa@127.0.0.1:55432/aspa_test \
TEST_REDIS_URL=redis://127.0.0.1:56379/0 \
uv run pytest
docker compose -f docker-compose.test.yml down
```

Tests apply real Alembic migrations to `aspa_test` and roll back test transactions.
PostgreSQL test storage is temporary. The test Compose project is separate from the
development stack; stopping it does not affect development containers or volumes.

## Auth API

- `POST /api/auth/register/otp/request` accepts `phone_number`, `birthdate`, and `gender`.
- `POST /api/auth/register/otp/verify` accepts `phone_number` and `code`, creates the
  account, and returns access and refresh tokens.
- `POST /api/auth/login/otp/request` accepts only `phone_number`.
- `POST /api/auth/login/otp/verify` accepts `phone_number` and `code`, then returns an
  access token and a rotating refresh token for an existing account.
- `POST /api/auth/refresh` consumes a refresh token and returns a new access/refresh
  token pair. Consumed refresh tokens cannot be replayed.
- `POST /api/auth/logout` invalidates the supplied refresh token and is idempotent.
- `GET /api/users/me` returns the authenticated profile.
- `PATCH /api/users/me` updates `username`, `email`, `birthdate`, `gender`, or `avatar`.
- `DELETE /api/users/me` permanently deletes the account and its owned data.

Profiles expose `username`, `email`, `phone_number`, `birthdate`, `gender`,
`account_level`, and `avatar`. Gender values are `male`, `female`, `other`, and
`prefer_not_to_say`. Account levels are `free` and `pro`; new accounts default to
`free`, and clients cannot change their own account level.

Iranian mobile numbers are normalized to E.164 (`+989xxxxxxxxx`). Local, Persian,
and Arabic digits are accepted. The bundled local SMS provider keeps the latest
code in process memory at `app.state.sms_provider.sent_codes`; it never logs OTPs.
Replace this provider with the production SMS adapter before deployment.
When `ENVIRONMENT=local`, OTP request responses include `dev_code` for local
frontend development and the OTP is always `11111`. This fixed code is never
used in test, staging, or production, where OTPs remain random; `dev_code` is
also omitted outside the local environment.

Routes use the stable `/api` prefix without a version segment. Health probes remain
at `/health` and `/ready`. API errors use `{\"error\": {\"code\", \"message\", \"details\"?}}`.

Authentication routes share a Redis-backed limit of 20 requests per client IP per
60 seconds (configurable in `.env`). Excess requests return 429 with `Retry-After`.
If Redis is unavailable, authentication returns 503 rather than bypassing the limit.
OTP values are hashed in Redis, expire after five minutes, have a resend cooldown,
and permit five verification attempts by default. Tokens must contain `sub`, `iat`,
and `exp`. Authentication failures return the Bearer challenge header.

Refresh tokens are opaque random values. Only keyed token digests are used in Redis
keys, tokens expire after 30 days by default, and every refresh rotates the token
atomically with Redis `GETDEL`. Logout invalidates the selected refresh token; an
already-issued access token remains valid until its normal expiration.

## Exercise catalog API

- `GET /api/exercises` lists active exercises.
- `POST /api/exercises` creates an exercise. Requires a bearer token.
- `GET /api/exercises/{id}` returns exercise details, muscle groups, equipment, and media keys.
- `POST /api/exercises/custom` creates a private exercise for the authenticated user.
- `PATCH /api/exercises/{id}/custom` updates an owned custom exercise.
- `DELETE /api/exercises/{id}` removes an exercise. Requires a bearer token.
- `GET /api/muscle-groups` lists active muscle groups.
- `POST /api/muscle-groups` creates a muscle group. Requires a bearer token.
- `DELETE /api/muscle-groups/{id}` removes a muscle group. Requires a bearer token.
- `GET /api/equipment` lists active equipment.

Creating an exercise requires at least one active primary muscle group. Equipment and
secondary muscle groups are optional and must also be active. A muscle group name
must be unique in Persian. Deleting a muscle group that is assigned
to an exercise, or an exercise that belongs to a workout plan, returns 409.

Custom exercises require a Persian name, how-to description, one or more ordered
instruction steps, and at least one GIF or MP4 object-storage reference. They are
visible only to their owner and can only be added to that user's workout plans.
Exercise responses expose `is_custom`, `can_edit`, `instruction_steps`, and `media`.

The exercise list supports `page`, `page_size`, Persian `search`, `muscle_group_id`,
`equipment_id`, `difficulty`, `sort`, and `direction` query parameters. Difficulty
values are `beginner`, `intermediate`, and `advanced`; sort values are `name_fa` and
`created_at`. Media fields contain S3-compatible object keys rather
than binary content.

## Workout plan API

Workout-plan endpoints require a bearer token. The API supports:

- `GET/POST /api/workout-plans` to list and create plans.
- `GET/PATCH/DELETE /api/workout-plans/{plan_id}` to read, edit, archive, or delete.
- `POST /api/workout-plans/{plan_id}/duplicate` to deep-copy a plan.
- Nested `/days` routes to create, edit, reorder, and remove training days.
- Nested `/exercises` routes to configure sets, rep ranges, rest, notes, and ordering.

Every workout-plan response also includes `muscle_coverage`, which counts how many
exercise placements target each muscle as a primary or secondary muscle.

Archived plans are excluded by default; pass `include_archived=true` when listing
to include them. Setting `is_archived` through the plan PATCH endpoint performs a
reversible archive, while DELETE permanently removes the plan.
