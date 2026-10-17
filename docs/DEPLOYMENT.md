# Deployment

AutoPart is a single Next.js application backed by PostgreSQL. Any host that runs Node.js ≥ 20.9 (or a container) and can reach PostgreSQL 15+ works. Examples: a VPS behind Caddy or nginx, Docker or Kubernetes, Render, Railway or Fly.io.

## 1. Requirements

- PostgreSQL 15+ with a UTF-8 database and a dedicated application role.
- HTTPS in front of the app. Session cookies are `Secure` and `__Host-` prefixed in production, so sign-in does not work over plain HTTP. The PWA also needs HTTPS.
- Environment variables (see `.env.example`):

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | `postgresql://user:pass@host:5432/autopart?schema=public` |
| `APP_URL` | yes | Public origin, e.g. `https://autopart.example.ir` |
| `DEMO_MODE` | no | `true` only for showcase deployments with demo data |
| `SEED_DEMO_PASSWORD`, `ALLOW_DEMO_SEED` | only to seed demo data | the seed **wipes all data** |
| `COOKIE_SECURE` | no | Leave unset. `false` disables Secure cookies (private HTTP testing only). |
| `NEXT_OUTPUT` | no | `standalone` for a self-contained server bundle |

## 2. Build and release (Node host)

```bash
npm ci
npm run db:deploy          # apply migrations (safe to run on every release)
npm run ops -- bootstrap   # permissions + system roles (idempotent; safe on every release)
npm run build
npm run start              # or: PORT=3000 next start
```

First deployment only — create the first administrator (the password is read from the environment):

```bash
ADMIN_PASSWORD='<strong password>' npm run ops -- create-admin admin@your-company.ir "نام مدیر"
```

Run `db:deploy` **before** starting the new version. Migrations are forward-only. Never run `db:migrate` or `db:reset` in production.

**Standalone bundle (smaller runtime):**
1. Build with `NEXT_OUTPUT=standalone npm run build`.
2. Copy `.next/static` into `.next/standalone/.next/static`, and `public` into `.next/standalone/public`.
3. Run `node .next/standalone/server.js`.

This bundle was built and smoke-tested on the development machine. It returned 200 for the health check, public pages, manifest, service worker and icons.

## 3. Docker

`Dockerfile` (multi-stage, standalone output) and `docker-compose.yml` (PostgreSQL 17 → one-shot migrations → app) are included:

```bash
# .env.docker
POSTGRES_PASSWORD=<strong password>
APP_URL=https://autopart.example.ir
DEMO_MODE=false

docker compose --env-file .env.docker up -d --build
```

- **First start:** run `docker compose --env-file .env.docker run --rm migrate npm run ops -- bootstrap`. Then run `docker compose --env-file .env.docker run --rm -e ADMIN_PASSWORD=... migrate npm run ops -- create-admin admin@your-company.ir "نام مدیر"`.
- **Optional demo data** (destructive): run `docker compose --env-file .env.docker run --rm -e ALLOW_DEMO_SEED=true -e SEED_DEMO_PASSWORD=... migrate npx prisma db seed`.
- **Health check:** `GET /api/health` returns `{"status":"ok","database":"up"}`, or 503 when the database is unreachable.

> The Docker files were written to match the verified standalone build, but **they have not been built or run**, because Docker was not available in the development environment. Test them in your pipeline before relying on them.

Terminate TLS in front of the container, for example with Caddy:

```
autopart.example.ir {
  reverse_proxy app:3000
}
```

## 4. Operations

- **Backups:**
  - Take a nightly `pg_dump -Fc` and keep point-in-time recovery if the host supports it.
  - Product images are stored in the database, so they are included in the dump.
  - Test restores regularly.
- **Scaling:**
  - The app is stateless: sessions, rate limits and notifications are all in PostgreSQL, so several instances can run behind a load balancer.
  - Stock reservations are safe across instances because they rely on database row locks and conditional updates.
- **Maintenance:** schedule `npm run ops -- purge-auth` daily. It deletes expired sessions and login attempts older than 30 days. Expired sessions are already rejected without it; the job only keeps the tables small.
- **Monitoring:** watch `/api/health`. Unexpected server errors are logged with an `[api]` or `[action]` prefix.
- **First real deployment:**
  1. Do not seed.
  2. Run `ops -- bootstrap` and `ops -- create-admin` (above).
  3. Sign in, then create users, customers and the catalogue from `/admin`.

## 5. Installing the visitor app (PWA)

Visitors open **`https://<your-domain>/visitor/install`**, a public page with platform-specific instructions and an install button where the browser supports one. After installation the app opens full-screen at `/visitor`, with a home-screen icon and shortcuts for "new order", "my orders" and "customers".

### Android (Chrome, Edge, Samsung Internet)

1. Open `/visitor/install` (or any page) in Chrome.
2. Tap **نصب اتوپارت** (Install AutoPart) on the page, or open the browser menu **⋮** and choose **Install app** / **Add to Home screen**.
3. Confirm. The **اتوپارت** icon appears on the home screen and in the app drawer.

### iPhone / iPad (Safari, iOS 16.4+)

1. Open `/visitor/install` in **Safari**. Other iOS browsers may not offer installation.
2. Tap the **Share** button (the square with an arrow).
3. Choose **Add to Home Screen**, keep the name **اتوپارت** and tap **Add**.
4. Launch it from the home screen and sign in once.

### Offline behaviour

- Pages that a visitor opened recently (order history, customer pages, the catalogue) stay readable without a connection.
- Pages that were never opened show the `/offline` page.
- An order being composed is kept on the device and restored when the app is reopened.
- **Submitting requires a connection**, because stock is reserved and verified by the server at that moment.
- Signing out clears the cached pages from the device.
- Admin and warehouse pages are never cached.

### Updating

The service worker checks for updates on each launch, and a new release takes effect on the next start. To force an update, bump `VERSION` in `public/sw.js` when you change its caching logic.
