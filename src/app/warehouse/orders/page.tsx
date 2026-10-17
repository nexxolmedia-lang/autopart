import type { Metadata } from "next";
import Link from "next/link";
import { PackageCheck } from "lucide-react";
import { QueueCard } from "@/components/warehouse/queue-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { faNumber } from "@/lib/digits";
import { cn, firstParam, toPositiveInt } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";
import { countOrdersByStatus, listOrders } from "@/server/modules/orders/queries";

export const metadata: Metadata = { title: "صف سفارش‌ها" };

const TABS = [
  { value: "APPROVED", label: "منتظر آماده‌سازی" },
  { value: "PREPARING", label: "در حال آماده‌سازی" },
  { value: "READY_FOR_DISPATCH", label: "آماده ارسال" },
  { value: "DISPATCHED", label: "ارسال‌شده" },
  { value: "DELIVERED", label: "تحویل‌شده" },
] as const;

export default async function WarehouseOrdersPage(props: PageProps<"/warehouse/orders">) {
  const actor = await requirePagePermission("orders.fulfil", "/warehouse/orders");
  const params = await props.searchParams;
  const status = TABS.find((t) => t.value === firstParam(params.status))?.value ?? "APPROVED";
  const [result, counts] = await Promise.all([
    listOrders(actor, "warehouse", { status, sort: status === "DELIVERED" || status === "DISPATCHED" ? "newest" : "delivery", page: toPositiveInt(firstParam(params.page), 1), pageSize: 18 }),
    countOrdersByStatus(actor, "warehouse"),
  ]);
  return (
    <>
      <h1 className="type-display mb-5 text-[2rem] leading-snug">صف سفارش‌ها</h1>
      <nav aria-label="وضعیت" className="scrollbar-none mb-5 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/warehouse/orders?status=${t.value}`}
            aria-current={status === t.value ? "page" : undefined}
            className={cn("flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[14px] font-medium", status === t.value ? "border-ink bg-ink text-bone" : "border-line bg-white hover:border-ink")}
          >
            {t.label}
            <span className={cn("type-data rounded-full px-1.5 text-[12px]", status === t.value ? "bg-ember text-ink" : "bg-bone")}>{faNumber(counts[t.value])}</span>
          </Link>
        ))}
      </nav>
      {result.rows.length === 0 ? (
        <EmptyState icon={<PackageCheck className="h-5 w-5" />} title="سفارشی در این وضعیت نیست" />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {result.rows.map((o) => (
            <li key={o.id}>
              <QueueCard order={o} />
            </li>
          ))}
        </ul>
      )}
      <Pagination className="mt-6" pathname="/warehouse/orders" params={params} page={result.page} pageCount={result.pageCount} total={result.total} pageSize={result.pageSize} label="سفارش" />
    </>
  );
}
