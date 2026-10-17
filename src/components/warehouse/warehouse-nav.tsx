"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, ClipboardList, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/warehouse", label: "داشبورد", icon: LayoutDashboard, exact: true },
  { href: "/warehouse/orders", label: "صف سفارش‌ها", icon: ClipboardList },
  { href: "/warehouse/inventory", label: "موجودی", icon: Boxes },
];

export function WarehouseNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="منوی انبار" className="no-print border-b border-line bg-white">
      <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
        {TABS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn("relative flex h-14 items-center gap-2 px-4 text-[15px] font-medium", active ? "text-ink" : "text-steel-500 hover:text-ink")}
              >
                <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
                {label}
                {active ? <span className="absolute inset-x-3 bottom-0 h-0.5 bg-ember" aria-hidden /> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
