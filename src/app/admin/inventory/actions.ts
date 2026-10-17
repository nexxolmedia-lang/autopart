"use server";

import { refresh } from "next/cache";
import { faNumber, toLatinDigits } from "@/lib/digits";
import { formText, runAction, type ActionState } from "@/server/action-utils";
import { requireActor } from "@/server/auth/session";
import { adjustStock, setBinLocation, type AdjustmentKind } from "@/server/modules/inventory/service";

export async function adjustStockAction(productId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(
    async () => {
      const result = await adjustStock(await requireActor(), {
        productId,
        kind: (formText(form, "kind") ?? "") as AdjustmentKind,
        quantity: toLatinDigits(formText(form, "quantity") ?? "").trim().replace(/^−/, "-"),
        reason: formText(form, "reason") ?? "",
        reference: formText(form, "reference"),
      });
      refresh();
      return result;
    },
    (r) => `موجودی از ${faNumber(r.before)} به ${faNumber(r.after)} تغییر کرد؛ موجود آزاد: ${faNumber(r.available)}.`,
  );
}

export async function setBinAction(productId: string, bin: string): Promise<ActionState> {
  return runAction(async () => {
    await setBinLocation(await requireActor(), productId, bin);
    refresh();
  }, "محل قفسه ذخیره شد.");
}
