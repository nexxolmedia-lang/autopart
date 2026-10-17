import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { History, Search } from "lucide-react";
import { PageTitle } from "@/components/admin/page-title";
import { Badge } from "@/components/ui/badges";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { inputClasses, selectClasses, tableClasses as t } from "@/components/ui/styles";
import { faNumber } from "@/lib/digits";
import { formatDateTime } from "@/lib/format";
import { MOVEMENT_LABELS } from "@/lib/movements";
import { formatOrderNumber } from "@/lib/order-workflow";
import { cn, firstParam, toPositiveInt } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";
import { listMovements } from "@/server/modules/inventory/service";
import type { MovementType } from "@prisma/client";

export const metadata: Metadata = { title: "گردش کالا" };

const TYPES = Object.keys(MOVEMENT_LABELS) as MovementType[];

export default async function MovementsPage(props: PageProps<"/admin/inventory/movements">) {
  const actor = await requirePagePermission("inventory.view", "/admin/inventory/movements");
  const params = await props.searchParams;
  const q = firstParam(params.q) ?? "";
  const typeParam = firstParam(params.type) ?? "";
  const type = TYPES.includes(typeParam as MovementType) ? (typeParam as MovementType) : undefined;
  const result = await listMovements(actor, { q: q || undefined, type, page: toPositiveInt(firstParam(params.page), 1), pageSize: 40 });

  return (
    <>
      <PageTitle back={{ href: "/admin/inventory", label: "موجودی انبار" }} eyebrow="انبار" title="گردش کالا" description="تاریخچه کامل و غیرقابل‌ویرایش تغییرات موجودی فیزیکی: موجودی قبل، تغییر، موجودی بعد، علت، کاربر و زمان." />
      <Form action="/admin/inventory/movements" className="mb-5 grid gap-3 border border-line bg-white p-4 md:grid-cols-[1.5fr_1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" aria-hidden />
          <input name="q" type="search" defaultValue={q} placeholder="کد کالا، نام، علت یا مرجع" aria-label="جستجو" className={cn(inputClasses, "h-10 ps-9")} />
        </div>
        <select name="type" defaultValue={type ?? ""} aria-label="نوع گردش" className={cn(inputClasses, selectClasses, "h-10")}>
          <option value="">همه انواع</option>
          {TYPES.map((k) => (
            <option key={k} value={k}>
              {MOVEMENT_LABELS[k].label}
            </option>
          ))}
        </select>
        <button type="submit" className="h-10 bg-ink px-4 text-sm font-medium text-bone hover:bg-graphite">
          اعمال
        </button>
      </Form>
      {result.rows.length === 0 ? (
        <EmptyState icon={<History className="h-5 w-5" />} title="گردشی ثبت نشده" />
      ) : (
        <div className={t.wrap}>
          <table className={t.table}>
            <thead className={t.thead}>
              <tr>
                <th className={t.th}>زمان</th>
                <th className={t.th}>کالا</th>
                <th className={t.th}>نوع</th>
                <th className={cn(t.th, "text-end")}>قبل</th>
                <th className={cn(t.th, "text-end")}>تغییر</th>
                <th className={cn(t.th, "text-end")}>بعد</th>
                <th className={t.th}>علت / مرجع</th>
                <th className={t.th}>کاربر</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((m) => (
                <tr key={m.id} className={t.tr}>
                  <td className={cn(t.td, "whitespace-nowrap text-[13px]")}>{formatDateTime(m.createdAt)}</td>
                  <td className={t.td}>
                    <p className="text-[13.5px] font-medium">{m.product.name}</p>
                    <p className="ltr text-end text-[12px] text-steel-500">{m.product.sku}</p>
                  </td>
                  <td className={t.td}>
                    <Badge tone={MOVEMENT_LABELS[m.type].tone}>{MOVEMENT_LABELS[m.type].label}</Badge>
                  </td>
                  <td className={cn(t.td, "type-data text-end text-steel-600")}>{faNumber(m.quantityBefore)}</td>
                  <td className={cn(t.td, "type-data text-end font-bold", m.quantityChange > 0 ? "text-ok" : "text-danger")}>
                    <span className="ltr">{m.quantityChange > 0 ? "+" : "−"}</span>
                    {faNumber(Math.abs(m.quantityChange))}
                  </td>
                  <td className={cn(t.td, "type-data text-end")}>{faNumber(m.quantityAfter)}</td>
                  <td className={cn(t.td, "max-w-xs text-[13px]")}>
                    {m.reason}
                    {m.order ? (
                      <Link href={`/admin/orders/${m.order.id}`} className="ltr ms-1 text-[12px] text-ember-700 hover:underline">
                        {formatOrderNumber(m.order.number)}
                      </Link>
                    ) : m.reference ? (
                      <span className="ltr ms-1 text-[12px] text-steel-500">{m.reference}</span>
                    ) : null}
                  </td>
                  <td className={cn(t.td, "text-[13px]")}>{m.user?.name ?? "سیستم"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination className="mt-6" pathname="/admin/inventory/movements" params={params} page={result.page} pageCount={result.pageCount} total={result.total} pageSize={result.pageSize} label="گردش" />
    </>
  );
}
