"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AlertTriangle, Building2, Check, ChevronLeft, Loader2, Minus, PackageX, Plus, Search, Trash2, UserPlus, WifiOff, X } from "lucide-react";
import Link from "next/link";
import { useOnline } from "@/components/app/connectivity";
import { imageSrc } from "@/components/catalog/product-image";
import { AvailabilityLabel } from "@/components/ui/badges";
import { Button, Spinner } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label, Textarea } from "@/components/ui/form";
import { toast } from "@/components/ui/toaster";
import type { VisitorAvailability } from "@/lib/availability";
import { DELIVERY_WINDOW_LABELS, formatCalendarDate, upcomingDeliveryDays } from "@/lib/format";
import { calculateTotals, formatMoney, MAX_LINE_QUANTITY } from "@/lib/money";
import { faNumber } from "@/lib/digits";
import { cn } from "@/lib/utils";
import { saveOrderAction, type ComposerPayload } from "@/app/visitor/(app)/orders/actions";

export type ComposerProduct = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  illustration: string;
  image: { url: string | null; assetId: string | null; alt: string } | null;
  price: number;
  availability: VisitorAvailability;
};

export type ComposerCustomer = {
  id: string;
  code: string;
  businessName: string;
  city: string;
  addressLine1?: string | null;
  contactName?: string | null;
};

type Line = { product: ComposerProduct; quantity: number; serverError?: string };
type Window = "ANY" | "MORNING" | "AFTERNOON";

export type ComposerInitial = {
  orderId?: string;
  orderLabel?: string;
  customer?: ComposerCustomer | null;
  lines?: { product: ComposerProduct; quantity: number }[];
  note?: string;
  date?: string;
  window?: Window;
};

const STORAGE_PREFIX = "autopart:composer:v1:";

function newKey() {
  try {
    return crypto.randomUUID();
  } catch {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16));
  }
}

function lineProblem(line: Line): string | null {
  const { upTo } = line.product.availability;
  if (upTo === 0) return "ناموجود — این قلم را حذف کنید.";
  if (upTo !== null && line.quantity > upTo) return `در حال حاضر فقط ${faNumber(upTo)} عدد قابل سفارش است.`;
  return line.serverError ?? null;
}

