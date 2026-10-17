"use server";

import { redirect } from "next/navigation";
import { formText, runAction, type ActionState } from "@/server/action-utils";
import { requireActor } from "@/server/auth/session";
import { customerInputFrom } from "@/server/form-parsers";
import { createCustomer } from "@/server/modules/customers/service";

export async function createVisitorCustomerAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  let target: string | null = null;
  const result = await runAction(async () => {
    const customer = await createCustomer(await requireActor(), customerInputFrom(form));
    target = formText(form, "return") === "order" ? `/visitor/orders/new?customer=${customer.id}` : `/visitor/customers/${customer.id}?created=1`;
  });
  if (result.ok && target) redirect(target);
  return result;
}
