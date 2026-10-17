import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Boxes, History, Search } from "lucide-react";
import { PageTitle } from "@/components/admin/page-title";
import { StockAdjustDialog } from "@/components/admin/stock-adjust-dialog";
import { Badge } from "@/components/ui/badges";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { inputClasses, selectClasses, tableClasses as t } from "@/components/ui/styles";
import { faNumber } from "@/lib/digits";
import { formatDateTime } from "@/lib/format";
import { cn, firstParam, toPositiveInt } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";
import { listInventory } from "@/server/modules/inventory/service";
import { getCatalogueOptions } from "@/server/modules/products/queries";

export const metadata: Metadata = { title: "موجودی انبار" };

export default async function InventoryPage(props: PageProps<"/admin/inventory">) {
  const actor = await requirePagePermission("inventory.view", "/admin/inventory");
  const params = await props.searchParams;
  const q = firstParam(params.q) ?? "";
  const stock = (firstParam(params.stock) as "low" | "out" | "all" | undefined) ?? "all";
  const categoryId = firstParam(params.category) ?? "";
  const [result, options] = await Promise.all([
    listInventory(actor, { q: q || undefined, stock, categoryId: categoryId || undefined, page: toPositiveInt(firstParam(params.page), 1), pageSize: 30 }),
    getCatalogueOptions(),
  ]);
  const canAdjust = actor.permissions.has("inventory.adjust");

  return (
    <>
      <PageTitle
        eyebrow="انبار"
        title="موجودی انبار"
        description="موجود آزاد = موجودی فیزیکی منهای اقلام رزروشده برای سفارش‌های باز. هر تغییر موجودی با علت و نام کاربر در گردش کالا ثبت می‌شود."
        actions={
          <Link href="/admin/inventory/movements" className="inline-flex h-10 items-center gap-2 border border-line px-4 text-[13.5px] hover:border-ink">
            <History className="h-4 w-4" aria-hidden /> گردش کالا
          </Link>
        }
      />
      <Form action="/admin/inventory" className="mb-5 grid gap-3 border border-line bg-white p-4 md:grid-cols-[1.5fr_1fr_1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" aria-hidden />
          <input name="q" type="search" defaultValue={q} placeholder="نام، کد کالا یا محل قفسه" aria-label="جستجو" className={cn(inputClasses, "h-10 ps-9")} />
        </div>
        <select name="stock" defaultValue={stock} aria-label="وضعیت موجودی" className={cn(inputClasses, selectClasses, "h-10")}>
          <option value="all">همه کالاها</option>
          <option value="low">کمبود موجودی</option>
          <option value="out">ناموجود</option>
        </select>
        <select name="category" defaultValue={categoryId} aria-label="دسته‌بندی" className={cn(inputClasses, selectClasses, "h-10")}>
          <option value="">همه دسته‌ها</option>
          {options.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className="h-10 bg-ink px-4 text-sm font-medium text-bone hover:bg-graphite">
          اعمال
        </button>
      </Form>

      {result.rows.length === 0 ? (
        <EmptyState icon={<Boxes className="h-5 w-5" />} title="کالایی با این فیلتر نیست" description={stock !== "all" ? "همه کالاها بالاتر از حد هشدار هستند." : "عبارت جستجو را تغییر دهید."} />
      ) : (
        <div className={t.wrap}>
          <table className={t.table}>
            <thead className={t.thead}>
              <tr>
                <th className={t.th}>کالا</th>
                <th className={t.th}>قفسه</th>
                <th className={cn(t.th, "text-end")}>فیزیکی</th>
                <th className={cn(t.th, "text-end")}>رزروشده</th>
                <th className={cn(t.th, "text-end")}>آزاد</th>
                <th className={t.th}>وضعیت</th>
                {canAdjust ? (
                  <th className={t.th}>
                    <span className="sr-only">عملیات</span>
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((r) => (
                <tr key={r.productId} className={t.tr}>
                  <td className={t.td}>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-[12px] text-steel-500">
                      <span className="ltr">{r.sku}</span> · {r.category}
                      {r.updatedAt ? ` · ${formatDateTime(r.updatedAt)}` : ""}
                    </p>
                  </td>
                  <td className={cn(t.td, "ltr text-end text-[13px]")}>{r.binLocation ?? "—"}</td>
                  <td className={cn(t.td, "type-data text-end")}>{faNumber(r.onHand)}</td>
                  <td className={cn(t.td, "type-data text-end text-steel-600")}>{faNumber(r.reserved)}</td>
                  <td className={cn(t.td, "type-data text-end text-[15px] font-bold", r.available <= 0 ? "text-danger" : r.isLow ? "text-warn" : "")}>{faNumber(r.available)}</td>
                  <td className={t.td}>
                    {r.status === "ARCHIVED" ? (
                      <Badge tone="muted">بایگانی</Badge>
                    ) : r.available <= 0 ? (
                      <Badge tone="danger">ناموجود</Badge>
                    ) : r.isLow ? (
                      <Badge tone="progress">کمتر از {faNumber(r.lowStockThreshold)}</Badge>
                    ) : (
                      <Badge tone="success">کافی</Badge>
                    )}
                  </td>
                  {canAdjust ? (
                    <td className={cn(t.td, "text-end")}>
                      <StockAdjustDialog product={{ id: r.productId, sku: r.sku, name: r.name, onHand: r.onHand, reserved: r.reserved }} />
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination className="mt-6" pathname="/admin/inventory" params={params} page={result.page} pageCount={result.pageCount} total={result.total} pageSize={result.pageSize} label="کالا" />
    </>
  );
}
