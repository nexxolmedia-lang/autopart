"use client";

import { useActionState } from "react";
import { Checkbox, Field, FormMessage, Input, Select, SubmitButton } from "@/components/ui/form";
import type { ActionState } from "@/server/action-utils";

type RoleOption = { id: string; name: string };

export function UserForm({
  action,
  roles,
  defaults = {},
  mode,
  isSelf,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  roles: RoleOption[];
  defaults?: { name?: string; email?: string; phone?: string | null; roleId?: string; isActive?: boolean };
  mode: "create" | "edit";
  isSelf?: boolean;
}) {
  const [state, formAction] = useActionState(action, {});
  const e = state.fieldErrors;
  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="نام و نام خانوادگی" name="name" errors={e}>
          {(p) => <Input {...p} defaultValue={defaults.name} required />}
        </Field>
        <Field label="ایمیل (نام کاربری)" name="email" errors={e}>
          {(p) => <Input {...p} dir="ltr" type="email" defaultValue={defaults.email} required autoComplete="off" />}
        </Field>
        <Field label="تلفن همراه" name="phone" errors={e}>
          {(p) => <Input {...p} dir="ltr" type="tel" defaultValue={defaults.phone ?? ""} />}
        </Field>
        <Field label="نقش" name="roleId" errors={e} hint={isSelf ? "تغییر نقش خودتان ممکن است دسترسی شما را محدود کند." : undefined}>
          {(p) => (
            <Select {...p} defaultValue={defaults.roleId ?? ""} required>
              <option value="" disabled>
                انتخاب نقش
              </option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {mode === "create" ? (
          <Field label="رمز عبور اولیه" name="password" errors={e} hint="حداقل ۱۰ نویسه شامل حرف و عدد. به کاربر به‌صورت امن اعلام کنید.">
            {(p) => <Input {...p} dir="ltr" type="password" autoComplete="new-password" required />}
          </Field>
        ) : null}
      </div>
      <label className="flex items-center gap-3 text-[14px]">
        <Checkbox name="isActive" defaultChecked={defaults.isActive ?? true} disabled={isSelf} />
        حساب فعال است
        {isSelf ? <input type="hidden" name="isActive" value="on" /> : null}
      </label>
      <SubmitButton pendingLabel="در حال ذخیره…">{mode === "create" ? "ایجاد کاربر" : "ذخیره تغییرات"}</SubmitButton>
    </form>
  );
}

export function PasswordResetForm({ action }: { action: (prev: ActionState, form: FormData) => Promise<ActionState> }) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-3" noValidate>
      <FormMessage state={state} />
      <Field label="رمز عبور جدید" name="password" errors={state.fieldErrors} hint="همه نشست‌های فعال این کاربر بسته می‌شود.">
        {(p) => <Input {...p} dir="ltr" type="password" autoComplete="new-password" required />}
      </Field>
      <SubmitButton size="sm" variant="dark" pendingLabel="در حال ذخیره…">
        تغییر رمز عبور
      </SubmitButton>
    </form>
  );
}
