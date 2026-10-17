"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Checkbox, Field, FormMessage, Input, Label, Select, SubmitButton, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/server/action-utils";

type Spec = { label: string; value: string };
type Fitment = { make: string; model: string; yearFrom: string; yearTo: string; engine: string };

export type ProductFormDefaults = {
  sku?: string;
  name?: string;
  slug?: string;
  shortDescription?: string | null;
  description?: string;
  categoryId?: string;
  brandId?: string;
  price?: string;
  oeReferences?: string[];
  specs?: Spec[];
  fitments?: Fitment[];
  weightGrams?: number | null;
  lowStockThreshold?: number;
  isFeatured?: boolean;
};

export function ProductForm({
  action,
  defaults = {},
  categories,
  brands,
  mode,
  canPrice,
  canStock,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  defaults?: ProductFormDefaults;
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  mode: "create" | "edit";
  canPrice: boolean;
  canStock: boolean;
}) {
  const [state, formAction] = useActionState(action, {});
  const [specs, setSpecs] = useState<Spec[]>(defaults.specs?.length ? defaults.specs : [{ label: "", value: "" }]);
  const [fitments, setFitments] = useState<Fitment[]>(defaults.fitments ?? []);
  const e = state.fieldErrors;

  return (
    <form action={formAction} className="space-y-8" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="specs" value={JSON.stringify(specs)} />
      <input type="hidden" name="fitments" value={JSON.stringify(fitments)} />

      <section className="grid gap-5 md:grid-cols-2">
        <Field label="نام کالا" name="name" errors={e} className="md:col-span-2">
          {(p) => <Input {...p} defaultValue={defaults.name} required />}
        </Field>
        <Field label="کد کالا (SKU)" name="sku" errors={e} hint="حروف بزرگ لاتین، رقم و خط تیره؛ مثلاً KSL-TK-4410">
          {(p) => <Input {...p} dir="ltr" defaultValue={defaults.sku} required className="uppercase" />}
        </Field>
        <Field label="نامک نشانی (اختیاری)" name="slug" errors={e} hint="خالی بگذارید تا خودکار ساخته شود.">
          {(p) => <Input {...p} dir="ltr" defaultValue={defaults.slug} />}
        </Field>
        <Field label="دسته‌بندی" name="categoryId" errors={e}>
          {(p) => (
            <Select {...p} defaultValue={defaults.categoryId ?? ""} required>
              <option value="" disabled>
                انتخاب کنید
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="برند" name="brandId" errors={e}>
          {(p) => (
            <Select {...p} defaultValue={defaults.brandId ?? ""} required>
              <option value="" disabled>
                انتخاب کنید
              </option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="قیمت فروش همکار (ریال)" name="price" errors={e} hint={canPrice ? "بدون مالیات بر ارزش افزوده." : "تغییر قیمت نیازمند مجوز قیمت‌گذاری است."}>
          {(p) => <Input {...p} dir="ltr" inputMode="numeric" defaultValue={defaults.price} required readOnly={!canPrice && mode === "edit"} />}
        </Field>
        <Field label="حد هشدار موجودی" name="lowStockThreshold" errors={e} hint="وقتی موجودی آزاد به این عدد برسد، «محدود» نمایش داده و هشدار ارسال می‌شود.">
          {(p) => <Input {...p} dir="ltr" inputMode="numeric" defaultValue={String(defaults.lowStockThreshold ?? 5)} />}
        </Field>
        <Field label="وزن (گرم)" name="weightGrams" errors={e}>
          {(p) => <Input {...p} dir="ltr" inputMode="numeric" defaultValue={defaults.weightGrams ? String(defaults.weightGrams) : ""} />}
        </Field>
        <Field label="شماره‌های فنی معادل" name="oeReferences" errors={e} hint="با کاما جدا کنید.">
          {(p) => <Input {...p} dir="ltr" defaultValue={defaults.oeReferences?.join(", ")} />}
        </Field>
        <Field label="توضیح کوتاه" name="shortDescription" errors={e} className="md:col-span-2">
          {(p) => <Input {...p} defaultValue={defaults.shortDescription ?? ""} />}
        </Field>
        <Field label="توضیحات کامل" name="description" errors={e} className="md:col-span-2">
          {(p) => <Textarea {...p} rows={5} defaultValue={defaults.description} required />}
        </Field>
        <label className="flex items-center gap-3 text-[14px] md:col-span-2">
          <Checkbox name="isFeatured" defaultChecked={defaults.isFeatured} />
          نمایش در قطعات منتخب صفحه اصلی
        </label>
      </section>

      {mode === "create" && canStock ? (
        <section className="grid gap-5 border-t border-line pt-6 md:grid-cols-2">
          <h2 className="type-heading text-lg md:col-span-2">موجودی اولیه</h2>
          <Field label="موجودی اولیه (عدد)" name="initialStock" errors={e} hint="به‌عنوان «ورود کالا» در گردش انبار ثبت می‌شود.">
            {(p) => <Input {...p} dir="ltr" inputMode="numeric" defaultValue="0" />}
          </Field>
          <Field label="محل قفسه" name="binLocation" errors={e}>
            {(p) => <Input {...p} dir="ltr" placeholder="A-01-2" className="uppercase" />}
          </Field>
        </section>
      ) : null}

      <section className="border-t border-line pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="type-heading text-lg">مشخصات فنی</h2>
          <button type="button" onClick={() => setSpecs((s) => [...s, { label: "", value: "" }])} className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:text-ember-700">
            <Plus className="h-4 w-4" aria-hidden /> افزودن ردیف
          </button>
        </div>
        <div className="space-y-2">
          {specs.map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_1.3fr_auto] gap-2">
              <Input aria-label={`عنوان مشخصه ${i + 1}`} value={s.label} placeholder="مثلاً قطر" onChange={(ev) => setSpecs((all) => all.map((x, j) => (j === i ? { ...x, label: ev.target.value } : x)))} className="h-10" />
              <Input aria-label={`مقدار مشخصه ${i + 1}`} value={s.value} placeholder="مثلاً ۲۶۶ میلی‌متر" onChange={(ev) => setSpecs((all) => all.map((x, j) => (j === i ? { ...x, value: ev.target.value } : x)))} className="h-10" />
              <button type="button" onClick={() => setSpecs((all) => all.filter((_, j) => j !== i))} className="flex h-10 w-10 items-center justify-center text-steel-400 hover:text-danger" aria-label={`حذف ردیف ${i + 1}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line pt-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="type-heading text-lg">خودروهای سازگار</h2>
            <p className="text-[12.5px] text-steel-500">سال‌ها را به شمسی وارد کنید (مثلاً ۱۳۹۵). سال پایان خالی یعنی «تاکنون».</p>
          </div>
          <button type="button" onClick={() => setFitments((f) => [...f, { make: "", model: "", yearFrom: "", yearTo: "", engine: "" }])} className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:text-ember-700">
            <Plus className="h-4 w-4" aria-hidden /> افزودن خودرو
          </button>
        </div>
        {fitments.length === 0 ? <p className="text-[13px] text-steel-500">خودرویی ثبت نشده است.</p> : null}
        <div className="space-y-2">
          {fitments.map((f, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 border border-line bg-bone/30 p-2 md:grid-cols-[1fr_1fr_90px_90px_1fr_auto] md:border-0 md:bg-transparent md:p-0">
              {(["make", "model", "yearFrom", "yearTo", "engine"] as const).map((k) => (
                <div key={k}>
                  <Label className="sr-only" htmlFor={`fit-${i}-${k}`}>
                    {{ make: "سازنده", model: "مدل", yearFrom: "از سال", yearTo: "تا سال", engine: "موتور" }[k]}
                  </Label>
                  <Input
                    id={`fit-${i}-${k}`}
                    value={f[k]}
                    placeholder={{ make: "سازنده", model: "مدل", yearFrom: "از سال", yearTo: "تا سال", engine: "موتور" }[k]}
                    inputMode={k.startsWith("year") ? "numeric" : undefined}
                    onChange={(ev) => setFitments((all) => all.map((x, j) => (j === i ? { ...x, [k]: ev.target.value } : x)))}
                    className={cn("h-10", k.startsWith("year") && "text-center")}
                  />
                </div>
              ))}
              <button type="button" onClick={() => setFitments((all) => all.filter((_, j) => j !== i))} className="flex h-10 w-10 items-center justify-center text-steel-400 hover:text-danger" aria-label={`حذف خودرو ${i + 1}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        {Object.keys(e ?? {}).some((k) => k.startsWith("fitments")) ? <p className="mt-2 text-[13px] text-danger">اطلاعات خودروهای سازگار را بررسی کنید (سازنده، مدل و سال شروع الزامی است).</p> : null}
        {Object.keys(e ?? {}).some((k) => k.startsWith("specs")) ? <p className="mt-2 text-[13px] text-danger">مشخصات فنی را بررسی کنید؛ هر ردیف باید عنوان و مقدار داشته باشد.</p> : null}
      </section>

      <div className="sticky bottom-0 -mx-4 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        <SubmitButton size="lg" pendingLabel="در حال ذخیره…">
          {mode === "create" ? "ایجاد کالا" : "ذخیره تغییرات"}
        </SubmitButton>
      </div>
    </form>
  );
}
