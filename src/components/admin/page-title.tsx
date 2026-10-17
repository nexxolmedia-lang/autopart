import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageTitle({
  eyebrow,
  title,
  description,
  actions,
  back,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn("mb-6 md:mb-8", className)}>
      {back ? (
        <Link href={back.href} className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-steel-600 hover:text-ink">
          <ArrowRight className="h-3.5 w-3.5" aria-hidden /> {back.label}
        </Link>
      ) : null}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className="type-eyebrow text-steel-500">{eyebrow}</p> : null}
          <h1 className="type-display mt-1.5 text-[1.9rem] leading-snug md:text-[2.2rem]">{title}</h1>
          {description ? <p className="mt-2 max-w-3xl text-[14.5px] leading-relaxed text-steel-600">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function Panel({ title, actions, children, className, bodyClassName }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={cn("border border-line bg-white", className)}>
      {title || actions ? (
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 md:px-5">
          {title ? <h2 className="type-heading text-[16px]">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      <div className={cn("p-4 md:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function Kpi({ label, value, hint, tone, href }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "ember" | "ok" | "warn"; href?: string }) {
  const body = (
    <>
      <p className="text-[12.5px] text-steel-600">{label}</p>
      <p className={cn("type-display mt-2 text-[1.8rem] leading-none", tone === "ember" && "text-ember-700", tone === "ok" && "text-ok", tone === "warn" && "text-warn")}>{value}</p>
      {hint ? <p className="mt-2 text-[12px] text-steel-500">{hint}</p> : null}
    </>
  );
  return href ? (
    <Link href={href} className="block bg-white p-4 transition-colors hover:bg-bone/40 md:p-5">
      {body}
    </Link>
  ) : (
    <div className="bg-white p-4 md:p-5">{body}</div>
  );
}
