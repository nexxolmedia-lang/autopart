import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ExternalLink, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { Container } from "@/components/site/section";
import { toPersianDigits } from "@/lib/digits";
import { formatOrderNumber } from "@/lib/order-workflow";
import { prisma } from "@/server/db";

export const metadata: Metadata = { title: "فهرست همه صفحات", robots: { index: false, follow: false } };

/**
 * Demo/QA index: every screen of the web app with working example links.
 * Only available when DEMO_MODE=true (it lists the demo accounts).
 */
export default function AllPagesPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "خانه" }, { label: "فهرست صفحات" }]}
        eyebrow="فهرست صفحات · Index"
        title={
          <>
            همه صفحات اتوپارت
            <br />
            <span className="text-bone/45">در یک نگاه.</span>
          </>
        }
        description="هر بخش نشان می‌دهد با کدام حساب نمایشی وارد شوید. روی هر نشانی بزنید تا همان صفحه باز شود. صفحه‌های دارای شناسه با رکوردهای واقعی داده‌های نمایشی پر شده‌اند."
      />
      <Suspense fallback={<Container className="py-16"><div className="skeleton h-96" /></Container>}>
        <IndexContent />
      </Suspense>
    </>
  );
}

type Row = { label: string; href: string; note?: string; raw?: boolean };
type Group = { id: string; title: string; account?: { email: string; role: string; home: string }; hint?: string; rows: Row[] };

