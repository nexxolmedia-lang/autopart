"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { faNumber, toPersianDigits } from "@/lib/digits";
import { cn } from "@/lib/utils";

type MenuCategory = { slug: string; name: string; count: number; illustration: string };

/** Desktop mega-menu: opens on hover or click, fully keyboard accessible. */
export function CatalogueMenu({ categories }: { categories: MenuCategory[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const enter = () => {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const leave = () => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 140);
  };

  return (
    <div ref={ref} className="relative" onMouseEnter={enter} onMouseLeave={leave}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="catalogue-menu"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1 rounded-xs px-3 py-2 text-[14px] text-steel-800 transition-colors hover:bg-ink/[0.05] hover:text-ink",
          open && "bg-ink/[0.05] text-ink",
        )}
      >
        کاتالوگ
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      <div id="catalogue-menu" hidden={!open} onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)} className="absolute start-0 top-[calc(100%+12px)] w-[720px] animate-rise border border-line bg-paper shadow-[var(--shadow-float)]">
        <div className="grid grid-cols-[1fr_220px]">
          <ul className="grid grid-cols-2 gap-px bg-line p-px">
            {categories.map((c, i) => (
              <li key={c.slug} className="bg-paper">
                <Link href={`/categories/${c.slug}`} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white">
                  <span className="type-data w-6 text-[11px] text-steel-400 group-hover:text-ember">{toPersianDigits(String(i + 1).padStart(2, "0"))}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/parts/${c.illustration}.svg`} alt="" className="h-9 w-12 object-contain" />
                  <span className="flex-1 text-[14px] font-medium text-ink">{c.name}</span>
                  <span className="type-data text-[11px] text-steel-500">{faNumber(c.count)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex flex-col justify-between bg-ink p-5 text-bone">
            <div>
              <p className="type-eyebrow text-ember">کاتالوگ کامل</p>
              <p className="mt-2 text-sm leading-relaxed text-bone/70">جستجو با نام قطعه، کد کالا، شماره فنی یا مدل خودرو.</p>
            </div>
            <Link href="/products" className="group mt-6 inline-flex items-center gap-2 text-sm font-medium text-bone">
              مشاهده همه قطعات
              <ArrowLeft className="h-4 w-4 text-ember transition-transform group-hover:-translate-x-1" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
