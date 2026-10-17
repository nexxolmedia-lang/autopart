"use client";

import { useActionState } from "react";
import { Field, FormMessage, Input, SubmitButton, Textarea } from "@/components/ui/form";
import type { ActionState } from "@/server/action-utils";

export type CustomerFormValues = {
  businessName?: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  region?: string | null;
  postalCode?: string | null;
  notes?: string | null;
};

export function CustomerForm({
  action,
  defaults = {},
  submitLabel,
  hidden,
  children,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  defaults?: CustomerFormValues;
  submitLabel: string;
  hidden?: Record<string, string>;
  children?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, {});
  const e = state.fieldErrors;
  return (
    <form action={formAction} className="space-y-5" noValidate>
      {hidden ? Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />) : null}
      <FormMessage state={state} />
      <Field label="نام کسب‌وکار" name="businessName" errors={e}>
        {(p) => <Input {...p} defaultValue={defaults.businessName} autoComplete="organization" required />}
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="نام فرد رابط" name="contactName" errors={e}>
          {(p) => <Input {...p} defaultValue={defaults.contactName ?? ""} autoComplete="name" />}
        </Field>
        <Field label="تلفن" name="phone" errors={e}>
          {(p) => <Input {...p} dir="ltr" type="tel" inputMode="tel" defaultValue={defaults.phone ?? ""} autoComplete="tel" />}
        </Field>
      </div>
      <Field label="ایمیل" name="email" errors={e}>
        {(p) => <Input {...p} dir="ltr" type="email" inputMode="email" defaultValue={defaults.email ?? ""} autoComplete="email" />}
      </Field>
      <Field label="نشانی" name="addressLine1" errors={e}>
        {(p) => <Input {...p} defaultValue={defaults.addressLine1} autoComplete="address-line1" required />}
      </Field>
      <Field label="ادامه نشانی" name="addressLine2" errors={e}>
        {(p) => <Input {...p} defaultValue={defaults.addressLine2 ?? ""} autoComplete="address-line2" />}
      </Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="شهر" name="city" errors={e}>
          {(p) => <Input {...p} defaultValue={defaults.city} autoComplete="address-level2" required />}
        </Field>
        <Field label="استان" name="region" errors={e}>
          {(p) => <Input {...p} defaultValue={defaults.region ?? ""} autoComplete="address-level1" />}
        </Field>
        <Field label="کد پستی" name="postalCode" errors={e}>
          {(p) => <Input {...p} dir="ltr" inputMode="numeric" defaultValue={defaults.postalCode ?? ""} autoComplete="postal-code" />}
        </Field>
      </div>
      <Field label="یادداشت" name="notes" errors={e} hint="توضیحات تحویل، ساعات کاری، زمان مناسب تماس.">
        {(p) => <Textarea {...p} rows={3} defaultValue={defaults.notes ?? ""} />}
      </Field>
      {children}
      <SubmitButton size="lg" pendingLabel="در حال ذخیره…" className="w-full sm:w-auto">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