async function IndexContent() {
  await connection();
  if (process.env.DEMO_MODE !== "true") notFound();

  const visitor = await prisma.user.findUnique({ where: { email: "visitor@autopart.test" }, select: { id: true } });
  const [product, category, visitorOrder, visitorDraft, visitorCustomer, reviewOrder, warehouseOrder, adminProduct, adminCustomer, sampleUser] = await Promise.all([
    prisma.product.findFirst({ where: { status: "ACTIVE" }, orderBy: [{ isFeatured: "desc" }, { name: "asc" }], select: { slug: true, name: true } }),
    prisma.category.findFirst({ orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } }),
    prisma.order.findFirst({ where: { visitorId: visitor?.id ?? "-", status: { not: "DRAFT" } }, orderBy: { createdAt: "desc" }, select: { id: true, number: true } }),
    prisma.order.findFirst({ where: { visitorId: visitor?.id ?? "-", status: "DRAFT" }, orderBy: { createdAt: "desc" }, select: { id: true, number: true } }),
    prisma.customer.findFirst({ where: { assignments: { some: { userId: visitor?.id ?? "-" } } }, orderBy: { businessName: "asc" }, select: { id: true, businessName: true } }),
    prisma.order.findFirst({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } }, orderBy: { createdAt: "asc" }, select: { id: true, number: true } }),
    prisma.order.findFirst({ where: { status: { in: ["APPROVED", "PREPARING", "READY_FOR_DISPATCH"] } }, orderBy: { createdAt: "asc" }, select: { id: true, number: true } }),
    prisma.product.findFirst({ orderBy: { sku: "asc" }, select: { id: true, sku: true } }),
    prisma.customer.findFirst({ orderBy: { code: "asc" }, select: { id: true, businessName: true } }),
    prisma.user.findUnique({ where: { email: "visitor@autopart.test" }, select: { id: true, name: true } }),
  ]);

  const opt = (cond: unknown, row: Row): Row[] => (cond ? [row] : []);

  const groups: Group[] = [
    {
      id: "site",
      title: "۱. وب‌سایت عمومی",
      hint: "بدون نیاز به ورود.",
      rows: [
        { label: "صفحه اصلی", href: "/" },
        { label: "کاتالوگ قطعات (جستجو، فیلتر، مرتب‌سازی، صفحه‌بندی)", href: "/products" },
        { label: "کاتالوگ — نمونه جستجو و فیلتر موجود", href: "/products?q=%D9%84%D9%86%D8%AA&stock=in&sort=price_asc" },
        ...opt(category, { label: `صفحه دسته — ${category?.name}`, href: `/categories/${category?.slug}` }),
        ...opt(product, { label: `جزئیات کالا — ${product?.name}`, href: `/products/${product?.slug}` }),
        { label: "برندها", href: "/brands" },
        { label: "جستجو", href: "/search?q=VLX" },
        { label: "درباره ما", href: "/about" },
        { label: "تماس با ما (فرم پیام)", href: "/contact" },
        { label: "ورود همکاران (دکمه‌های ورود سریع نمایشی)", href: "/login" },
        { label: "راهنمای نصب اپلیکیشن ویزیتور (PWA)", href: "/visitor/install" },
      ],
    },
    {
      id: "visitor",
      title: "۲. اپلیکیشن ویزیتور (موبایل)",
      account: { email: "visitor@autopart.test", role: "ویزیتور فروش", home: "/visitor" },
      hint: "برای تجربه واقعی، پنجره مرورگر را باریک کنید یا با گوشی باز کنید.",
      rows: [
        { label: "داشبورد ویزیتور", href: "/visitor" },
        { label: "ثبت سفارش جدید", href: "/visitor/orders/new", note: "کالای VLX-BC-0712 فقط ۲ عدد موجودی دارد — محدودیت «قابل سفارش تا N» را ببینید." },
        { label: "سفارش‌های من", href: "/visitor/orders" },
        ...opt(visitorOrder, { label: `جزئیات سفارش ${visitorOrder ? formatOrderNumber(visitorOrder.number) : ""}`, href: `/visitor/orders/${visitorOrder?.id}` }),
        ...opt(visitorDraft, { label: `ویرایش پیش‌نویس ${visitorDraft ? formatOrderNumber(visitorDraft.number) : ""}`, href: `/visitor/orders/${visitorDraft?.id}/edit` }),
        { label: "مشتریان من", href: "/visitor/customers" },
        { label: "افزودن مشتری جدید", href: "/visitor/customers/new" },
        ...opt(visitorCustomer, { label: `پرونده مشتری — ${visitorCustomer?.businessName}`, href: `/visitor/customers/${visitorCustomer?.id}` }),
        { label: "کاتالوگ با موجودی قابل سفارش", href: "/visitor/catalogue" },
      ],
    },
    {
      id: "admin",
      title: "۳. میز سفارش و پنل مدیریت",
      account: { email: "manager@autopart.test", role: "مدیر فروش", home: "/admin" },
      hint: "کاربران و نقش‌ها فقط برای admin@autopart.test (مدیر سیستم) باز می‌شوند.",
      rows: [
        { label: "داشبورد مدیریت", href: "/admin" },
        { label: "سفارش‌ها (فیلتر وضعیت، دوره، جستجو)", href: "/admin/orders" },
        ...opt(reviewOrder, { label: `بررسی سفارش ${reviewOrder ? formatOrderNumber(reviewOrder.number) : ""} (اصلاح اقلام، تأیید/رد، یادداشت، تحویل)`, href: `/admin/orders/${reviewOrder?.id}` }),
        { label: "کالاها", href: "/admin/products" },
        { label: "افزودن کالا", href: "/admin/products/new" },
        ...opt(adminProduct, { label: `ویرایش کالا ${adminProduct?.sku} (قیمت، تصاویر، بایگانی)`, href: `/admin/products/${adminProduct?.id}` }),
        { label: "دسته‌بندی‌ها", href: "/admin/categories" },
        { label: "برندها", href: "/admin/brands" },
        { label: "موجودی انبار (اصلاح موجودی)", href: "/admin/inventory" },
        { label: "تاریخچه گردش کالا", href: "/admin/inventory/movements" },
        { label: "مشتریان", href: "/admin/customers" },
        { label: "افزودن مشتری", href: "/admin/customers/new" },
        ...opt(adminCustomer, { label: `پرونده مشتری — ${adminCustomer?.businessName} (تخصیص ویزیتور)`, href: `/admin/customers/${adminCustomer?.id}` }),
        { label: "گزارش‌ها", href: "/admin/reports" },
        { label: "خروجی CSV — سفارش‌ها به تفکیک روز", href: "/admin/reports/export/orders-by-date", raw: true },
        { label: "خروجی CSV — فروش به تفکیک کالا", href: "/admin/reports/export/sales-by-product", raw: true },
        { label: "خروجی CSV — فروش به تفکیک مشتری", href: "/admin/reports/export/sales-by-customer", raw: true },
        { label: "خروجی CSV — فروش به تفکیک ویزیتور", href: "/admin/reports/export/sales-by-visitor", raw: true },
        { label: "خروجی CSV — موجودی", href: "/admin/reports/export/inventory", raw: true },
        { label: "گزارش ممیزی", href: "/admin/audit" },
        { label: "پیام‌های وب‌سایت", href: "/admin/inquiries" },
        { label: "کاربران (فقط مدیر سیستم)", href: "/admin/users" },
        { label: "افزودن کاربر (فقط مدیر سیستم)", href: "/admin/users/new" },
        ...opt(sampleUser, { label: `ویرایش کاربر — ${sampleUser?.name} (فقط مدیر سیستم)`, href: `/admin/users/${sampleUser?.id}` }),
        { label: "نقش‌ها و مجوزها (فقط مدیر سیستم)", href: "/admin/roles" },
      ],
    },
    {
      id: "warehouse",
      title: "۴. پنل انبار",
      account: { email: "warehouse@autopart.test", role: "انباردار", home: "/warehouse" },
      hint: "اصلاح موجودی فقط برای supervisor@autopart.test (سرپرست انبار) فعال است.",
      rows: [
        { label: "صف کار انبار", href: "/warehouse" },
        { label: "سفارش‌های آماده‌سازی و ارسال", href: "/warehouse/orders" },
        ...opt(warehouseOrder, { label: `فهرست جمع‌آوری ${warehouseOrder ? formatOrderNumber(warehouseOrder.number) : ""} (جمع‌آوری، آماده، ارسال، تحویل)`, href: `/warehouse/orders/${warehouseOrder?.id}` }),
        { label: "موجودی انبار", href: "/warehouse/inventory" },
      ],
    },
    {
      id: "system",
      title: "۵. صفحات سیستمی و API",
      rows: [
        { label: "صفحه ۴۰۴ (یافت نشد)", href: "/this-page-does-not-exist" },
        { label: "صفحه آفلاین (PWA)", href: "/offline" },
        { label: "Web App Manifest", href: "/manifest.webmanifest", raw: true },
        { label: "Service Worker", href: "/sw.js", raw: true },
        { label: "سلامت سرویس و پایگاه داده", href: "/api/health", raw: true },
        { label: "API کالاها (پس از ورود)", href: "/api/v1/products?q=VLX", raw: true },
        { label: "API مشتریان (پس از ورود)", href: "/api/v1/customers", raw: true },
        { label: "API سفارش‌ها (پس از ورود)", href: "/api/v1/orders", raw: true },
      ],
    },
  ];

  const total = groups.reduce((n, g) => n + g.rows.length, 0);

  return (
    <Container className="py-12 md:py-16">
      <div className="grid gap-4 border border-line bg-white p-5 md:grid-cols-[auto_1fr] md:items-center md:p-6">
        <KeyRound className="h-6 w-6 text-ember" aria-hidden />
        <div className="text-[14.5px] leading-relaxed text-steel-700">
          رمز عبور همه حساب‌های نمایشی:{" "}
          <span className="ltr type-data rounded-xs bg-bone px-1.5 py-0.5 text-ink">{process.env.SEED_DEMO_PASSWORD ?? "—"}</span>
          {" · "}برای تغییر حساب، از منوی کاربر (بالای پنل) «خروج» را بزنید و با حساب دیگری وارد شوید. اگر با نقش نامناسب وارد باشید، صفحه «دسترسی محدود» (۴۰۳) نمایش داده می‌شود.
          <span className="mt-1 block text-[13px] text-steel-500">{toPersianDigits(String(total))} نشانی در {toPersianDigits(String(groups.length))} بخش.</span>
        </div>
      </div>

      <nav aria-label="بخش‌ها" className="mt-8 flex flex-wrap gap-2">
        {groups.map((g) => (
          <a key={g.id} href={`#${g.id}`} className="border border-line bg-white px-3 py-1.5 text-[13.5px] hover:border-ink">
            {g.title}
          </a>
        ))}
      </nav>

      <div className="mt-10 space-y-14">
        {groups.map((g) => (
          <section key={g.id} id={g.id} aria-labelledby={`${g.id}-title`} className="scroll-mt-24">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-3">
              <div>
                <h2 id={`${g.id}-title`} className="type-heading text-2xl">
                  {g.title}
                </h2>
                {g.hint ? <p className="mt-1 text-[13.5px] text-steel-600">{g.hint}</p> : null}
              </div>
              {g.account ? (
                <a
                  href={`/login?next=${encodeURIComponent(g.account.home)}`}
                  className="inline-flex items-center gap-2 bg-ink px-3.5 py-2 text-[13.5px] text-bone hover:bg-ink-3"
                >
                  ورود با حساب {g.account.role}: <span className="ltr type-data text-[12.5px] text-bone/80">{g.account.email}</span>
                </a>
              ) : null}
            </div>
            <ol className="divide-y divide-line border-x border-b border-line bg-white">
              {g.rows.map((r, i) => (
                <li key={r.href} className="grid gap-1 px-4 py-3 md:grid-cols-[40px_1fr_minmax(0,1.1fr)] md:items-center md:gap-4">
                  <span className="type-data hidden text-[12px] text-steel-400 md:block">{toPersianDigits(String(i + 1).padStart(2, "0"))}</span>
                  <div>
                    <p className="text-[14.5px] font-medium text-ink">{r.label}</p>
                    {r.note ? <p className="mt-0.5 text-[12.5px] text-steel-500">{r.note}</p> : null}
                  </div>
                  <a
                    href={r.href}
                    target={r.raw ? "_blank" : undefined}
                    rel={r.raw ? "noreferrer" : undefined}
                    className="ltr type-data inline-flex min-w-0 items-center gap-1.5 justify-self-start break-all text-[13px] text-ember-700 underline-offset-2 hover:underline md:justify-self-end"
                  >
                    {r.raw ? <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
                    {decodeURIComponent(r.href)}
                  </a>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </Container>
  );
}
