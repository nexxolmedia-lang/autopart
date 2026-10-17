"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, RotateCcw, Save } from "lucide-react";
import { imageSrc } from "@/components/catalog/product-image";
import { Button, Spinner } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { toast } from "@/components/ui/toaster";
import { faNumber, toLatinDigits, toPersianDigits } from "@/lib/digits";
import { bpsToPercent, calculateLine, calculateTotals, formatMoney, parseAmount, parsePercentToBps } from "@/lib/money";
import { cn } from "@/lib/utils";
import { adjustLinesAction } from "@/app/admin/orders/actions";

export type EditorLine = {
  id: string;
  productName: string;
  sku: string;
  brandName: string;
  image: { url: string | null; assetId: string | null; alt: string } | null;
  illustration: string;
  requestedQuantity: number;
  requestedUnitPrice: number;
  quantity: number;
  unitPrice: number;
  discountBps: number;
  lineTotal: number;
  catalogPrice: number;
  /** Exact stock (order desk only): available to promise + already reserved for this line. */
  stock: { available: number; reservedHere: number; bin: string | null } | null;
};

type Draft = { quantity: string; price: string; discount: string };

export function OrderLinesEditor({
  orderId,
  version,
  lines,
  editable,
  canPrice,
}: {
  orderId: string;
  version: number;
  lines: EditorLine[];
  editable: boolean;
  canPrice: boolean;
}) {
  const initial = useMemo(
    () => Object.fromEntries(lines.map((l) => [l.id, { quantity: String(l.quantity), price: l.unitPrice.toLocaleString("en-US"), discount: bpsToPercent(l.discountBps) }])) as Record<string, Draft>,
    [lines],
  );
  const [drafts, setDrafts] = useState(initial);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const parsed = lines.map((l) => {
    const d = drafts[l.id]!;
    const qtyText = toLatinDigits(d.quantity).trim();
    const quantity = /^\d{1,4}$/.test(qtyText) ? Number(qtyText) : NaN;
    const unitPrice = parseAmount(d.price);
    const discountBps = parsePercentToBps(d.discount);
    const problems: string[] = [];
    if (Number.isNaN(quantity)) problems.push("تعداد نامعتبر است.");
    if (unitPrice === null) problems.push("قیمت نامعتبر است.");
    if (discountBps === null) problems.push("درصد تخفیف نامعتبر است.");
    if (!Number.isNaN(quantity) && l.stock && quantity > l.stock.available + l.stock.reservedHere) {
      problems.push(`حداکثر قابل تأمین: ${faNumber(l.stock.available + l.stock.reservedHere)} عدد`);
    }
    const valid = problems.length === 0;
    const amounts = valid ? calculateLine(unitPrice!, quantity, discountBps!) : null;
    const changed = valid && (quantity !== l.quantity || unitPrice !== l.unitPrice || discountBps !== l.discountBps);
    return { line: l, quantity, unitPrice: unitPrice ?? 0, discountBps: discountBps ?? 0, amounts, problems, changed, valid };
  });

  const totals = calculateTotals(parsed.filter((p) => p.valid).map((p) => ({ unitPrice: p.unitPrice, quantity: p.quantity, discountBps: p.discountBps })));
  const anyChanged = parsed.some((p) => p.changed);
  const anyInvalid = parsed.some((p) => !p.valid);
  const set = (id: string, patch: Partial<Draft>) => setDrafts((d) => ({ ...d, [id]: { ...d[id]!, ...patch } }));

  const save = () =>
    startTransition(async () => {
      setError(null);
      const result = await adjustLinesAction(orderId, {
        expectedVersion: version,
        note: note.trim() || undefined,
        lines: parsed
          .filter((p) => p.changed)
          .map((p) => ({ itemId: p.line.id, quantity: p.quantity, ...(canPrice ? { unitPrice: p.unitPrice, discountBps: p.discountBps } : {}) })),
      });
      if (result.ok) {
        toast(result.message ?? "ذخیره شد.");
        setNote("");
      } else {
        setError(result.error ?? "ذخیره ممکن نشد.");
      }
    });

  const inputCls = "type-data h-9 w-full rounded-xs border border-line bg-white px-2 text-center text-[13.5px] focus:border-ink focus:outline-none aria-[invalid=true]:border-danger";

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-[13.5px]">
          <thead className="border-b border-line bg-bone/60 text-steel-600">
            <tr>
              <th className="type-eyebrow px-3 py-2.5 text-start font-medium">قطعه</th>
              <th className="type-eyebrow w-20 px-2 py-2.5 text-start font-medium">تعداد</th>
              <th className="type-eyebrow w-32 px-2 py-2.5 text-start font-medium">قیمت واحد (ریال)</th>
              <th className="type-eyebrow w-16 px-2 py-2.5 text-start font-medium">تخفیف ٪</th>
              <th className="type-eyebrow px-3 py-2.5 text-end font-medium">جمع</th>
            </tr>
          </thead>
          <tbody>
            {parsed.map(({ line, amounts, problems, changed, quantity }) => {
              const adjusted = line.quantity !== line.requestedQuantity || line.unitPrice !== line.requestedUnitPrice || line.discountBps > 0;
              return (
                <tr key={line.id} className={cn("border-b border-line/70 align-top", changed && "bg-ember-50/60", quantity === 0 && "opacity-70")}>
                  <td className="px-3 py-3">
                    <div className="flex gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageSrc(line.image, line.illustration)} alt="" className="h-12 w-14 shrink-0 bg-[#f5f3ee] object-contain p-0.5" />
                      <div className="min-w-0">
                        <p className="font-medium leading-snug">{line.productName}</p>
                        <p className="text-[12px] text-steel-500">
                          <span className="ltr">{line.sku}</span> · <span className="ltr">{line.brandName}</span>
                        </p>
                        {line.stock ? (
                          <p className={cn("mt-1 text-[11.5px]", line.stock.available === 0 ? "text-warn" : "text-steel-600")}>
                            موجود آزاد {faNumber(line.stock.available)} · رزرو این سفارش {faNumber(line.stock.reservedHere)}
                            {line.stock.bin ? (
                              <>
                                {" "}
                                · قفسه <span className="ltr">{line.stock.bin}</span>
                              </>
                            ) : null}
                          </p>
                        ) : null}
                        {line.catalogPrice !== line.unitPrice ? (
                          <p className="mt-0.5 text-[11.5px] text-info">قیمت فعلی کاتالوگ: {formatMoney(line.catalogPrice)}</p>
                        ) : null}
                        <p className="mt-0.5 text-[11.5px] text-steel-500">
                          درخواست ویزیتور: {faNumber(line.requestedQuantity)} × {formatMoney(line.requestedUnitPrice)}
                          {adjusted ? <span className="ms-1.5 font-semibold text-ember-700">· اصلاح‌شده</span> : null}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    {editable ? (
                      <input aria-label={`تعداد ${line.productName}`} className={inputCls} inputMode="numeric" value={drafts[line.id]!.quantity} onChange={(e) => set(line.id, { quantity: e.target.value })} aria-invalid={problems.some((p) => p.includes("تعداد") || p.includes("حداکثر"))} />
                    ) : (
                      <span className="type-data">{faNumber(line.quantity)}</span>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    {editable && canPrice ? (
                      <input aria-label={`قیمت واحد ${line.productName}`} dir="ltr" className={inputCls} inputMode="numeric" value={drafts[line.id]!.price} onChange={(e) => set(line.id, { price: e.target.value })} aria-invalid={problems.some((p) => p.includes("قیمت"))} />
                    ) : (
                      <span className="type-data">{formatMoney(line.unitPrice)}</span>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    {editable && canPrice ? (
                      <input aria-label={`درصد تخفیف ${line.productName}`} dir="ltr" className={inputCls} inputMode="decimal" value={drafts[line.id]!.discount} onChange={(e) => set(line.id, { discount: e.target.value })} aria-invalid={problems.some((p) => p.includes("تخفیف"))} />
                    ) : (
                      <span className="type-data">{line.discountBps ? `٪${toPersianDigits(bpsToPercent(line.discountBps))}` : "—"}</span>
                    )}
                  </td>
                  <td className="type-data whitespace-nowrap px-3 py-3 text-end font-semibold">
                    {amounts ? formatMoney(amounts.net) : "—"}
                    {problems.length ? (
                      <p className="mt-1 flex items-center justify-end gap-1 text-[11.5px] font-normal text-danger">
                        <AlertTriangle className="h-3 w-3" aria-hidden /> {problems[0]}
                      </p>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_300px]">
        <div>
          {editable && anyChanged ? (
            <div className="space-y-3">
              <label className="block text-[13px] font-medium text-steel-800" htmlFor="adjust-note">
                توضیح اصلاحیه (در یادداشت‌های داخلی ثبت می‌شود)
              </label>
              <Textarea id="adjust-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثلاً کاهش تعداد مطابق تأیید تلفنی مشتری" />
              {error ? (
                <p role="alert" className="flex items-start gap-2 text-[13px] text-danger">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}
                </p>
              ) : null}
              <div className="flex gap-2">
                <Button onClick={save} disabled={pending || anyInvalid}>
                  {pending ? <Spinner /> : <Save className="h-4 w-4" aria-hidden />} ذخیره اصلاحات
                </Button>
                <Button variant="ghost" onClick={() => setDrafts(initial)} disabled={pending}>
                  <RotateCcw className="h-4 w-4" aria-hidden /> بازگردانی
                </Button>
              </div>
              <p className="text-[12px] leading-relaxed text-steel-500">افزایش تعداد فقط در صورت وجود موجودی آزاد رزرو می‌شود. مقادیر درخواستی ویزیتور برای سابقه حفظ می‌شوند.</p>
            </div>
          ) : editable ? (
            <p className="text-[12.5px] leading-relaxed text-steel-500">
              برای اصلاح، تعداد{canPrice ? "، قیمت واحد یا درصد تخفیف" : ""} هر قلم را تغییر دهید. تعداد صفر یعنی آن قلم تأمین نمی‌شود.
            </p>
          ) : null}
        </div>
        <dl className="space-y-1.5 border border-line bg-bone/50 p-4 text-[13.5px]">
          <div className="flex justify-between">
            <dt className="text-steel-600">جمع اقلام</dt>
            <dd className="type-data">{formatMoney(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-steel-600">تخفیف</dt>
            <dd className="type-data">{totals.discountAmount ? `−${formatMoney(totals.discountAmount)}` : "—"}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-[15px] font-bold">
            <dt>مبلغ کل (بدون مالیات)</dt>
            <dd className="type-data">{formatMoney(totals.total)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
