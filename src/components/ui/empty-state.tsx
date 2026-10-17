import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("paper-grid flex flex-col items-center justify-center rounded-xs border border-dashed border-steel-300 px-6 py-14 text-center", className)}>
      {icon ? <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-line bg-white text-steel-600">{icon}</div> : null}
      <h3 className="type-heading text-lg text-ink">{title}</h3>
      {description ? <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-steel-600">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton h-4", className)} aria-hidden />;
}

export function SkeletonRows({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)} role="status" aria-label="در حال بارگذاری">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
