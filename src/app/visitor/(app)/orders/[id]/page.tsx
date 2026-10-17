import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Info, MessageSquare } from "lucide-react";
import { imageSrc } from "@/components/catalog/product-image";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { StatusBadge } from "@/components/ui/badges";
import { VisitorOrderActions } from "@/components/visitor/visitor-order-actions";
import { DELIVERY_WINDOW_LABELS, formatCalendarDate, formatDateTime } from "@/lib/format";
import { faNumber, toPersianDigits } from "@/lib/digits";
import { bpsToPercent, formatMoney } from "@/lib/money";
import { ORDER_STATUS_META, formatOrderNumber } from "@/lib/order-workflow";
import { firstParam } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";
import { getOrderDetail } from "@/server/modules/orders/queries";

export const metadata: Metadata = { title: "جزئیات سفارش" };

export default async function VisitorOrderPage(props: PageProps<"/visitor/orders/[id]">) {
  const { id } = await props.params;
  const actor = await requirePagePermission("orders.view_own", `/visitor/orders/${id}`);
  const order = await getOrderDetail(actor, "visitor", id);
  const placed = firstParam((await props.searchParams).placed) === "1";
  const adjusted = order.items.some((i) => i.quantity !== i.requestedQuantity || i.unitPrice !== i.requestedUnitPrice || i.discountBps > 0);
  const requestedTotal = order.items.reduce((s, i) => s + i.requestedQuantity * i.requestedUnitPrice, 0);

  return (
    <div className="space-y-6">
      <Link href="/visitor/orders" className="inline-flex items-center gap-1.5 text-[13px] text-steel-600 hover:text-ink">
        <ArrowRight className="h-3.5 w-3.5" aria-hidden /> سفارش‌های من
      </Link>

      {placed && order.status !== "DRAFT" ? (
        <div role="status" className="flex items-start gap-3 border border-ok/30 bg-ok-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ok" aria-hidden />
          <div>
            <p className="font-semibold text-ok">سفارش <span className="ltr">{formatOrderNumber(order.number)}</span> ثبت شد</p>
            <p className="mt-0.5 text-[13.5px] leading-relaxed text-steel-800">موجودی رزرو شد و میز سفارش مطلع گردید. از مراحل تأیید و ارسال باخبر خواهید شد.</p>
          </div>
        </div>
      ) : null}

      <header className="border-b border-ink pb-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="ltr type-data text-[13px] text-steel-600">{formatOrderNumber(order.number)}</span>
          <StatusBadge status={order.status} />
        </div>
        <h1 className="type-display mt-3 text-[1.9rem] leading-[1.02]">{order.customerName}</h1>
        <p className="mt-2 text-[13px] text-steel-600">{ORDER_STATUS_META[order.status].description}</p>
      </header>

      {order.status === "DRAFT" || order.status === "SUBMITTED" ? <VisitorOrderActions orderId={order.id} status={order.status} /> : null}

      {order.rejectionReason || order.cancellationReason ? (
        <div className="flex items-start gap-2.5 border border-line bg-bone p-4 text-[13.5px]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-steel-700" aria-hidden />
          <p>
            <span className="font-semibold">{order.rejectionReason ? "علت رد: " : "علت لغو: "}</span>
            {order.rejectionReason ?? order.cancellationReason}
          </p>
        </div>
      ) : null}

      <section aria-labelledby="lines-title">
        <div className="mb-2 flex items-end justify-between">
          <h2 id="lines-title" className="type-eyebrow text-steel-600">
            اقلام سفارش · {faNumber(order.items.length)}
          </h2>
          {adjusted ? <span className="type-eyebrow text-[11px] text-ember">اصلاح‌شده توسط میز سفارش</span> : null}
        </div>
        <ul className="divide-y divide-line border border-line bg-white">
          {order.items.map((item) => {
            const qtyChanged = item.quantity !== item.requestedQuantity;
            const priceChanged = item.unitPrice !== item.requestedUnitPrice;
            return (
              <li key={item.id} className="flex gap-3 p-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageSrc(item.product.images[0], item.product.category.illustration)} alt="" className="h-14 w-16 shrink-0 bg-[#f5f3ee] object-contain p-1" />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium leading-snug">{item.productName}</p>
                  <p className="type-data text-[11.5px] text-steel-500">
                    <span className="ltr">{item.sku}</span> · {item.brandName}
                  </p>
                  <p className="type-data mt-1.5 text-[13px]">
                    {qtyChanged ? <span className="me-1.5 text-steel-400 line-through">{faNumber(item.requestedQuantity)}</span> : null}
                    <span className={qtyChanged ? "font-semibold text-ember-700" : undefined}>{faNumber(item.quantity)}</span>
                    <span className="text-steel-500"> × </span>
                    {priceChanged ? <span className="me-1.5 text-steel-400 line-through">{formatMoney(item.requestedUnitPrice)}</span> : null}
                    {formatMoney(item.unitPrice)}
                    {item.discountBps > 0 ? <span className="ms-1.5 text-ok">٪{toPersianDigits(bpsToPercent(item.discountBps))} تخفیف</span> : null}
                  </p>
                </div>
                <p className="type-data shrink-0 text-[14.5px] font-medium">{formatMoney(item.lineTotal)}</p>
              </li>
            );
          })}
        </ul>
        <dl className="mt-3 space-y-1.5 border border-line bg-bone/50 p-4 text-[14px]">
          {adjusted ? (
            <div className="flex justify-between text-steel-500">
              <dt>مبلغ درخواستی اولیه</dt>
              <dd className="type-data line-through">{formatMoney(requestedTotal)}</dd>
            </div>
          ) : null}
          {order.discountAmount > 0 ? (
            <div className="flex justify-between text-steel-700">
              <dt>تخفیف</dt>
              <dd className="type-data">−{formatMoney(order.discountAmount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between text-[16px] font-semibold">
            <dt>جمع کل (بدون مالیات)</dt>
            <dd className="type-data">{formatMoney(order.total)}</dd>
          </div>
          <p className="pt-1 text-[11.5px] text-steel-500">قیمت‌ها همان قیمت‌های ثبت‌شده در این سفارش هستند و با تغییر قیمت کاتالوگ تغییر نمی‌کنند.</p>
        </dl>
      </section>

      <section className="grid grid-cols-2 gap-px border border-line bg-line text-[13.5px]" aria-label="تحویل">
        <div className="bg-white p-4">
          <p className="type-eyebrow text-steel-500">تحویل درخواستی</p>
          <p className="mt-1.5 font-medium">{order.requestedDeliveryDate ? formatCalendarDate(order.requestedDeliveryDate) : "اولین زمان ممکن"}</p>
          <p className="text-steel-600">{DELIVERY_WINDOW_LABELS[order.requestedDeliveryWindow]}</p>
        </div>
        <div className="bg-white p-4">
          <p className="type-eyebrow text-steel-500">تحویل تأییدشده</p>
          {order.confirmedDeliveryDate ? (
            <>
              <p className="mt-1.5 font-medium">{formatCalendarDate(order.confirmedDeliveryDate)}</p>
              <p className="text-steel-600">{order.confirmedDeliveryWindow ? DELIVERY_WINDOW_LABELS[order.confirmedDeliveryWindow] : ""}</p>
            </>
          ) : (
            <p className="mt-1.5 text-steel-500">در انتظار تأیید</p>
          )}
        </div>
        <div className="col-span-2 bg-white p-4">
          <p className="type-eyebrow text-steel-500">نشانی تحویل</p>
          <p className="mt-1.5 whitespace-pre-line">{order.deliveryAddress}</p>
          {order.dispatchedAt ? (
            <p className="mt-2 text-steel-600">
              ارسال‌شده در {formatDateTime(order.dispatchedAt)}
              {order.dispatchCarrier ? ` با ${order.dispatchCarrier}` : ""}
              {order.dispatchReference ? ` · کد رهگیری ${order.dispatchReference}` : ""}
            </p>
          ) : null}
        </div>
      </section>

      {order.visitorNote ? (
        <section className="flex gap-3 border border-line bg-white p-4 text-[14px]">
          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-steel-500" aria-hidden />
          <div>
            <p className="type-eyebrow text-steel-500">توضیح شما</p>
            <p className="mt-1 whitespace-pre-line">{order.visitorNote}</p>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="history-title">
        <h2 id="history-title" className="type-eyebrow mb-3 text-steel-600">
          تاریخچه وضعیت
        </h2>
        <div className="border border-line bg-white p-4">
          <OrderTimeline events={order.statusEvents} />
        </div>
      </section>
    </div>
  );
}
