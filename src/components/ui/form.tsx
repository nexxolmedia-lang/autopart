"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClasses, Spinner, type ButtonSize, type ButtonVariant } from "./button";
import { inputClasses, selectClasses } from "./styles";


export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-[13px] font-medium text-steel-800", className)} {...props} />;
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClasses, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputClasses, "min-h-24 py-2.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(inputClasses, selectClasses, className)}
      {...props}
    >
      {children}
    </select>
  );
}

export function FieldError({ id, messages }: { id?: string; messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p id={id} className="mt-1.5 text-[13px] leading-snug text-danger" role="alert">
      {messages[0]}
    </p>
  );
}

type FieldProps = {
  label: ReactNode;
  name: string;
  errors?: Record<string, string[] | undefined>;
  hint?: ReactNode;
  className?: string;
  children: (props: { id: string; name: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
};

/** Label + control + hint + error, wired up for accessibility. */
export function Field({ label, name, errors, hint, className, children }: FieldProps) {
  const id = useId();
  const messages = errors?.[name];
  const errorId = messages?.length ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      {children({ id, name, "aria-invalid": Boolean(messages?.length), "aria-describedby": [errorId, hintId].filter(Boolean).join(" ") || undefined })}
      {hint && !messages?.length ? (
        <p id={hintId} className="mt-1.5 text-[12.5px] leading-snug text-steel-500">
          {hint}
        </p>
      ) : null}
      <FieldError id={errorId} messages={messages} />
    </div>
  );
}

export function SubmitButton({
  children,
  pendingLabel,
  variant,
  size,
  className,
  disabled,
  ...props
}: ComponentProps<"button"> & { pendingLabel?: string; variant?: ButtonVariant; size?: ButtonSize }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || disabled} aria-busy={pending} className={buttonClasses({ variant, size, className })} {...props}>
      {pending ? <Spinner /> : null}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

export function FormMessage({ state }: { state?: { ok?: boolean; message?: string; error?: string } | null }) {
  if (!state) return null;
  if (state.error) {
    return (
      <div role="alert" className="flex items-start gap-2.5 rounded-xs border border-danger/25 bg-danger-50 px-3.5 py-3 text-sm text-danger">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>{state.error}</span>
      </div>
    );
  }
  if (state.ok && state.message) {
    return (
      <div role="status" className="flex items-start gap-2.5 rounded-xs border border-ok/25 bg-ok-50 px-3.5 py-3 text-sm text-ok">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>{state.message}</span>
      </div>
    );
  }
  return null;
}

export function Checkbox({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-4.5 w-4.5 shrink-0 cursor-pointer appearance-none rounded-[2px] border border-steel-400 bg-white transition-colors checked:border-ink checked:bg-ink",
        "checked:bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3.5 8.5l3 3 6-7' fill='none' stroke='%23ff5b1a' stroke-width='2'/%3E%3C/svg%3E\")] bg-center bg-no-repeat",
        className,
      )}
      {...props}
    />
  );
}
