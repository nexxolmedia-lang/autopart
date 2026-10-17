import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, MessageSquare, Phone } from "lucide-react";
import { imageSrc } from "@/components/catalog/product-image";
import { Panel } from "@/components/admin/page-title";
import { NotesPanel } from "@/components/orders/notes-panel";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { WorkflowActions } from "@/components/orders/workflow-actions";
import { PickToggle, PrintButton } from "@/components/warehouse/pick-toggle";
import { StatusBadge } from "@/components/ui/badges";
import { faNumber } from "@/lib/digits";
import { DELIVERY_WINDOW_LABELS, formatCalendarDate, formatDateTime } from "@/lib/format";
import { availableActions, formatOrderNumber, type OrderAction } from "@/lib/order-workflow";
import { cn } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";
import { getWarehouseOrder } from "@/server/modules/orders/queries";

export const metadata: Metadata = { title: "فهرست جمع‌آوری" };

const WAREHOUSE_ACTIONS: OrderAction[] = ["start_preparing", "mark_ready", "dispatch", "deliver"];

export default async function WarehouseOrderPage(props: PageProps<"/warehouse/orders/[id]">) {
  const { id } = await props.params;
  const actor = await requirePagePermission("orders.fulfil", `/warehouse/orders/${id}`);
  const order = await getWarehouseOrder(actor, id);
  const actions = availableActions({ status: order.status, visitorId: "" }, { id: actor.id, permissions: actor.permissions }).filter((a) => WAREHOUSE_ACTIONS.includes(a));
  // Pick in shelf order to minimise walking.
  const lines = [...order.items].filter((i) => i.quantity > 0).sort((a, b) => (a.product.inventory?.binLocation ?? "~").localeCompare(b.product.inventory?.binLocation ?? "~"));
  const unpicked = lines.filter((i) => !i.pickedAt).length;
  const blocked: Partial<Record<OrderAction, string>> = unpicked ? { mark_ready: `${faNumber(unpicked)} قلم هنوز جمع‌آوری نشده است.` } : {};
  const delivery = order.confirmedDeliveryDate ?? order.requestedDeliveryDate;
  const canPick = order.status === "PREPARING";

  return (
    <>
      <Link href="/warehouse/orders" className="no-print mb-4 inline-flex items-center gap-1.5 text-[13px] text-steel-600 hover:text-ink">
        <ArrowRight className="h-3.5 w-3.5" aria-hidden /> صف سفارش‌ها
      </Link>
      <header className="mb-6 flex flex-col gap-4 border-b border-ink pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="ltr type-data text-[22px] font-bold">{formatOrderNumber(order.number)}</span>
            <StatusBadge status={order.status} />
          </div>
          <h1 className="type-display mt-2 text-[2rem] leading-snug">{order.customerName}</h1>
          <p className="mt-1 text-[14px] text-steel-600">
            تحویل: {delivery ? formatCalendarDate(delivery) : "اولین زمان ممکن"} · {DELIVERY_WINDOW_LABELS[order.confirmedDeliveryWindow ?? order.requestedDeliveryWindow]}
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <WorkflowActions orderId={order.id} version={order.version} actions={actions} blockedReason={blocked} />
          <PrintButton />
        </div>
      </header>

      {order.status === "APPROVED" ? (
        <p className="no-print mb-5 border border-ember/30 bg-ember-50 p-4 text-[14px]">برای شروع جمع‌آوری، دکمه «شروع آماده‌سازی» را بزنید. پس از آن می‌توانید هر قلم را علامت بزنید.</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section aria-labelledby="pick-title">
          <div className="mb-3 flex items-end justify-between">
            <h2 id="pick-title" className="type-heading text-lg">
              فهرست جمع‌آوری · به ترتیب قفسه
            </h2>
            <span className="text-[13px] text-steel-600">
              {faNumber(lines.length - unpicked)} از {faNumber(lines.length)} قلم
            </span>
          </div>
          <ul className="divide-y divide-line border border-line bg-white">
            {lines.map((item) => (
              <li key={item.id} className={cn("flex items-center gap-4 p-4", item.pickedAt && "bg-ok-50/50")}>
                <div className="w-20 shrink-0 text-center">
                  <p className="text-[11px] text-steel-500">قفسه</p>
                  <p className="ltr type-data text-[17px] font-bold">{item.product.inventory?.binLocation ?? "—"}</p>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageSrc(item.product.images[0], item.product.category.illustration)} alt="" className="hidden h-14 w-16 shrink-0 bg-[#f5f3ee] object-contain p-1 sm:block" />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold leading-snug">{item.productName}</p>
                  <p className="text-[12.5px] text-steel-500">
                    <span className="ltr">{item.sku}</span> · <span className="ltr">{item.brandName}</span>
                  </p>
                  {item.pickedAt ? (
                    <p className="mt-0.5 text-[12px] text-ok">
                      جمع‌آوری توسط {item.pickedBy?.name ?? "—"} · {formatDateTime(item.pickedAt)}
                    </p>
                  ) : null}
                </div>
                <div className="shrink-0 text-center">
                  <p className="text-[11px] text-steel-500">تعداد</p>
                  <p className="type-display text-[1.7rem] leading-none">{faNumber(item.quantity)}</p>
                </div>
                <div className="no-print">
                  <PickToggle orderId={order.id} itemId={item.id} picked={Boolean(item.pickedAt)} disabled={!canPick} label={`جمع‌آوری ${item.productName}`} />
                </div>
              </li>
            ))}
          </ul>
          {order.items.some((i) => i.quantity === 0) ? <p className="mt-2 text-[12.5px] text-steel-500">اقلامی که میز سفارش تعداد آن‌ها را صفر کرده، در این فهرست نمایش داده نمی‌شوند.</p> : null}
        </section>
        <aside className="space-y-6">
          <Panel title="ارسال به">
            <p className="font-semibold">{order.customerName}</p>
            <p className="mt-2 flex gap-2 whitespace-pre-line text-[13.5px] leading-relaxed text-steel-700">
              <MapPin className="mt-1 h-4 w-4 shrink-0" aria-hidden />
              {order.deliveryAddress}
            </p>
            {order.customer.phone ? (
              <p className="mt-2 flex items-center gap-2 text-[13.5px]">
                <Phone className="h-4 w-4" aria-hidden /> {order.customer.contactName ?? ""} <span className="ltr">{order.customer.phone}</span>
              </p>
            ) : null}
            {order.dispatchedAt ? (
              <p className="mt-3 border-t border-line pt-3 text-[13px] text-steel-700">
                ارسال‌شده {formatDateTime(order.dispatchedAt)}
                {order.dispatchCarrier ? ` با ${order.dispatchCarrier}` : ""}
                {order.dispatchReference ? (
                  <>
                    {" "}
                    · <span className="ltr">{order.dispatchReference}</span>
                  </>
                ) : null}
              </p>
            ) : null}
          </Panel>
          {order.visitorNote ? (
            <Panel title="توضیح ویزیتور">
              <p className="flex gap-2 whitespace-pre-line text-[14px]">
                <MessageSquare className="mt-1 h-4 w-4 shrink-0 text-steel-500" aria-hidden />
                {order.visitorNote}
              </p>
            </Panel>
          ) : null}
          <Panel title="یادداشت‌های داخلی" className="no-print">
            <NotesPanel orderId={order.id} canAdd notes={order.notes.map((n) => ({ id: n.id, body: n.body, author: n.author?.name ?? "—", when: formatDateTime(n.createdAt) }))} />
          </Panel>
          <Panel title="تاریخچه وضعیت" className="no-print">
            <OrderTimeline events={order.statusEvents} />
          </Panel>
        </aside>
      </div>
    </>
  );
}
