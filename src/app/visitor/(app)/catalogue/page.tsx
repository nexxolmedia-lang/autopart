import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { PackageSearch, Plus, Search } from "lucide-react";
import { imageSrc } from "@/components/catalog/product-image";
import { AvailabilityLabel } from "@/components/ui/badges";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { formatMoney } from "@/lib/money";
import { cn, firstParam, toPositiveInt } from "@/lib/utils";
import { requirePageAnyPermission } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { searchOrderableProducts } from "@/server/modules/products/queries";

export const metadata: Metadata = { title: "استعلام قطعه" };

export default async function VisitorCataloguePage(props: PageProps<"/visitor/catalogue">) {
  const actor = await requirePageAnyPermission(["orders.create", "inventory.view"], "/visitor/catalogue");
  const params = await props.searchParams;
  const q = firstParam(params.q)?.trim().slice(0, 100) ?? "";
  const category = firstParam(params.category) ?? "";
  const [result, categories] = await Promise.all([
    searchOrderableProducts(actor, { q: q || undefined, category: category || undefined, page: toPositiveInt(firstParam(params.page), 1), pageSize: 15 }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } }),
  ]);
  const chip = (slug: string) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (slug) sp.set("category", slug);
    const s = sp.toString();
    return s ? `/visitor/catalogue?${s}` : "/visitor/catalogue";
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="type-eyebrow text-steel-500">قیمت و موجودی لحظه‌ای</p>
        <h1 className="type-display mt-1.5 text-[2rem] leading-snug">استعلام قطعه</h1>
      </div>
      <Form action="/visitor/catalogue" className="relative">
        {category ? <input type="hidden" name="category" value={category} /> : null}
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" aria-hidden />
        <input name="q" type="search" defaultValue={q} placeholder="قطعه، کد کالا، شماره فنی، خودرو یا مدل" aria-label="جستجوی قطعه" className="h-12 w-full rounded-xs border border-line bg-white ps-10 pe-3 text-[16px] focus:border-ink focus:outline-none" enterKeyHint="search" />
      </Form>
      <nav aria-label="دسته‌بندی‌ها" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4">
        {[{ slug: "", name: "همه" }, ...categories].map((c) => (
          <Link key={c.slug} href={chip(c.slug)} aria-current={category === c.slug ? "page" : undefined} className={cn("flex h-9 shrink-0 items-center rounded-full border px-3.5 text-[13px] font-medium", category === c.slug ? "border-ink bg-ink text-bone" : "border-line bg-white text-steel-700")}>
            {c.name}
          </Link>
        ))}
      </nav>
      {result.items.length === 0 ? (
        <EmptyState icon={<PackageSearch className="h-5 w-5" />} title="قطعه‌ای پیدا نشد" description="املای عبارت را بررسی کنید یا با کد کالا یا خودرو جستجو کنید." />
      ) : (
        <ul className="divide-y divide-line border border-line">
          {result.items.map((p) => (
            <li key={p.id} className="bg-white p-4">
              <div className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageSrc(p.image, p.illustration)} alt="" className="h-16 w-20 shrink-0 bg-[#f5f3ee] object-contain p-1" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <p className="type-eyebrow text-[10px] text-steel-500">
                    {p.brand} · {p.category}
                  </p>
                  <p className="mt-0.5 text-[15px] font-medium leading-snug">{p.name}</p>
                  <p className="ltr type-data text-end text-[12px] text-steel-500">{p.sku}</p>
                </div>
              </div>
              {p.specs.length ? (
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
                  {p.specs.map((s) => (
                    <div key={s.label} className="flex justify-between gap-2 border-b border-line/60 py-0.5">
                      <dt className="truncate text-steel-500">{s.label}</dt>
                      <dd className="type-data shrink-0">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              <div className="mt-3 flex items-center justify-between gap-3">
                <div>
                  <p className="type-data text-[17px] font-semibold">{formatMoney(p.price)}</p>
                  <AvailabilityLabel availability={p.availability.status} label={p.availability.label} className="text-[12px]" />
                </div>
                {p.availability.upTo !== 0 && actor.permissions.has("orders.create") ? (
                  <Link href={`/visitor/orders/new?product=${p.id}`} className="flex h-10 items-center gap-1.5 bg-ember px-3.5 text-[13px] font-semibold text-ink active:bg-ember-600">
                    <Plus className="h-4 w-4" aria-hidden /> سفارش
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination pathname="/visitor/catalogue" params={params} page={result.page} pageCount={result.pageCount} total={result.total} pageSize={result.pageSize} label="قطعه" />
    </div>
  );
}
