import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowUpLeft } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { faNumber, toPersianDigits } from "@/lib/digits";
import { Container } from "@/components/site/section";
import { getBrandsWithCounts } from "@/server/modules/products/queries";

export const metadata: Metadata = { title: "برندها", description: "سازندگان متخصص پشت محصولات اتوپارت." };

export default function BrandsPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "خانه" }, { label: "برندها" }]}
        eyebrow="برندها"
        title="متخصص هر سیستم."
        description="هر گروه کالا در کاتالوگ از سازنده‌ای تأمین می‌شود که کار اصلی‌اش یک سیستم خودرو است."
      />
      <Container className="py-12 md:py-16">
        <Suspense fallback={<div className="skeleton h-96" />}>
          <BrandList />
        </Suspense>
      </Container>
    </>
  );
}

async function BrandList() {
  await connection();
  const brands = await getBrandsWithCounts();
  return (
    <ul className="border-t border-ink">
      {brands.map((b, i) => (
        <li key={b.id} className="border-b border-line">
          <Link href={`/products?brand=${b.slug}`} className="group grid gap-4 py-8 transition-colors hover:bg-white md:grid-cols-[60px_1.1fr_1.4fr_auto] md:items-center md:gap-8 md:px-3">
            <span className="type-data text-[12px] text-steel-400 group-hover:text-ember">{toPersianDigits(String(i + 1).padStart(2, "0"))}</span>
            <div>
              <p className="ltr type-display text-end text-[clamp(1.6rem,3vw,2.4rem)] leading-none">
                {b.name.split(" ")[0]!.toUpperCase()}
              </p>
              <p className="mt-2 text-[13px] text-steel-500">
                <span className="ltr">{b.name}</span> · {b.country}
              </p>
            </div>
            <div>
              <p className="text-[15px] leading-relaxed text-steel-800">{b.description}</p>
              {b.specialties.length ? (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {b.specialties.map((s) => (
                    <li key={s} className="type-eyebrow rounded-xs border border-line px-2 py-1 text-[10px] text-steel-600">
                      {s}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="flex items-center gap-4">
              <span className="type-data text-sm">{faNumber(b.productCount)} قطعه</span>
              <span className="flex h-10 w-10 items-center justify-center border border-line transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-ember">
                <ArrowUpLeft className="h-4 w-4" aria-hidden />
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
