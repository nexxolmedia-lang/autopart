"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  FolderTree,
  History,
  Inbox,
  LayoutDashboard,
  Menu,
  Package,
  ScrollText,
  ShieldCheck,
  Tags,
  Users,
  UserSquare2,
  X,
} from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { faNumber } from "@/lib/digits";
import { cn } from "@/lib/utils";

const ICONS = {
  dashboard: LayoutDashboard,
  orders: ClipboardList,
  products: Package,
  categories: FolderTree,
  brands: Tags,
  inventory: Boxes,
  movements: History,
  customers: UserSquare2,
  users: Users,
  roles: ShieldCheck,
  reports: BarChart3,
  audit: ScrollText,
  inquiries: Inbox,
} as const;

export type AdminNavItem = { href: string; label: string; icon: keyof typeof ICONS; badge?: number; group: string };

function NavList({ items, onNavigate }: { items: AdminNavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const groups = [...new Set(items.map((i) => i.group))];
  return (
    <nav aria-label="منوی مدیریت" className="space-y-6">
      {groups.map((group) => (
        <div key={group}>
          <p className="type-eyebrow mb-2 px-3 text-[11px] text-bone/35">{group}</p>
          <ul className="space-y-0.5">
            {items
              .filter((i) => i.group === group)
              .map((item) => {
                const Icon = ICONS[item.icon];
                const active = item.href === "/admin" ? pathname === "/admin" : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex h-10 items-center gap-3 rounded-xs px-3 text-[14px] transition-colors",
                        active ? "bg-bone/10 text-bone" : "text-bone/60 hover:bg-bone/5 hover:text-bone",
                      )}
                    >
                      {active ? <span className="absolute inset-y-2 start-0 w-0.5 bg-ember" aria-hidden /> : null}
                      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} aria-hidden />
                      <span className="flex-1">{item.label}</span>
                      {item.badge ? <span className="type-data rounded-full bg-ember px-1.5 text-[11px] font-semibold text-ink">{faNumber(item.badge)}</span> : null}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar({ items }: { items: AdminNavItem[] }) {
  return (
    <aside className="no-print sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto bg-ink px-3 py-5 text-bone lg:flex">
      <Link href="/admin" className="mb-8 flex items-center gap-2.5 px-3">
        <LogoMark className="h-8 w-8 text-bone" />
        <span className="leading-tight">
          <span className="type-heading block text-[17px]">اتوپارت</span>
          <span className="block text-[11.5px] text-bone/50">میز سفارش و مدیریت</span>
        </span>
      </Link>
      <NavList items={items} />
    </aside>
  );
}

export function AdminMobileNav({ items }: { items: AdminNavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // Close when the route changes (state adjusted during render, not in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xs border border-line lg:hidden" aria-label="باز کردن منو" aria-expanded={open}>
        <Menu className="h-5 w-5" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="منوی مدیریت">
          <button type="button" className="absolute inset-0 bg-ink/50" aria-label="بستن منو" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 start-0 flex w-72 animate-rise flex-col overflow-y-auto bg-ink px-3 py-5 text-bone">
            <div className="mb-6 flex items-center justify-between px-3">
              <span className="flex items-center gap-2.5">
                <LogoMark className="h-7 w-7 text-bone" />
                <span className="type-heading">اتوپارت</span>
              </span>
              <button type="button" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xs border border-bone/20" aria-label="بستن منو">
                <X className="h-4 w-4" />
              </button>
            </div>
            <NavList items={items} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
