# AutoPart · فهرست صفحات (Index)

This project is a **Next.js App Router** application, so it has no `index.html` file. Each screen is a React component in a `page.tsx` file under `src/app/`, and the URL comes from the folder path. The homepage `/` is `src/app/(site)/page.tsx`. Folders in parentheses, such as `(site)` and `(app)`, are only for grouping and do not appear in the URL.

**`index.html` (screenshot gallery):** double-click `index.html` in the project folder to see screenshots of all 46 pages; it opens without the server running. Click a picture to see the full page, or click the address under it to open the live page (the server must be running). The images are in `preview/`. To refresh them after UI changes, start the app and run `npm run index:build`.

**Interactive index:** start the app and open **http://localhost:3000/all-pages**. It lists every screen as a clickable link, filled with real demo records, and shows which demo account each section needs. It is available only when `DEMO_MODE=true`.

## Start the app

Run each command in its own terminal, in order:

```bash
npm run db:local
```

```bash
npm run dev
```

Then open http://localhost:3000/all-pages.

All demo accounts use the password in `.env` → `SEED_DEMO_PASSWORD` (`AutoPart-Demo-2026`). The login page also has one-click demo login buttons.

| Account | Role | Opens |
| --- | --- | --- |
| `visitor@autopart.test` | ویزیتور فروش (field sales) | `/visitor` |
| `manager@autopart.test` | مدیر فروش (order desk) | `/admin` |
| `admin@autopart.test` | مدیر سیستم (administrator; users and roles) | `/admin` |
| `warehouse@autopart.test` | انباردار | `/warehouse` |
| `supervisor@autopart.test` | سرپرست انبار (may adjust stock) | `/warehouse` |

## URL → source file

### 1. Public website (no login)
| URL | Page | File |
| --- | --- | --- |
| `/` | صفحه اصلی | `src/app/(site)/page.tsx` |
| `/products` | کاتالوگ (search, filters, sort, pages) | `src/app/(site)/products/page.tsx` |
| `/products/[slug]` | جزئیات کالا | `src/app/(site)/products/[slug]/page.tsx` |
| `/categories/[slug]` | صفحه دسته | `src/app/(site)/categories/[slug]/page.tsx` |
| `/brands` | برندها | `src/app/(site)/brands/page.tsx` |
| `/search` | جستجو | `src/app/(site)/search/page.tsx` |
| `/about` | درباره ما | `src/app/(site)/about/page.tsx` |
| `/contact` | تماس با ما | `src/app/(site)/contact/page.tsx` |
| `/all-pages` | **این فهرست (Index)** | `src/app/(site)/all-pages/page.tsx` |
| `/login` | ورود همکاران | `src/app/login/page.tsx` |
| `/visitor/install` | راهنمای نصب PWA | `src/app/visitor/install/page.tsx` |
| `/offline` | صفحه آفلاین | `src/app/offline/page.tsx` |

Shared layout (header and footer): `src/app/(site)/layout.tsx`. Root layout (RTL, font): `src/app/layout.tsx`. Styles: `src/app/globals.css`.

### 2. Visitor app (`visitor@autopart.test`)
| URL | Page | File |
| --- | --- | --- |
| `/visitor` | داشبورد | `src/app/visitor/(app)/page.tsx` |
| `/visitor/orders` | سفارش‌های من | `src/app/visitor/(app)/orders/page.tsx` |
| `/visitor/orders/new` | ثبت سفارش جدید | `src/app/visitor/(app)/orders/new/page.tsx` |
| `/visitor/orders/[id]` | جزئیات سفارش | `src/app/visitor/(app)/orders/[id]/page.tsx` |
| `/visitor/orders/[id]/edit` | ویرایش پیش‌نویس | `src/app/visitor/(app)/orders/[id]/edit/page.tsx` |
| `/visitor/customers` | مشتریان من | `src/app/visitor/(app)/customers/page.tsx` |
| `/visitor/customers/new` | مشتری جدید | `src/app/visitor/(app)/customers/new/page.tsx` |
| `/visitor/customers/[id]` | پرونده مشتری | `src/app/visitor/(app)/customers/[id]/page.tsx` |
| `/visitor/catalogue` | کاتالوگ قابل سفارش | `src/app/visitor/(app)/catalogue/page.tsx` |

