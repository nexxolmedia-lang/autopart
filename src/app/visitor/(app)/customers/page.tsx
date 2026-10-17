import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { ChevronLeft, Search, UserPlus, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { faNumber } from "@/lib/digits";
import { formatRelative } from "@/lib/format";
import { firstParam, toPositiveInt } from "@/lib/utils";
import { requirePageAnyPermission } from "@/server/auth/session";
import { listCustomers } from "@/server/modules/customers/service";

export const metadata: Metadata = { title: "مشتریان" };

export default async function VisitorCustomersPage(props: PageProps<"/visitor/customers">) {
  const actor = await requirePageAnyPermission(["customers.view_assigned", "customers.view_all"], "/visitor/customers");
  const params = await props.searchParams;
  const q = firstParam(params.q)?.trim() ?? "";
  const result = await listCustomers(actor, { q: q || undefined, page: toPositiveInt(firstParam(params.page), 1), pageSize: 20 });
  const now = new Date();

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="type-eyebrow text-steel-500">تخصیص‌یافته به شما</p>
          <h1 className="type-display mt-1.5 text-[2rem] leading-snug">مشتریان</h1>
        </div>
        {actor.permissions.has("customers.create") ? (
          <ButtonLink href="/visitor/customers/new" size="sm" variant="dark">
            <UserPlus className="h-4 w-4" aria-hidden /> افزودن
          </ButtonLink>
        ) : null}
      </div>
      <Form action="/visitor/customers" className="relative">
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" aria-hidden />
        <input name="q" type="search" defaultValue={q} placeholder="نام، فرد رابط، شهر یا کد" aria-label="جستجوی مشتری" className="h-12 w-full rounded-xs border border-line bg-white ps-10 pe-3 text-[16px] focus:border-ink focus:outline-none" />
      </Form>
      {result.rows.length === 0 ? (
        <EmptyState icon={<Users className="h-5 w-5" />} title={q ? "مشتری‌ای پیدا نشد" : "هنوز مشتری‌ای به شما تخصیص داده نشده"} description={q ? "جستجوی دیگری را امتحان کنید." : "از میز سفارش بخواهید مشتری به شما تخصیص دهد یا مشتری جدید اضافه کنید."} />
      ) : (
        <ul className="divide-y divide-line border border-line">
          {result.rows.map((c) => (
            <li key={c.id}>
              <Link href={`/visitor/customers/${c.id}`} className="flex items-center gap-3 bg-white px-4 py-3.5 hover:bg-bone/50 active:bg-bone">
                <span className="type-heading flex h-10 w-10 shrink-0 items-center justify-center bg-bone text-[15px]">{c.businessName.slice(0, 1)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{c.businessName}</p>
                  <p className="truncate text-[12.5px] text-steel-500">
                    {c.city}
                    {c.contactName ? ` · ${c.contactName}` : ""} · {faNumber(c._count.orders)} سفارش
                    {c.orders[0] ? ` · آخرین ${formatRelative(c.orders[0].createdAt, now)}` : ""}
                  </p>
                </div>
                <ChevronLeft className="h-4 w-4 text-steel-400" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pagination pathname="/visitor/customers" params={params} page={result.page} pageCount={result.pageCount} total={result.total} pageSize={result.pageSize} label="مشتری" />
    </div>
  );
}
