"use client";

import { useActionState, useTransition } from "react";
import { Archive, ArchiveRestore } from "lucide-react";
import { Button, Spinner } from "@/components/ui/button";
import { Checkbox, FormMessage, SubmitButton } from "@/components/ui/form";
import { toast } from "@/components/ui/toaster";
import type { ActionState } from "@/server/action-utils";
import { setAssignmentsAction, setCustomerActiveAction } from "@/app/admin/customers/actions";

export type VisitorOption = { id: string; name: string; email: string };

export function VisitorCheckboxes({ visitors, selected }: { visitors: VisitorOption[]; selected: string[] }) {
  if (visitors.length === 0) return <p className="text-[13px] text-steel-500">هیچ کاربری با مجوز ثبت سفارش وجود ندارد.</p>;
  return (
    <ul className="grid gap-px border border-line bg-line sm:grid-cols-2">
      {visitors.map((v) => (
        <li key={v.id} className="bg-white">
          <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
            <Checkbox name="assignees" value={v.id} defaultChecked={selected.includes(v.id)} />
            <span>
              <span className="block text-[13.5px] font-medium">{v.name}</span>
              <span className="ltr block text-end text-[11.5px] text-steel-500">{v.email}</span>
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}

export function AssignmentsForm({ customerId, visitors, selected }: { customerId: string; visitors: VisitorOption[]; selected: string[] }) {
  const [state, formAction] = useActionState<ActionState, FormData>(setAssignmentsAction.bind(null, customerId), {});
  return (
    <form action={formAction} className="space-y-3">
      <FormMessage state={state} />
      <p className="text-[12.5px] leading-relaxed text-steel-600">ویزیتورها فقط مشتریانی را می‌بینند و برایشان سفارش ثبت می‌کنند که به آن‌ها تخصیص داده شده باشد.</p>
      <VisitorCheckboxes visitors={visitors} selected={selected} />
      <SubmitButton size="sm" variant="dark" pendingLabel="در حال ذخیره…">
        ذخیره تخصیص
      </SubmitButton>
    </form>
  );
}

export function CustomerArchiveButton({ customerId, active }: { customerId: string; active: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant={active ? "ghost" : "outline"}
      className={active ? "text-danger" : undefined}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const r = await setCustomerActiveAction(customerId, !active);
          toast(r.ok ? (r.message ?? "انجام شد.") : (r.error ?? "خطا"), r.ok ? "success" : "error");
        })
      }
    >
      {pending ? <Spinner /> : active ? <Archive className="h-4 w-4" aria-hidden /> : <ArchiveRestore className="h-4 w-4" aria-hidden />}
      {active ? "بایگانی مشتری" : "فعال‌سازی مجدد"}
    </Button>
  );
}
