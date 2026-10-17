import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { DailyBarChart } from "@/components/admin/bar-chart";
import { Kpi, PageTitle, Panel } from "@/components/admin/page-title";
import { StatusBadge } from "@/components/ui/badges";
import { faNumber } from "@/lib/digits";
import { formatRelative } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUS_META, formatOrderNumber } from "@/lib/order-workflow";
import { requirePagePermission } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { listLowStock } from "@/server/modules/inventory/service";
import { countOrdersByStatus, listOrders } from "@/server/modules/orders/queries";
import { ordersByDate, recentActivity, resolveRange, salesSummary } from "@/server/modules/reports/service";

export const metadata: Metadata = { title: "داشبورد" };

export default async function AdminDashboard() {
  const actor = await requirePagePermission("panel.admin", "/admin");
  const has = (p: Parameters<typeof actor.permissions.has>[0]) => actor.permissions.has(p);
  const now = new Date();

  const [counts, awaiting, sales, daily, lowStock, activity, productCount] = await Promise.all([
    has("orders.view_all") ? countOrdersByStatus(actor, "admin") : null,
    has("orders.view_all") ? listOrders(actor, "admin", { status: "awaiting", sort: "oldest", pageSize: 6 }) : null,
    has("reports.view") ? salesSummary(actor, now) : null,
    has("reports.view") ? ordersByDate(actor, resolveRange({}, now, 30)) : null,
    has("inventory.view") ? listLowStock(actor, 6) : null,
    has("audit.view") ? recentActivity(actor, 8) : null,
    prisma.product.count({ where: { status: "ACTIVE" } }),
  ]);

  const firstName = actor.name.split(" ")[0];
  const preparing = counts ? counts.APPROVED + counts.PREPARING + counts.READY_FOR_DISPATCH : 0;

  return (
    <>
      <PageTitle eyebrow={actor.roleName} title={`${firstName}، روز خوبی داشته باشید.`} description="وضعیت لحظه‌ای سفارش‌ها، فروش و موجودی — همه ارقام از داده‌های واقعی سامانه محاسبه می‌شوند." />

      {counts ? (
        <section aria-label="شاخص‌های سفارش" className="mb-6 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-3 xl:grid-cols-6">
          <Kpi label="در انتظار تأیید" value={faNumber(counts.SUBMITTED + counts.UNDER_REVIEW)} tone={counts.SUBMITTED + counts.UNDER_REVIEW > 0 ? "ember" : undefined} href="/admin/orders?status=awaiting" hint={`${faNumber(counts.SUBMITTED)} جدید · ${faNumber(counts.UNDER_REVIEW)} در حال بررسی`} />
          <Kpi label="تأییدشده و در انبار" value={faNumber(preparing)} href="/admin/orders?status=fulfilment" hint={`${faNumber(counts.PREPARING)} در حال آماده‌سازی`} />
          <Kpi label="ارسال‌شده" value={faNumber(counts.DISPATCHED)} href="/admin/orders?status=DISPATCHED" />
          <Kpi label="تحویل‌شده" value={faNumber(counts.DELIVERED)} tone="ok" href="/admin/orders?status=DELIVERED" />
          <Kpi label="کالای فعال" value={faNumber(productCount)} href={has("products.manage") ? "/admin/products" : undefined} />
          <Kpi label="کمبود موجودی" value={faNumber(lowStock?.length ?? 0)} tone={lowStock && lowStock.length ? "warn" : undefined} href={has("inventory.view") ? "/admin/inventory?stock=low" : undefined} hint={lowStock && lowStock.length >= 6 ? "۶ مورد یا بیشتر" : undefined} />
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {sales && daily ? (
            <Panel
              title="فروش ۳۰ روز اخیر"
              actions={
                <Link href="/admin/reports" className="text-[13px] font-medium text-steel-700 hover:text-ink">
                  گزارش کامل ←
                </Link>
              }
            >
              <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-3">
                <div>
                  <p className="text-[12.5px] text-steel-600">فروش تأییدشده</p>
                  <p className="type-data mt-1 text-[1.35rem] font-bold">{formatMoney(sales.current.revenue)}</p>
                  {sales.changePct !== null ? (
                    <p className={`mt-0.5 text-[12px] ${sales.changePct >= 0 ? "text-ok" : "text-danger"}`}>
                      {sales.changePct >= 0 ? "▲" : "▼"} ٪{faNumber(Math.abs(Math.round(sales.changePct)))} نسبت به ۳۰ روز قبل
                    </p>
                  ) : null}
                </div>
                <div>
                  <p className="text-[12.5px] text-steel-600">تعداد سفارش</p>
                  <p className="type-data mt-1 text-[1.35rem] font-bold">{faNumber(sales.current.orders)}</p>
                </div>
                <div>
                  <p className="text-[12.5px] text-steel-600">میانگین هر سفارش</p>
                  <p className="type-data mt-1 text-[1.35rem] font-bold">{formatMoney(sales.averageOrder)}</p>
                </div>
              </div>
              <DailyBarChart data={daily} valueOf={(d) => (d as (typeof daily)[number]).sales} format={formatMoney} label="نمودار فروش روزانه" />
            </Panel>
          ) : null}

          {awaiting ? (
            <Panel
              title="در انتظار تأیید"
              actions={
                <Link href="/admin/orders?status=awaiting" className="text-[13px] font-medium text-steel-700 hover:text-ink">
                  همه ←
                </Link>
              }
              bodyClassName="p-0 md:p-0"
            >
              {awaiting.rows.length === 0 ? (
                <p className="p-6 text-center text-sm text-steel-500">سفارشی در انتظار تأیید نیست.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {awaiting.rows.map((o) => (
                    <li key={o.id}>
                      <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-bone/40 md:px-5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="ltr type-data text-[12.5px] font-semibold">{formatOrderNumber(o.number)}</span>
                            <StatusBadge status={o.status} className="h-5 text-[11px]" />
                          </div>
                          <p className="mt-1 truncate text-[14px] font-medium">{o.customerName}</p>
                          <p className="text-[12px] text-steel-500">
                            {o.visitor.name} · {o.submittedAt ? formatRelative(o.submittedAt, now) : ""} · {faNumber(o._count.items)} قلم
                          </p>
                        </div>
                        <p className="type-data shrink-0 text-[14px] font-semibold">{o.total !== null ? formatMoney(o.total) : ""}</p>
                        <ArrowLeft className="h-4 w-4 shrink-0 text-steel-400" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          ) : null}
        </div>

        <div className="space-y-6">
          {counts ? (
            <Panel title="سفارش‌ها بر اساس وضعیت">
              <ul className="space-y-2.5">
                {(Object.keys(counts) as (keyof typeof counts)[])
                  .filter((s) => s !== "DRAFT")
                  .map((s) => {
                    const total = Object.entries(counts).reduce((a, [k, v]) => (k === "DRAFT" ? a : a + v), 0);
                    const pct = total ? Math.round((counts[s] / total) * 100) : 0;
                    return (
                      <li key={s}>
                        <Link href={`/admin/orders?status=${s}`} className="group block">
                          <div className="flex items-center justify-between text-[13px]">
                            <span className="group-hover:text-ember-700">{ORDER_STATUS_META[s].label}</span>
                            <span className="type-data text-steel-600">{faNumber(counts[s])}</span>
                          </div>
                          <div className="mt-1 h-1.5 bg-steel-100" aria-hidden>
                            <div className="h-full bg-ink" style={{ width: `${Math.max(pct, counts[s] ? 2 : 0)}%` }} />
                          </div>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </Panel>
          ) : null}

          {lowStock ? (
            <Panel
              title="هشدار کمبود موجودی"
              actions={
                <Link href="/admin/inventory?stock=low" className="text-[13px] font-medium text-steel-700 hover:text-ink">
                  همه ←
                </Link>
              }
              bodyClassName="p-0 md:p-0"
            >
              {lowStock.length === 0 ? (
                <p className="p-6 text-center text-sm text-steel-500">همه کالاها بالاتر از حد هشدار هستند.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {lowStock.map((p) => (
                    <li key={p.productId} className="flex items-center gap-3 px-4 py-3 md:px-5">
                      <AlertTriangle className={`h-4 w-4 shrink-0 ${p.available <= 0 ? "text-danger" : "text-warn"}`} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium">{p.name}</p>
                        <p className="text-[12px] text-steel-500">
                          <span className="ltr">{p.sku}</span> · قفسه <span className="ltr">{p.binLocation ?? "—"}</span>
                        </p>
                      </div>
                      <div className="text-end">
                        <p className={`type-data text-[15px] font-bold ${p.available <= 0 ? "text-danger" : "text-warn"}`}>{faNumber(p.available)}</p>
                        <p className="text-[11px] text-steel-500">حد هشدار {faNumber(p.lowStockThreshold)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          ) : null}

          {activity ? (
            <Panel
              title="فعالیت‌های اخیر"
              actions={
                <Link href="/admin/audit" className="text-[13px] font-medium text-steel-700 hover:text-ink">
                  گزارش ممیزی ←
                </Link>
              }
            >
              <ol className="space-y-3.5">
                {activity.map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-[13px] leading-relaxed">{a.summary}</p>
                      <p className="text-[11.5px] text-steel-500">
                        {a.actor?.name ?? "سیستم"} · {formatRelative(a.createdAt, now)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  );
}
