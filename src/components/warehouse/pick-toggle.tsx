"use client";

import { useOptimistic, useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { setPickedAction } from "@/app/admin/orders/actions";

/** Large tap target for marking a line as picked (optimistic, server-validated). */
export function PickToggle({ orderId, itemId, picked, disabled, label }: { orderId: string; itemId: string; picked: boolean; disabled: boolean; label: string }) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(picked);
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={optimistic}
      aria-label={label}
      disabled={disabled || pending}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          const r = await setPickedAction(orderId, itemId, !optimistic);
          if (!r.ok) toast(r.error ?? "ثبت ممکن نشد.", "error");
        })
      }
      className={cn(
        "flex h-14 w-14 shrink-0 items-center justify-center border-2 transition-colors disabled:cursor-not-allowed",
        optimistic ? "border-ok bg-ok text-white" : "border-steel-300 bg-white text-transparent hover:border-ink",
        disabled && !optimistic && "opacity-40",
      )}
    >
      <Check className="h-7 w-7" strokeWidth={3} aria-hidden />
    </button>
  );
}

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="no-print inline-flex h-10 items-center gap-2 border border-line bg-white px-4 text-[13.5px] hover:border-ink">
      چاپ فهرست جمع‌آوری
    </button>
  );
}
