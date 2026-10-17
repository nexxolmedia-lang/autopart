"use client";

import { useState, useTransition } from "react";
import { Ban, CheckCheck, CheckCircle2, ClipboardCheck, PackageCheck, PlayCircle, Truck, XCircle } from "lucide-react";
import { Button, Spinner, type ButtonVariant } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/form";
import { toast } from "@/components/ui/toaster";
import { ORDER_ACTION_META, type OrderAction } from "@/lib/order-workflow";
import { orderTransitionAction } from "@/app/admin/orders/actions";

const ICON: Partial<Record<OrderAction, typeof CheckCircle2>> = {
  start_review: ClipboardCheck,
  approve: CheckCircle2,
  reject: XCircle,
  cancel: Ban,
  start_preparing: PlayCircle,
  mark_ready: PackageCheck,
  dispatch: Truck,
  deliver: CheckCheck,
};

const VARIANT: Partial<Record<OrderAction, ButtonVariant>> = {
  approve: "primary",
  start_preparing: "primary",
  mark_ready: "primary",
  dispatch: "primary",
  deliver: "primary",
  start_review: "outline",
  reject: "outline",
  cancel: "ghost",
};

const CONFIRM_COPY: Partial<Record<OrderAction, { title: string; description: string; reasonLabel?: string }>> = {
  reject: { title: "رد سفارش", description: "موجودی رزروشده آزاد و ویزیتور مطلع می‌شود. علت رد برای ویزیتور نمایش داده می‌شود.", reasonLabel: "علت رد" },
  cancel: { title: "لغو سفارش", description: "موجودی رزروشده آزاد می‌شود. این کار قابل بازگشت نیست.", reasonLabel: "علت لغو" },
  dispatch: { title: "تأیید ارسال", description: "با تأیید ارسال، موجودی فیزیکی کسر و گردش کالا ثبت می‌شود." },
  approve: { title: "تأیید سفارش", description: "سفارش با قیمت‌ها و تعدادهای فعلی تأیید و برای انبار آزاد می‌شود." },
};

/**
 * Workflow buttons. The server re-validates every transition — this only
 * offers the actions `availableActions()` reported for the current actor.
 */
export function WorkflowActions({ orderId, version, actions, blockedReason }: { orderId: string; version: number; actions: OrderAction[]; blockedReason?: Partial<Record<OrderAction, string>> }) {
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<OrderAction | null>(null);
  const [reason, setReason] = useState("");
  const [carrier, setCarrier] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (action: OrderAction) =>
    startTransition(async () => {
      setError(null);
      const result = await orderTransitionAction(orderId, action, {
        expectedVersion: version,
        reason: reason.trim() || undefined,
        carrier: carrier.trim() || undefined,
        reference: reference.trim() || undefined,
      });
      if (result.ok) {
        toast(result.message ?? "انجام شد.");
        setDialog(null);
        setReason("");
      } else {
        setError(result.error ?? "خطایی رخ داد.");
        if (!dialog) toast(result.error ?? "خطایی رخ داد.", "error");
      }
    });

  if (actions.length === 0) return null;
  const copy = dialog ? CONFIRM_COPY[dialog] : undefined;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = ICON[action] ?? CheckCircle2;
          const blocked = blockedReason?.[action];
          return (
            <Button
              key={action}
              variant={VARIANT[action] ?? "outline"}
              disabled={pending || Boolean(blocked)}
              title={blocked}
              onClick={() => (CONFIRM_COPY[action] ? setDialog(action) : run(action))}
              className={action === "cancel" ? "text-danger" : undefined}
            >
              {pending && !dialog ? <Spinner /> : <Icon className="h-4 w-4" aria-hidden />}
              {ORDER_ACTION_META[action].label}
            </Button>
          );
        })}
      </div>
      {error && !dialog ? (
        <p role="alert" className="mt-2 text-[13px] text-danger">
          {error}
        </p>
      ) : null}

      <Dialog open={dialog !== null} onClose={() => !pending && setDialog(null)} title={copy?.title ?? ""} description={copy?.description} size="sm">
        <div className="space-y-4">
          {copy?.reasonLabel ? (
            <Field label={copy.reasonLabel} name="reason" errors={error ? { reason: [error] } : undefined}>
              {(p) => <Textarea {...p} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} required autoFocus />}
            </Field>
          ) : null}
          {dialog === "dispatch" ? (
            <>
              <Field label="روش ارسال / باربری" name="carrier">
                {(p) => <Input {...p} value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="مثلاً خودروی اتوپارت — مسیر ۲" />}
              </Field>
              <Field label="کد رهگیری (اختیاری)" name="reference">
                {(p) => <Input {...p} dir="ltr" value={reference} onChange={(e) => setReference(e.target.value)} />}
              </Field>
            </>
          ) : null}
          {error && !copy?.reasonLabel ? (
            <p role="alert" className="text-[13px] text-danger">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDialog(null)} disabled={pending}>
              انصراف
            </Button>
            <Button
              variant={dialog === "reject" || dialog === "cancel" ? "danger" : "primary"}
              className="flex-1"
              disabled={pending || (Boolean(copy?.reasonLabel) && reason.trim().length === 0)}
              onClick={() => dialog && run(dialog)}
            >
              {pending ? <Spinner /> : null}
              {dialog ? ORDER_ACTION_META[dialog].label : ""}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
