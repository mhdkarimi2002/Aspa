# ASPA Admin Panel

This directory contains the separate SvelteKit admin application with TypeScript and the Node adapter. Its user interface is Persian and right-to-left.

## Local development

```bash
npm install
npm run dev
```

With Docker Compose, the panel is available at `http://localhost:3001`.

## Checks

```bash
npm run check
npm run lint
npm run test
npm run build
```

For host development, copy `.env.example` to `.env`; set `ADMIN_LOCAL_LOGIN=true` only to use the seeded development credentials.

After running `docker compose run --rm seed`, log in with username `admin` and password `admin`. This method works only in the local environment. Docker Compose binds the API and admin ports to localhost. Regular users' OTP login is unchanged.

The panel includes user lists and details, account status and level changes, common-exercise lists and editing, and muscle-group and equipment management. The media library uploads GIF, MP4, PNG and JPEG files to configured S3-compatible storage,
shows signed previews and records review/usage-rights status. Attach approved object keys
in exercise forms. Shared navigation, pending/error feedback and system status are available.

Production admins sign in with phone OTP; regular accounts cannot establish admin sessions.
See [the backend/admin delivery guide](../docs/backend-admin-finish-line.md) for configuration
and remaining external release requirements.

To grant the admin role to an existing user, use an operator-controlled server shell. The `admin` username login still uses only the local seeded account:

```bash
docker compose exec api python -m app.db.grant_admin 09120000000
```

The API checks admin authorization on every request. Admin changes are recorded in the audit-log table.
