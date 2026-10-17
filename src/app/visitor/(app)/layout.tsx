import Link from "next/link";
import type { Metadata } from "next";
import { LogoMark } from "@/components/brand/logo";
import { OfflineBanner } from "@/components/app/connectivity";
import { NotificationBell } from "@/components/app/notification-bell";
import { UserMenu } from "@/components/app/user-menu";
import { VisitorTabBar } from "@/components/visitor/tab-bar";
import { requirePagePermission } from "@/server/auth/session";
import { getPanelChrome } from "@/server/panel-data";

export const instant = false;

export const metadata: Metadata = {
  title: { default: "اپلیکیشن ویزیتور", template: "%s · اپلیکیشن ویزیتور اتوپارت" },
  robots: { index: false },
};

export default async function VisitorLayout({ children }: LayoutProps<"/visitor">) {
  const actor = await requirePagePermission("panel.visitor", "/visitor");
  const chrome = await getPanelChrome(actor);
  return (
    <div className="min-h-dvh bg-paper pb-[calc(env(safe-area-inset-bottom)+6rem)]">
      <OfflineBanner />
      <header className="no-print sticky top-0 z-30 border-b border-white/10 bg-ink text-bone safe-top">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link href="/visitor" className="flex items-center gap-2.5" aria-label="خانه اپلیکیشن ویزیتور">
            <LogoMark className="h-7 w-7 text-bone" />
            <span className="type-eyebrow text-[11px] text-bone/60">اپلیکیشن ویزیتور</span>
          </Link>
          <div className="ms-auto flex items-center gap-1">
            <NotificationBell items={chrome.notifications} unread={chrome.unread} dark />
            <UserMenu name={actor.name} role={actor.roleName} panels={chrome.panels} dark />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 pt-5">{children}</main>
      <VisitorTabBar />
    </div>
  );
}
