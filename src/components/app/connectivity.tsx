"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

/** Browser connectivity. Assumes online during SSR. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}

/**
 * Persistent banner while offline. Cached pages may still be readable, but
 * prices and stock shown are not authoritative and nothing can be submitted.
 */
export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div role="status" className="sticky top-0 z-50 flex items-start gap-3 bg-warn px-4 py-2.5 text-[13px] text-white">
      <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>
        <strong className="font-semibold">اتصال اینترنت برقرار نیست.</strong> اطلاعات نمایش‌داده‌شده ممکن است قدیمی باشد و موجودی تضمین نمی‌شود. ثبت سفارش پس از اتصال مجدد امکان‌پذیر است.
      </p>
    </div>
  );
}
