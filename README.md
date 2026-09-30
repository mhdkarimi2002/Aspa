# Aspa

## Run with Docker Compose

Build and start the frontend, admin panel, API, PostgreSQL, and Redis from the repository root:

```bash
docker compose up --build
```

The services are available at:

- Frontend: http://localhost:3000
- پنل مدیریت: http://localhost:3001
- Backend API: http://localhost:8000
- API documentation: http://localhost:8000/docs

Populate the running database with repeatable development data:

```bash
docker compose run --rm seed
```

The command can be run more than once without duplicating the sample data. It
creates a Persian exercise catalog, active and archived workout plans, and a
development administrator account:

```text
Phone number: +989120000000
```

For the local admin panel at `http://localhost:3001/login`, use username
`admin` and password `admin` after seeding. This admin login is disabled outside
the local environment. Regular app users still sign in with a phone OTP; local
registration and login OTPs are `11111`.

The Compose configuration includes a development-only JWT secret. Set a strong
secret outside local development:

```bash
JWT_SECRET_KEY="$(openssl rand -hex 32)" docker compose up --build
```

Stop the stack with `docker compose down`. To also remove the PostgreSQL data
volume, run `docker compose down --volumes`.
