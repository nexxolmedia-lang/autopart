import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { PageTitle } from "@/components/admin/page-title";
import { Badge } from "@/components/ui/badges";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox } from "@/components/ui/form";
import { Pagination } from "@/components/ui/pagination";
import { inputClasses, selectClasses, tableClasses as t } from "@/components/ui/styles";
import { faNumber } from "@/lib/digits";
import { formatDate } from "@/lib/format";
import { cn, firstParam, toPositiveInt } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";
import { listAssignableVisitors, listCustomers } from "@/server/modules/customers/service";

export const metadata: Metadata = { title: "مشتریان" };

export default async function AdminCustomersPage(props: PageProps<"/admin/customers">) {
  const actor = await requirePagePermission("customers.view_all", "/admin/customers");
  const params = await props.searchParams;
  const q = firstParam(params.q) ?? "";
  const visitorId = firstParam(params.visitor) ?? "";
  const includeInactive = firstParam(params.archived) === "on";
  const [result, visitors] = await Promise.all([
    listCustomers(actor, { q: q || undefined, visitorId: visitorId || undefined, includeInactive, page: toPositiveInt(firstParam(params.page), 1), pageSize: 25 }),
    listAssignableVisitors(),
  ]);

  return (
    <>
      <PageTitle
        eyebrow="فروش"
        title="مشتریان"
        description="تعمیرگاه‌ها و ناوگان‌هایی که از اتوپارت خرید می‌کنند، همراه با ویزیتورهای تخصیص‌یافته به هر کدام."
        actions={
          actor.permissions.has("customers.create") ? (
            <ButtonLink href="/admin/customers/new">
              <Plus className="h-4 w-4" aria-hidden /> مشتری جدید
            </ButtonLink>
          ) : null
        }
      />
      <Form action="/admin/customers" className="mb-5 grid gap-3 border border-line bg-white p-4 md:grid-cols-[1.5fr_1fr_auto_auto] md:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" aria-hidden />
          <input name="q" type="search" defaultValue={q} placeholder="نام، فرد رابط، کد، شهر یا تلفن" aria-label="جستجو" className={cn(inputClasses, "h-10 ps-9")} />
        </div>
        <select name="visitor" defaultValue={visitorId} aria-label="ویزیتور" className={cn(inputClasses, selectClasses, "h-10")}>
          <option value="">همه ویزیتورها</option>
          {visitors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-[13px]">
          <Checkbox name="archived" defaultChecked={includeInactive} /> نمایش بایگانی‌شده‌ها
        </label>
        <button type="submit" className="h-10 bg-ink px-4 text-sm font-medium text-bone hover:bg-graphite">
          اعمال
        </button>
      </Form>
      {result.rows.length === 0 ? (
        <EmptyState icon={<Users className="h-5 w-5" />} title="مشتری‌ای پیدا نشد" />
      ) : (
        <div className={t.wrap}>
          <table className={t.table}>
            <thead className={t.thead}>
              <tr>
                <th className={t.th}>مشتری</th>
                <th className={t.th}>شهر</th>
                <th className={t.th}>ویزیتورها</th>
                <th className={cn(t.th, "text-end")}>سفارش‌ها</th>
                <th className={t.th}>آخرین سفارش</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((c) => (
                <tr key={c.id} className={t.tr}>
                  <td className={t.td}>
                    <Link href={`/admin/customers/${c.id}`} className="font-medium hover:text-ember-700">
                      {c.businessName}
                    </Link>
                    <p className="text-[12px] text-steel-500">
                      <span className="ltr">{c.code}</span>
                      {c.contactName ? ` · ${c.contactName}` : ""}
                      {!c.isActive ? (
                        <Badge tone="muted" className="ms-2 h-5">
                          بایگانی
                        </Badge>
                      ) : null}
                    </p>
                  </td>
                  <td className={t.td}>{c.city}</td>
                  <td className={cn(t.td, "text-[13px]")}>{c.assignments.length ? c.assignments.map((a) => a.user.name).join("، ") : <span className="text-warn">بدون ویزیتور</span>}</td>
                  <td className={cn(t.td, "type-data text-end")}>{faNumber(c._count.orders)}</td>
                  <td className={cn(t.td, "text-[13px] text-steel-600")}>{c.orders[0] ? formatDate(c.orders[0].createdAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination className="mt-6" pathname="/admin/customers" params={params} page={result.page} pageCount={result.pageCount} total={result.total} pageSize={result.pageSize} label="مشتری" />
    </>
  );
}
