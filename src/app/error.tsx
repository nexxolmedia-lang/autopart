"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-xl flex-col justify-center px-6 py-16">
      <p className="type-eyebrow text-ember">خطایی رخ داد</p>
      <h1 className="type-display mt-3 text-4xl">بارگذاری این صفحه ممکن نشد.</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-steel-700">
        خطا ثبت شد. دوباره تلاش کنید — اگر تکرار شد با مدیر سیستم تماس بگیرید
        {error.digest ? (
          <>
            {" "}و کد پیگیری <span className="ltr type-data rounded-xs bg-bone px-1.5 py-0.5">{error.digest}</span> را اعلام کنید
          </>
        ) : null}
        .
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset} variant="dark">
          <RotateCcw className="h-4 w-4" aria-hidden /> تلاش دوباره
        </Button>
        <ButtonLink href="/" variant="outline">
          صفحه اصلی
        </ButtonLink>
      </div>
    </main>
  );
}
