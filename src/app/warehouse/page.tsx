import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Kpi, Panel } from "@/components/admin/page-title";
import { QueueCard } from "@/components/warehouse/queue-card";
import { faNumber } from "@/lib/digits";
import { formatRelative } from "@/lib/format";
import { formatOrderNumber } from "@/lib/order-workflow";
import { requirePagePermission } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { listLowStock } from "@/server/modules/inventory/service";
import { countOrdersByStatus, listOrders } from "@/server/modules/orders/queries";

export const metadata: Metadata = { title: "داشبورد انبار" };

export default async function WarehouseHome() {
  const actor = await requirePagePermission("orders.fulfil", "/warehouse");
  const now = new Date();
  const since = new Date(now.getTime() - 3 * 86_400_000);
  const [counts, queue, lowStock, recent] = await Promise.all([
    countOrdersByStatus(actor, "warehouse"),
    listOrders(actor, "warehouse", { status: "fulfilment", sort: "delivery", pageSize: 6 }),
    actor.permissions.has("inventory.view") ? listLowStock(actor, 8) : Promise.resolve([]),
    prisma.orderStatusEvent.findMany({
      where: { toStatus: { in: ["READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED"] }, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { order: { select: { id: true, number: true, customerName: true } }, actor: { select: { name: true } } },
    }),
  ]);
  const verbs: Record<string, string> = { READY_FOR_DISPATCH: "آماده ارسال شد", DISPATCHED: "ارسال شد", DELIVERED: "تحویل شد" };

  return (
    <>
      <div className="mb-6">
        <p className="type-eyebrow text-steel-500">{actor.roleName}</p>
        <h1 className="type-display mt-1.5 text-[2rem] leading-snug">امروز در انبار</h1>
      </div>
      <section className="mb-6 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
        <Kpi label="منتظر آماده‌سازی" value={faNumber(counts.APPROVED)} tone={counts.APPROVED ? "ember" : undefined} href="/warehouse/orders?status=APPROVED" />
        <Kpi label="در حال آماده‌سازی" value={faNumber(counts.PREPARING)} href="/warehouse/orders?status=PREPARING" />
        <Kpi label="آماده ارسال" value={faNumber(counts.READY_FOR_DISPATCH)} tone={counts.READY_FOR_DISPATCH ? "warn" : undefined} href="/warehouse/orders?status=READY_FOR_DISPATCH" />
        <Kpi label="در مسیر تحویل" value={faNumber(counts.DISPATCHED)} href="/warehouse/orders?status=DISPATCHED" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="type-heading text-lg">صف آماده‌سازی (به ترتیب تاریخ تحویل)</h2>
            <Link href="/warehouse/orders" className="text-[13px] font-medium text-steel-700 hover:text-ink">
              همه ←
            </Link>
          </div>
          {queue.rows.length === 0 ? (
            <p className="border border-dashed border-line p-8 text-center text-sm text-steel-500">سفارشی در صف انبار نیست.</p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {queue.rows.map((o) => (
                <li key={o.id}>
                  <QueueCard order={o} />
                </li>
              ))}
            </ul>
          )}
        </section>
        <aside className="space-y-6">
          <Panel title="هشدار کمبود موجودی" bodyClassName="p-0 md:p-0">
            {lowStock.length === 0 ? (
              <p className="p-6 text-center text-sm text-steel-500">کمبودی وجود ندارد.</p>
            ) : (
              <ul className="divide-y divide-line">
                {lowStock.map((p) => (
                  <li key={p.productId} className="flex items-center gap-3 px-4 py-3">
                    <AlertTriangle className={`h-4 w-4 shrink-0 ${p.available <= 0 ? "text-danger" : "text-warn"}`} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium">{p.name}</p>
                      <p className="text-[12px] text-steel-500">
                        قفسه <span className="ltr">{p.binLocation ?? "—"}</span> · <span className="ltr">{p.sku}</span>
                      </p>
                    </div>
                    <span className={`type-data text-[16px] font-bold ${p.available <= 0 ? "text-danger" : "text-warn"}`}>{faNumber(p.available)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="کارهای انجام‌شده اخیر">
            {recent.length === 0 ? (
              <p className="text-sm text-steel-500">در سه روز اخیر موردی ثبت نشده است.</p>
            ) : (
              <ul className="space-y-3">
                {recent.map((e) => (
                  <li key={e.id} className="text-[13px]">
                    <Link href={`/warehouse/orders/${e.order.id}`} className="hover:text-ember-700">
                      سفارش <span className="ltr font-semibold">{formatOrderNumber(e.order.number)}</span> {verbs[e.toStatus]}
                    </Link>
                    <p className="text-[12px] text-steel-500">
                      {e.order.customerName} · {e.actor?.name ?? "—"} · {formatRelative(e.createdAt, now)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>
      </div>
    </>
  );
}
