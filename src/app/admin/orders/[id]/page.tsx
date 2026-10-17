import type { Metadata } from "next";
import Link from "next/link";
import { Info, MessageSquare, Phone, Printer } from "lucide-react";
import { PageTitle, Panel } from "@/components/admin/page-title";
import { DeliveryEditor } from "@/components/orders/delivery-editor";
import { NotesPanel } from "@/components/orders/notes-panel";
import { OrderLinesEditor, type EditorLine } from "@/components/orders/order-lines-editor";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { WorkflowActions } from "@/components/orders/workflow-actions";
import { StatusBadge } from "@/components/ui/badges";
import { availableQuantity } from "@/lib/availability";
import { faNumber } from "@/lib/digits";
import { DELIVERY_WINDOW_LABELS, businessToday, formatCalendarDate, formatDateTime, toIsoDate } from "@/lib/format";
import { EDITABLE_BY_DESK_STATUSES, ORDER_STATUS_META, TERMINAL_STATUSES, availableActions, formatOrderNumber, type OrderAction } from "@/lib/order-workflow";
import { requirePagePermission } from "@/server/auth/session";
import { getOrderAuditTrail, getOrderDetail } from "@/server/modules/orders/queries";

export const metadata: Metadata = { title: "جزئیات سفارش" };

