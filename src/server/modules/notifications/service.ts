/**
 * In-app notifications.
 *
 * This is the integration point for outbound channels: `deliver()` is where an
 * email / SMS / WhatsApp / push provider would be invoked (ideally via a
 * transactional outbox processed by a background worker). Today notifications
 * are persisted and shown in the panel headers.
 */
import type { PermissionKey } from "@/lib/permissions";
import type { Actor } from "@/server/auth/actor";
import { prisma, type Db } from "@/server/db";

export type NotificationPayload = { title: string; body?: string; href?: string };

export async function notifyUsers(db: Db, userIds: readonly string[], payload: NotificationPayload): Promise<void> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return;
  await db.notification.createMany({
    data: unique.map((userId) => ({
      userId,
      title: payload.title.slice(0, 200),
      body: payload.body?.slice(0, 500),
      href: payload.href,
    })),
  });
}

/** Notify every active user whose role grants the permission (optionally excluding someone). */
export async function notifyPermissionHolders(
  db: Db,
  permission: PermissionKey,
  payload: NotificationPayload,
  options: { excludeUserId?: string } = {},
): Promise<void> {
  const users = await db.user.findMany({
    where: {
      isActive: true,
      role: { permissions: { some: { permissionKey: permission } } },
      ...(options.excludeUserId ? { id: { not: options.excludeUserId } } : {}),
    },
    select: { id: true },
  });
  await notifyUsers(
    db,
    users.map((u) => u.id),
    payload,
  );
}

export async function listNotifications(actor: Actor, limit = 12) {
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: actor.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({ where: { userId: actor.id, readAt: null } }),
  ]);
  return { items, unread };
}

export async function markAllNotificationsRead(actor: Actor): Promise<void> {
  await prisma.notification.updateMany({ where: { userId: actor.id, readAt: null }, data: { readAt: new Date() } });
}
