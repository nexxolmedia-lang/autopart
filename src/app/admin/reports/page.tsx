import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { DailyBarChart, RankBar } from "@/components/admin/bar-chart";
import { Kpi, PageTitle, Panel } from "@/components/admin/page-title";
import { tableClasses as t } from "@/components/ui/styles";
import { faNumber } from "@/lib/digits";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUS_META } from "@/lib/order-workflow";
import { cn, firstParam } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";
import { inventoryLevels, ordersByDate, ordersByStatus, resolveRange, salesByCustomer, salesByProduct, salesByVisitor } from "@/server/modules/reports/service";

export const metadata: Metadata = { title: "گزارش‌ها" };

const PRESETS = [
  { days: 7, label: "۷ روز" },
  { days: 30, label: "۳۰ روز" },
  { days: 90, label: "۹۰ روز" },
  { days: 365, label: "یک سال" },
];

function Csv({ report, range }: { report: string; range: { from: string; to: string } }) {
  return (
    <a href={`/admin/reports/export/${report}?from=${range.from}&to=${range.to}`} className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-steel-700 hover:text-ink" download>
      <Download className="h-3.5 w-3.5" aria-hidden /> خروجی CSV
    </a>
  );
}

export default async function ReportsPage(props: PageProps<"/admin/reports">) {
  const actor = await requirePagePermission("reports.view", "/admin/reports");
  const params = await props.searchParams;
  const days = Number(firstParam(params.days)) || 30;
  const range = resolveRange({ from: firstParam(params.from), to: firstParam(params.to) }, new Date(), PRESETS.some((p) => p.days === days) ? days : 30);
  const [daily, statuses, products, customers, visitors, inventory] = await Promise.all([
    ordersByDate(actor, range),
    ordersByStatus(actor, range),
    salesByProduct(actor, range, 15),
    salesByCustomer(actor, range, 10),
    salesByVisitor(actor, range),
    inventoryLevels(actor),
  ]);

  const revenue = daily.reduce((s, d) => s + d.sales, 0);
  const submitted = daily.reduce((s, d) => s + d.orders, 0);
  const approved = daily.reduce((s, d) => s + d.salesOrders, 0);
  const stockValue = inventory.reduce((s, r) => s + r.stockValue, 0);
  const lowStock = inventory.filter((r) => r.isLow);
  const maxProduct = Math.max(1, ...products.map((p) => p.revenue));
  const maxCustomer = Math.max(1, ...customers.map((c) => c.revenue));

  return (
    <>
      <PageTitle eyebrow="گزارش‌ها" title="گزارش فروش و موجودی" description={`بازه ${formatDate(`${range.from}T12:00:00Z`)} تا ${formatDate(`${range.to}T12:00:00Z`)} — «فروش» یعنی سفارش‌های تأییدشده‌ای که رد یا لغو نشده‌اند. مبالغ بدون مالیات است.`} />

      <nav aria-label="بازه زمانی" className="mb-6 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Link
            key={p.days}
            href={`/admin/reports?days=${p.days}`}
            aria-current={days === p.days && !firstParam(params.from) ? "page" : undefined}
            className={cn("flex h-9 items-center rounded-full border px-4 text-[13px] font-medium", days === p.days && !firstParam(params.from) ? "border-ink bg-ink text-bone" : "border-line bg-white hover:border-ink")}
          >
            {p.label} اخیر
          </Link>
        ))}
      </nav>

      <section className="mb-6 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
        <Kpi label="فروش تأییدشده" value={<span className="text-[1.3rem]">{formatMoney(revenue)}</span>} />
        <Kpi label="سفارش‌های ثبت‌شده" value={faNumber(submitted)} hint={`${faNumber(approved)} تأییدشده`} />
        <Kpi label="نرخ تأیید" value={submitted ? `٪${faNumber(Math.round((approved / submitted) * 100))}` : "—"} />
        <Kpi label="ارزش موجودی انبار" value={<span className="text-[1.3rem]">{formatMoney(stockValue)}</span>} hint={`${faNumber(lowStock.length)} کالا زیر حد هشدار`} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="فروش روزانه" actions={<Csv report="orders-by-date" range={range} />}>
          <DailyBarChart data={daily} valueOf={(d) => (d as (typeof daily)[number]).sales} format={formatMoney} label="نمودار فروش روزانه" />
        </Panel>
        <Panel title="سفارش‌ها بر اساس وضعیت" actions={<Csv report="orders-by-status" range={range} />} bodyClassName="p-0 md:p-0">
          <table className="w-full text-[13.5px]">
            <tbody>
              {statuses.map((s) => (
                <tr key={s.status} className="border-b border-line/70 last:border-0">
                  <td className="px-4 py-2.5">{ORDER_STATUS_META[s.status].label}</td>
                  <td className="type-data px-4 py-2.5 text-end">{faNumber(s.orders)}</td>
                  <td className="type-data px-4 py-2.5 text-end text-steel-600">{formatMoney(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="پرفروش‌ترین کالاها" actions={<Csv report="sales-by-product" range={range} />} bodyClassName="p-0 md:p-0">
          {products.length === 0 ? (
            <p className="p-6 text-center text-sm text-steel-500">در این بازه فروشی ثبت نشده است.</p>
          ) : (
            <ol className="divide-y divide-line">
              {products.map((p, i) => (
                <li key={p.productId} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
                    <span className="min-w-0 truncate">
                      <span className="type-data me-2 text-steel-400">{faNumber(i + 1)}</span>
                      {p.name} <span className="ltr text-[12px] text-steel-500">{p.sku}</span>
                    </span>
                    <span className="type-data shrink-0 font-semibold">{formatMoney(p.revenue)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <RankBar value={p.revenue} max={maxProduct} tone={i === 0 ? "ember" : "ink"} />
                    <span className="shrink-0 text-[11.5px] text-steel-500">{faNumber(p.units)} عدد</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
        <Panel title="مشتریان برتر" actions={<Csv report="sales-by-customer" range={range} />} bodyClassName="p-0 md:p-0">
          {customers.length === 0 ? (
            <p className="p-6 text-center text-sm text-steel-500">در این بازه فروشی ثبت نشده است.</p>
          ) : (
            <ol className="divide-y divide-line">
              {customers.map((c, i) => (
                <li key={c.customerId} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
                    <Link href={`/admin/customers/${c.customerId}`} className="min-w-0 truncate hover:text-ember-700">
                      <span className="type-data me-2 text-steel-400">{faNumber(i + 1)}</span>
                      {c.name} <span className="text-[12px] text-steel-500">· {c.city}</span>
                    </Link>
                    <span className="type-data shrink-0 font-semibold">{formatMoney(c.revenue)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <RankBar value={c.revenue} max={maxCustomer} tone={i === 0 ? "ember" : "ink"} />
                    <span className="shrink-0 text-[11.5px] text-steel-500">{faNumber(c.orders)} سفارش</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <Panel className="mt-6" title="عملکرد ویزیتورها" actions={<Csv report="sales-by-visitor" range={range} />} bodyClassName="p-0 md:p-0">
        <div className="overflow-x-auto">
          <table className={t.table}>
            <thead className={t.thead}>
              <tr>
                <th className={t.th}>ویزیتور</th>
                <th className={cn(t.th, "text-end")}>ثبت‌شده</th>
                <th className={cn(t.th, "text-end")}>تأییدشده</th>
                <th className={cn(t.th, "text-end")}>ردشده</th>
                <th className={cn(t.th, "text-end")}>مشتریان</th>
                <th className={cn(t.th, "text-end")}>میانگین سفارش</th>
                <th className={cn(t.th, "text-end")}>فروش</th>
              </tr>
            </thead>
            <tbody>
              {visitors.map((v) => (
                <tr key={v.visitorId} className={t.tr}>
                  <td className={cn(t.td, "font-medium")}>{v.name}</td>
                  <td className={cn(t.td, "type-data text-end")}>{faNumber(v.submitted)}</td>
                  <td className={cn(t.td, "type-data text-end")}>{faNumber(v.approved)}</td>
                  <td className={cn(t.td, "type-data text-end")}>{faNumber(v.rejected)}</td>
                  <td className={cn(t.td, "type-data text-end")}>{faNumber(v.customers)}</td>
                  <td className={cn(t.td, "type-data text-end")}>{formatMoney(v.average)}</td>
                  <td className={cn(t.td, "type-data text-end font-semibold")}>{formatMoney(v.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel className="mt-6" title={`موجودی و کمبودها · ${faNumber(lowStock.length)} کالا زیر حد هشدار`} actions={<Csv report="inventory" range={range} />} bodyClassName="p-0 md:p-0">
        <div className="overflow-x-auto">
          <table className={t.table}>
            <thead className={t.thead}>
              <tr>
                <th className={t.th}>کالا</th>
                <th className={t.th}>دسته</th>
                <th className={cn(t.th, "text-end")}>فیزیکی</th>
                <th className={cn(t.th, "text-end")}>آزاد</th>
                <th className={cn(t.th, "text-end")}>حد هشدار</th>
                <th className={cn(t.th, "text-end")}>ارزش موجودی</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((r) => (
                <tr key={r.productId} className={t.tr}>
                  <td className={t.td}>
                    {r.name} <span className="ltr text-[12px] text-steel-500">{r.sku}</span>
                  </td>
                  <td className={t.td}>{r.category}</td>
                  <td className={cn(t.td, "type-data text-end")}>{faNumber(r.onHand)}</td>
                  <td className={cn(t.td, "type-data text-end font-bold", r.available <= 0 ? "text-danger" : "text-warn")}>{faNumber(r.available)}</td>
                  <td className={cn(t.td, "type-data text-end")}>{faNumber(r.threshold)}</td>
                  <td className={cn(t.td, "type-data text-end")}>{formatMoney(r.stockValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
