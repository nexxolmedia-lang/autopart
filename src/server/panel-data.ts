import "server-only";
import { formatRelative } from "@/lib/format";
import type { Actor } from "./auth/actor";
import { listNotifications } from "./modules/notifications/service";

/** Data every panel header needs, shaped for Client Components. */
export async function getPanelChrome(actor: Actor) {
  const { items, unread } = await listNotifications(actor, 12);
  const now = new Date();
  const panels = [
    actor.permissions.has("panel.admin") ? { href: "/admin", label: "میز سفارش و مدیریت" } : null,
    actor.permissions.has("panel.warehouse") ? { href: "/warehouse", label: "انبار" } : null,
    actor.permissions.has("panel.visitor") ? { href: "/visitor", label: "اپلیکیشن ویزیتور" } : null,
  ].filter((p): p is { href: string; label: string } => p !== null);
  return {
    unread,
    panels,
    notifications: items.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      href: n.href,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
      ago: formatRelative(n.createdAt, now),
    })),
  };
}
