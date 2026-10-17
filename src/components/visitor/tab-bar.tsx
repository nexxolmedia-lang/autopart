"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Home, Plus, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/visitor", label: "خانه", icon: Home, match: (p: string) => p === "/visitor" },
  { href: "/visitor/orders", label: "سفارش‌ها", icon: ClipboardList, match: (p: string) => p.startsWith("/visitor/orders") && !p.startsWith("/visitor/orders/new") },
  { href: "/visitor/orders/new", label: "سفارش جدید", icon: Plus, primary: true, match: (p: string) => p.startsWith("/visitor/orders/new") },
  { href: "/visitor/customers", label: "مشتریان", icon: Users, match: (p: string) => p.startsWith("/visitor/customers") },
  { href: "/visitor/catalogue", label: "قطعات", icon: Search, match: (p: string) => p.startsWith("/visitor/catalogue") },
];

/** Thumb-reachable bottom navigation for the field app. */
export function VisitorTabBar() {
  const pathname = usePathname();
  return (
    <nav aria-label="اپلیکیشن ویزیتور" className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur-md safe-bottom">
      <ul className="mx-auto grid h-16 max-w-3xl grid-cols-5">
        {TABS.map(({ href, label, icon: Icon, primary, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn("flex flex-1 flex-col items-center justify-center gap-1 text-[10.5px] font-medium transition-colors", active ? "text-ink" : "text-steel-500 hover:text-ink")}
              >
                {primary ? (
                  <span className={cn("-mt-5 flex h-12 w-12 items-center justify-center rounded-full border-4 border-paper shadow-[var(--shadow-lift)] transition-colors", active ? "bg-ink text-ember" : "bg-ember text-ink")}>
                    <Icon className="h-5 w-5" strokeWidth={2.4} aria-hidden />
                  </span>
                ) : (
                  <span className="relative">
                    <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.2 : 1.7} aria-hidden />
                    {active ? <span className="absolute -bottom-1.5 left-1/2 h-0.5 w-4 -translate-x-1/2 bg-ember" aria-hidden /> : null}
                  </span>
                )}
                <span className={primary ? "-mt-0.5" : undefined}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
