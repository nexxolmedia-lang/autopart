"use server";

import { refresh } from "next/cache";
import { runAction, type ActionState } from "@/server/action-utils";
import { requireActor } from "@/server/auth/session";
import { markAllNotificationsRead } from "@/server/modules/notifications/service";

export async function markNotificationsReadAction(): Promise<ActionState> {
  return runAction(async () => {
    await markAllNotificationsRead(await requireActor());
    refresh();
  });
}
