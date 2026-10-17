"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CheckCircle2, Download, MoreVertical, PlusSquare, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

type Platform = "ios" | "android" | "desktop";

const subscribeNever = () => () => {};

function subscribeDisplayMode(onChange: () => void) {
  const query = window.matchMedia("(display-mode: standalone)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

/**
 * Install experience. Chromium browsers (Android, desktop) expose an install
 * prompt we can trigger; iOS Safari does not, so we show the Share → Add to
 * Home Screen steps instead.
 */
export function InstallPrompt() {
  // Platform and display mode are browser-only; the server renders the neutral (null/false) state.
  const platform = useSyncExternalStore<Platform | null>(subscribeNever, detectPlatform, () => null);
  const standalone = useSyncExternalStore(subscribeDisplayMode, isStandalone, () => false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [justInstalled, setInstalled] = useState(false);
  const installed = standalone || justInstalled;

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <div className="flex items-center gap-3 border border-ok/30 bg-ok-50 p-4 text-ok">
        <CheckCircle2 className="h-5 w-5" aria-hidden />
        <p className="text-[14px] font-medium">اتوپارت روی این دستگاه نصب شده است.</p>
      </div>
    );
  }

  const ios = (
    <section key="ios" aria-labelledby="ios-title">
      <h2 id="ios-title" className="type-heading text-lg">
        آیفون و آیپد (Safari)
      </h2>
      <ol className="mt-3 divide-y divide-line border border-line bg-white text-[14px]">
        <li className="flex flex-wrap items-center gap-x-2 gap-y-1 p-3.5">
          <span className="type-data w-5 text-ember">۱</span> این صفحه را در مرورگر <strong>Safari</strong> باز کنید.
        </li>
        <li className="flex flex-wrap items-center gap-x-2 gap-y-1 p-3.5">
          <span className="type-data w-5 text-ember">۲</span> روی <Share className="h-4 w-4" aria-label="آیکون اشتراک‌گذاری" /> <strong>Share</strong> در نوار ابزار بزنید.
        </li>
        <li className="flex flex-wrap items-center gap-x-2 gap-y-1 p-3.5">
          <span className="type-data w-5 text-ember">۳</span> گزینه <PlusSquare className="h-4 w-4" aria-hidden /> <strong>Add to Home Screen</strong> و سپس <strong>Add</strong> را انتخاب کنید.
        </li>
      </ol>
      <p className="mt-2 text-[12.5px] text-steel-500">iOS پیام نصب خودکار نشان نمی‌دهد؛ نصب همیشه از منوی اشتراک‌گذاری انجام می‌شود.</p>
    </section>
  );

  const android = (
    <section key="android" aria-labelledby="android-title">
      <h2 id="android-title" className="type-heading text-lg">
        اندروید (Chrome، Edge، Samsung Internet)
      </h2>
      <ol className="mt-3 divide-y divide-line border border-line bg-white text-[14px]">
        <li className="flex flex-wrap items-center gap-x-2 gap-y-1 p-3.5">
          <span className="type-data w-5 text-ember">۱</span> روی دکمه <strong>نصب اتوپارت</strong> در بالا بزنید یا منوی مرورگر <MoreVertical className="h-4 w-4" aria-label="آیکون منو" /> را باز کنید.
        </li>
        <li className="flex flex-wrap items-center gap-x-2 gap-y-1 p-3.5">
          <span className="type-data w-5 text-ember">۲</span> گزینه <strong>نصب برنامه</strong> (یا <strong>افزودن به صفحه اصلی</strong>) را انتخاب کنید.
        </li>
        <li className="flex flex-wrap items-center gap-x-2 gap-y-1 p-3.5">
          <span className="type-data w-5 text-ember">۳</span> اتوپارت را از صفحه اصلی گوشی باز کنید — به‌صورت تمام‌صفحه اجرا می‌شود.
        </li>
      </ol>
    </section>
  );

  return (
    <div className="space-y-6">
      {deferred ? (
        <Button
          size="lg"
          className="w-full"
          onClick={async () => {
            await deferred.prompt();
            const choice = await deferred.userChoice;
            if (choice.outcome === "accepted") setInstalled(true);
            setDeferred(null);
          }}
        >
          <Download className="h-4 w-4" aria-hidden /> نصب اتوپارت
        </Button>
      ) : null}
      {platform === "ios" ? [ios, android] : [android, ios]}
    </div>
  );
}
