import type { ReactNode } from "react";
import { AVAILABILITY_LABELS, type PublicAvailability } from "@/lib/availability";
import { ORDER_STATUS_META, type OrderStatusKey, type StatusTone } from "@/lib/order-workflow";
import { cn } from "@/lib/utils";

const toneClasses: Record<StatusTone, { chip: string; dot: string }> = {
  neutral: { chip: "bg-steel-100 text-steel-800 border-steel-200", dot: "bg-steel-600" },
  muted: { chip: "bg-bone text-steel-600 border-line", dot: "bg-steel-400" },
  info: { chip: "bg-info-50 text-info border-info/20", dot: "bg-info" },
  attention: { chip: "bg-ember-50 text-ember-700 border-ember/25", dot: "bg-ember" },
  progress: { chip: "bg-warn-50 text-warn border-warn/20", dot: "bg-warn" },
  success: { chip: "bg-ok-50 text-ok border-ok/20", dot: "bg-ok" },
  danger: { chip: "bg-danger-50 text-danger border-danger/20", dot: "bg-danger" },
};

export function Badge({ tone = "neutral", children, className, pulse }: { tone?: StatusTone; children: ReactNode; className?: string; pulse?: boolean }) {
  const t = toneClasses[tone];
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-xs border px-2 text-[12px] font-medium", t.chip, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", t.dot, pulse && "animate-pulse-dot")} aria-hidden />
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: OrderStatusKey; className?: string }) {
  const meta = ORDER_STATUS_META[status];
  return (
    <Badge tone={meta.tone} className={className} pulse={status === "SUBMITTED"}>
      {meta.label}
    </Badge>
  );
}

const availabilityTone: Record<PublicAvailability, string> = {
  IN_STOCK: "bg-ok",
  LIMITED: "bg-warn",
  OUT_OF_STOCK: "bg-steel-400",
};

export function AvailabilityLabel({ availability, label, className, dark }: { availability: PublicAvailability; label?: string; className?: string; dark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[13px]", dark ? "text-bone/80" : "text-steel-700", className)}>
      <span className="relative flex h-2 w-2" aria-hidden>
        {availability === "IN_STOCK" ? <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok/40 [animation-duration:2.4s]" /> : null}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", availabilityTone[availability])} />
      </span>
      {label ?? AVAILABILITY_LABELS[availability]}
    </span>
  );
}
