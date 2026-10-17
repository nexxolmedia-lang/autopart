import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Package, Plus, Search } from "lucide-react";
import { PageTitle } from "@/components/admin/page-title";
import { imageSrc } from "@/components/catalog/product-image";
import { Badge } from "@/components/ui/badges";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { inputClasses, selectClasses, tableClasses as t } from "@/components/ui/styles";
import { faNumber } from "@/lib/digits";
import { formatMoney } from "@/lib/money";
import { cn, firstParam, toPositiveInt } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";
import { getCatalogueOptions, listProductsAdmin } from "@/server/modules/products/queries";

export const metadata: Metadata = { title: "کالاها" };

export default async function AdminProductsPage(props: PageProps<"/admin/products">) {
  const actor = await requirePagePermission("products.manage", "/admin/products");
  const params = await props.searchParams;
  const q = firstParam(params.q) ?? "";
  const category = firstParam(params.category) ?? "";
  const brand = firstParam(params.brand) ?? "";
  const status = (firstParam(params.status) as "ACTIVE" | "ARCHIVED" | "ALL" | undefined) ?? "ACTIVE";
  const [result, options] = await Promise.all([
    listProductsAdmin(actor, { q: q || undefined, category: category || undefined, brand: brand || undefined, status, page: toPositiveInt(firstParam(params.page), 1), pageSize: 25 }),
    getCatalogueOptions(),
  ]);

  return (
    <>
      <PageTitle
        eyebrow="کاتالوگ"
        title="کالاها"
        description="مدیریت اطلاعات کالا، قیمت، تصاویر و خودروهای سازگار. کالاهایی که در سفارش‌ها استفاده شده‌اند حذف نمی‌شوند و فقط بایگانی می‌شوند."
        actions={
          <ButtonLink href="/admin/products/new">
            <Plus className="h-4 w-4" aria-hidden /> کالای جدید
          </ButtonLink>
        }
      />
      <Form action="/admin/products" className="mb-5 grid gap-3 border border-line bg-white p-4 md:grid-cols-[1.5fr_1fr_1fr_0.8fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" aria-hidden />
          <input name="q" type="search" defaultValue={q} placeholder="نام، کد کالا، برند یا خودرو" aria-label="جستجو" className={cn(inputClasses, "h-10 ps-9")} />
        </div>
        <select name="category" defaultValue={category} aria-label="دسته‌بندی" className={cn(inputClasses, selectClasses, "h-10")}>
          <option value="">همه دسته‌ها</option>
          {options.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="brand" defaultValue={brand} aria-label="برند" className={cn(inputClasses, selectClasses, "h-10")}>
          <option value="">همه برندها</option>
          {options.brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status} aria-label="وضعیت" className={cn(inputClasses, selectClasses, "h-10")}>
          <option value="ACTIVE">فعال</option>
          <option value="ARCHIVED">بایگانی‌شده</option>
          <option value="ALL">همه</option>
        </select>
        <button type="submit" className="h-10 bg-ink px-4 text-sm font-medium text-bone hover:bg-graphite">
          اعمال
        </button>
      </Form>

      {result.rows.length === 0 ? (
        <EmptyState icon={<Package className="h-5 w-5" />} title="کالایی پیدا نشد" description="فیلترها را تغییر دهید یا کالای جدیدی بسازید." />
      ) : (
        <div className={t.wrap}>
          <table className={t.table}>
            <thead className={t.thead}>
              <tr>
                <th className={t.th}>کالا</th>
                <th className={t.th}>دسته / برند</th>
                <th className={cn(t.th, "text-end")}>قیمت</th>
                <th className={cn(t.th, "text-end")}>موجود آزاد</th>
                <th className={t.th}>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((p) => (
                <tr key={p.id} className={t.tr}>
                  <td className={t.td}>
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 hover:text-ember-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageSrc(p.images[0], p.category.illustration)} alt="" className="h-10 w-12 shrink-0 bg-[#f5f3ee] object-contain p-0.5" />
                      <span className="min-w-0">
                        <span className="block font-medium">{p.name}</span>
                        <span className="ltr block text-end text-[12px] text-steel-500">{p.sku}</span>
                      </span>
                    </Link>
                  </td>
                  <td className={cn(t.td, "text-[13px]")}>
                    {p.category.name}
                    <span className="ltr block text-end text-[12px] text-steel-500">{p.brand.name}</span>
                  </td>
                  <td className={cn(t.td, "type-data whitespace-nowrap text-end")}>{formatMoney(p.price)}</td>
                  <td className={cn(t.td, "type-data text-end font-semibold", p.isLow && "text-warn")}>
                    {faNumber(p.available)}
                    <span className="block text-[11.5px] font-normal text-steel-500">از {faNumber(p.onHand)} فیزیکی</span>
                  </td>
                  <td className={t.td}>
                    {p.status === "ARCHIVED" ? <Badge tone="muted">بایگانی</Badge> : p.isLow ? <Badge tone="progress">کمبود</Badge> : <Badge tone="success">فعال</Badge>}
                    {p.isFeatured ? <span className="ms-2 text-[11.5px] text-ember-700">منتخب</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination className="mt-6" pathname="/admin/products" params={params} page={result.page} pageCount={result.pageCount} total={result.total} pageSize={result.pageSize} label="کالا" />
    </>
  );
}
