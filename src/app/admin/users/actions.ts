"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { formBool, formText, runAction, type ActionState } from "@/server/action-utils";
import { requireActor } from "@/server/auth/session";
import { createRole, createUser, resetUserPassword, setRolePermissions, updateUser } from "@/server/modules/users/service";

const userFields = (form: FormData) => ({
  name: formText(form, "name") ?? "",
  email: formText(form, "email") ?? "",
  phone: formText(form, "phone"),
  roleId: formText(form, "roleId") ?? "",
  isActive: formBool(form, "isActive"),
});

export async function createUserAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  let id: string | null = null;
  const result = await runAction(async () => {
    const user = await createUser(await requireActor(), { ...userFields(form), password: formText(form, "password") ?? "" });
    id = user.id;
  });
  if (result.ok && id) redirect(`/admin/users/${id}?created=1`);
  return result;
}

export async function updateUserAction(userId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    await updateUser(await requireActor(), userId, userFields(form));
    refresh();
  }, "اطلاعات کاربر ذخیره شد.");
}

export async function resetPasswordAction(userId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    await resetUserPassword(await requireActor(), userId, formText(form, "password") ?? "");
    refresh();
  }, "رمز عبور تغییر کرد و همه نشست‌های فعال کاربر بسته شد.");
}

export async function saveRolePermissionsAction(roleId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const keys = form.getAll("permissions").filter((v): v is string => typeof v === "string");
    await setRolePermissions(await requireActor(), roleId, keys);
    refresh();
  }, "مجوزهای نقش ذخیره شد. تغییرات از درخواست بعدی کاربران اعمال می‌شود.");
}

export async function createRoleAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    await createRole(await requireActor(), { name: formText(form, "name") ?? "", description: formText(form, "description") });
    refresh();
  }, "نقش جدید ایجاد شد. اکنون مجوزهای آن را تعیین کنید.");
}
