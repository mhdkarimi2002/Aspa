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

The Compose configuration includes a development-only JWT secret. Set a strong
secret outside local development:

```bash
JWT_SECRET_KEY="$(openssl rand -hex 32)" docker compose up --build
```

Stop the stack with `docker compose down`. To also remove the PostgreSQL data
volume, run `docker compose down --volumes`.
