import Form from "next/form";
import Link from "next/link";
import { PackageSearch, Search, X } from "lucide-react";
import { ProductGrid } from "@/components/catalog/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { firstParam, toPositiveInt } from "@/lib/utils";
import { searchCatalog, type CatalogSort } from "@/server/modules/products/queries";
import { CatalogFilters, SortSelect } from "./catalog-filters";

export type CatalogSearchParams = Record<string, string | string[] | undefined>;

const SORTS: CatalogSort[] = ["relevance", "price_asc", "price_desc", "name", "newest"];

export async function CatalogView({ params, pathname, lockedCategory }: { params: CatalogSearchParams; pathname: string; lockedCategory?: string }) {
  const q = firstParam(params.q)?.trim().slice(0, 100) || undefined;
  const category = lockedCategory ?? (firstParam(params.category) || undefined);
  const brandParam = params.brand;
  const brands = (Array.isArray(brandParam) ? brandParam : brandParam ? [brandParam] : []).filter(Boolean).slice(0, 10);
  const inStock = firstParam(params.stock) === "in";
  const sortValue = firstParam(params.sort) as CatalogSort | undefined;
  const sort = sortValue && SORTS.includes(sortValue) ? sortValue : "relevance";
  const page = toPositiveInt(firstParam(params.page), 1);

  const result = await searchCatalog({ q, category, brands, inStock, sort, page, pageSize: 12 });
  const activeFilters = [
    ...(q ? [{ label: `“${q}”`, key: "q" }] : []),
    ...(inStock ? [{ label: "فقط موجود", key: "stock" }] : []),
    ...(!lockedCategory && category ? [{ label: result.facets.categories.find((c) => c.slug === category)?.name ?? category, key: "category" }] : []),
    ...brands.map((b) => ({ label: result.facets.brands.find((x) => x.slug === b)?.name ?? b, key: `brand:${b}` })),
  ];

  const removeHref = (key: string) => {
    const sp = new URLSearchParams();
    if (q && key !== "q") sp.set("q", q);
    if (inStock && key !== "stock") sp.set("stock", "in");
    if (!lockedCategory && category && key !== "category") sp.set("category", category);
    brands.filter((b) => key !== `brand:${b}`).forEach((b) => sp.append("brand", b));
    if (sort !== "relevance") sp.set("sort", sort);
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[250px_1fr] lg:gap-12">
      <aside aria-label="فیلترها">
        <CatalogFilters
          action={pathname}
          q={q}
          category={category}
          brands={brands}
          inStock={inStock}
          sort={sort !== "relevance" ? sort : undefined}
          categories={result.facets.categories}
          brandFacets={result.facets.brands}
          lockedCategory={Boolean(lockedCategory)}
        />
      </aside>
      <div className="min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Form action={pathname} className="relative flex-1" scroll={false}>
            {inStock ? <input type="hidden" name="stock" value="in" /> : null}
            {!lockedCategory && category ? <input type="hidden" name="category" value={category} /> : null}
            {brands.map((b) => (
              <input key={b} type="hidden" name="brand" value={b} />
            ))}
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" aria-hidden />
            <input
              name="q"
              type="search"
              defaultValue={q}
              aria-label="جستجو در کاتالوگ"
              placeholder="جستجو با نام، کد کالا، شماره فنی یا خودرو"
              className="h-10 w-full rounded-xs border border-line bg-white ps-9 pe-3 text-sm placeholder:text-steel-400 focus:border-ink focus:outline-none"
            />
          </Form>
          <Form action={pathname} scroll={false} className="flex items-center gap-2">
            {q ? <input type="hidden" name="q" value={q} /> : null}
            {inStock ? <input type="hidden" name="stock" value="in" /> : null}
            {!lockedCategory && category ? <input type="hidden" name="category" value={category} /> : null}
            {brands.map((b) => (
              <input key={b} type="hidden" name="brand" value={b} />
            ))}
            <SortSelect value={sort} />
          </Form>
        </div>

        {activeFilters.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {activeFilters.map((f) => (
              <Link
                key={f.key}
                href={removeHref(f.key)}
                scroll={false}
                className="inline-flex h-7 items-center gap-1.5 rounded-xs border border-line bg-white px-2.5 text-[12.5px] hover:border-ink"
                aria-label={`حذف فیلتر ${f.label}`}
              >
                {f.label}
                <X className="h-3 w-3 text-steel-500" aria-hidden />
              </Link>
            ))}
            <Link href={pathname} scroll={false} className="ms-1 text-[12.5px] text-steel-600 underline-offset-2 hover:underline">
              حذف همه
            </Link>
          </div>
        ) : null}

        <div className="mt-6">
          {result.items.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="h-5 w-5" />}
              title="قطعه‌ای با این فیلترها پیدا نشد"
              description="جستجوی کلی‌تری انجام دهید، یک فیلتر را حذف کنید یا با واحد فروش تماس بگیرید — قطعات خارج از فهرست را هم تأمین می‌کنیم."
              action={
                <Link href={pathname} className="text-sm font-medium underline underline-offset-4">
                  پاک کردن فیلترها
                </Link>
              }
            />
          ) : (
            <ProductGrid products={result.items} className="xl:grid-cols-3" />
          )}
        </div>
        <Pagination className="mt-8" pathname={pathname} params={params} page={result.page} pageCount={result.pageCount} total={result.total} pageSize={result.pageSize} label="قطعه" />
      </div>
    </div>
  );
}

export function CatalogViewSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[250px_1fr] lg:gap-12" aria-busy="true" aria-label="در حال بارگذاری کاتالوگ">
      <div className="hidden space-y-3 lg:block">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="skeleton h-5" />
        ))}
      </div>
      <div>
        <div className="skeleton h-10" />
        <div className="mt-6 grid grid-cols-1 gap-px sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton h-80 rounded-none" />
          ))}
        </div>
      </div>
    </div>
  );
}
