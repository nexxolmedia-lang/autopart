import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { ClipboardList, Search } from "lucide-react";
import { OrderRow } from "@/components/visitor/order-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ButtonLink } from "@/components/ui/button";
import { cn, firstParam, toPositiveInt } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";
import { listOrders } from "@/server/modules/orders/queries";

export const metadata: Metadata = { title: "سفارش‌های من" };

const FILTERS = [
  { value: "", label: "همه" },
  { value: "draft", label: "پیش‌نویس" },
  { value: "awaiting", label: "در انتظار تأیید" },
  { value: "fulfilment", label: "در حال آماده‌سازی" },
  { value: "dispatched", label: "ارسال‌شده" },
  { value: "closed", label: "بسته‌شده" },
];

export default async function VisitorOrdersPage(props: PageProps<"/visitor/orders">) {
  const actor = await requirePagePermission("orders.view_own", "/visitor/orders");
  const params = await props.searchParams;
  const status = firstParam(params.status) ?? "";
  const q = firstParam(params.q)?.trim() ?? "";
  const result = await listOrders(actor, "visitor", { status: status || undefined, q: q || undefined, page: toPositiveInt(firstParam(params.page), 1), pageSize: 15 });

  const hrefFor = (value: string) => {
    const sp = new URLSearchParams();
    if (value) sp.set("status", value);
    if (q) sp.set("q", q);
    const s = sp.toString();
    return s ? `/visitor/orders?${s}` : "/visitor/orders";
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="type-eyebrow text-steel-500">سابقه سفارش‌ها</p>
          <h1 className="type-display mt-1.5 text-[2rem] leading-snug">سفارش‌های من</h1>
        </div>
        <ButtonLink href="/visitor/orders/new" size="sm">
          سفارش جدید
        </ButtonLink>
      </div>

      <Form action="/visitor/orders" className="relative">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" aria-hidden />
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="شماره سفارش، مشتری یا کد کالا"
          aria-label="جستجوی سفارش"
          className="h-12 w-full rounded-xs border border-line bg-white ps-10 pe-3 text-[16px] focus:border-ink focus:outline-none"
        />
      </Form>

      <nav aria-label="فیلتر وضعیت" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={hrefFor(f.value)}
            aria-current={status === f.value ? "page" : undefined}
            className={cn(
              "flex h-9 shrink-0 items-center rounded-full border px-3.5 text-[13px] font-medium transition-colors",
              status === f.value ? "border-ink bg-ink text-bone" : "border-line bg-white text-steel-700 hover:border-ink",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {result.rows.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-5 w-5" />}
          title={q || status ? "سفارشی با این مشخصات نیست" : "هنوز سفارشی ثبت نشده"}
          description={q || status ? "فیلتر یا عبارت جستجوی دیگری را امتحان کنید." : "سفارش‌هایی که برای مشتریان ثبت می‌کنید اینجا نمایش داده می‌شوند."}
          action={<ButtonLink href="/visitor/orders/new">ثبت سفارش</ButtonLink>}
        />
      ) : (
        <ul className="divide-y divide-line border border-line">
          {result.rows.map((o) => (
            <li key={o.id}>
              <OrderRow order={o} href={`/visitor/orders/${o.id}`} />
            </li>
          ))}
        </ul>
      )}
      <Pagination pathname="/visitor/orders" params={params} page={result.page} pageCount={result.pageCount} total={result.total} pageSize={result.pageSize} label="سفارش" />
    </div>
  );
}
