"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarCheck } from "lucide-react";
import { Button, Spinner } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { DELIVERY_WINDOW_LABELS, upcomingDeliveryDays } from "@/lib/format";
import { cn } from "@/lib/utils";
import { updateDeliveryAction } from "@/app/admin/orders/actions";

type Window = "ANY" | "MORNING" | "AFTERNOON";

export function DeliveryEditor({ orderId, version, today, date, window: initialWindow }: { orderId: string; version: number; today: string; date: string; window: Window }) {
  const days = useMemo(() => upcomingDeliveryDays(today, 21), [today]);
  const [value, setValue] = useState(date);
  const [win, setWin] = useState<Window>(initialWindow);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dirty = value !== date || win !== initialWindow;

  return (
    <div className="space-y-3">
      <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label="تاریخ تحویل تأییدشده">
        {days.map((d) => (
          <button
            key={d.iso}
            type="button"
            role="radio"
            aria-checked={value === d.iso}
            onClick={() => setValue(d.iso)}
            className={cn("flex h-14 min-w-[76px] shrink-0 flex-col items-center justify-center border px-2 text-center", value === d.iso ? "border-ink bg-ink text-bone" : "border-line bg-white hover:border-ink")}
          >
            <span className={cn("text-[11px]", value === d.iso ? "text-bone/70" : "text-steel-500")}>{d.weekday}</span>
            <span className="text-[12.5px] font-semibold">{d.label}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 border border-line bg-white" role="radiogroup" aria-label="بازه زمانی">
        {(["ANY", "MORNING", "AFTERNOON"] as const).map((w) => (
          <button key={w} type="button" role="radio" aria-checked={win === w} onClick={() => setWin(w)} className={cn("h-10 border-s border-line text-[12.5px] first:border-s-0", win === w ? "bg-ink text-bone" : "hover:bg-bone")}>
            {DELIVERY_WINDOW_LABELS[w]}
          </button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      ) : null}
      <Button
        variant="dark"
        size="sm"
        disabled={!dirty || !value || pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const r = await updateDeliveryAction(orderId, { expectedVersion: version, confirmedDeliveryDate: value, confirmedDeliveryWindow: win });
            if (r.ok) toast(r.message ?? "ذخیره شد.");
            else setError(r.error ?? "ذخیره ممکن نشد.");
          })
        }
      >
        {pending ? <Spinner /> : <CalendarCheck className="h-4 w-4" aria-hidden />} تأیید برنامه تحویل
      </Button>
    </div>
  );
}
