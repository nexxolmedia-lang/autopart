# AutoPart · اتوپارت

> سامانه یکپارچه توزیع قطعات خودرو: وب‌سایت عمومی، اپلیکیشن موبایل ویزیتورها (PWA) با سفارش‌گیری بر اساس موجودی لحظه‌ای، میز سفارش و پنل مدیریت، و پنل انبار. کل رابط کاربری فارسی و راست‌به‌چپ، با فونت Arial، مبالغ به **ریال** و تاریخ‌ها به **تقویم هجری شمسی** با ارقام فارسی است.

AutoPart is a full-stack platform for an automotive-parts distributor:

| Area | Who | What |
| --- | --- | --- |
| **Public website** `/` | Workshops, fleets | Catalogue with search, filters, sort and pagination; category and brand pages; product detail with fitment and specs; about and contact pages. |
| **Visitor app** `/visitor` | Field sales reps (phone, installable PWA) | Assigned customers (and creating new ones); building orders against **live available stock** ("up to N units"); drafts; submitting; order history and status. |
| **Order desk / admin** `/admin` | Sales managers, administrators | Reviewing, adjusting, approving, rejecting and cancelling orders, with notes and delivery arrangements. Products, categories, brands and images. Inventory adjustments and movement history. Customers and visitor assignments. Users, roles and permissions. Reports with CSV export. Audit log. Website inquiries. |
| **Warehouse** `/warehouse` | Warehouse staff | Fulfilment queue, pick lists sorted by bin, picking, ready, dispatch and deliver. Inventory adjustments for supervisors only. |

Everything is in Persian (RTL) with an Arial font stack. Money is stored as whole **rials (IRR)** in BIGINT columns, and dates are shown in the **Solar Hijri** calendar (Asia/Tehran) with Persian digits.

---

## Quick start (local)

