import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-ink text-bone">
      <div className="blueprint-grid absolute inset-0" aria-hidden />
      <div className="relative flex h-16 items-center px-6">
        <Link href="/" aria-label="صفحه اصلی اتوپارت">
          <Logo dark />
        </Link>
      </div>
      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
        <p className="type-eyebrow text-ember">خطای ۴۰۴ · صفحه یافت نشد</p>
        <h1 className="type-display mt-5 text-[clamp(3rem,9vw,7rem)]">
          چیزی پیدا
          <br />
          <span className="text-bone/35">نشد.</span>
        </h1>
        <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-bone/65">
          صفحه‌ای که دنبال آن بودید وجود ندارد، جابه‌جا شده یا قطعه از کاتالوگ خارج شده است.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/products" size="lg">
            <Search className="h-4 w-4" aria-hidden /> جستجو در کاتالوگ
          </ButtonLink>
          <ButtonLink href="/" size="lg" variant="outline-light">
            <ArrowRight className="h-4 w-4" aria-hidden /> صفحه اصلی
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
