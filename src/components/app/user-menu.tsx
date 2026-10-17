"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ExternalLink, LayoutGrid, LogOut } from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import { cn, initials } from "@/lib/utils";

export type PanelLink = { href: string; label: string };

export function UserMenu({ name, role, panels, dark }: { name: string; role: string; panels: PanelLink[]; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const clearOfflineCaches = async () => {
    // Remove any cached private pages from this device before signing out.
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((k) => k.startsWith("autopart-pages")).map((k) => caches.delete(k)));
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="منوی حساب کاربری"
        className={cn(
          "flex h-10 items-center gap-2.5 rounded-xs ps-1 pe-2 transition-colors",
          dark ? "text-bone hover:bg-bone/10" : "text-ink hover:bg-ink/[0.06]",
        )}
      >
        <span className={cn("type-data flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold", dark ? "bg-bone text-ink" : "bg-ink text-bone")}>
          {initials(name)}
        </span>
        <span className="hidden text-start leading-tight md:block">
          <span className="block text-[13px] font-medium">{name}</span>
          <span className={cn("block text-[11px]", dark ? "text-bone/55" : "text-steel-500")}>{role}</span>
        </span>
      </button>
      {open ? (
        <div className="absolute end-0 top-[calc(100%+8px)] z-50 w-64 animate-rise border border-line bg-paper text-ink shadow-[var(--shadow-float)]">
          <div className="border-b border-line px-4 py-3">
            <p className="text-sm font-medium">{name}</p>
            <p className="text-[12px] text-steel-500">{role}</p>
          </div>
          {panels.length > 1 ? (
            <div className="border-b border-line py-1.5">
              <p className="type-eyebrow px-4 py-1.5 text-[10px] text-steel-500">تغییر محیط کار</p>
              {panels.map((p) => (
                <Link key={p.href} href={p.href} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13.5px] hover:bg-white">
                  <LayoutGrid className="h-4 w-4 text-steel-500" aria-hidden /> {p.label}
                </Link>
              ))}
            </div>
          ) : null}
          <div className="py-1.5">
            <Link href="/" className="flex items-center gap-2.5 px-4 py-2 text-[13.5px] hover:bg-white">
              <ExternalLink className="h-4 w-4 text-steel-500" aria-hidden /> وب‌سایت عمومی
            </Link>
            <form action={logoutAction} onSubmit={() => void clearOfflineCaches()}>
              <button type="submit" className="flex w-full items-center gap-2.5 px-4 py-2 text-start text-[13.5px] text-danger hover:bg-white">
                <LogOut className="h-4 w-4" aria-hidden /> خروج
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
