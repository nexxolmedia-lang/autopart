import { faNumber } from "@/lib/digits";
import { formatMoney } from "@/lib/money";
import type { PublicProductCard } from "@/server/modules/products/queries";

/**
 * A static, HTML-rendered preview of the field-sales app — built from the
 * same tokens as the real app, so the marketing site shows the actual product.
 */
export function PhoneMockup({ products }: { products: PublicProductCard[] }) {
  const lines = products.slice(0, 3);
  const qty = [2, 4, 1];
  const total = lines.reduce((sum, p, i) => sum + p.price * (qty[i] ?? 1), 0);
  return (
    <div className="relative mx-auto w-[300px] select-none" aria-hidden>
      <div className="rounded-[44px] border border-white/15 bg-[#050506] p-2.5 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]">
        <div className="relative overflow-hidden rounded-[36px] bg-paper">
          <div className="absolute left-1/2 top-2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-[#050506]" />
          <div className="bg-ink px-4 pb-3 pt-10 text-bone">
            <div className="flex items-center justify-between text-[10px] text-bone/50">
              <span className="type-eyebrow text-[9px]">سفارش جدید</span>
              <span className="flex items-center gap-1 text-[9px]">
                <span className="h-1.5 w-1.5 rounded-full bg-ok" /> موجودی لحظه‌ای
              </span>
            </div>
            <p className="mt-1.5 text-[15px] font-semibold">تعمیرگاه مرکزی پارس</p>
            <p className="text-[10.5px] text-bone/55"><span className="ltr">CUS-00001</span> · تهران</p>
          </div>
          <div className="space-y-px bg-line">
            {lines.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2.5 bg-white px-3 py-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/parts/${p.category.illustration}.svg`} alt="" className="h-9 w-11 bg-[#f5f3ee] object-contain p-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] font-medium leading-tight text-ink">{p.name}</p>
                  <p className="ltr type-data text-end text-[9.5px] text-steel-500">{p.sku}</p>
                  <p className="text-[9.5px] text-ok">{p.availability === "LIMITED" ? "قابل سفارش تا ۴ عدد" : "بیش از ۵۰ عدد موجود"}</p>
                </div>
                <div className="flex items-center border border-line">
                  <span className="flex h-6 w-6 items-center justify-center text-[12px] text-steel-500">−</span>
                  <span className="type-data w-5 text-center text-[11px]">{faNumber(qty[i] ?? 1)}</span>
                  <span className="flex h-6 w-6 items-center justify-center text-[12px]">+</span>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2 px-3 py-3">
            <div className="flex justify-between text-[10.5px] text-steel-600">
              <span>زمان تحویل</span>
              <span className="text-ink">فردا · صبح</span>
            </div>
            <div className="flex justify-between text-[10.5px] text-steel-600">
              <span>توضیحات</span>
              <span className="truncate ps-4 text-ink">قبل از ارسال تماس بگیرید</span>
            </div>
          </div>
          <div className="border-t border-line bg-white px-3 pb-6 pt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[10.5px] text-steel-600">{faNumber(lines.length)} قلم · بدون مالیات</span>
              <span className="type-data text-[15px] font-semibold">{formatMoney(total)}</span>
            </div>
            <div className="mt-2.5 flex h-10 items-center justify-center rounded-[3px] bg-ember text-[12.5px] font-semibold text-ink">ثبت سفارش</div>
          </div>
        </div>
      </div>
    </div>
  );
}
