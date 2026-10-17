"use client";

import Form from "next/form";
import { useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/form";
import { faNumber } from "@/lib/digits";
import { cn } from "@/lib/utils";

type Facet = { slug: string; name: string; count: number };

/**
 * Filter sidebar as a plain GET form (works without JavaScript); with JS it
 * submits on every change and navigates client-side via next/form.
 */
export function CatalogFilters({
  action,
  q,
  category,
  brands,
  inStock,
  sort,
  categories,
  brandFacets,
  lockedCategory,
}: {
  action: string;
  q?: string;
  category?: string;
  brands: string[];
  inStock: boolean;
  sort?: string;
  categories: Facet[];
  brandFacets: Facet[];
  lockedCategory?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const activeCount = brands.length + (inStock ? 1 : 0) + (category && !lockedCategory ? 1 : 0);
  const submit = () => formRef.current?.requestSubmit();

  const body = (
    <>
      {q ? <input type="hidden" name="q" value={q} /> : null}
      {sort ? <input type="hidden" name="sort" value={sort} /> : null}

      <fieldset className="border-t border-ink pt-4">
        <legend className="type-eyebrow mb-3 text-steel-600">موجودی</legend>
        <label className="flex cursor-pointer items-center gap-3 py-1 text-[14px]">
          <Checkbox name="stock" value="in" defaultChecked={inStock} onChange={submit} />
          فقط کالاهای موجود
        </label>
      </fieldset>

      {!lockedCategory ? (
        <fieldset className="mt-8 border-t border-ink pt-4">
          <legend className="type-eyebrow mb-3 text-steel-600">دسته‌بندی</legend>
          <div className="space-y-0.5">
            <label className="flex cursor-pointer items-center gap-3 py-1 text-[14px]">
              <input type="radio" name="category" value="" defaultChecked={!category} onChange={submit} className="accent-ink" />
              <span className="flex-1">همه دسته‌ها</span>
            </label>
            {categories.map((c) => (
              <label key={c.slug} className={cn("flex cursor-pointer items-center gap-3 py-1 text-[14px]", c.count === 0 && category !== c.slug && "opacity-45")}>
                <input type="radio" name="category" value={c.slug} defaultChecked={category === c.slug} onChange={submit} className="accent-ink" />
                <span className="flex-1">{c.name}</span>
                <span className="type-data text-[11px] text-steel-500">{faNumber(c.count)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <fieldset className="mt-8 border-t border-ink pt-4">
        <legend className="type-eyebrow mb-3 text-steel-600">برند</legend>
        <div className="space-y-0.5">
          {brandFacets.map((b) => (
            <label key={b.slug} className={cn("flex cursor-pointer items-center gap-3 py-1 text-[14px]", b.count === 0 && !brands.includes(b.slug) && "opacity-45")}>
              <Checkbox name="brand" value={b.slug} defaultChecked={brands.includes(b.slug)} onChange={submit} />
              <span className="flex-1">{b.name}</span>
              <span className="type-data text-[11px] text-steel-500">{faNumber(b.count)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <noscript>
        <button type="submit" className="mt-6 h-10 w-full bg-ink text-sm text-bone">
          اعمال فیلترها
        </button>
      </noscript>
    </>
  );

  return (
    <Form ref={formRef} action={action} scroll={false}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="catalog-filter-panel"
        className="flex h-12 w-full items-center gap-2 border border-line bg-white px-4 text-sm font-medium lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        فیلترها
        {activeCount > 0 ? <span className="type-data ms-1 rounded-full bg-ember px-1.5 text-[11px] text-ink">{faNumber(activeCount)}</span> : null}
        <span className={cn("ms-auto text-steel-500 transition-transform", open && "rotate-180")} aria-hidden>
          ▾
        </span>
      </button>
      <div id="catalog-filter-panel" className={cn("max-lg:border max-lg:border-t-0 max-lg:border-line max-lg:bg-white max-lg:p-4", open ? "block" : "hidden lg:block")}>
        {body}
      </div>
    </Form>
  );
}
export function SortSelect({ value }: { value: string }) {
  return (
    <select
      name="sort"
      defaultValue={value}
      aria-label="مرتب‌سازی کالاها"
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="h-10 rounded-xs border border-line bg-white px-3 pe-8 text-sm focus:border-ink focus:outline-none"
    >
      <option value="relevance">پیشنهادی</option>
      <option value="price_asc">ارزان‌ترین</option>
      <option value="price_desc">گران‌ترین</option>
      <option value="name">بر اساس نام</option>
      <option value="newest">جدیدترین</option>
    </select>
  );
}
