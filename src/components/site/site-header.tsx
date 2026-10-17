import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowUpLeft, Search } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { appConfig } from "@/lib/config";
import { homePathFor } from "@/lib/permissions";
import { getActor } from "@/server/auth/session";
import { getCategoriesWithCounts } from "@/server/modules/products/queries";
import { MobileNav } from "./mobile-nav";
import { CatalogueMenu } from "./catalogue-menu";

const NAV = [
  { href: "/brands", label: "برندها" },
  { href: "/#ordering", label: "روند سفارش" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40">
      <div className="hidden border-b border-white/10 bg-ink text-bone/70 md:block">
        <div className="mx-auto flex h-9 max-w-[1320px] items-center justify-between px-6 text-[12px]">
          <p className="text-bone/60">
            فروش عمده به همکاران · قیمت‌ها بدون مالیات بر ارزش افزوده · <span className="text-bone/80">{appConfig.contact.hours}</span>
          </p>
          <div className="flex items-center gap-5">
            <a href={`tel:${appConfig.contact.phoneHref}`} className="ltr tabular hover:text-bone">
              {appConfig.contact.phone}
            </a>
            <Link href="/visitor/install" className="hover:text-bone">
              اپلیکیشن ویزیتور
            </Link>
          </div>
        </div>
      </div>
      <div className="border-b border-line bg-paper/92 backdrop-blur-md supports-[backdrop-filter]:bg-paper/80">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-6 px-4 md:px-6">
          <Link href="/" className="shrink-0" aria-label="صفحه اصلی اتوپارت">
            <Logo />
          </Link>
          <nav aria-label="منوی اصلی" className="hidden flex-1 items-center gap-1 lg:flex">
            <Suspense fallback={<NavLink href="/products">کاتالوگ</NavLink>}>
              <CatalogueNav />
            </Suspense>
            {NAV.map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <form action="/search" role="search" className="relative hidden md:block">
              <label htmlFor="site-search" className="sr-only">
                جستجوی قطعه
              </label>
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" aria-hidden />
              <input
                id="site-search"
                name="q"
                type="search"
                placeholder="نام قطعه، کد کالا یا خودرو…"
                className="h-10 w-56 rounded-xs border border-line bg-white ps-9 pe-3 text-sm placeholder:text-steel-400 focus:w-72 focus:border-ink focus:outline-none xl:w-64"
                style={{ transition: "width .3s var(--ease-precise)" }}
              />
            </form>
            <Suspense fallback={<TradeLoginLink />}>
              <AccountLink />
            </Suspense>
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-xs px-3 py-2 text-[14px] text-steel-800 transition-colors hover:bg-ink/[0.05] hover:text-ink">
      {children}
    </Link>
  );
}

async function CatalogueNav() {
  await connection();
  const categories = await getCategoriesWithCounts();
  return <CatalogueMenu categories={categories.map((c) => ({ slug: c.slug, name: c.name, count: c.productCount, illustration: c.illustration }))} />;
}

function TradeLoginLink() {
  return (
    <Link href="/login" className="hidden h-10 items-center gap-1.5 rounded-xs bg-ink px-4 text-[14px] font-medium text-bone transition-colors hover:bg-graphite sm:inline-flex">
      ورود همکاران
      <ArrowUpLeft className="h-4 w-4 text-ember" aria-hidden />
    </Link>
  );
}

async function AccountLink() {
  const actor = await getActor();
  if (!actor) return <TradeLoginLink />;
  return (
    <Link
      href={homePathFor(actor.permissions)}
      className="hidden h-10 items-center gap-2 rounded-xs bg-ink px-4 text-[14px] font-medium text-bone transition-colors hover:bg-graphite sm:inline-flex"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-ember" aria-hidden />
      محیط کار من
    </Link>
  );
}
