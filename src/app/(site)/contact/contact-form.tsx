"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Field, FormMessage, Input, Select, SubmitButton, Textarea } from "@/components/ui/form";
import type { ActionState } from "@/server/action-utils";
import { submitInquiryAction } from "./actions";

const TOPICS = {
  trade_account: "افتتاح حساب همکاری",
  quote: "درخواست پیش‌فاکتور",
  availability: "استعلام موجودی قطعه",
  other: "سایر موارد",
};

export function ContactForm({ defaultTopic, defaultMessage }: { defaultTopic?: string; defaultMessage?: string }) {
  const [state, action] = useActionState<ActionState, FormData>(submitInquiryAction, {});
  const errors = state.fieldErrors;

  if (state.ok) {
    return (
      <div className="flex flex-col items-start gap-4 border border-ok/30 bg-ok-50 p-8" role="status">
        <CheckCircle2 className="h-8 w-8 text-ok" aria-hidden />
        <h2 className="type-heading text-2xl">پیام شما دریافت شد.</h2>
        <p className="text-[15px] leading-relaxed text-steel-800">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state.error ? state : null} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="نام و نام خانوادگی" name="name" errors={errors}>
          {(p) => <Input {...p} autoComplete="name" required />}
        </Field>
        <Field label="تعمیرگاه / شرکت" name="company" errors={errors}>
          {(p) => <Input {...p} autoComplete="organization" />}
        </Field>
        <Field label="ایمیل" name="email" errors={errors}>
          {(p) => <Input {...p} dir="ltr" type="email" autoComplete="email" required />}
        </Field>
        <Field label="تلفن (اختیاری)" name="phone" errors={errors}>
          {(p) => <Input {...p} dir="ltr" type="tel" autoComplete="tel" />}
        </Field>
      </div>
      <Field label="موضوع" name="topic" errors={errors}>
        {(p) => (
          <Select {...p} defaultValue={defaultTopic && defaultTopic in TOPICS ? defaultTopic : "trade_account"}>
            {Object.entries(TOPICS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="پیام" name="message" errors={errors}>
        {(p) => <Textarea {...p} rows={6} defaultValue={defaultMessage} required placeholder="درباره تعمیرگاه، خودروهایی که روی آن‌ها کار می‌کنید یا قطعات مورد نیازتان بنویسید." />}
      </Field>
      {/* Honeypot — hidden from people and assistive technology. */}
      <div aria-hidden className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
        <label>
          وب‌سایت
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton size="lg" pendingLabel="در حال ارسال…">
          ارسال پیام
        </SubmitButton>
        <p className="text-[12.5px] text-steel-500">این اطلاعات فقط برای پاسخ به پیام شما استفاده می‌شود.</p>
      </div>
    </form>
  );
}
