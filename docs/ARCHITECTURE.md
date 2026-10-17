# Architecture

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack, Cache Components / Partial Prerendering, `proxy.ts`), React 19 |
| Language | TypeScript (strict, `noUncheckedIndexedAccess`) |
| Styling | Tailwind CSS v4 (design tokens in `src/app/globals.css`), logical properties for RTL, lucide icons |
| Database | PostgreSQL 15+ through Prisma 6 (migrations in `prisma/migrations`) |
| Validation | zod v4 at every service boundary |
| Tests | Vitest (unit and integration against real PostgreSQL), Playwright (e2e) |

It is a single deployable application. The public website, the three panels and the JSON API all share one service layer.

```
src/
  app/                 routes: (site) public pages, admin/, visitor/, warehouse/, login/, api/
  components/          UI by area: ui/ (primitives), catalog/, site/, visitor/, orders/, admin/, warehouse/, pwa/
  lib/                 pure, isomorphic helpers: money, digits, dates, availability, order workflow, permissions
  server/
    auth/              sessions, password hashing, the actor and permission checks
    modules/<domain>/  services (writes, in transactions) and queries (reads, scoped to the actor)
    db.ts              Prisma client (BIGINT money surfaced as JS numbers)
    errors.ts          typed domain errors → HTTP status / form errors
prisma/                schema, migrations, seed (+ seed-data/)
tests/                 unit/, integration/, e2e/
```

### Request flow

1. `src/proxy.ts` redirects requests to `/admin`, `/visitor` and `/warehouse` that carry no session cookie. This is an optimisation only, not a security boundary.
2. Pages, Server Actions and Route Handlers resolve the **actor**: user, role and permission set, loaded from the database session on every request.
3. Each page calls `requirePagePermission(...)`, which triggers `forbidden()` when the actor lacks it.
4. Server Actions call services. Every service re-checks permissions (`assertCan`) and validates its input with zod.
5. Every read goes through a **scope** (`orderScope`, `customerScope`). A record outside the actor's scope is reported as *not found*, which avoids leaking that it exists.

Pages with data call `connection()`, so they render per request. The static parts (header, footer, layout) are prerendered and streamed first.

## Domain model (main tables)

`User`, `Role`, `Permission` and `RolePermission` model accounts and RBAC. Roles live in the database and the code only ever checks permission keys, never role names. Related tables:
- `Session`: stores only the SHA-256 hash of the token.
- `LoginAttempt`: feeds rate limiting.

`Category`, `Brand`, `Product`, `ProductImage`/`ImageAsset` and `VehicleFitment` hold the catalogue. `Product.price` holds whole rials (BIGINT).

`Inventory` has one row per product: `onHand` (physical) and `reserved`. **available = onHand − reserved** and is never stored. Two more tables support it:
- `InventoryMovement`: an append-only ledger with before, change, after, type (`RECEIPT`, `ADJUSTMENT`, `STOCK_COUNT`, `RETURN`, `DISPATCH`), user, reason and reference.
- `StockReservation`: one row per order line, `ACTIVE` → `RELEASED` | `CONSUMED`.

`Customer` and `CustomerAssignment` link customers to visitors.

`Order`, `OrderItem`, `OrderStatusEvent` and `OrderNote` hold orders. Each order also keeps snapshots of the customer name and address and the requested delivery. Each item keeps snapshots of the SKU, name, the **requested** quantity and price, and the **final** quantity, price, discount and line total.

`AuditLog` records every significant write with a JSON diff. `Notification` holds in-app notifications. `ContactInquiry` holds website messages.

Database-level guarantees, added in the migration:
- `CHECK` constraints keep `onHand ≥ 0`, `reserved ≥ 0` and `reserved ≤ onHand`.
- Prices, quantities and discounts are kept within valid ranges.
- Order totals must be consistent.
- `pg_trgm` GIN indexes support catalogue search.

## Order workflow

