import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1320px] px-4 md:px-6", className)}>{children}</div>;
}

/** Numbered section heading — the site's editorial rhythm ("02 / Catalogue"). */
export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  action,
  dark,
  className,
}: {
  index?: string;
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-6 border-t pt-6 md:grid-cols-[200px_1fr_auto] md:items-end", dark ? "border-bone/15" : "border-ink", className)}>
      <p className={cn("type-eyebrow", dark ? "text-bone/50" : "text-steel-500")}>
        {index ? <span className="text-ember">{index}</span> : null}
        {index ? <span className="mx-2 opacity-50">/</span> : null}
        {eyebrow}
      </p>
      <div>
        <h2 className={cn("type-display text-[clamp(2rem,4.2vw,3.4rem)]", dark ? "text-bone" : "text-ink")}>{title}</h2>
        {description ? <p className={cn("mt-4 max-w-2xl text-[16px] leading-relaxed", dark ? "text-bone/65" : "text-steel-700")}>{description}</p> : null}
      </div>
      {action ? <div className="md:pb-1.5">{action}</div> : null}
    </div>
  );
}
