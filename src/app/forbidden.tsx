import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

export default function Forbidden() {
  return (
    <main className="flex min-h-dvh flex-col bg-paper">
      <div className="flex h-16 items-center border-b border-line px-6">
        <Link href="/" aria-label="صفحه اصلی اتوپارت">
          <Logo />
        </Link>
      </div>
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-16">
        <ShieldAlert className="h-10 w-10 text-ember" strokeWidth={1.5} aria-hidden />
        <p className="type-eyebrow mt-6 text-steel-500">خطای ۴۰۳ · دسترسی محدود</p>
        <h1 className="type-display mt-3 text-5xl">این بخش در نقش شما نیست.</h1>
        <p className="mt-5 text-[16px] leading-relaxed text-steel-700">
          حساب شما مجوز ورود به این بخش را ندارد. اگر به آن نیاز دارید، از مدیر سیستم بخواهید نقش شما را به‌روزرسانی کند.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/login" variant="dark">
            رفتن به محیط کار من
          </ButtonLink>
          <ButtonLink href="/" variant="outline">
            وب‌سایت عمومی
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
