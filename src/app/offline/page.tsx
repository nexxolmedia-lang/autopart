import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { RetryButton } from "@/components/pwa/retry-button";

export const metadata: Metadata = { title: "اتصال برقرار نیست", robots: { index: false } };

/**
 * Fully static fallback served by the service worker when a page is requested
 * without a connection and no cached copy exists.
 */
export default function OfflinePage() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-ink text-bone">
      <div className="blueprint-grid absolute inset-0" aria-hidden />
      <div className="relative flex h-16 items-center px-6">
        <Logo dark />
      </div>
      <div className="relative mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-16">
        <WifiOff className="h-10 w-10 text-ember" aria-hidden />
        <h1 className="type-display mt-6 text-[clamp(2.2rem,7vw,3.6rem)]">اتصال برقرار نیست.</h1>
        <p className="mt-5 text-[15.5px] leading-relaxed text-bone/70">
          این صفحه هنوز روی دستگاه شما ذخیره نشده است. صفحه‌هایی که اخیراً باز کرده‌اید بدون اینترنت هم قابل مشاهده‌اند، اما ثبت سفارش فقط با اتصال
          ممکن است؛ زیرا موجودی باید هنگام ثبت توسط سرور تأیید شود.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <RetryButton />
        </div>
      </div>
    </main>
  );
}
