"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { runAction, type ActionState } from "@/server/action-utils";
import { requireActor } from "@/server/auth/session";
import { customerInputFrom } from "@/server/form-parsers";
import { createCustomer, setCustomerActive, setCustomerAssignments, updateCustomer } from "@/server/modules/customers/service";

export async function createAdminCustomerAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  let id: string | null = null;
  const result = await runAction(async () => {
    const assignTo = form.getAll("assignees").filter((v): v is string => typeof v === "string");
    const customer = await createCustomer(await requireActor(), customerInputFrom(form), { assignTo });
    id = customer.id;
  });
  if (result.ok && id) redirect(`/admin/customers/${id}?created=1`);
  return result;
}

export async function updateCustomerAction(customerId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    await updateCustomer(await requireActor(), customerId, customerInputFrom(form));
    refresh();
  }, "اطلاعات مشتری ذخیره شد.");
}

export async function setAssignmentsAction(customerId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ids = form.getAll("assignees").filter((v): v is string => typeof v === "string");
    await setCustomerAssignments(await requireActor(), customerId, ids);
    refresh();
  }, "تخصیص ویزیتورها ذخیره شد.");
}

export async function setCustomerActiveAction(customerId: string, active: boolean): Promise<ActionState> {
  return runAction(async () => {
    await setCustomerActive(await requireActor(), customerId, active);
    refresh();
  }, active ? "مشتری فعال شد." : "مشتری بایگانی شد.");
}
