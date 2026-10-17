import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Container } from "./section";

export type Crumb = { href?: string; label: string };

export function Breadcrumbs({ items, dark }: { items: Crumb[]; dark?: boolean }) {
  return (
    <nav aria-label="مسیر صفحه">
      <ol className={`flex flex-wrap items-center gap-1 text-[12.5px] ${dark ? "text-bone/50" : "text-steel-500"}`}>
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 ? <ChevronLeft className="h-3 w-3 opacity-60" aria-hidden /> : null}
            {c.href ? (
              <Link href={c.href} className={dark ? "hover:text-bone" : "hover:text-ink"}>
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className={dark ? "text-bone/80" : "text-ink"}>
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Dark editorial page header used across the public site. */
export function PageHeader({
  eyebrow,
  title,
  description,
  crumbs,
  aside,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  crumbs?: Crumb[];
  aside?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-ink text-bone">
      <div className="blueprint-grid pointer-events-none absolute inset-0" aria-hidden />
      <Container className="relative py-12 md:py-16">
        {crumbs ? <Breadcrumbs items={crumbs} dark /> : null}
        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="type-eyebrow text-ember">{eyebrow}</p>
            <h1 className="type-display mt-4 text-[clamp(2.4rem,5.5vw,4.4rem)]">{title}</h1>
            {description ? <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-bone/65">{description}</p> : null}
          </div>
          {aside}
        </div>
      </Container>
    </section>
  );
}
