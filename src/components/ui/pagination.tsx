import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { faNumber } from "@/lib/digits";
import { cn } from "@/lib/utils";

type Params = Record<string, string | string[] | undefined>;

function hrefFor(pathname: string, params: Params, page: number) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page" || value === undefined || value === "") continue;
    if (Array.isArray(value)) value.forEach((v) => search.append(key, v));
    else search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const qs = search.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) out.push("…");
    out.push(p);
  });
  return out;
}

export function Pagination({
  pathname,
  params,
  page,
  pageCount,
  total,
  pageSize,
  label = "مورد",
  className,
}: {
  pathname: string;
  params: Params;
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  label?: string;
  className?: string;
}) {
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);
  const linkBase = "inline-flex h-9 min-w-9 items-center justify-center rounded-xs border px-2.5 text-sm tabular transition-colors";
  return (
    <nav aria-label="صفحه‌بندی" className={cn("flex flex-col items-center justify-between gap-3 sm:flex-row", className)}>
      <p className="text-[13px] text-steel-600">
        <span className="type-data text-ink">{faNumber(first)}–{faNumber(last)}</span> از{" "}
        <span className="type-data text-ink">{faNumber(total)}</span> {label}
      </p>
      {pageCount > 1 ? (
        <ul className="flex items-center gap-1">
          <li>
            {page > 1 ? (
              <Link href={hrefFor(pathname, params, page - 1)} className={cn(linkBase, "border-line bg-white hover:border-ink")} aria-label="صفحه قبل" scroll={false}>
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className={cn(linkBase, "border-line/60 text-steel-300")} aria-hidden>
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </li>
          {pageWindow(page, pageCount).map((p, i) =>
            p === "…" ? (
              <li key={`gap-${i}`} className="px-1 text-steel-400">
                …
              </li>
            ) : (
              <li key={p}>
                <Link
                  href={hrefFor(pathname, params, p)}
                  aria-current={p === page ? "page" : undefined}
                  scroll={false}
                  className={cn(linkBase, p === page ? "border-ink bg-ink text-bone" : "border-line bg-white hover:border-ink")}
                >
                  {faNumber(p)}
                </Link>
              </li>
            ),
          )}
          <li>
            {page < pageCount ? (
              <Link href={hrefFor(pathname, params, page + 1)} className={cn(linkBase, "border-line bg-white hover:border-ink")} aria-label="صفحه بعد" scroll={false}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <span className={cn(linkBase, "border-line/60 text-steel-300")} aria-hidden>
                <ChevronLeft className="h-4 w-4" />
              </span>
            )}
          </li>
        </ul>
      ) : null}
    </nav>
  );
}
