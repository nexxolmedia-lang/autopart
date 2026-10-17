import { formatDateTime } from "@/lib/format";
import { ORDER_STATUS_META, type OrderStatusKey } from "@/lib/order-workflow";
import { cn } from "@/lib/utils";

export type TimelineEvent = {
  id: string;
  fromStatus: OrderStatusKey | null;
  toStatus: OrderStatusKey;
  note: string | null;
  createdAt: Date;
  actor: { name: string } | null;
};

const dot: Record<string, string> = {
  success: "bg-ok",
  danger: "bg-danger",
  attention: "bg-ember",
  info: "bg-info",
  progress: "bg-warn",
  muted: "bg-steel-400",
  neutral: "bg-steel-600",
};

/** Status history, newest last, with responsible user and timestamp. */
export function OrderTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative space-y-0">
      {events.map((e, i) => {
        const meta = ORDER_STATUS_META[e.toStatus];
        const last = i === events.length - 1;
        return (
          <li key={e.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!last ? <span className="absolute start-[5px] top-4 h-[calc(100%-8px)] w-px bg-line" aria-hidden /> : null}
            <span className={cn("relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-paper", dot[meta.tone], last && "ring-2 ring-ember/30")} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium">{meta.label}</p>
              <p className="text-[12px] text-steel-500">
                {formatDateTime(e.createdAt)}
                {e.actor ? ` · ${e.actor.name}` : ""}
              </p>
              {e.note ? <p className="mt-1 text-[13px] leading-snug text-steel-700">{e.note}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
