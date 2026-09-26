# Frontend architecture

Feature folders own a use case. `app/` only routes to them. Shared UI stays in `components/ui`.

```text
src/features/<feature>/
  domain/        pure rules
  data/          repository and session interfaces
  service.ts     use case, depends on interfaces
  actions.ts     Next.js adapter
  components/
src/shared/api/  HTTP transport only
```

## SOLID

- A repository talks to the API. It does not render, validate form input, or set cookies.
- A service depends on `AuthRepository` and `SessionStore`, not on `fetch`.
- Copy and phone rules live outside the repository.
- A new feature adds its own repository. Do not grow one shared endpoint module.
- Pages do not call `fetch`.
