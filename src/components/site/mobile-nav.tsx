"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpLeft, Menu, Search, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { toPersianDigits } from "@/lib/digits";

const LINKS = [
  { href: "/products", label: "کاتالوگ قطعات" },
  { href: "/brands", label: "برندها" },
  { href: "/#ordering", label: "روند سفارش" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
  { href: "/visitor/install", label: "نصب اپلیکیشن ویزیتور" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xs border border-line text-ink lg:hidden"
        aria-label="باز کردن منو"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-ink text-bone lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="منوی سایت"
          onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
          onSubmit={() => setOpen(false)}
        >
          <div className="blueprint-grid absolute inset-0 opacity-60" aria-hidden />
          <div className="relative flex h-16 items-center justify-between px-4">
            <Logo dark />
            <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-xs border border-bone/20" aria-label="بستن منو" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <form action="/search" role="search" className="relative mx-4 mt-2">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bone/50" aria-hidden />
            <input
              name="q"
              type="search"
              aria-label="جستجوی قطعه"
              placeholder="نام قطعه، کد کالا یا خودرو…"
              className="h-12 w-full rounded-xs border border-bone/20 bg-ink-2 ps-10 pe-3 text-base text-bone placeholder:text-bone/40 focus:border-ember focus:outline-none"
            />
          </form>
          <nav aria-label="منوی موبایل" className="relative mt-6 flex-1 overflow-y-auto px-4">
            <ul className="border-t border-bone/10">
              {LINKS.map((l, i) => (
                <li key={l.href} className="border-b border-bone/10">
                  <Link href={l.href} className="flex items-center gap-4 py-4 text-xl">
                    <span className="type-data w-6 text-xs text-ember">{toPersianDigits(String(i + 1).padStart(2, "0"))}</span>
                    <span className="type-heading">{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="relative p-4 safe-bottom">
            <Link href="/login" className="flex h-12 items-center justify-center gap-2 rounded-xs bg-ember font-medium text-ink">
              ورود همکاران <ArrowUpLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
