"use client";

import { useActionState, useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, FormMessage, Input, Select, SubmitButton, Textarea } from "@/components/ui/form";
import { toast } from "@/components/ui/toaster";
import { faNumber } from "@/lib/digits";
import type { ActionState } from "@/server/action-utils";
import { adjustStockAction } from "@/app/admin/inventory/actions";

const KINDS = {
  RECEIPT: { label: "ورود کالا", hint: "کالای دریافتی از تأمین‌کننده. تعداد دریافت‌شده را وارد کنید." },
  ADJUSTMENT: { label: "اصلاح موجودی (±)", hint: "برای خرابی یا مفقودی عدد منفی (مثلاً ‎-2) و برای کالای پیدا‌شده عدد مثبت وارد کنید." },
  STOCK_COUNT: { label: "شمارش انبار", hint: "عدد شمارش‌شده در قفسه را وارد کنید؛ موجودی فیزیکی برابر آن می‌شود." },
  RETURN: { label: "مرجوعی مشتری", hint: "تعداد کالای سالم برگشتی از مشتری." },
} as const;

export function StockAdjustDialog({ product }: { product: { id: string; sku: string; name: string; onHand: number; reserved: number } }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} aria-label={`ثبت گردش برای ${product.name}`}>
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden /> ثبت گردش
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="ثبت گردش موجودی" description={`${product.name} · ${product.sku}`}>
        {open ? <AdjustForm product={product} onDone={() => setOpen(false)} /> : null}
      </Dialog>
    </>
  );
}

function AdjustForm({ product, onDone }: { product: { id: string; onHand: number; reserved: number }; onDone: () => void }) {
  const [state, formAction] = useActionState<ActionState, FormData>(adjustStockAction.bind(null, product.id), {});
  const [kind, setKind] = useState<keyof typeof KINDS>("RECEIPT");
  useEffect(() => {
    if (state.ok) {
      toast(state.message ?? "ثبت شد.");
      onDone();
    }
  }, [state.at, state.ok, state.message, onDone]);
  const e = state.fieldErrors;
  return (
    <form action={formAction} className="space-y-4">
      <dl className="grid grid-cols-3 gap-2 text-center text-[12.5px]">
        <div className="bg-bone/60 p-2.5">
          <dt className="text-steel-600">فیزیکی</dt>
          <dd className="type-display text-lg">{faNumber(product.onHand)}</dd>
        </div>
        <div className="bg-bone/60 p-2.5">
          <dt className="text-steel-600">رزروشده</dt>
          <dd className="type-display text-lg">{faNumber(product.reserved)}</dd>
        </div>
        <div className="bg-bone/60 p-2.5">
          <dt className="text-steel-600">آزاد</dt>
          <dd className="type-display text-lg">{faNumber(Math.max(0, product.onHand - product.reserved))}</dd>
        </div>
      </dl>
      <FormMessage state={state.ok ? null : state} />
      <Field label="نوع گردش" name="kind" errors={e} hint={KINDS[kind].hint}>
        {(p) => (
          <Select {...p} value={kind} onChange={(ev) => setKind(ev.target.value as keyof typeof KINDS)}>
            {Object.entries(KINDS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label={kind === "STOCK_COUNT" ? "تعداد شمارش‌شده" : "تعداد"} name="quantity" errors={e}>
        {(p) => <Input {...p} dir="ltr" inputMode={kind === "ADJUSTMENT" ? "text" : "numeric"} required autoFocus />}
      </Field>
      <Field label="علت" name="reason" errors={e}>
        {(p) => <Textarea {...p} rows={2} required placeholder="مثلاً تحویل از تأمین‌کننده طبق فاکتور" />}
      </Field>
      <Field label="شماره مرجع (اختیاری)" name="reference" errors={e} hint="شماره فاکتور خرید، حواله یا برگه شمارش">
        {(p) => <Input {...p} dir="ltr" />}
      </Field>
      <p className="text-[12px] leading-relaxed text-steel-500">هر گردش با نام شما، موجودی قبل و بعد در تاریخچه ثبت می‌شود. موجودی هرگز منفی یا کمتر از مقدار رزروشده نمی‌شود.</p>
      <SubmitButton pendingLabel="در حال ثبت…">ثبت گردش</SubmitButton>
    </form>
  );
}
