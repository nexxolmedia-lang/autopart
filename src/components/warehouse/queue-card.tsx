import Link from "next/link";
import { CalendarClock, ChevronLeft } from "lucide-react";
import { StatusBadge } from "@/components/ui/badges";
import { faNumber } from "@/lib/digits";
import { DELIVERY_WINDOW_LABELS, formatCalendarDate } from "@/lib/format";
import { formatOrderNumber } from "@/lib/order-workflow";
import type { OrderListResult } from "@/server/modules/orders/queries";

type Row = OrderListResult["rows"][number];

/** Large-target queue card for tablets on the warehouse floor. No prices. */
export function QueueCard({ order }: { order: Row }) {
  const delivery = order.confirmedDeliveryDate ?? order.requestedDeliveryDate;
  const window = order.confirmedDeliveryWindow ?? order.requestedDeliveryWindow;
  const pct = order.pickableLines ? Math.round((order.pickedLines / order.pickableLines) * 100) : 0;
  return (
    <Link href={`/warehouse/orders/${order.id}`} className="group block border border-line bg-white p-4 transition-colors hover:border-ink active:bg-bone md:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="ltr type-data text-[15px] font-bold">{formatOrderNumber(order.number)}</span>
        <StatusBadge status={order.status} />
      </div>
      <p className="mt-2 text-[17px] font-semibold">{order.customerName}</p>
      <p className="text-[13px] text-steel-500">{order.customer.city}</p>
      <div className="mt-3 flex items-center gap-2 text-[13px] text-steel-700">
        <CalendarClock className="h-4 w-4 shrink-0" aria-hidden />
        {delivery ? `${formatCalendarDate(delivery)} · ${DELIVERY_WINDOW_LABELS[window]}` : "اولین زمان ممکن"}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 bg-steel-100" aria-hidden>
          <div className={pct === 100 ? "h-full bg-ok" : "h-full bg-ember"} style={{ width: `${pct}%` }} />
        </div>
        <span className="shrink-0 text-[12.5px] text-steel-600">
          {faNumber(order.pickedLines)} از {faNumber(order.pickableLines)} قلم · {faNumber(order.unitCount)} عدد
        </span>
        <ChevronLeft className="h-4 w-4 shrink-0 text-steel-400 transition-transform group-hover:-translate-x-0.5" aria-hidden />
      </div>
    </Link>
  );
}
