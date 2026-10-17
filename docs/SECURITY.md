# Security

## Authentication and sessions

- **Password hashing** uses scrypt (N = 2¹⁵, r = 8, p = 1, 64-byte key) with a 16-byte random salt per password and constant-time comparison (`src/server/auth/password.ts`). The format is versioned so hashes can be upgraded on the next login.
- **Password policy:** 10–128 characters, with at least one Latin letter and one digit.
- **Sessions:**
  - A 32-byte random token goes in the cookie. The database stores only the token's SHA-256 hash.
  - Sessions last 7 days and are invalidated server-side on sign-out.
  - Deactivating a user, changing their role or resetting their password ends all of that user's sessions.
- **Cookie:** `HttpOnly`, `SameSite=Lax`, `Path=/`. In production it is also `Secure` and uses the `__Host-` prefix.
- **Login throttling:** every attempt is recorded in `LoginAttempt`. Five failures per email or 25 per IP within 15 minutes block further attempts, including ones with the correct password, until the window passes. Error messages are generic, and unknown emails are verified against a dummy hash to avoid timing differences.
- **No self-registration.** Accounts are created by administrators.

## Authorisation (RBAC and record scope)

- Permissions are fine-grained keys (`src/lib/permissions.ts`). Roles are stored in the database and can be edited in `/admin/roles`. The Administrator role is locked.
- Code checks **permissions, never role names**. The checks happen at three layers:
  - pages, through `requirePagePermission`, which calls `forbidden()`;
  - Server Actions and route handlers, through `requirePermission`;
  - again inside every service, through `assertCan`.
- **Record-level scope (IDOR protection):**
  - Visitors only see orders they created and customers assigned to them.
  - Warehouse staff only see orders in fulfilment states, and never prices.
  - Out-of-scope IDs return *not found*.
  - The integration tests cover cross-visitor access to orders and customers.
- Sensitive actions require dedicated permissions: changing prices (`pricing.manage`), adjusting stock (`inventory.adjust`) and approving one's own orders (`orders.approve_own`).
- `src/proxy.ts` only redirects anonymous users early and is not relied on for security.

## Request integrity

- **CSRF:**
  - Server Actions are protected by Next.js's built-in Origin/Host check.
  - The JSON `POST` endpoint (`/api/v1/orders`) runs `assertSameOrigin`.
  - Cookies are `SameSite=Lax`.
- **Validation:** zod schemas validate every service input on the server. Clients never supply prices or totals.
- **Idempotency:** order submission takes an idempotency key, so retries and double-taps create one order.
- **Concurrency:** stock reservation is a single conditional `UPDATE`, and orders use row locks and optimistic versions. The database `CHECK` constraints act as the last line of defence.
- **Uploads:**
  - Images must be at most 2 MB, with a maximum of 8 per product.
  - The type is detected from magic bytes (JPEG, PNG, WebP), not from the filename or the declared MIME type.
  - Images are served from `/api/images/[id]` with `X-Content-Type-Options: nosniff`.
- **Contact form:** a honeypot field plus a limit of 5 messages per hour per IP.

## HTTP headers (`next.config.ts`)

- `Content-Security-Policy`:
  - `default-src 'self'`; scripts limited to self (plus the inline scripts Next.js requires).
  - `img-src 'self' data: blob:`; `connect-src 'self'`.
  - `frame-ancestors 'none'`; `form-action 'self'`; `base-uri 'self'`; `object-src 'none'`.
- `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy`: camera, microphone, geolocation, payment and USB disabled.
- `Cross-Origin-Opener-Policy: same-origin`.
- `Strict-Transport-Security` (production only).
- The `X-Powered-By` header is removed.

## Audit trail

`AuditLog` records actor, action, entity, a JSON diff and IP address for:
- sign-ins;
- user, role and permission changes;
- product and price changes;
- stock adjustments;
- every order transition, line adjustment, note and delivery change;
- customer changes.

Administrators and managers can view it at `/admin/audit`. Inventory additionally has its own append-only movement ledger.

## Operational guidance

- Never set `DEMO_MODE=true` on a deployment with real data, and never run `db:seed` against it. The seed refuses to run in production unless `ALLOW_DEMO_SEED=true`.
- Serve the app only over HTTPS. Secure cookies require it.
- Use a dedicated PostgreSQL role with least privilege. Back up the database regularly; see DEPLOYMENT.md.
- Rotate demo passwords and remove the demo accounts before going live.

## Known gaps

- There is no multi-factor authentication and no self-service password reset (administrators reset passwords).
- Rate limiting is stored in the database. It works across instances but is basic, so put a WAF or reverse-proxy limit in front of public deployments.
- The CSP still needs `'unsafe-inline'` for scripts because of Next.js inline bootstrap scripts; nonce-based CSP was not implemented.
