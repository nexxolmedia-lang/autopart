import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "dark" | "outline" | "outline-light" | "ghost" | "ghost-light" | "danger" | "subtle";
export type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

const base =
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-[var(--ease-precise)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember disabled:pointer-events-none disabled:opacity-45 active:translate-y-px";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ember text-ink hover:bg-ember-600 hover:text-ink shadow-[inset_0_-2px_0_rgba(0,0,0,0.12)]",
  dark: "bg-ink text-bone hover:bg-graphite",
  outline: "border border-ink/20 bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-bone",
  "outline-light": "border border-bone/25 bg-transparent text-bone hover:border-bone hover:bg-bone hover:text-ink",
  ghost: "text-ink hover:bg-ink/[0.06]",
  "ghost-light": "text-bone/80 hover:bg-bone/10 hover:text-bone",
  danger: "bg-danger text-white hover:bg-[#951c22]",
  subtle: "bg-bone text-ink hover:bg-bone-2 border border-line",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] rounded-xs",
  md: "h-10 px-4 text-sm rounded-xs",
  lg: "h-12 px-6 text-[15px] rounded-xs",
  icon: "h-10 w-10 rounded-xs",
  "icon-sm": "h-8 w-8 rounded-xs",
};

export function buttonClasses({ variant = "primary", size = "md", className }: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize };

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize; children: ReactNode };

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses({ variant, size, className })} {...props} />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4 animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
