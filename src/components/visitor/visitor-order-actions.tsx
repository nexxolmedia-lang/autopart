"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Send, Trash2, Undo2 } from "lucide-react";
import { useOnline } from "@/components/app/connectivity";
import { Button, ButtonLink, Spinner } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label, Textarea } from "@/components/ui/form";
import { toast } from "@/components/ui/toaster";
import { visitorOrderTransitionAction } from "@/app/visitor/(app)/orders/actions";

export function VisitorOrderActions({ orderId, status }: { orderId: string; status: "DRAFT" | "SUBMITTED" }) {
  const router = useRouter();
  const online = useOnline();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<null | "cancel">(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (action: "submit" | "cancel") =>
    startTransition(async () => {
      setError(null);
      const result = await visitorOrderTransitionAction(orderId, action, reason);
      if (result.ok) {
        toast(result.message ?? "انجام شد.");
        setConfirm(null);
        if (action === "submit") router.replace(`/visitor/orders/${orderId}?placed=1`);
      } else {
        setError(result.error ?? "خطایی رخ داد.");
        toast(result.error ?? "خطایی رخ داد.", "error");
      }
    });

  return (
    <div className="space-y-2">
      {status === "DRAFT" ? (
        <div className="grid grid-cols-2 gap-2">
          <ButtonLink href={`/visitor/orders/${orderId}/edit`} variant="outline" size="lg">
            <Pencil className="h-4 w-4" aria-hidden /> ویرایش
          </ButtonLink>
          <Button size="lg" onClick={() => run("submit")} disabled={pending || !online}>
            {pending ? <Spinner /> : <Send className="h-4 w-4" aria-hidden />} ثبت سفارش
          </Button>
          <Button variant="ghost" className="col-span-2 text-danger" onClick={() => setConfirm("cancel")} disabled={pending}>
            <Trash2 className="h-4 w-4" aria-hidden /> حذف پیش‌نویس
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="lg" className="w-full" onClick={() => setConfirm("cancel")} disabled={pending || !online}>
          <Undo2 className="h-4 w-4" aria-hidden /> انصراف از سفارش
        </Button>
      )}
      {!online ? <p className="text-center text-[12.5px] text-warn">برای تغییر سفارش به اینترنت متصل شوید.</p> : null}
      {error && !confirm ? <p role="alert" className="text-center text-[13px] text-danger">{error}</p> : null}

      <Dialog
        open={confirm === "cancel"}
        onClose={() => !pending && setConfirm(null)}
        size="sm"
        title={status === "DRAFT" ? "این پیش‌نویس حذف شود؟" : "از این سفارش انصراف می‌دهید؟"}
        description={status === "DRAFT" ? "پیش‌نویس لغو می‌شود. هنوز موجودی‌ای رزرو نشده است." : "موجودی رزروشده آزاد و میز سفارش مطلع می‌شود. این کار قابل بازگشت نیست."}
      >
        <div className="space-y-4">
          {status === "SUBMITTED" ? (
            <div>
              <Label htmlFor="withdraw-reason">علت (اختیاری)</Label>
              <Textarea id="withdraw-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="مثلاً مشتری منصرف شد" />
            </div>
          ) : null}
          {error ? <p role="alert" className="text-[13px] text-danger">{error}</p> : null}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirm(null)} disabled={pending}>
              انصراف
            </Button>
            <Button variant="danger" className="flex-1" onClick={() => run("cancel")} disabled={pending}>
              {pending ? <Spinner /> : null}
              {status === "DRAFT" ? "حذف پیش‌نویس" : "تأیید انصراف"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
