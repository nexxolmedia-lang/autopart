import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { firstParam } from "@/lib/utils";
import { LoginForm, type DemoAccount } from "./login-form";

export const metadata: Metadata = { title: "ورود همکاران", robots: { index: false } };

/**
 * Demo accounts are listed only when DEMO_MODE=true (development / showcase
 * deployments). Never enable it on a deployment that holds real data.
 */
const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: "visitor@autopart.test", role: "ویزیتور فروش", name: "رضا کریمی", lands: "اپلیکیشن ویزیتور" },
  { email: "manager@autopart.test", role: "مدیر فروش", name: "مریم احمدی", lands: "میز سفارش" },
  { email: "warehouse@autopart.test", role: "انباردار", name: "حسین رحیمی", lands: "انبار" },
  { email: "supervisor@autopart.test", role: "سرپرست انبار", name: "نرگس صالحی", lands: "انبار" },
  { email: "admin@autopart.test", role: "مدیر سیستم", name: "علی محمدی", lands: "مدیریت" },
];

export default function LoginPage(props: PageProps<"/login">) {
  const demo = process.env.DEMO_MODE === "true";
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(480px,560px)]">
      <section className="relative hidden overflow-hidden bg-ink text-bone lg:flex lg:flex-col">
        <div className="blueprint-grid absolute inset-0" aria-hidden />
        <div className="pointer-events-none absolute -bottom-40 -start-20 h-[480px] w-[480px] rounded-full bg-ember/15 blur-[120px]" aria-hidden />
        <div className="relative flex flex-1 flex-col justify-between p-12">
          <Link href="/" aria-label="صفحه اصلی اتوپارت">
            <Logo dark />
          </Link>
          <div>
            <p className="type-eyebrow text-ember">سامانه همکاران</p>
            <h1 className="type-display mt-5 max-w-xl text-[clamp(2.4rem,4vw,3.8rem)]">یک سابقه برای هر سفارش؛ از بازدید تا ارسال.</h1>
            <ul className="mt-10 space-y-3 text-[15px] text-bone/70">
              {["ویزیتورها: قیمت و موجودی لحظه‌ای، ثبت سفارش در چند ثانیه", "میز سفارش: بررسی، اصلاح و تأیید با سابقه کامل ممیزی", "انبار: فهرست جمع‌آوری، محل قفسه و تأیید ارسال"].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ember" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <p className="type-eyebrow text-bone/35">نشست امن · دسترسی مبتنی بر نقش · ارتباط رمزنگاری‌شده</p>
        </div>
      </section>
      <main className="flex flex-col bg-paper px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="lg:hidden" aria-label="صفحه اصلی اتوپارت">
            <Logo />
          </Link>
          <Link href="/" className="ms-auto inline-flex items-center gap-1.5 text-[13px] text-steel-600 hover:text-ink">
            <ArrowRight className="h-3.5 w-3.5" aria-hidden /> بازگشت به وب‌سایت
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <p className="type-eyebrow text-steel-500">ورود همکاران</p>
          <h2 className="type-display mt-3 text-4xl">ورود به سامانه</h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-steel-600">ویژه کارکنان و ویزیتورهای اتوپارت. پس از ورود، به محیط کار متناسب با نقش خود هدایت می‌شوید.</p>
          <div className="mt-8">
            <Suspense fallback={null}>
              <SignedOutNotice searchParams={props.searchParams} />
            </Suspense>
            {/* One static form: the post-login destination (?next=) is read in the browser. */}
            <LoginForm demoAccounts={demo ? DEMO_ACCOUNTS : undefined} demoPassword={demo ? process.env.SEED_DEMO_PASSWORD : undefined} />
            {demo ? (
              <Link href="/all-pages" className="mt-4 inline-flex text-[13px] font-medium text-ember-700 underline underline-offset-2">
                فهرست همه صفحات وب‌اپ (Index) ←
              </Link>
            ) : null}
          </div>
        </div>
        <p className="text-center text-[12px] text-steel-500">
          مشکل در ورود؟ با مدیر سیستم تماس بگیرید. ·{" "}
          <Link href="/contact" className="underline underline-offset-2">
            واحد فروش
          </Link>
        </p>
      </main>
    </div>
  );
}

async function SignedOutNotice({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const params = await searchParams;
  if (firstParam(params.signedOut) !== "1") return null;
  return (
    <p role="status" className="mb-5 rounded-xs border border-line bg-white px-3.5 py-3 text-sm text-steel-700">
      از حساب کاربری خارج شدید.
    </p>
  );
}
