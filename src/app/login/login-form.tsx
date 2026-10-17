"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field, FormMessage, Input, SubmitButton } from "@/components/ui/form";
import type { ActionState } from "@/server/action-utils";
import { loginAction } from "./actions";

export type DemoAccount = { email: string; role: string; name: string; lands: string };

export function LoginForm({ demoAccounts, demoPassword }: { demoAccounts?: DemoAccount[]; demoPassword?: string }) {
  const [state, action] = useActionState<ActionState, FormData>(loginAction, {});
  const [show, setShow] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const nextRef = useRef<HTMLInputElement>(null);

  // The page is static; pick up the post-login destination from the URL.
  // The server action validates it (same-origin relative paths only).
  useEffect(() => {
    if (nextRef.current) nextRef.current.value = new URLSearchParams(window.location.search).get("next") ?? "";
  }, []);

  const fill = (email: string) => {
    if (emailRef.current) emailRef.current.value = email;
    if (passwordRef.current && demoPassword) passwordRef.current.value = demoPassword;
    formRef.current?.requestSubmit();
  };

  return (
    <>
      <form ref={formRef} action={action} className="space-y-5" noValidate>
        <input ref={nextRef} type="hidden" name="next" defaultValue="" />
        <FormMessage state={state.error ? state : null} />
        <Field label="ایمیل" name="email" errors={state.fieldErrors}>
          {(p) => <Input {...p} dir="ltr" ref={emailRef} type="email" autoComplete="username" inputMode="email" autoCapitalize="none" required autoFocus />}
        </Field>
        <Field label="رمز عبور" name="password" errors={state.fieldErrors}>
          {(p) => (
            <div className="relative">
              <Input {...p} dir="ltr" ref={passwordRef} type={show ? "text" : "password"} autoComplete="current-password" required className="pe-12" />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute end-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-steel-500 hover:text-ink"
                aria-label={show ? "پنهان کردن رمز" : "نمایش رمز"}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          )}
        </Field>
        <SubmitButton size="lg" className="w-full" pendingLabel="در حال ورود…">
          ورود
        </SubmitButton>
      </form>

      {demoAccounts?.length ? (
        <div className="mt-10 border-t border-line pt-6">
          <p className="type-eyebrow text-steel-500">حساب‌های نمایشی · فقط محیط توسعه</p>
          <ul className="mt-3 grid gap-px border border-line bg-line">
            {demoAccounts.map((a) => (
              <li key={a.email}>
                <button
                  type="button"
                  onClick={() => fill(a.email)}
                  className="group flex w-full items-center gap-3 bg-white px-3.5 py-2.5 text-start transition-colors hover:bg-bone"
                >
                  <span className="flex-1">
                    <span className="block text-[13.5px] font-medium">{a.role}</span>
                    <span className="ltr type-data block text-end text-[11.5px] text-steel-500">{a.email}</span>
                  </span>
                  <span className="type-eyebrow text-[10px] text-steel-400 group-hover:text-ember">{a.lands} ←</span>
                </button>
              </li>
            ))}
          </ul>
          {demoPassword ? (
            <p className="mt-3 text-[12.5px] text-steel-600">
              رمز عبور همه حساب‌های نمایشی: <span className="ltr type-data rounded-xs bg-bone px-1.5 py-0.5 text-ink">{demoPassword}</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