export default async function AdminOrderPage(props: PageProps<"/admin/orders/[id]">) {
  const { id } = await props.params;
  const actor = await requirePagePermission("orders.view_all", `/admin/orders/${id}`);
  const [order, audit] = await Promise.all([getOrderDetail(actor, "admin", id), getOrderAuditTrail(actor, id)]);
  const today = businessToday();

  const actions = availableActions(order, { id: actor.id, permissions: actor.permissions }).filter((a) => a !== "submit");
  const blocked: Partial<Record<OrderAction, string>> = {};
  if (!order.items.some((i) => i.quantity > 0)) blocked.approve = "هیچ قلمی با تعداد بیشتر از صفر وجود ندارد.";
  const unpicked = order.items.filter((i) => i.quantity > 0 && !i.pickedAt).length;
  if (unpicked) blocked.mark_ready = `${faNumber(unpicked)} قلم هنوز جمع‌آوری نشده است.`;

  const editable = EDITABLE_BY_DESK_STATUSES.includes(order.status) && actor.permissions.has("orders.review");
  const exactStock = actor.permissions.has("inventory.view");
  const lines: EditorLine[] = order.items.map((i) => ({
    id: i.id,
    productName: i.productName,
    sku: i.sku,
    brandName: i.brandName,
    image: i.product.images[0] ?? null,
    illustration: i.product.category.illustration,
    requestedQuantity: i.requestedQuantity,
    requestedUnitPrice: i.requestedUnitPrice,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    discountBps: i.discountBps,
    lineTotal: i.lineTotal,
    catalogPrice: i.product.price,
    stock:
      exactStock && i.product.inventory
        ? {
            available: availableQuantity(i.product.inventory.onHand, i.product.inventory.reserved),
            reservedHere: i.reservation?.status === "ACTIVE" ? i.reservation.quantity : 0,
            bin: i.product.inventory.binLocation,
          }
        : null,
  }));
  const canEditDelivery = actor.permissions.has("orders.review") && !TERMINAL_STATUSES.includes(order.status) && order.status !== "DISPATCHED" && order.status !== "DRAFT";

  return (
    <>
      <PageTitle
        back={{ href: "/admin/orders", label: "سفارش‌ها" }}
        eyebrow={
          <span className="flex items-center gap-2">
            <span className="ltr type-data">{formatOrderNumber(order.number)}</span>
            <StatusBadge status={order.status} />
          </span>
        }
        title={order.customerName}
        description={ORDER_STATUS_META[order.status].description}
        actions={
          <>
            <WorkflowActions orderId={order.id} version={order.version} actions={actions} blockedReason={blocked} />
            <Link href={`/warehouse/orders/${order.id}`} className="no-print hidden h-10 items-center gap-2 border border-line px-3 text-[13px] hover:border-ink md:inline-flex" aria-label="نمای انبار">
              <Printer className="h-4 w-4" aria-hidden /> فهرست جمع‌آوری
            </Link>
          </>
        }
      />

      {order.rejectionReason || order.cancellationReason ? (
        <div className="mb-6 flex items-start gap-2.5 border border-line bg-bone p-4 text-[13.5px]">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            <span className="font-semibold">{order.rejectionReason ? "علت رد: " : "علت لغو: "}</span>
            {order.rejectionReason ?? order.cancellationReason}
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          <Panel title={`اقلام سفارش · ${faNumber(order.items.length)}`} bodyClassName="p-0 md:p-0">
            <div className="p-3 md:p-4">
              <OrderLinesEditor orderId={order.id} version={order.version} lines={lines} editable={editable} canPrice={actor.permissions.has("pricing.manage")} />
            </div>
          </Panel>

          {order.visitorNote ? (
            <Panel title="توضیح ویزیتور">
              <p className="flex gap-2 whitespace-pre-line text-[14px] leading-relaxed">
                <MessageSquare className="mt-1 h-4 w-4 shrink-0 text-steel-500" aria-hidden />
                {order.visitorNote}
              </p>
            </Panel>
          ) : null}

          <Panel title="یادداشت‌های داخلی">
            <NotesPanel
              orderId={order.id}
              canAdd={actor.permissions.has("orders.review") || actor.permissions.has("orders.fulfil")}
              notes={(order.notes ?? []).map((n) => ({ id: n.id, body: n.body, author: n.author?.name ?? "—", when: formatDateTime(n.createdAt) }))}
            />
          </Panel>

          {audit.length ? (
            <Panel title="سابقه ممیزی این سفارش" bodyClassName="p-0 md:p-0">
              <ul className="divide-y divide-line text-[13px]">
                {audit.map((a) => (
                  <li key={a.id} className="flex flex-col gap-0.5 px-4 py-2.5 md:flex-row md:items-center md:justify-between md:px-5">
                    <span>{a.summary}</span>
                    <span className="shrink-0 text-[12px] text-steel-500">
                      {a.actor?.name ?? "سیستم"} · {formatDateTime(a.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>

        <aside className="space-y-6">
          <Panel title="مشتری">
            <p className="font-semibold">{order.customer.businessName}</p>
            <p className="text-[12.5px] text-steel-500">
              <span className="ltr">{order.customer.code}</span>
              {order.customer.contactName ? ` · ${order.customer.contactName}` : ""}
            </p>
            {order.customer.phone ? (
              <a href={`tel:${order.customer.phone.replace(/[^+\d]/g, "")}`} className="mt-2 inline-flex items-center gap-1.5 text-[13px] hover:text-ember-700">
                <Phone className="h-3.5 w-3.5" aria-hidden /> <span className="ltr">{order.customer.phone}</span>
              </a>
            ) : null}
            <p className="mt-3 whitespace-pre-line border-t border-line pt-3 text-[13px] leading-relaxed text-steel-700">{order.deliveryAddress}</p>
            {actor.permissions.has("customers.view_all") ? (
              <Link href={`/admin/customers/${order.customer.id}`} className="mt-3 inline-block text-[13px] font-medium text-steel-700 hover:text-ink">
                پرونده مشتری ←
              </Link>
            ) : null}
          </Panel>

          <Panel title="تحویل">
            <dl className="mb-4 grid grid-cols-2 gap-3 text-[13px]">
              <div>
                <dt className="text-steel-500">درخواست ویزیتور</dt>
                <dd className="mt-1 font-medium">{order.requestedDeliveryDate ? formatCalendarDate(order.requestedDeliveryDate) : "اولین زمان ممکن"}</dd>
                <dd className="text-[12px] text-steel-600">{DELIVERY_WINDOW_LABELS[order.requestedDeliveryWindow]}</dd>
              </div>
              <div>
                <dt className="text-steel-500">تأییدشده</dt>
                <dd className="mt-1 font-medium">{order.confirmedDeliveryDate ? formatCalendarDate(order.confirmedDeliveryDate) : "—"}</dd>
                <dd className="text-[12px] text-steel-600">{order.confirmedDeliveryWindow ? DELIVERY_WINDOW_LABELS[order.confirmedDeliveryWindow] : ""}</dd>
              </div>
            </dl>
            {order.dispatchedAt ? (
              <p className="mb-3 text-[13px] text-steel-700">
                ارسال در {formatDateTime(order.dispatchedAt)}
                {order.dispatchCarrier ? ` با ${order.dispatchCarrier}` : ""}
                {order.dispatchReference ? (
                  <>
                    {" "}
                    · کد رهگیری <span className="ltr">{order.dispatchReference}</span>
                  </>
                ) : null}
              </p>
            ) : null}
            {canEditDelivery ? (
              <DeliveryEditor
                orderId={order.id}
                version={order.version}
                today={today}
                date={order.confirmedDeliveryDate ? toIsoDate(order.confirmedDeliveryDate) : order.requestedDeliveryDate && toIsoDate(order.requestedDeliveryDate) >= today ? toIsoDate(order.requestedDeliveryDate) : ""}
                window={order.confirmedDeliveryWindow ?? order.requestedDeliveryWindow}
              />
            ) : null}
          </Panel>

          <Panel title="ویزیتور">
            <p className="font-medium">{order.visitor.name}</p>
            <p className="ltr text-end text-[12.5px] text-steel-500">{order.visitor.email}</p>
            {order.approvedBy ? <p className="mt-2 text-[12.5px] text-steel-600">تأییدکننده: {order.approvedBy.name}</p> : null}
          </Panel>

          <Panel title="تاریخچه وضعیت">
            <OrderTimeline events={order.statusEvents} />
          </Panel>
        </aside>
      </div>
    </>
  );
}
