"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Checkbox, Field, FormMessage, Input, Select, SubmitButton, Textarea } from "@/components/ui/form";
import { toast } from "@/components/ui/toaster";
import type { ActionState } from "@/server/action-utils";
import { saveBrandAction, saveCategoryAction } from "@/app/admin/products/actions";

export const ILLUSTRATIONS = [
  "timing-kit", "gasket", "camshaft", "engine-mount", "cylinder-head", "valve", "piston", "piston-rings", "bearing", "oil-filter", "air-filter",
  "fuel-filter", "cabin-filter", "brake-disc", "brake-pads", "brake-caliper", "shock-absorber", "control-arm", "coil-spring", "clutch-kit",
  "cv-joint", "radiator", "water-pump", "thermostat", "spark-plug", "ignition-coil", "alternator", "starter-motor", "battery", "generic",
];

type CategoryValues = { id?: string; name?: string; slug?: string; description?: string | null; illustration?: string; sortOrder?: number; isActive?: boolean };
type BrandValues = { id?: string; name?: string; slug?: string; country?: string | null; description?: string | null; isActive?: boolean };

function useCloseOnSuccess(state: ActionState, close: () => void) {
  useEffect(() => {
    if (state.ok) {
      toast(state.message ?? "ذخیره شد.");
      close();
    }
  }, [state.at, state.ok, state.message, close]);
}

function CategoryFormBody({ values, onDone }: { values: CategoryValues; onDone: () => void }) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveCategoryAction.bind(null, values.id ?? null), {});
  useCloseOnSuccess(state, onDone);
  const e = state.fieldErrors;
  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state.ok ? null : state} />
      <Field label="نام" name="name" errors={e}>
        {(p) => <Input {...p} defaultValue={values.name} required />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="نامک (لاتین)" name="slug" errors={e}>
          {(p) => <Input {...p} dir="ltr" defaultValue={values.slug} placeholder="brakes" />}
        </Field>
        <Field label="ترتیب نمایش" name="sortOrder" errors={e}>
          {(p) => <Input {...p} dir="ltr" inputMode="numeric" defaultValue={String(values.sortOrder ?? 0)} />}
        </Field>
      </div>
      <Field label="تصویر نقشه فنی" name="illustration" errors={e}>
        {(p) => (
          <Select {...p} defaultValue={values.illustration ?? "generic"} dir="ltr">
            {ILLUSTRATIONS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="توضیحات" name="description" errors={e}>
        {(p) => <Textarea {...p} rows={3} defaultValue={values.description ?? ""} />}
      </Field>
      <label className="flex items-center gap-3 text-[14px]">
        <Checkbox name="isActive" defaultChecked={values.isActive ?? true} /> فعال و قابل نمایش در سایت
      </label>
      <SubmitButton pendingLabel="در حال ذخیره…">ذخیره</SubmitButton>
    </form>
  );
}

function BrandFormBody({ values, onDone }: { values: BrandValues; onDone: () => void }) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveBrandAction.bind(null, values.id ?? null), {});
  useCloseOnSuccess(state, onDone);
  const e = state.fieldErrors;
  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state.ok ? null : state} />
      <Field label="نام برند" name="name" errors={e}>
        {(p) => <Input {...p} defaultValue={values.name} required />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="نامک (لاتین)" name="slug" errors={e}>
          {(p) => <Input {...p} dir="ltr" defaultValue={values.slug} />}
        </Field>
        <Field label="کشور سازنده" name="country" errors={e}>
          {(p) => <Input {...p} defaultValue={values.country ?? ""} />}
        </Field>
      </div>
      <Field label="توضیحات" name="description" errors={e}>
        {(p) => <Textarea {...p} rows={3} defaultValue={values.description ?? ""} />}
      </Field>
      <label className="flex items-center gap-3 text-[14px]">
        <Checkbox name="isActive" defaultChecked={values.isActive ?? true} /> فعال
      </label>
      <SubmitButton pendingLabel="در حال ذخیره…">ذخیره</SubmitButton>
    </form>
  );
}

export function TaxonomyDialog({ kind, values }: { kind: "category" | "brand"; values?: CategoryValues & BrandValues }) {
  const [open, setOpen] = useState(false);
  const isNew = !values?.id;
  const title = kind === "category" ? (isNew ? "دسته‌بندی جدید" : "ویرایش دسته‌بندی") : isNew ? "برند جدید" : "ویرایش برند";
  return (
    <>
      {isNew ? (
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden /> {title}
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)} aria-label={`${title} ${values?.name ?? ""}`}>
          <Pencil className="h-3.5 w-3.5" aria-hidden /> ویرایش
        </Button>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title={title}>
        {open ? kind === "category" ? <CategoryFormBody values={values ?? {}} onDone={() => setOpen(false)} /> : <BrandFormBody values={values ?? {}} onDone={() => setOpen(false)} /> : null}
      </Dialog>
    </>
  );
}
