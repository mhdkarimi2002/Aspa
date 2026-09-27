# Aspa

## Run with Docker Compose

Build and start the frontend, API, PostgreSQL, and Redis from the repository root:

```bash
docker compose up --build
```

The services are available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API documentation: http://localhost:8000/docs

Populate the running database with repeatable development data:

```bash
docker compose run --rm seed
```

The command can be run more than once without duplicating the sample data. It
creates a bilingual exercise catalog, active and archived workout plans, and a
development account:

```text
Phone number: +989120000000
```

Request a login OTP for this phone number. In the local environment only, the
OTP request response includes `dev_code` so the frontend can complete the flow
without an SMS provider. Every local registration and login OTP is `11111`.

The Compose configuration includes a development-only JWT secret. Set a strong
secret outside local development:

```bash
JWT_SECRET_KEY="$(openssl rand -hex 32)" docker compose up --build
```

Stop the stack with `docker compose down`. To also remove the PostgreSQL data
volume, run `docker compose down --volumes`.