```
DRAFT ─submit→ SUBMITTED ─start_review→ UNDER_REVIEW ─approve→ APPROVED ─start_preparing→ PREPARING
  │               │  └─approve────────────────────────────────↗                              │
  │               ├─reject→ REJECTED          (reject/cancel also from UNDER_REVIEW, APPROVED) │
  └─(delete)      └─cancel→ CANCELLED                                                        ↓
                                           DELIVERED ←deliver─ DISPATCHED ←dispatch─ READY_FOR_DISPATCH
```

- `src/lib/order-workflow.ts` defines the transitions and the permission each one needs. `transitionOrder` re-validates every transition on the server with a `SELECT … FOR UPDATE` row lock and an optimistic `version` check, then writes an `OrderStatusEvent`, an audit entry and notifications.
- The UI only offers actions that `availableActions()` returns for the current actor and status.
- Rejecting or cancelling requires a reason.
- `mark_ready` requires every line to be picked.
- `DELIVERED`, `CANCELLED` and `REJECTED` are terminal states.

## Inventory and reservations (no overselling, no double deduction)

| Event | onHand | reserved | Reservation | Movement |
| --- | --- | --- | --- | --- |
| Submit (or a desk quantity increase) | – | + q | ACTIVE | – |
| Desk quantity decrease | – | − q | adjusted | – |
| Reject / cancel | – | − q | RELEASED | – |
| Dispatch | − q | − q | CONSUMED | DISPATCH |
| Deliver | – | – | – | – |
| Receipt / adjustment / count / return | ± | – | – | yes |

A reservation is one conditional statement per line:

```sql
UPDATE "Inventory" SET reserved = reserved + $q
WHERE "productId" = $id AND "onHand" - reserved >= $q
```

If no row is updated, the line is short. The whole transaction rolls back and the caller receives `InsufficientStockError` with the per-line shortages. Lines are processed in sorted product order so concurrent multi-line orders cannot deadlock. Integration tests run 20 parallel single-unit orders against 7 units: exactly 7 succeed.

Dispatch moves `ACTIVE` reservations to `CONSUMED`, and the order status gates the step, so stock is deducted exactly once. Physical reductions cannot drop `onHand` below `reserved`.

Visitors never see raw stock figures, only "up to N units" (capped at 50) or availability labels. Their stock figures are validated again on the server at submission.

## Money

- Amounts are whole rials stored as BIGINT and converted to JS numbers by a Prisma result extension. The values involved, up to 10¹¹ × 9 999, stay well below 2⁵³.
- All arithmetic in `src/lib/money.ts` is BigInt-based with half-up rounding. Discounts are integer basis points.
- Prices are always taken from the database when an order is priced. Clients never send prices, and the order desk needs `pricing.manage` to override one.
- Submitting a draft re-prices it. After submission, order items keep their prices permanently, regardless of later catalogue price changes.

## Localisation

- `<html lang="fa-IR" dir="rtl">`. Styles use logical utilities (`ms-`/`me-`, `start`/`end`, `text-start`). The `.ltr` class keeps SKUs, emails and phone numbers left-to-right.
- The font stack is `Arial, "Noto Sans Arabic", Tahoma, sans-serif`, with no web-font downloads.
- Dates use `Intl.DateTimeFormat("fa-IR", { calendar: "persian", numberingSystem: "arabext", timeZone: "Asia/Tehran" })`. Business "today" is computed in Tehran time. The delivery-day pickers show Jalali dates and skip Fridays.
- Numbers use Persian digits with the Persian thousands separator. Input parsing accepts both Persian and Latin digits.

## PWA

- `src/app/manifest.ts` is RTL, has `start_url: /visitor` and includes maskable icons.
- `public/sw.js` is registered in production builds only. It caches hashed static assets cache-first and product images stale-while-revalidate. Page navigations are network-first, with an `autopart-pages` cache for public and visitor pages; admin and warehouse pages are never cached. `/offline` is the fallback.
- The service worker never touches API calls, non-GET requests, Server Actions or RSC payloads.
- The page cache is cleared on sign-out.
