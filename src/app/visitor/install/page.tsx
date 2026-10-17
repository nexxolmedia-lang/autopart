import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Wifi, WifiOff } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export const metadata: Metadata = { title: "نصب اپلیکیشن ویزیتور", description: "نصب اتوپارت روی اندروید یا آیفون." };

export default function InstallPage() {
  return (
    <div className="min-h-dvh bg-paper">
      <header className="bg-ink text-bone safe-top">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link href="/" aria-label="صفحه اصلی اتوپارت">
            <Logo dark />
          </Link>
          <Link href="/visitor" className="inline-flex items-center gap-1.5 text-[13px] text-bone/70 hover:text-bone">
            <ArrowRight className="h-3.5 w-3.5" aria-hidden /> اپلیکیشن ویزیتور
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-8 px-4 py-8">
        <div>
          <p className="type-eyebrow text-ember">وب‌اپلیکیشن پیش‌رونده (PWA)</p>
          <h1 className="type-display mt-2 text-[2.2rem] leading-snug">نصب اپلیکیشن ویزیتور</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-steel-700">
            اتوپارت مستقیم از مرورگر روی صفحه اصلی گوشی نصب می‌شود — بدون فروشگاه اپلیکیشن، همیشه به‌روز و تمام‌صفحه مانند یک اپلیکیشن بومی.
          </p>
        </div>
        <InstallPrompt />
        <section className="border border-line bg-white p-5" aria-labelledby="offline-title">
          <h2 id="offline-title" className="type-heading text-lg">
            کار با اینترنت ضعیف
          </h2>
          <ul className="mt-3 space-y-3 text-[14px] leading-relaxed text-steel-700">
            <li className="flex gap-3">
              <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden />
              در حالت آفلاین، صفحاتی که اخیراً دیده‌اید قابل مشاهده می‌مانند و سفارش در حال تکمیل روی دستگاه حفظ می‌شود — اما قیمت و موجودی ممکن است قدیمی باشد.
            </li>
            <li className="flex gap-3">
              <Wifi className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-hidden />
              سفارش فقط با اتصال اینترنت ثبت می‌شود و سرور هر بار قیمت و موجودی را دوباره بررسی می‌کند.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
