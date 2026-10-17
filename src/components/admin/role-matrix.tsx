"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { Checkbox, Field, FormMessage, Input, SubmitButton } from "@/components/ui/form";
import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";
import type { ActionState } from "@/server/action-utils";
import { createRoleAction, saveRolePermissionsAction } from "@/app/admin/users/actions";

const GROUPS = [...new Set(Object.values(PERMISSIONS).map((p) => p.group))];

export function RolePermissionsForm({ role }: { role: { id: string; key: string; name: string; permissions: PermissionKey[] } }) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveRolePermissionsAction.bind(null, role.id), {});
  const locked = role.key === "ADMIN";
  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      {locked ? (
        <p className="flex items-center gap-2 text-[13px] text-steel-600">
          <Lock className="h-4 w-4" aria-hidden /> نقش مدیر سیستم همیشه همه مجوزها را دارد.
        </p>
      ) : null}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {GROUPS.map((group) => (
          <fieldset key={group} className="min-w-0">
            <legend className="type-eyebrow mb-2 text-steel-600">{group}</legend>
            <ul className="space-y-1.5">
              {(Object.entries(PERMISSIONS) as [PermissionKey, (typeof PERMISSIONS)[PermissionKey]][])
                .filter(([, p]) => p.group === group)
                .map(([key, p]) => (
                  <li key={key}>
                    <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-snug">
                      <Checkbox name="permissions" value={key} defaultChecked={role.permissions.includes(key)} disabled={locked} className="mt-0.5" />
                      <span>
                        {p.description}
                        <span className="ltr block text-end text-[11px] text-steel-400">{key}</span>
                      </span>
                    </label>
                  </li>
                ))}
            </ul>
          </fieldset>
        ))}
      </div>
      {!locked ? (
        <SubmitButton size="sm" variant="dark" pendingLabel="در حال ذخیره…">
          ذخیره مجوزهای «{role.name}»
        </SubmitButton>
      ) : null}
    </form>
  );
}

export function NewRoleForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(createRoleAction, {});
  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-[1fr_1.5fr_auto] md:items-end">
      <div className="md:col-span-3">
        <FormMessage state={state} />
      </div>
      <Field label="نام نقش" name="name" errors={state.fieldErrors}>
        {(p) => <Input {...p} required placeholder="مثلاً حسابدار" />}
      </Field>
      <Field label="توضیح" name="description" errors={state.fieldErrors}>
        {(p) => <Input {...p} />}
      </Field>
      <SubmitButton pendingLabel="در حال ایجاد…">ایجاد نقش</SubmitButton>
    </form>
  );
}
