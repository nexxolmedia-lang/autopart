import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Download, Plus, Search, UserPlus } from "lucide-react";
import { OrderRow } from "@/components/visitor/order-row";
import { EmptyState } from "@/components/ui/empty-state";
import { faNumber } from "@/lib/digits";
import { formatRelative } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { SALES_STATUSES } from "@/lib/order-workflow";
import { requirePagePermission } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { listCustomers } from "@/server/modules/customers/service";
import { countOrdersByStatus, listOrders } from "@/server/modules/orders/queries";

export const metadata: Metadata = { title: "خانه" };

export default async function VisitorHome() {
  const actor = await requirePagePermission("panel.visitor", "/visitor");
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [counts, recent, customers, month] = await Promise.all([
    countOrdersByStatus(actor, "visitor"),
    listOrders(actor, "visitor", { pageSize: 5 }),
    listCustomers(actor, { pageSize: 50 }),
    prisma.order.aggregate({
      where: { visitorId: actor.id, status: { in: [...SALES_STATUSES] }, submittedAt: { gte: monthStart } },
      _sum: { total: true },
      _count: { _all: true },
    }),
  ]);

  const total = Object.entries(counts).reduce((s, [k, v]) => (k === "DRAFT" ? s : s + v), 0);
  const pending = counts.SUBMITTED + counts.UNDER_REVIEW;
  const approved = counts.APPROVED + counts.PREPARING + counts.READY_FOR_DISPATCH + counts.DISPATCHED;
  const firstName = actor.name.split(" ")[0];
  const dueVisit = [...customers.rows]
    .map((c) => ({ ...c, last: c.orders[0]?.createdAt ?? null }))
    .sort((a, b) => (a.last?.getTime() ?? 0) - (b.last?.getTime() ?? 0))
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <section>
        <p className="type-eyebrow text-steel-500">اپلیکیشن ویزیتور · {actor.roleName}</p>
        <h1 className="type-display mt-2 text-[2rem] leading-snug">{firstName}، خوش آمدید.</h1>
      </section>

      <Link
        href="/visitor/orders/new"
        className="group relative flex items-center justify-between overflow-hidden bg-ink px-5 py-5 text-bone shadow-[var(--shadow-lift)] transition-transform active:scale-[0.99]"
      >
        <div className="blueprint-grid absolute inset-0 opacity-60" aria-hidden />
        <div className="relative">
          <p className="type-eyebrow text-ember">شروع کنید</p>
          <p className="type-heading mt-1.5 text-2xl">سفارش جدید</p>
          <p className="mt-1 text-[13px] text-bone/60">مشتری ← قطعات ← ثبت. موجودی فوراً رزرو می‌شود.</p>
        </div>
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-ember text-ink transition-transform group-hover:rotate-90">
          <Plus className="h-6 w-6" strokeWidth={2.4} aria-hidden />
        </span>
      </Link>

      <section aria-label="خلاصه سفارش‌ها" className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
        {[
          { label: "سفارش ثبت‌شده", value: total, href: "/visitor/orders" },
          { label: "در انتظار تأیید", value: pending, href: "/visitor/orders?status=awaiting", accent: pending > 0 },
          { label: "تأییدشده · در جریان", value: approved, href: "/visitor/orders?status=fulfilment" },
          { label: "پیش‌نویس", value: counts.DRAFT, href: "/visitor/orders?status=draft" },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="bg-white p-4 transition-colors hover:bg-bone/50">
            <p className={`type-display text-3xl ${s.accent ? "text-ember" : ""}`}>{faNumber(s.value)}</p>
            <p className="mt-1 text-[12px] leading-tight text-steel-600">{s.label}</p>
          </Link>
        ))}
      </section>

      <section className="flex items-center justify-between border border-line bg-bone/60 px-4 py-3">
        <div>
          <p className="type-eyebrow text-steel-500">تأییدشده در ماه جاری</p>
          <p className="type-data mt-1 text-xl font-medium">{formatMoney(Number(month._sum.total ?? 0))}</p>
        </div>
        <p className="text-end text-[12.5px] text-steel-600">
          {faNumber(month._count._all)} سفارش
          <br />
          بدون مالیات
        </p>
      </section>

      <section className="grid grid-cols-3 gap-2">
        {[
          { href: "/visitor/catalogue", icon: Search, label: "استعلام قطعه" },
          { href: "/visitor/customers/new", icon: UserPlus, label: "مشتری جدید" },
          { href: "/visitor/install", icon: Download, label: "نصب اپلیکیشن" },
        ].map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className="flex flex-col items-center gap-2 border border-line bg-white px-2 py-4 text-center text-[12.5px] font-medium transition-colors hover:border-ink active:bg-bone">
            <Icon className="h-5 w-5 text-steel-700" strokeWidth={1.7} aria-hidden />
            {label}
          </Link>
        ))}
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="type-heading text-lg">آخرین سفارش‌ها</h2>
          <Link href="/visitor/orders" className="text-[13px] font-medium text-steel-700 hover:text-ink">
            همه سفارش‌ها ←
          </Link>
        </div>
        {recent.rows.length === 0 ? (
          <EmptyState icon={<ClipboardList className="h-5 w-5" />} title="هنوز سفارشی ثبت نکرده‌اید" description="سفارش‌هایی که ثبت می‌کنید با وضعیت لحظه‌ای اینجا نمایش داده می‌شوند." />
        ) : (
          <ul className="divide-y divide-line border border-line">
            {recent.rows.map((o) => (
              <li key={o.id}>
                <OrderRow order={o} href={`/visitor/orders/${o.id}`} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {dueVisit.length > 0 ? (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="type-heading text-lg">بیشترین فاصله از آخرین سفارش</h2>
            <Link href="/visitor/customers" className="text-[13px] font-medium text-steel-700 hover:text-ink">
              همه مشتریان ←
            </Link>
          </div>
          <ul className="divide-y divide-line border border-line">
            {dueVisit.map((c) => (
              <li key={c.id}>
                <div className="flex items-center gap-3 bg-white px-4 py-3">
                  <Link href={`/visitor/customers/${c.id}`} className="min-w-0 flex-1 hover:text-ember">
                    <p className="truncate text-[15px] font-medium">{c.businessName}</p>
                    <p className="text-[12.5px] text-steel-500">
                      {c.city} · {c.last ? `آخرین سفارش ${formatRelative(c.last, now)}` : "بدون سفارش"}
                    </p>
                  </Link>
                  <Link
                    href={`/visitor/orders/new?customer=${c.id}`}
                    className="flex h-9 items-center gap-1 border border-line px-3 text-[12.5px] font-medium hover:border-ink"
                    aria-label={`سفارش جدید برای ${c.businessName}`}
                  >
                    سفارش <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
