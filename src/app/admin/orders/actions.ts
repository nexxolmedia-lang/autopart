"use server";

import { refresh } from "next/cache";
import { ORDER_ACTION_META, formatOrderNumber, type OrderAction } from "@/lib/order-workflow";
import { runAction, type ActionState } from "@/server/action-utils";
import { requireActor } from "@/server/auth/session";
import { addOrderNote, adjustOrderLines, setItemPicked, transitionOrder, updateDeliveryArrangement } from "@/server/modules/orders/service";
import type { DeliveryArrangementInput, LineAdjustmentInput, TransitionPayload } from "@/server/modules/orders/schemas";

const ALLOWED: OrderAction[] = ["start_review", "approve", "reject", "cancel", "start_preparing", "mark_ready", "dispatch", "deliver"];

export async function orderTransitionAction(orderId: string, action: OrderAction, payload: TransitionPayload = {}): Promise<ActionState> {
  return runAction(
    async () => {
      if (!ALLOWED.includes(action)) throw new Error("Unsupported action");
      const ref = await transitionOrder(await requireActor(), orderId, action, payload);
      refresh();
      return ref;
    },
    (ref) => `سفارش ${formatOrderNumber((ref as { number: number }).number)}: ${ORDER_ACTION_META[action].label} انجام شد.`,
  );
}

export async function adjustLinesAction(orderId: string, input: LineAdjustmentInput): Promise<ActionState> {
  return runAction(async () => {
    await adjustOrderLines(await requireActor(), orderId, input);
    refresh();
  }, "اقلام سفارش به‌روزرسانی شد. مبلغ کل دوباره محاسبه گردید.");
}

export async function updateDeliveryAction(orderId: string, input: DeliveryArrangementInput): Promise<ActionState> {
  return runAction(async () => {
    await updateDeliveryArrangement(await requireActor(), orderId, input);
    refresh();
  }, "برنامه تحویل ذخیره شد.");
}

export async function addNoteAction(orderId: string, body: string): Promise<ActionState> {
  return runAction(async () => {
    await addOrderNote(await requireActor(), orderId, body);
    refresh();
  }, "یادداشت افزوده شد.");
}

export async function setPickedAction(orderId: string, itemId: string, picked: boolean): Promise<ActionState> {
  return runAction(async () => {
    await setItemPicked(await requireActor(), orderId, itemId, picked);
    refresh();
  });
}
