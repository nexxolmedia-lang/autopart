import { cn } from "@/lib/utils";

/**
 * AutoPart mark: a hexagonal fastener head seen in plan view, with the
 * hex-socket cut as a negative "A" vertex — engineered, not decorative.
 */
export function LogoMark({ className, accent = "var(--color-ember)" }: { className?: string; accent?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8", className)} aria-hidden="true">
      <path d="M16 1.8 28.3 8.9v14.2L16 30.2 3.7 23.1V8.9Z" fill="currentColor" />
      <path d="M16 8.2 22.6 12v8L16 23.8 9.4 20v-8Z" fill="none" stroke={accent} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M12.7 19.4 16 11.6l3.3 7.8" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="square" />
    </svg>
  );
}

export function Logo({ className, dark = false, compact = false }: { className?: string; dark?: boolean; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", dark ? "text-bone" : "text-ink", className)}>
      <LogoMark className="h-7 w-7" />
      {compact ? null : (
        <span className="flex flex-col leading-none">
          <span className="type-display text-[21px] leading-none">اتوپارت</span>
          <span className="ltr mt-1 text-[9.5px] font-bold text-current opacity-55">AUTO<span className="text-ember">/</span>PART</span>
        </span>
      )}
      <span className="sr-only">اتوپارت</span>
    </span>
  );
}
