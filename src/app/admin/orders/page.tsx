import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { ClipboardList, Search } from "lucide-react";
import { PageTitle } from "@/components/admin/page-title";
import { StatusBadge } from "@/components/ui/badges";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { selectClasses, inputClasses, tableClasses as t } from "@/components/ui/styles";
import { faNumber } from "@/lib/digits";
import { DELIVERY_WINDOW_LABELS, businessToday, formatCalendarDate, formatDateTime, parseIsoDate, toIsoDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUSES, ORDER_STATUS_META, formatOrderNumber } from "@/lib/order-workflow";
import { cn, firstParam, toPositiveInt } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { listOrders } from "@/server/modules/orders/queries";

export const metadata: Metadata = { title: "سفارش‌ها" };

const QUICK = [
  { value: "", label: "همه" },
  { value: "awaiting", label: "در انتظار تأیید" },
  { value: "fulfilment", label: "در انبار" },
  { value: "DISPATCHED", label: "ارسال‌شده" },
  { value: "closed", label: "بسته‌شده" },
];

export default async function AdminOrdersPage(props: PageProps<"/admin/orders">) {
  const actor = await requirePagePermission("orders.view_all", "/admin/orders");
  const params = await props.searchParams;
  const status = firstParam(params.status) ?? "";
  const q = firstParam(params.q)?.trim() ?? "";
  const visitorId = firstParam(params.visitor) ?? "";
  const period = firstParam(params.period) ?? "";
  const days = { "7": 7, "30": 30, "90": 90, "365": 365 }[period];
  const today = businessToday();
  const from = days ? toIsoDate(new Date(parseIsoDate(today)!.getTime() - (days - 1) * 86_400_000)) : "";
  const to = days ? today : "";
  const sort = (firstParam(params.sort) as "newest" | "oldest" | "total_desc" | "delivery" | undefined) ?? "newest";

  const [result, visitors] = await Promise.all([
    listOrders(actor, "admin", { status: status || undefined, q: q || undefined, visitorId: visitorId || undefined, from: from || undefined, to: to || undefined, sort, page: toPositiveInt(firstParam(params.page), 1), pageSize: 20 }),
    prisma.user.findMany({ where: { role: { permissions: { some: { permissionKey: "orders.create" } } } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const quickHref = (value: string) => {
    const sp = new URLSearchParams();
    if (value) sp.set("status", value);
    if (q) sp.set("q", q);
    if (visitorId) sp.set("visitor", visitorId);
    const s = sp.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  };

  return (
    <>
      <PageTitle eyebrow="میز سفارش" title="سفارش‌ها" description="همه سفارش‌های ثبت‌شده توسط ویزیتورها. برای بررسی، اصلاح، تأیید یا رد روی هر سفارش کلیک کنید." />

      <nav aria-label="فیلتر سریع" className="scrollbar-none mb-4 flex gap-2 overflow-x-auto">
        {QUICK.map((f) => (
          <Link
            key={f.value}
            href={quickHref(f.value)}
            aria-current={status === f.value ? "page" : undefined}
            className={cn("flex h-9 shrink-0 items-center rounded-full border px-4 text-[13px] font-medium", status === f.value ? "border-ink bg-ink text-bone" : "border-line bg-white text-steel-700 hover:border-ink")}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <Form action="/admin/orders" className="mb-5 grid gap-3 border border-line bg-white p-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" aria-hidden />
          <input name="q" type="search" defaultValue={q} placeholder="شماره سفارش، مشتری یا کد کالا" aria-label="جستجو" className={cn(inputClasses, "h-10 ps-9")} />
        </div>
        <select name="status" defaultValue={status} aria-label="وضعیت" className={cn(inputClasses, selectClasses, "h-10")}>
          <option value="">همه وضعیت‌ها</option>
          <option value="awaiting">در انتظار تأیید</option>
          <option value="fulfilment">در انبار</option>
          <option value="open">همه سفارش‌های باز</option>
          <option value="closed">بسته‌شده</option>
          {ORDER_STATUSES.filter((s) => s !== "DRAFT").map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_META[s].label}
            </option>
          ))}
        </select>
        <select name="visitor" defaultValue={visitorId} aria-label="ویزیتور" className={cn(inputClasses, selectClasses, "h-10")}>
          <option value="">همه ویزیتورها</option>
          {visitors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <select name="period" defaultValue={period} aria-label="بازه زمانی" className={cn(inputClasses, selectClasses, "h-10")}>
          <option value="">همه زمان‌ها</option>
          <option value="7">۷ روز اخیر</option>
          <option value="30">۳۰ روز اخیر</option>
          <option value="90">۹۰ روز اخیر</option>
          <option value="365">یک سال اخیر</option>
        </select>
        <div className="flex gap-2">
          <select name="sort" defaultValue={sort} aria-label="مرتب‌سازی" className={cn(inputClasses, selectClasses, "h-10")}>
            <option value="newest">جدیدترین</option>
            <option value="oldest">قدیمی‌ترین</option>
            <option value="total_desc">بیشترین مبلغ</option>
            <option value="delivery">نزدیک‌ترین تحویل</option>
          </select>
          <button type="submit" className="h-10 shrink-0 bg-ink px-4 text-sm font-medium text-bone hover:bg-graphite">
            اعمال
          </button>
        </div>
      </Form>

      {result.rows.length === 0 ? (
        <EmptyState icon={<ClipboardList className="h-5 w-5" />} title="سفارشی پیدا نشد" description="فیلترها را تغییر دهید یا عبارت جستجو را کوتاه‌تر کنید." />
      ) : (
        <>
          {/* Desktop table */}
          <div className={cn(t.wrap, "hidden md:block")}>
            <table className={t.table}>
              <thead className={t.thead}>
                <tr>
                  <th className={t.th}>سفارش</th>
                  <th className={t.th}>مشتری</th>
                  <th className={t.th}>ویزیتور</th>
                  <th className={t.th}>ثبت</th>
                  <th className={t.th}>تحویل</th>
                  <th className={t.th}>وضعیت</th>
                  <th className={cn(t.th, "text-end")}>مبلغ</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((o) => (
                  <tr key={o.id} className={cn(t.tr, "cursor-pointer")}>
                    <td className={t.td}>
                      <Link href={`/admin/orders/${o.id}`} className="ltr type-data font-semibold hover:text-ember-700">
                        {formatOrderNumber(o.number)}
                      </Link>
                      <p className="text-[12px] text-steel-500">{faNumber(o._count.items)} قلم</p>
                    </td>
                    <td className={t.td}>
                      <p className="font-medium">{o.customerName}</p>
                      <p className="text-[12px] text-steel-500">
                        <span className="ltr">{o.customer.code}</span> · {o.customer.city}
                      </p>
                    </td>
                    <td className={t.td}>{o.visitor.name}</td>
                    <td className={cn(t.td, "whitespace-nowrap text-[13px] text-steel-700")}>{formatDateTime(o.submittedAt ?? o.createdAt)}</td>
                    <td className={cn(t.td, "whitespace-nowrap text-[13px] text-steel-700")}>
                      {o.confirmedDeliveryDate ? (
                        <span className="text-ink">{formatCalendarDate(o.confirmedDeliveryDate)}</span>
                      ) : o.requestedDeliveryDate ? (
                        formatCalendarDate(o.requestedDeliveryDate)
                      ) : (
                        "—"
                      )}
                      <p className="text-[11.5px] text-steel-500">{DELIVERY_WINDOW_LABELS[o.confirmedDeliveryWindow ?? o.requestedDeliveryWindow]}</p>
                    </td>
                    <td className={t.td}>
                      <StatusBadge status={o.status} />
                    </td>
                    <td className={cn(t.td, "type-data whitespace-nowrap text-end font-semibold")}>{o.total !== null ? formatMoney(o.total) : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <ul className="divide-y divide-line border border-line md:hidden">
            {result.rows.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="block bg-white p-4 active:bg-bone">
                  <div className="flex items-center justify-between gap-2">
                    <span className="ltr type-data text-[13px] font-semibold">{formatOrderNumber(o.number)}</span>
                    <StatusBadge status={o.status} className="h-5 text-[11px]" />
                  </div>
                  <p className="mt-1.5 font-medium">{o.customerName}</p>
                  <div className="mt-1 flex justify-between text-[12.5px] text-steel-600">
                    <span>
                      {o.visitor.name} · {formatDateTime(o.submittedAt ?? o.createdAt)}
                    </span>
                    <span className="type-data font-semibold text-ink">{o.total !== null ? formatMoney(o.total) : ""}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      <Pagination className="mt-6" pathname="/admin/orders" params={params} page={result.page} pageCount={result.pageCount} total={result.total} pageSize={result.pageSize} label="سفارش" />
    </>
  );
}
