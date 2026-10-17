import type { Metadata } from "next";
import Form from "next/form";
import type { Prisma } from "@prisma/client";
import { ScrollText, Search } from "lucide-react";
import { PageTitle } from "@/components/admin/page-title";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { inputClasses, selectClasses, tableClasses as t } from "@/components/ui/styles";
import { formatDateTime } from "@/lib/format";
import { cn, firstParam, toPositiveInt } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";
import { prisma } from "@/server/db";

export const metadata: Metadata = { title: "گزارش ممیزی" };

const ENTITY_LABELS: Record<string, string> = {
  Order: "سفارش",
  Product: "کالا",
  Customer: "مشتری",
  User: "کاربر",
  Role: "نقش",
  Category: "دسته‌بندی",
  Brand: "برند",
};

export default async function AuditPage(props: PageProps<"/admin/audit">) {
  await requirePagePermission("audit.view", "/admin/audit");
  const params = await props.searchParams;
  const q = firstParam(params.q)?.trim() ?? "";
  const entity = firstParam(params.entity) ?? "";
  const page = toPositiveInt(firstParam(params.page), 1);
  const pageSize = 40;
  const where: Prisma.AuditLogWhereInput = {
    ...(entity ? { entityType: entity } : {}),
    ...(q ? { OR: [{ summary: { contains: q, mode: "insensitive" } }, { action: { contains: q, mode: "insensitive" } }, { actor: { name: { contains: q, mode: "insensitive" } } }] } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: { actor: { select: { name: true } } } }),
  ]);

  return (
    <>
      <PageTitle eyebrow="مدیریت سیستم" title="گزارش ممیزی" description="سابقه غیرقابل‌ویرایش عملیات حساس: ورود، تغییر قیمت، تأیید و اصلاح سفارش، گردش انبار، تغییر کاربران و مجوزها." />
      <Form action="/admin/audit" className="mb-5 grid gap-3 border border-line bg-white p-4 md:grid-cols-[1.5fr_1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" aria-hidden />
          <input name="q" type="search" defaultValue={q} placeholder="شرح، کاربر یا کد عملیات" aria-label="جستجو" className={cn(inputClasses, "h-10 ps-9")} />
        </div>
        <select name="entity" defaultValue={entity} aria-label="نوع موجودیت" className={cn(inputClasses, selectClasses, "h-10")}>
          <option value="">همه</option>
          {Object.entries(ENTITY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button type="submit" className="h-10 bg-ink px-4 text-sm font-medium text-bone hover:bg-graphite">
          اعمال
        </button>
      </Form>
      {rows.length === 0 ? (
        <EmptyState icon={<ScrollText className="h-5 w-5" />} title="رکوردی پیدا نشد" />
      ) : (
        <div className={t.wrap}>
          <table className={t.table}>
            <thead className={t.thead}>
              <tr>
                <th className={t.th}>زمان</th>
                <th className={t.th}>کاربر</th>
                <th className={t.th}>موجودیت</th>
                <th className={t.th}>شرح</th>
                <th className={t.th}>جزئیات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className={cn(t.tr, "align-top")}>
                  <td className={cn(t.td, "whitespace-nowrap text-[12.5px]")}>{formatDateTime(a.createdAt)}</td>
                  <td className={cn(t.td, "text-[13px]")}>
                    {a.actor?.name ?? "سیستم"}
                    {a.ipAddress ? <span className="ltr block text-end text-[11px] text-steel-400">{a.ipAddress}</span> : null}
                  </td>
                  <td className={cn(t.td, "text-[13px]")}>
                    {ENTITY_LABELS[a.entityType] ?? a.entityType}
                    <span className="ltr block text-end text-[11px] text-steel-400">{a.action}</span>
                  </td>
                  <td className={cn(t.td, "text-[13px]")}>{a.summary}</td>
                  <td className={t.td}>
                    {a.changes ? (
                      <details className="text-[12px]">
                        <summary className="cursor-pointer text-steel-600 hover:text-ink">نمایش</summary>
                        <pre className="ltr mt-2 max-h-48 max-w-sm overflow-auto whitespace-pre-wrap bg-bone/60 p-2 text-start text-[11px] leading-relaxed">{JSON.stringify(a.changes, null, 2)}</pre>
                      </details>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination className="mt-6" pathname="/admin/audit" params={params} page={page} pageCount={Math.max(1, Math.ceil(total / pageSize))} total={total} pageSize={pageSize} label="رکورد" />
    </>
  );
}
