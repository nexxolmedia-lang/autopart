"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; message: string };

const EVENT = "autopart:toast";

/** Fire a toast from any Client Component. */
export function toast(message: string, kind: ToastKind = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<Omit<Toast, "id">>(EVENT, { detail: { message, kind } }));
}

const icons = { success: CheckCircle2, error: AlertTriangle, info: Info };

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let counter = 0;
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<Omit<Toast, "id">>).detail;
      const id = ++counter;
      setToasts((current) => [...current.slice(-3), { ...detail, id }]);
      window.setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), detail.kind === "error" ? 7000 : 4200);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:items-end sm:pb-6">
      {toasts.map((t) => {
        const Icon = icons[t.kind];
        return (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm animate-rise items-start gap-3 rounded-xs border px-4 py-3 text-sm shadow-[var(--shadow-float)]",
              t.kind === "error" ? "border-danger/30 bg-white text-danger" : "border-ink bg-ink text-bone",
            )}
          >
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", t.kind === "success" && "text-ember")} aria-hidden />
            <p className="flex-1 leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => setToasts((current) => current.filter((x) => x.id !== t.id))}
              className="-me-1 rounded-xs p-0.5 opacity-60 hover:opacity-100"
              aria-label="بستن اعلان"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
