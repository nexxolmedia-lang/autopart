import type { Metadata } from "next";
import Form from "next/form";
import { Search } from "lucide-react";
import { StockAdjustDialog } from "@/components/admin/stock-adjust-dialog";
import { Pagination } from "@/components/ui/pagination";
import { inputClasses, selectClasses } from "@/components/ui/styles";
import { faNumber } from "@/lib/digits";
import { cn, firstParam, toPositiveInt } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";
import { listInventory } from "@/server/modules/inventory/service";

export const metadata: Metadata = { title: "موجودی انبار" };

export default async function WarehouseInventoryPage(props: PageProps<"/warehouse/inventory">) {
  const actor = await requirePagePermission("inventory.view", "/warehouse/inventory");
  const params = await props.searchParams;
  const q = firstParam(params.q) ?? "";
  const stock = (firstParam(params.stock) as "low" | "out" | "all" | undefined) ?? "all";
  const result = await listInventory(actor, { q: q || undefined, stock, page: toPositiveInt(firstParam(params.page), 1), pageSize: 30 });
  const canAdjust = actor.permissions.has("inventory.adjust");

  return (
    <>
      <h1 className="type-display mb-2 text-[2rem] leading-snug">موجودی انبار</h1>
      <p className="mb-5 text-[14px] text-steel-600">{canAdjust ? "می‌توانید ورود کالا، اصلاح و شمارش موجودی را ثبت کنید." : "دسترسی فقط‌خواندنی. ثبت گردش موجودی نیازمند مجوز سرپرست انبار است."}</p>
      <Form action="/warehouse/inventory" className="mb-5 grid gap-3 md:grid-cols-[1.5fr_1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-steel-500" aria-hidden />
          <input name="q" type="search" defaultValue={q} placeholder="کد کالا، نام یا قفسه" aria-label="جستجو" className={cn(inputClasses, "h-12 ps-10 text-[16px]")} />
        </div>
        <select name="stock" defaultValue={stock} aria-label="وضعیت" className={cn(inputClasses, selectClasses, "h-12")}>
          <option value="all">همه</option>
          <option value="low">کمبود</option>
          <option value="out">ناموجود</option>
        </select>
        <button type="submit" className="h-12 bg-ink px-6 font-medium text-bone">
          جستجو
        </button>
      </Form>
      <ul className="divide-y divide-line border border-line bg-white">
        {result.rows.map((r) => (
          <li key={r.productId} className="flex flex-wrap items-center gap-4 p-4">
            <div className="w-20 shrink-0 text-center">
              <p className="text-[11px] text-steel-500">قفسه</p>
              <p className="ltr type-data text-[16px] font-bold">{r.binLocation ?? "—"}</p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{r.name}</p>
              <p className="text-[12.5px] text-steel-500">
                <span className="ltr">{r.sku}</span> · {r.category}
              </p>
            </div>
            <dl className="flex gap-5 text-center">
              <div>
                <dt className="text-[11px] text-steel-500">فیزیکی</dt>
                <dd className="type-data text-[17px] font-bold">{faNumber(r.onHand)}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-steel-500">رزرو</dt>
                <dd className="type-data text-[17px] text-steel-600">{faNumber(r.reserved)}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-steel-500">آزاد</dt>
                <dd className={cn("type-data text-[17px] font-bold", r.available <= 0 ? "text-danger" : r.isLow ? "text-warn" : "text-ok")}>{faNumber(r.available)}</dd>
              </div>
            </dl>
            {canAdjust ? <StockAdjustDialog product={{ id: r.productId, sku: r.sku, name: r.name, onHand: r.onHand, reserved: r.reserved }} /> : null}
          </li>
        ))}
      </ul>
      <Pagination className="mt-6" pathname="/warehouse/inventory" params={params} page={result.page} pageCount={result.pageCount} total={result.total} pageSize={result.pageSize} label="کالا" />
    </>
  );
}
