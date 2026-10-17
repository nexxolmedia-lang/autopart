import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { StatusBadge } from "@/components/ui/badges";
import { formatCalendarDate, formatDateTime } from "@/lib/format";
import { faNumber } from "@/lib/digits";
import { formatMoney } from "@/lib/money";
import { formatOrderNumber, type OrderStatusKey } from "@/lib/order-workflow";

export type OrderRowData = {
  id: string;
  number: number;
  status: OrderStatusKey;
  customerName: string;
  total: number | null;
  createdAt: Date;
  requestedDeliveryDate: Date | null;
  _count: { items: number };
};

/** Touch-friendly order summary used across the field app. */
export function OrderRow({ order, href }: { order: OrderRowData; href: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 bg-white px-4 py-3.5 transition-colors active:bg-bone hover:bg-bone/50">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="ltr type-data text-[12.5px] font-medium text-ink">{formatOrderNumber(order.number)}</span>
          <StatusBadge status={order.status} className="h-5 text-[11px]" />
        </div>
        <p className="mt-1 truncate text-[15px] font-medium">{order.customerName}</p>
        <p className="mt-0.5 text-[12.5px] text-steel-500">
          {formatDateTime(order.createdAt)} · {faNumber(order._count.items)} قلم
          {order.requestedDeliveryDate ? <> · تحویل {formatCalendarDate(order.requestedDeliveryDate)}</> : null}
        </p>
      </div>
      {order.total !== null ? <p className="type-data shrink-0 text-[15px] font-medium">{formatMoney(order.total)}</p> : null}
      <ChevronLeft className="h-4 w-4 shrink-0 text-steel-400 transition-transform group-hover:-translate-x-0.5" aria-hidden />
    </Link>
  );
}
