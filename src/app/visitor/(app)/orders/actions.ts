"use server";

import { refresh } from "next/cache";
import { formatOrderNumber } from "@/lib/order-workflow";
import { runAction, type ActionState } from "@/server/action-utils";
import { requireActor } from "@/server/auth/session";
import type { OrderRef } from "@/server/modules/orders/service";
import { createOrder, transitionOrder, updateDraft } from "@/server/modules/orders/service";

export type ComposerPayload = {
  orderId?: string;
  customerId: string;
  items: { productId: string; quantity: number }[];
  visitorNote?: string;
  requestedDeliveryDate?: string;
  requestedDeliveryWindow?: "ANY" | "MORNING" | "AFTERNOON";
  idempotencyKey?: string;
};

/**
 * Save or submit an order from the composer. Only identifiers and quantities
 * are accepted from the client — prices and stock are resolved server-side.
 */
export async function saveOrderAction(payload: ComposerPayload, submit: boolean): Promise<ActionState<OrderRef>> {
  return runAction(
    async () => {
      const actor = await requireActor();
      const input = {
        customerId: payload.customerId,
        items: payload.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        visitorNote: payload.visitorNote,
        requestedDeliveryDate: payload.requestedDeliveryDate,
        requestedDeliveryWindow: payload.requestedDeliveryWindow,
        idempotencyKey: payload.orderId ? undefined : payload.idempotencyKey,
      };
      const ref = payload.orderId ? await updateDraft(actor, payload.orderId, input, { submit }) : await createOrder(actor, input, { submit });
      refresh();
      return ref;
    },
    (ref) => (submit ? `سفارش ${formatOrderNumber(ref.number)} ثبت شد — موجودی رزرو شد.` : `پیش‌نویس ${formatOrderNumber(ref.number)} ذخیره شد.`),
  );
}

export async function visitorOrderTransitionAction(orderId: string, action: "submit" | "cancel", reason?: string): Promise<ActionState<OrderRef>> {
  return runAction(
    async () => {
      const ref = await transitionOrder(await requireActor(), orderId, action, { reason: reason || undefined });
      refresh();
      return ref;
    },
    (ref) => (action === "submit" ? `سفارش ${formatOrderNumber(ref.number)} ثبت شد — موجودی رزرو شد.` : `سفارش ${formatOrderNumber(ref.number)} لغو شد.`),
  );
}