Requirements: **Node.js ≥ 20.9** (tested with Node 24.19 and npm 11). No Docker or system PostgreSQL install is needed: the project ships an embedded PostgreSQL 17 for development.

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # defaults match the embedded database
```

In `.env`, set `DEMO_MODE="true"` and choose a `SEED_DEMO_PASSWORD` (e.g. `AutoPart-Demo-2026`). Then:

```bash
npm run db:local            # terminal 1 – starts PostgreSQL on :54329 and creates autopart_dev + autopart_test
npm run db:deploy           # terminal 2 – applies migrations
npm run db:seed             # loads demo data (wipes the database first!)
npm run dev                 # http://localhost:3000
```

> On npm ≥ 11, install scripts must be allowed. `package.json` contains an `allowScripts` block for prisma, @prisma/engines, @prisma/client, embedded-postgres, esbuild and unrs-resolver. If `npm install` reports blocked scripts, run `npm approve-scripts` and then `npm rebuild`.

**Using your own PostgreSQL (15+)** instead: point `DATABASE_URL` and `TEST_DATABASE_URL` at it, then skip `db:local`. The databases must use UTF-8 encoding.

### Index of all pages

Open **http://localhost:3000/all-pages** (when `DEMO_MODE=true`) for a clickable list of every screen, with real demo records and the account each section needs. [INDEX.md](INDEX.md) maps every URL to its source file. As a Next.js App Router project there is no `index.html`; the homepage is `src/app/(site)/page.tsx`.

### Demo accounts

All demo accounts share the password set in `SEED_DEMO_PASSWORD`. When `DEMO_MODE=true`, the login page lists them as one-click buttons.

| Email | Role | Lands on |
| --- | --- | --- |
| `admin@autopart.test` | مدیر سیستم (Administrator) | `/admin` |
| `manager@autopart.test` | مدیر فروش (Sales manager / order desk) | `/admin` |
| `visitor@autopart.test` | ویزیتور فروش (Field visitor) – 6 customers | `/visitor` |
| `sara.hosseini@autopart.test`, `mehdi.jafari@autopart.test` | Visitors (other territories) | `/visitor` |
| `warehouse@autopart.test` | انباردار (Warehouse operator) | `/warehouse` |
| `supervisor@autopart.test` | سرپرست انبار (Warehouse supervisor, may adjust stock) | `/warehouse` |

The seed contains 64 products in 9 categories from 8 fictional brands, plus 17 customers. It also has 52 historical orders spread over 90 days and every workflow state. All the data is replayed through the real services, so stock, reservations, movements and the audit trail are all consistent. Some seeded scenarios:

- `VLX-BC-0712` (left front brake caliper) has exactly **2 units available**, which lets you see the "up to N" limit and the stock validation.
- Two products had price changes after orders were placed: `NRD-OF-1045` and `VLX-BP-1520`. Their old orders keep the historical prices.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js development server, production build, production server |
| `npm run lint` / `typecheck` | ESLint (Next.js and React Compiler rules) and `tsc --noEmit` |
| `npm run db:local` | Embedded PostgreSQL for development (data in `.local-db/`) |
| `npm run db:migrate` | Create or apply migrations in development (`prisma migrate dev`) |
| `npm run db:deploy` | Apply migrations (`prisma migrate deploy`), for CI and production |
| `npm run db:seed` | **Wipe** and load the demo data |
| `npm run db:reset` | Drop the database, re-migrate and re-seed (destructive) |
| `npm test` | Unit and integration tests (Vitest) |
| `npm run test:unit` / `test:integration` / `test:e2e` | Individual suites |
| `npm run ops -- bootstrap | create-admin | purge-auth` | Production operations: create roles and permissions, create the first admin, clean up auth records (see DEPLOYMENT.md) |
| `node scripts/generate-icons.mjs` | Re-render the PWA icons into `public/icons/` |

## Tests

| Suite | Tool | Count | Notes |
| --- | --- | --- | --- |
| Unit | Vitest | 34 | Money arithmetic and rounding, the order state machine, availability labels, Persian digits and Jalali dates, password hashing, role defaults |
| Integration | Vitest + real PostgreSQL | 39 | Runs against `TEST_DATABASE_URL`, whose name must contain `test`; each file truncates it. Covers auth, throttling, RBAC, IDOR protection, the product and price audit, inventory movements and DB constraints, and the full order lifecycle including reservations, historical prices and idempotency. **Concurrency:** 20 parallel orders for 7 units never oversell; opposite-order multi-line orders do not deadlock. |
| End-to-end | Playwright (Chromium, desktop + Pixel 7) | 16 | Runs the production build against a separate, freshly seeded `autopart_e2e` database. Covers the public site and the Persian 404 page; the visitor ordering on a phone with the stock limit; visitor → order desk → warehouse → delivered; access control; offline service-worker behaviour |

```bash
npm run test:unit
npm run test:integration          # needs the database running (npm run db:local)
npx playwright install chromium   # first time only
npm run build && npm run test:e2e # starts its own server on :3100
```

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): structure, domain model, order workflow, inventory and reservations, money, localisation
- [docs/SECURITY.md](docs/SECURITY.md): authentication, sessions, RBAC, CSRF, rate limiting, headers, audit
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): production build, environment variables, Docker, migrations, backups, **PWA installation on Android and iOS**

## Main routes

**Public:** `/`, `/products` (`?q=&category=&brand=&stock=in&sort=&page=`), `/products/[slug]`, `/categories/[slug]`, `/brands`, `/search`, `/about`, `/contact`, `/login`, `/visitor/install`, `/offline`

**Visitor:** `/visitor`, `/visitor/orders`, `/visitor/orders/new`, `/visitor/orders/[id]`, `/visitor/orders/[id]/edit`, `/visitor/customers`, `/visitor/customers/new`, `/visitor/customers/[id]`, `/visitor/catalogue`

**Admin:** `/admin`, `/admin/orders[/id]`, `/admin/products[/new|/id]`, `/admin/categories`, `/admin/brands`, `/admin/inventory`, `/admin/inventory/movements`, `/admin/customers[/new|/id]`, `/admin/users[/new|/id]`, `/admin/roles`, `/admin/reports`, `/admin/reports/export/[report]` (CSV), `/admin/audit`, `/admin/inquiries`

**Warehouse:** `/warehouse`, `/warehouse/orders`, `/warehouse/orders/[id]`, `/warehouse/inventory`

**API (session-authenticated JSON):**
- `GET /api/v1/products`
- `GET /api/v1/customers`
- `GET|POST /api/v1/orders`
- `GET /api/images/[id]`
- `GET /api/health`

## Assumptions and known limitations

- **Single warehouse and single currency (IRR).** Prices exclude VAT; there is no tax, invoicing or payment processing.
- **Visitors cannot place orders offline.** Stock must be confirmed by the server at submission. While offline, the PWA shows recently visited pages and keeps an unsent order on the device.
- **Product images are stored in PostgreSQL** (at most 2 MB each, with magic-byte validation). That is fine for a catalogue this size; use object storage for large catalogues.
- **Soft 404/403 on some routes.** Pages use Partial Prerendering, so on dynamic product and category URLs, and on the detail pages of private areas, the static shell streams before the data check. A missing product therefore returns HTTP 200 with the 404 page and a `noindex` tag. A forbidden detail page returns 200 with the 403 page. No protected data is sent, and an e2e test checks this. Unknown routes return a real 404.
- **No notifications outside the app.** There are no emails, SMS or push messages; notifications are in-app only. Password reset is done by an administrator.
- Fitment years are stored as Gregorian years and shown as Solar Hijri years (year − 621), which is approximate for model years.
- Dates are formatted with the platform's `Intl` Persian calendar. Browsers or Node builds without full ICU will fall back to Gregorian.
- The Docker image and compose file are provided but were **not built in the development environment**, because Docker was not available. The standalone server they package was built and smoke-tested locally.
