import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { NotificationBell } from "@/components/app/notification-bell";
import { UserMenu } from "@/components/app/user-menu";
import { WarehouseNav } from "@/components/warehouse/warehouse-nav";
import { requirePagePermission } from "@/server/auth/session";
import { getPanelChrome } from "@/server/panel-data";

export const instant = false;

export const metadata: Metadata = {
  title: { default: "انبار", template: "%s · انبار اتوپارت" },
  robots: { index: false },
};

export default async function WarehouseLayout({ children }: LayoutProps<"/warehouse">) {
  const actor = await requirePagePermission("panel.warehouse", "/warehouse");
  const chrome = await getPanelChrome(actor);
  return (
    <div className="min-h-dvh bg-paper">
      <header className="no-print bg-ink text-bone">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link href="/warehouse" className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7 text-bone" />
            <span className="type-heading text-[16px]">انبار اتوپارت</span>
          </Link>
          <div className="ms-auto flex items-center gap-1">
            <NotificationBell items={chrome.notifications} unread={chrome.unread} dark />
            <UserMenu name={actor.name} role={actor.roleName} panels={chrome.panels} dark />
          </div>
        </div>
      </header>
      <WarehouseNav />
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">{children}</main>
    </div>
  );
}