The order screen is `src/components/visitor/order-composer.tsx`, and the app layout is `src/app/visitor/(app)/layout.tsx`.

### 3. Order desk and admin panel (`manager@` / `admin@autopart.test`)
| URL | Page | File |
| --- | --- | --- |
| `/admin` | داشبورد | `src/app/admin/page.tsx` |
| `/admin/orders` | سفارش‌ها | `src/app/admin/orders/page.tsx` |
| `/admin/orders/[id]` | بررسی / تأیید سفارش | `src/app/admin/orders/[id]/page.tsx` |
| `/admin/products` | کالاها | `src/app/admin/products/page.tsx` |
| `/admin/products/new` | افزودن کالا | `src/app/admin/products/new/page.tsx` |
| `/admin/products/[id]` | ویرایش کالا | `src/app/admin/products/[id]/page.tsx` |
| `/admin/categories` | دسته‌بندی‌ها | `src/app/admin/categories/page.tsx` |
| `/admin/brands` | برندها | `src/app/admin/brands/page.tsx` |
| `/admin/inventory` | موجودی | `src/app/admin/inventory/page.tsx` |
| `/admin/inventory/movements` | گردش کالا | `src/app/admin/inventory/movements/page.tsx` |
| `/admin/customers` | مشتریان | `src/app/admin/customers/page.tsx` |
| `/admin/customers/new` | مشتری جدید | `src/app/admin/customers/new/page.tsx` |
| `/admin/customers/[id]` | پرونده مشتری | `src/app/admin/customers/[id]/page.tsx` |
| `/admin/users` | کاربران (admin only) | `src/app/admin/users/page.tsx` |
| `/admin/users/new` | کاربر جدید (admin only) | `src/app/admin/users/new/page.tsx` |
| `/admin/users/[id]` | ویرایش کاربر (admin only) | `src/app/admin/users/[id]/page.tsx` |
| `/admin/roles` | نقش‌ها و مجوزها (admin only) | `src/app/admin/roles/page.tsx` |
| `/admin/reports` | گزارش‌ها | `src/app/admin/reports/page.tsx` |
| `/admin/reports/export/[report]` | خروجی CSV | `src/app/admin/reports/export/[report]/route.ts` |
| `/admin/audit` | گزارش ممیزی | `src/app/admin/audit/page.tsx` |
| `/admin/inquiries` | پیام‌های وب‌سایت | `src/app/admin/inquiries/page.tsx` |

The CSV reports are `orders-by-date`, `orders-by-status`, `sales-by-product`, `sales-by-customer`, `sales-by-visitor` and `inventory`.

### 4. Warehouse (`warehouse@` / `supervisor@autopart.test`)
| URL | Page | File |
| --- | --- | --- |
| `/warehouse` | صف کار | `src/app/warehouse/page.tsx` |
| `/warehouse/orders` | سفارش‌ها | `src/app/warehouse/orders/page.tsx` |
| `/warehouse/orders/[id]` | فهرست جمع‌آوری و ارسال | `src/app/warehouse/orders/[id]/page.tsx` |
| `/warehouse/inventory` | موجودی | `src/app/warehouse/inventory/page.tsx` |

### 5. System pages and API
| URL | Purpose | File |
| --- | --- | --- |
| *(any unknown URL)* | صفحه ۴۰۴ | `src/app/not-found.tsx` |
| *(wrong role)* | صفحه ۴۰۳ | `src/app/forbidden.tsx` |
| `/manifest.webmanifest` | PWA manifest | `src/app/manifest.ts` |
| `/sw.js` | Service worker | `public/sw.js` |
| `/api/health` | Health check | `src/app/api/health/route.ts` |
| `/api/v1/products`, `/api/v1/customers`, `/api/v1/orders` | JSON API (signed in) | `src/app/api/v1/*/route.ts` |
| `/api/images/[id]` | Product images | `src/app/api/images/[id]/route.ts` |

## Where the rest of the code lives
- `src/server/modules/*`: business logic (orders, inventory, products, customers, users, reports, audit).
- `src/lib/*`: money, Persian digits and Jalali dates, order workflow and permissions.
- `prisma/schema.prisma` and `prisma/seed.ts`: database schema and demo data.
- `tests/`: unit, integration and e2e tests.
- `README.md` and `docs/`: setup, architecture, security, deployment and PWA installation.