export function OrderComposer({
  actorId,
  initial,
  today,
  maxDate,
}: {
  actorId: string;
  initial: ComposerInitial;
  today: string;
  maxDate: string;
}) {
  const router = useRouter();
  const online = useOnline();
  const editingDraft = Boolean(initial.orderId);
  const storageKey = `${STORAGE_PREFIX}${actorId}`;

  const [customer, setCustomer] = useState<ComposerCustomer | null>(initial.customer ?? null);
  const [lines, setLines] = useState<Line[]>(initial.lines ?? []);
  const [note, setNote] = useState(initial.note ?? "");
  const [date, setDate] = useState(initial.date ?? "");
  const [window_, setWindow] = useState<Window>(initial.window ?? "ANY");
  const [idempotencyKey] = useState(newKey);
  const [customerPicker, setCustomerPicker] = useState(false);
  const [review, setReview] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [pending, startTransition] = useTransition();
  const [submittingAs, setSubmittingAs] = useState<"submit" | "draft" | null>(null);
  const restored = useRef(false);

  // Restore an unsent order (new orders only; never when editing a saved draft).
  // localStorage is only readable after hydration, so this has to run in an effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (editingDraft || restored.current) return;
    restored.current = true;
    if (initial.customer || initial.lines?.length) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as { customer: ComposerCustomer | null; lines: Line[]; note: string; date: string; window: Window };
      if (!saved.lines?.length && !saved.customer) return;
      setCustomer(saved.customer);
      setLines(saved.lines.map((l) => ({ product: l.product, quantity: l.quantity })));
      setNote(saved.note ?? "");
      setDate(saved.date && saved.date >= today ? saved.date : "");
      setWindow(saved.window ?? "ANY");
      toast("سفارش ارسال‌نشده شما بازیابی شد. موجودی هنگام ثبت دوباره بررسی می‌شود.", "info");
    } catch {
      /* storage unavailable or corrupt — start fresh */
    }
  }, [editingDraft, initial.customer, initial.lines, storageKey, today]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (editingDraft || !restored.current) return;
    try {
      if (!customer && lines.length === 0) window.localStorage.removeItem(storageKey);
      else window.localStorage.setItem(storageKey, JSON.stringify({ customer, lines, note, date, window: window_ }));
    } catch {
      /* ignore */
    }
  }, [customer, lines, note, date, window_, editingDraft, storageKey]);

  const deliveryDays = useMemo(() => upcomingDeliveryDays(today, 14).filter((d) => d.iso <= maxDate), [today, maxDate]);
  const totals = useMemo(() => calculateTotals(lines.map((l) => ({ unitPrice: l.product.price, quantity: l.quantity }))), [lines]);
  const units = lines.reduce((s, l) => s + l.quantity, 0);
  const problems = lines.map(lineProblem);
  const hasProblems = problems.some(Boolean);
  const canReview = Boolean(customer) && lines.length > 0 && !hasProblems;

  const addProduct = useCallback((product: ComposerProduct) => {
    setLines((current) => {
      const existing = current.find((l) => l.product.id === product.id);
      if (existing) {
        const max = product.availability.upTo ?? MAX_LINE_QUANTITY;
        return current.map((l) => (l.product.id === product.id ? { ...l, product, quantity: Math.min(l.quantity + 1, max), serverError: undefined } : l));
      }
      return [...current, { product, quantity: 1 }];
    });
    setServerError(null);
  }, []);

  const setQuantity = (productId: string, quantity: number) => {
    const q = Math.max(1, Math.min(MAX_LINE_QUANTITY, Math.floor(quantity || 1)));
    setLines((current) => current.map((l) => (l.product.id === productId ? { ...l, quantity: q, serverError: undefined } : l)));
  };
  const removeLine = (productId: string) => setLines((current) => current.filter((l) => l.product.id !== productId));

  const payload = (): ComposerPayload => ({
    orderId: initial.orderId,
    customerId: customer?.id ?? "",
    items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
    visitorNote: note.trim() || undefined,
    requestedDeliveryDate: date || undefined,
    requestedDeliveryWindow: window_,
    idempotencyKey,
  });

  const send = (submit: boolean) => {
    if (!online) return;
    setServerError(null);
    setFieldErrors({});
    setSubmittingAs(submit ? "submit" : "draft");
    startTransition(async () => {
      const result = await saveOrderAction(payload(), submit);
      setSubmittingAs(null);
      if (result.ok && result.data) {
        try {
          window.localStorage.removeItem(storageKey);
        } catch {
          /* ignore */
        }
        if (result.message) toast(result.message);
        router.push(`/visitor/orders/${result.data.id}${submit ? "?placed=1" : ""}`);
        return;
      }
      setServerError(result.error ?? "ذخیره سفارش ممکن نشد.");
      if (result.shortages?.length) {
        // The server is authoritative: adopt its availability figures for the affected lines.
        setLines((current) =>
          current.map((l) => {
            const s = result.shortages!.find((x) => x.productId === l.product.id);
            if (!s) return l;
            return {
              ...l,
              product: { ...l.product, availability: { ...l.product.availability, upTo: s.available, status: s.available > 0 ? "LIMITED" : "OUT_OF_STOCK", label: s.available > 0 ? `قابل سفارش تا ${faNumber(s.available)} عدد` : "ناموجود" } },
              serverError: s.available > 0 ? `در حال حاضر فقط ${faNumber(s.available)} عدد قابل سفارش است.` : "این کالا اکنون ناموجود است.",
            };
          }),
        );
        setReview(false);
      }
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
    });
  };

  return (
    <div className="pb-28">
      <header className="mb-5">
        <p className="type-eyebrow text-steel-500">{editingDraft ? `ویرایش پیش‌نویس ${initial.orderLabel ?? ""}` : "سفارش جدید"}</p>
        <h1 className="type-display mt-1.5 text-[2rem] leading-none">{editingDraft ? "ویرایش پیش‌نویس" : "ثبت سفارش"}</h1>
        <ol className="mt-4 grid grid-cols-3 gap-1.5" aria-label="مراحل">
          {[
            { label: "مشتری", done: Boolean(customer) },
            { label: `قطعات${lines.length ? ` · ${faNumber(lines.length)}` : ""}`, done: lines.length > 0 && !hasProblems },
            { label: "بازبینی", done: false },
          ].map((s, i) => (
            <li key={s.label} className="flex flex-col gap-1.5">
              <span className={cn("h-1 w-full", s.done ? "bg-ember" : i === 0 || (i === 1 && customer) || (i === 2 && canReview) ? "bg-ink" : "bg-line")} />
              <span className={cn("flex items-center gap-1 text-[11.5px] font-medium", s.done ? "text-ink" : "text-steel-500")}>
                {s.done ? <Check className="h-3 w-3 text-ember" aria-hidden /> : null}
                {s.label}
              </span>
            </li>
          ))}
        </ol>
      </header>

      {!online ? (
        <div role="status" className="mb-5 flex items-start gap-2.5 border border-warn/30 bg-warn-50 px-3.5 py-3 text-[13px] text-warn">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          اتصال اینترنت برقرار نیست. می‌توانید تکمیل سفارش را ادامه دهید — روی همین دستگاه ذخیره می‌شود — اما ثبت آن پس از اتصال مجدد ممکن است.
        </div>
      ) : null}

      {serverError && !review ? (
        <div role="alert" className="mb-5 flex items-start gap-2.5 border border-danger/25 bg-danger-50 px-3.5 py-3 text-[13.5px] text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{serverError}</span>
        </div>
      ) : null}

      {/* 1 · Customer */}
      <section aria-labelledby="customer-heading" className="mb-6">
        <h2 id="customer-heading" className="type-eyebrow mb-2 text-steel-600">
          ۱ · مشتری
        </h2>
        {customer ? (
          <div className="flex items-center gap-3 border border-ink bg-white p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-ink text-bone">
              <Building2 className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold">{customer.businessName}</p>
              <p className="truncate text-[12.5px] text-steel-500">
                <span className="ltr type-data">{customer.code}</span> · {customer.addressLine1 ? `${customer.addressLine1}، ` : ""}
                {customer.city}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCustomerPicker(true)}>
              تغییر
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCustomerPicker(true)}
            className="flex w-full items-center gap-3 border border-dashed border-steel-400 bg-white p-4 text-start transition-colors hover:border-ink active:bg-bone"
          >
            <span className="flex h-10 w-10 items-center justify-center bg-bone text-steel-700">
              <Building2 className="h-5 w-5" aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block text-[15px] font-semibold">انتخاب مشتری</span>
              <span className="block text-[12.5px] text-steel-500">از میان مشتریان تخصیص‌یافته به شما</span>
            </span>
            <ChevronLeft className="h-5 w-5 text-steel-400" aria-hidden />
          </button>
        )}
        {fieldErrors.customerId ? <p className="mt-1.5 text-[13px] text-danger">{fieldErrors.customerId[0]}</p> : null}
      </section>

      {/* 2 · Parts */}
      <section aria-labelledby="parts-heading" className="mb-6">
        <h2 id="parts-heading" className="type-eyebrow mb-2 text-steel-600">
          ۲ · قطعات
        </h2>
        {lines.length > 0 ? (
          <ul className="mb-4 divide-y divide-line border border-ink bg-white" aria-label="اقلام سفارش">
            {lines.map((line, index) => {
              const problem = problems[index];
              const { upTo } = line.product.availability;
              const atMax = upTo !== null && line.quantity >= upTo;
              return (
                <li key={line.product.id} className={cn("p-3.5", problem && "bg-danger-50/50")}>
                  <div className="flex gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageSrc(line.product.image, line.product.illustration)} alt="" className="h-14 w-16 shrink-0 bg-[#f5f3ee] object-contain p-1" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium leading-snug">{line.product.name}</p>
                      <p className="type-data mt-0.5 text-[11.5px] text-steel-500">
                        <span className="ltr">{line.product.sku}</span> · {line.product.brand}
                      </p>
                      <AvailabilityLabel availability={line.product.availability.status} label={line.product.availability.label} className="mt-1 text-[12px]" />
                    </div>
                    <button type="button" onClick={() => removeLine(line.product.id)} className="-me-1 -mt-1 flex h-9 w-9 items-center justify-center text-steel-400 hover:text-danger" aria-label={`حذف ${line.product.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center border border-line bg-white">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.product.id, line.quantity - 1)}
                        disabled={line.quantity <= 1}
                        className="flex h-11 w-11 items-center justify-center text-ink disabled:text-steel-300"
                        aria-label={`کاهش تعداد ${line.product.name}`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={upTo ?? MAX_LINE_QUANTITY}
                        value={line.quantity}
                        onChange={(e) => setQuantity(line.product.id, Number(e.target.value))}
                        onFocus={(e) => e.currentTarget.select()}
                        className="type-data h-11 w-14 border-x border-line text-center text-[16px] font-medium focus:outline-none"
                        aria-label={`تعداد ${line.product.name}`}
                        aria-invalid={Boolean(problem)}
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity(line.product.id, line.quantity + 1)}
                        disabled={atMax}
                        className="flex h-11 w-11 items-center justify-center text-ink disabled:text-steel-300"
                        aria-label={`افزایش تعداد ${line.product.name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-end">
                      <p className="type-data text-[15px] font-medium">{formatMoney(line.product.price * line.quantity)}</p>
                      <p className="type-data text-[11.5px] text-steel-500">هر عدد {formatMoney(line.product.price)}</p>
                    </div>
                  </div>
                  {problem ? (
                    <p role="alert" className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-danger">
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                      {problem}
                      {upTo !== null && upTo > 0 && line.quantity > upTo ? (
                        <button type="button" onClick={() => setQuantity(line.product.id, upTo)} className="font-semibold underline underline-offset-2">
                          تنظیم روی {faNumber(upTo)}
                        </button>
                      ) : null}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
        <ProductSearch onAdd={addProduct} inOrder={new Map(lines.map((l) => [l.product.id, l.quantity]))} />
      </section>

      {/* 3 · Delivery & notes */}
      <section aria-labelledby="details-heading" className="mb-6 space-y-4">
        <h2 id="details-heading" className="type-eyebrow text-steel-600">
          ۳ · تحویل و توضیحات
        </h2>
        <fieldset className="min-w-0">
          <legend className="mb-1.5 text-[13px] font-medium text-steel-800">تاریخ تحویل دلخواه (اختیاری)</legend>
          {/* Jalali day picker: native date inputs only offer the Gregorian calendar. */}
          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="radiogroup" aria-label="تاریخ تحویل">
            {[{ iso: "", weekday: "اولین زمان", label: "ممکن" }, ...deliveryDays].map((d) => (
              <button
                key={d.iso || "asap"}
                type="button"
                role="radio"
                aria-checked={date === d.iso}
                onClick={() => setDate(d.iso)}
                className={cn(
                  "flex h-16 min-w-[84px] shrink-0 flex-col items-center justify-center gap-0.5 border px-2 text-center transition-colors",
                  date === d.iso ? "border-ink bg-ink text-bone" : "border-line bg-white text-ink hover:border-ink",
                )}
              >
                <span className={cn("text-[11.5px]", date === d.iso ? "text-bone/70" : "text-steel-500")}>{d.weekday}</span>
                <span className="text-[13.5px] font-semibold">{d.label}</span>
              </button>
            ))}
          </div>
          {fieldErrors.requestedDeliveryDate ? <p className="mt-1.5 text-[13px] text-danger">{fieldErrors.requestedDeliveryDate[0]}</p> : null}
        </fieldset>
        <fieldset className="min-w-0">
          <legend className="mb-1.5 text-[13px] font-medium text-steel-800">بازه زمانی</legend>
          <div className="grid grid-cols-3 border border-line bg-white">
            {(["ANY", "MORNING", "AFTERNOON"] as const).map((w) => (
              <label key={w} className={cn("relative flex h-11 cursor-pointer items-center justify-center border-s border-line text-[13px] font-medium first:border-s-0", window_ === w ? "bg-ink text-bone" : "text-steel-700 hover:bg-bone")}>
                <input type="radio" name="window" value={w} checked={window_ === w} onChange={() => setWindow(w)} className="sr-only" />
                {w === "ANY" ? "هر ساعتی" : w === "MORNING" ? "صبح" : "بعدازظهر"}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <Label htmlFor="visitor-note">توضیح برای میز سفارش (اختیاری)</Label>
          <Textarea id="visitor-note" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثلاً قبل از ارسال تماس بگیرید — درب پشتی. تا پنجشنبه لازم است." />
        </div>
      </section>

      {/* Sticky summary */}
      <div className="no-print fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4rem)] z-30 border-t border-line bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="type-data text-[17px] font-semibold leading-tight">{formatMoney(totals.total)}</p>
            <p className="text-[11.5px] text-steel-500">
              {faNumber(lines.length)} قلم · {faNumber(units)} عدد · بدون مالیات
            </p>
          </div>
          <Button size="lg" onClick={() => setReview(true)} disabled={!canReview} className="min-w-[150px]">
            بازبینی سفارش <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>

      <CustomerPicker
        open={customerPicker}
        onClose={() => setCustomerPicker(false)}
        onSelect={(c) => {
          setCustomer(c);
          setCustomerPicker(false);
        }}
      />

      <Dialog open={review} onClose={() => !pending && setReview(false)} title="بازبینی سفارش" description="قیمت و موجودی هنگام ثبت توسط سرور تأیید می‌شود.">
        {customer ? (
          <div className="space-y-5">
            <div className="border border-line bg-white p-3.5">
              <p className="type-eyebrow text-steel-500">مشتری</p>
              <p className="mt-1 font-semibold">{customer.businessName}</p>
              <p className="text-[12.5px] text-steel-500">
                <span className="ltr">{customer.code}</span> · {customer.city}
              </p>
            </div>
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-ink text-start">
                  <th className="type-eyebrow py-2 font-medium text-steel-600">قطعه</th>
                  <th className="type-eyebrow py-2 text-end font-medium text-steel-600">تعداد</th>
                  <th className="type-eyebrow py-2 text-end font-medium text-steel-600">جمع</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.product.id} className="border-b border-line align-top">
                    <td className="py-2.5 pe-3">
                      <p className="font-medium leading-snug">{l.product.name}</p>
                      <p className="type-data text-[11.5px] text-steel-500">
                        <span className="ltr">{l.product.sku}</span> · {formatMoney(l.product.price)}
                      </p>
                    </td>
                    <td className="type-data py-2.5 text-end">{faNumber(l.quantity)}</td>
                    <td className="type-data py-2.5 ps-3 text-end">{formatMoney(l.product.price * l.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className="pt-3 font-semibold">
                    جمع کل (بدون مالیات)
                  </td>
                  <td className="type-data pt-3 text-end text-[16px] font-semibold">{formatMoney(totals.total)}</td>
                </tr>
              </tfoot>
            </table>
            <dl className="grid grid-cols-2 gap-3 text-[13px]">
              <div>
                <dt className="type-eyebrow text-steel-500">تاریخ تحویل</dt>
                <dd className="mt-1">{date ? formatCalendarDate(`${date}T00:00:00Z`) : "اولین زمان ممکن"}</dd>
              </div>
              <div>
                <dt className="type-eyebrow text-steel-500">بازه زمانی</dt>
                <dd className="mt-1">{DELIVERY_WINDOW_LABELS[window_]}</dd>
              </div>
              {note.trim() ? (
                <div className="col-span-2">
                  <dt className="type-eyebrow text-steel-500">توضیحات</dt>
                  <dd className="mt-1 whitespace-pre-line">{note.trim()}</dd>
                </div>
              ) : null}
            </dl>
            {serverError ? (
              <p role="alert" className="flex items-start gap-2 border border-danger/25 bg-danger-50 p-3 text-[13px] text-danger">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {serverError}
              </p>
            ) : null}
            {!online ? <p className="text-[13px] text-warn">اتصال برقرار نیست — برای ثبت به اینترنت متصل شوید.</p> : null}
            <div className="flex flex-col gap-2 pt-1 sm:flex-row-reverse">
              <Button size="lg" className="flex-1" onClick={() => send(true)} disabled={pending || !online}>
                {pending && submittingAs === "submit" ? <Spinner /> : <Check className="h-4 w-4" aria-hidden />}
                {pending && submittingAs === "submit" ? "در حال ثبت…" : "ثبت سفارش"}
              </Button>
              <Button size="lg" variant="outline" className="flex-1" onClick={() => send(false)} disabled={pending || !online}>
                {pending && submittingAs === "draft" ? <Spinner /> : null}
                ذخیره پیش‌نویس
              </Button>
            </div>
            <p className="text-center text-[12px] text-steel-500">با ثبت سفارش، موجودی بلافاصله رزرو و سفارش برای میز سفارش ارسال می‌شود.</p>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

// ── Product search ───────────────────────────────────────────────────────────

function ProductSearch({ onAdd, inOrder }: { onAdd: (p: ComposerProduct) => void; inOrder: Map<string, number> }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ComposerProduct[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setState("loading");
      try {
        const res = await fetch(`/api/v1/products?pageSize=12&q=${encodeURIComponent(q.trim())}`, { signal: controller.signal, cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { items: ComposerProduct[] };
        setResults(data.items);
        setState("idle");
      } catch (error) {
        if ((error as Error).name !== "AbortError") setState("error");
      }
    }, q ? 250 : 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [q]);

  return (
    <div className="border border-line bg-white">
      <div className="relative border-b border-line">
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جستجوی قطعه، کد کالا یا خودرو…"
          aria-label="جستجوی قطعه برای افزودن"
          className="h-12 w-full bg-transparent ps-10 pe-10 text-[16px] focus:outline-none"
          enterKeyHint="search"
        />
        {q ? (
          <button type="button" onClick={() => setQ("")} className="absolute end-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-steel-500" aria-label="پاک کردن جستجو">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <div aria-live="polite" className="sr-only">
        {state === "idle" ? `${faNumber(results.length)} قطعه پیدا شد` : ""}
      </div>
      {state === "loading" && results.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-steel-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> در حال جستجو…
        </div>
      ) : state === "error" ? (
        <p className="px-4 py-6 text-center text-sm text-danger">بارگذاری قطعات ممکن نشد. اتصال اینترنت را بررسی و دوباره تلاش کنید.</p>
      ) : results.length === 0 ? (
        <p className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-steel-500">
          <PackageX className="h-5 w-5" aria-hidden />
          قطعه‌ای با «{q}» پیدا نشد.
        </p>
      ) : (
        <ul className={cn("divide-y divide-line transition-opacity", state === "loading" && "opacity-60")}>
          {!q ? <li className="type-eyebrow bg-bone/50 px-4 py-2 text-[10px] text-steel-500">قطعات پیشنهادی — برای یافتن هر قطعه‌ای جستجو کنید</li> : null}
          {results.map((p) => {
            const qty = inOrder.get(p.id);
            const out = p.availability.upTo === 0;
            return (
              <li key={p.id} className="flex items-center gap-3 px-3.5 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageSrc(p.image, p.illustration)} alt="" className="h-12 w-14 shrink-0 bg-[#f5f3ee] object-contain p-1" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium leading-snug">{p.name}</p>
                  <p className="type-data text-[11.5px] text-steel-500">
                    <span className="ltr">{p.sku}</span> · {formatMoney(p.price)}
                  </p>
                  <AvailabilityLabel availability={p.availability.status} label={p.availability.label} className="text-[11.5px]" />
                </div>
                <button
                  type="button"
                  disabled={out}
                  onClick={() => onAdd(p)}
                  className={cn(
                    "flex h-11 min-w-11 shrink-0 items-center justify-center gap-1 px-3 text-[13px] font-semibold transition-colors",
                    out ? "bg-bone text-steel-400" : qty ? "bg-ink text-bone" : "bg-ember text-ink active:bg-ember-600",
                  )}
                  aria-label={out ? `${p.name} ناموجود است` : qty ? `افزودن یک عدد دیگر ${p.name} (${qty} عدد در سفارش)` : `افزودن ${p.name}`}
                >
                  {out ? "—" : qty ? (
                    <>
                      <span className="type-data">{faNumber(qty)}</span>
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                    </>
                  ) : (
                    <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Customer picker ──────────────────────────────────────────────────────────

function CustomerPicker({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (c: ComposerCustomer) => void }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<ComposerCustomer[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/customers?q=${encodeURIComponent(q.trim())}`, { signal: controller.signal, cache: "no-store" });
        if (!res.ok) throw new Error();
        setItems(((await res.json()) as { items: ComposerCustomer[] }).items);
        setError(false);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError(true);
      }
    }, q ? 200 : 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [q, open]);

  return (
    <Dialog open={open} onClose={onClose} title="انتخاب مشتری" description="فقط مشتریان تخصیص‌یافته به شما نمایش داده می‌شوند.">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="نام، کد یا شهر"
          aria-label="جستجوی مشتری"
          className="h-11 w-full rounded-xs border border-line bg-white ps-9 pe-3 text-[16px] focus:border-ink focus:outline-none"
          autoFocus
        />
      </div>
      <div className="mt-3 min-h-40">
        {error ? (
          <p className="py-6 text-center text-sm text-danger">بارگذاری مشتریان ممکن نشد.</p>
        ) : items === null ? (
          <div className="flex justify-center py-8">
            <Spinner className="text-steel-500" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-steel-500">مشتری‌ای پیدا نشد.</p>
        ) : (
          <ul className="divide-y divide-line border border-line">
            {items.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => onSelect(c)} className="flex w-full items-center gap-3 bg-white px-3.5 py-3 text-start hover:bg-bone/60 active:bg-bone">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.businessName}</p>
                    <p className="truncate text-[12.5px] text-steel-500">
                      <span className="ltr type-data">{c.code}</span> · {c.city}
                      {c.contactName ? ` · ${c.contactName}` : ""}
                    </p>
                  </div>
                  <ChevronLeft className="h-4 w-4 text-steel-400" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Link href="/visitor/customers/new?return=order" className="mt-4 flex h-11 items-center justify-center gap-2 border border-dashed border-steel-400 text-[13.5px] font-medium hover:border-ink">
        <UserPlus className="h-4 w-4" aria-hidden /> افزودن مشتری جدید
      </Link>
    </Dialog>
  );
}
