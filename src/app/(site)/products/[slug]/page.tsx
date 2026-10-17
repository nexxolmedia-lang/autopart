import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Info, Phone, ShieldCheck } from "lucide-react";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductImage } from "@/components/catalog/product-image";
import { CopyButton } from "@/components/catalog/copy-button";
import { Breadcrumbs } from "@/components/site/page-header";
import { Container } from "@/components/site/section";
import { AvailabilityLabel } from "@/components/ui/badges";
import { ButtonLink } from "@/components/ui/button";
import { appConfig } from "@/lib/config";
import { faNumber, toPersianDigits } from "@/lib/digits";
import { formatMoney } from "@/lib/money";
import { getPublicProduct } from "@/server/modules/products/queries";

export async function generateMetadata(props: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getPublicProduct(slug);
  if (!product) return { title: "قطعه یافت نشد" };
  return {
    title: `${product.name} · ${product.sku}`,
    description: product.shortDescription ?? product.description.slice(0, 160),
  };
}

export default function ProductPage(props: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={props.params} />
    </Suspense>
  );
}

const AVAILABILITY_COPY = {
  IN_STOCK: "در انبار تهران موجود است و با نوبت بعدی ارسال می‌شود.",
  LIMITED: "تعداد محدودی باقی مانده است. از ویزیتور بخواهید آن را در سفارش رزرو کند.",
  OUT_OF_STOCK: "در حال حاضر ناموجود است. برای زمان تأمین یا قطعه جایگزین با واحد فروش تماس بگیرید.",
} as const;

async function ProductContent({ params }: { params: PageProps<"/products/[slug]">["params"] }) {
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  if (!product) notFound();
  const primary = product.images[0] ?? null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand.name },
    category: product.category.name,
    description: product.description,
    offers: {
      "@type": "Offer",
      priceCurrency: appConfig.currency,
      price: String(product.price),
      availability: product.availability === "OUT_OF_STOCK" ? "https://schema.org/OutOfStock" : product.availability === "LIMITED" ? "https://schema.org/LimitedAvailability" : "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container className="pt-8">
        <Breadcrumbs
          items={[
            { href: "/", label: "خانه" },
            { href: "/products", label: "کاتالوگ" },
            { href: `/categories/${product.category.slug}`, label: product.category.name },
            { label: product.sku },
          ]}
        />
      </Container>
      <Container className="grid gap-10 py-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-12">
        <div>
          <div className="relative border border-line">
            <ProductImage image={primary} illustration={product.category.illustration} alt={primary?.alt ?? product.name} className="aspect-[4/3]" sizes="lg" priority />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between border-t border-line/70 bg-[#f5f3ee]/80 px-4 py-2 backdrop-blur-sm">
              <span className="ltr type-data text-[11px] text-steel-600">DWG · {product.sku}</span>
              <span className="ltr type-data text-[11px] text-steel-600">{product.brand.name.toUpperCase()}</span>
            </div>
          </div>
          {product.images.length > 1 ? (
            <ul className="mt-3 grid grid-cols-4 gap-3">
              {product.images.slice(1, 5).map((img) => (
                <li key={img.id} className="border border-line">
                  <ProductImage image={img} illustration={product.category.illustration} className="aspect-square" sizes="sm" />
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <Link href={`/products?brand=${product.brand.slug}`} className="type-eyebrow text-steel-600 hover:text-ink">
              {product.brand.name}
            </Link>
            <span className="h-3 w-px bg-line" aria-hidden />
            <Link href={`/categories/${product.category.slug}`} className="type-eyebrow text-steel-600 hover:text-ink">
              {product.category.name}
            </Link>
          </div>
          <h1 className="type-display mt-4 text-[clamp(2rem,3.6vw,3rem)] leading-[1.02]">{product.name}</h1>
          <div className="mt-4 flex items-center gap-2">
            <span className="ltr type-data rounded-xs border border-line bg-white px-2 py-1 text-[13px]">{product.sku}</span>
            <CopyButton value={product.sku} label="کپی کد کالا" />
          </div>
          {product.shortDescription ? <p className="mt-6 text-[17px] leading-relaxed text-steel-800">{product.shortDescription}</p> : null}

          <div className="mt-8 border-y border-ink py-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="type-eyebrow text-steel-500">قیمت همکار</p>
                <p className="type-display mt-2 text-4xl">{formatMoney(product.price)}</p>
                <p className="mt-1 text-[12.5px] text-steel-500">هر عدد · بدون مالیات بر ارزش افزوده</p>
              </div>
              <div className="text-end">
                <AvailabilityLabel availability={product.availability} className="text-[15px] font-medium text-ink" />
                <p className="mt-1 max-w-[260px] text-[12.5px] leading-snug text-steel-600">{AVAILABILITY_COPY[product.availability]}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <ButtonLink href={`/contact?topic=availability&part=${encodeURIComponent(product.sku)}`} size="lg">
              استعلام این قطعه <ArrowLeft className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href={`tel:${appConfig.contact.phoneHref}`} size="lg" variant="outline">
              <Phone className="h-4 w-4" aria-hidden /> <span className="ltr">{appConfig.contact.phone}</span>
            </ButtonLink>
          </div>
          <p className="mt-4 flex items-start gap-2 text-[13px] leading-relaxed text-steel-600">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            مشتریان همکار از طریق ویزیتور اتوپارت یا واحد فروش سفارش می‌دهند. موجودی در لحظه ثبت سفارش رزرو می‌شود.
          </p>

          <section className="mt-10" aria-labelledby="specs-title">
            <h2 id="specs-title" className="type-eyebrow text-steel-600">
              مشخصات فنی
            </h2>
            <dl className="mt-3 border-t border-line">
              {product.specs.map((s) => (
                <div key={s.label} className="grid grid-cols-[1fr_1.2fr] gap-4 border-b border-line py-2.5 text-[14px]">
                  <dt className="text-steel-600">{s.label}</dt>
                  <dd className="type-data text-ink">{s.value}</dd>
                </div>
              ))}
              {product.weightGrams ? (
                <div className="grid grid-cols-[1fr_1.2fr] gap-4 border-b border-line py-2.5 text-[14px]">
                  <dt className="text-steel-600">وزن</dt>
                  <dd className="type-data">{faNumber(product.weightGrams / 1000, true)} کیلوگرم</dd>
                </div>
              ) : null}
              {product.oeReferences.length ? (
                <div className="grid grid-cols-[1fr_1.2fr] gap-4 border-b border-line py-2.5 text-[14px]">
                  <dt className="text-steel-600">شماره‌های فنی معادل</dt>
                  <dd className="ltr type-data text-end">{product.oeReferences.join(", ")}</dd>
                </div>
              ) : null}
            </dl>
          </section>
        </div>
      </Container>

      <Container className="grid gap-10 border-t border-line py-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <section aria-labelledby="desc-title">
          <h2 id="desc-title" className="type-heading text-2xl">
            درباره این قطعه
          </h2>
          <p className="mt-4 max-w-prose text-[16px] leading-relaxed text-steel-800">{product.description}</p>
          <p className="mt-6 flex items-start gap-2 rounded-xs border border-line bg-bone/60 p-4 text-[13px] leading-relaxed text-steel-700">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ink" aria-hidden />
            پیش از نصب، سازگاری قطعه را با شماره شاسی (VIN) یا کاتالوگ سازنده خودرو تطبیق دهید. اطلاعات سازگاری این صفحه جنبه راهنما دارد.
          </p>
        </section>
        <section aria-labelledby="fitment-title">
          <h2 id="fitment-title" className="type-heading text-2xl">
            خودروهای سازگار
          </h2>
          {product.fitments.length === 0 ? (
            <p className="mt-4 text-steel-600">عمومی یا وابسته به کاربرد — برای تأیید سازگاری با واحد فروش تماس بگیرید.</p>
          ) : (
            <div className="mt-4 overflow-x-auto border border-line bg-white">
              <table className="w-full min-w-[440px] text-start text-[14px]">
                <thead className="border-b border-line bg-bone/60">
                  <tr>
                    <th scope="col" className="type-eyebrow px-4 py-2.5 font-medium text-steel-600">سازنده</th>
                    <th scope="col" className="type-eyebrow px-4 py-2.5 font-medium text-steel-600">مدل</th>
                    <th scope="col" className="type-eyebrow px-4 py-2.5 font-medium text-steel-600">موتور</th>
                    <th scope="col" className="type-eyebrow px-4 py-2.5 font-medium text-steel-600">سال تولید</th>
                  </tr>
                </thead>
                <tbody>
                  {product.fitments.map((f) => (
                    <tr key={f.id} className="border-b border-line/70 last:border-0">
                      <td className="px-4 py-2.5 font-medium">{f.make}</td>
                      <td className="px-4 py-2.5">{f.model}</td>
                      <td className="type-data px-4 py-2.5 text-[13px]">{f.engine ?? "—"}</td>
                      <td className="type-data px-4 py-2.5 text-[13px]">
                        {toPersianDigits(f.yearFrom - 621)} تا {f.yearTo ? toPersianDigits(f.yearTo - 621) : "اکنون"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </Container>

      {product.related.length > 0 ? (
        <section className="bg-bone py-14" aria-labelledby="related-title">
          <Container>
            <div className="flex items-end justify-between border-t border-ink pt-5">
              <h2 id="related-title" className="type-heading text-2xl">
                سایر قطعات {product.category.name}
              </h2>
              <Link href={`/categories/${product.category.slug}`} className="group inline-flex items-center gap-2 text-sm font-medium">
                مشاهده دسته <ArrowLeft className="h-4 w-4 text-ember transition-transform group-hover:-translate-x-1" aria-hidden />
              </Link>
            </div>
            <ul className="mt-8 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {product.related.map((p) => (
                <li key={p.id} className="flex">
                  <ProductCard product={p} className="w-full" />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}
    </>
  );
}

function ProductSkeleton() {
  return (
    <Container className="grid gap-10 py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-16" aria-busy="true">
      <div className="skeleton aspect-[4/3] rounded-none" />
      <div className="space-y-4">
        <div className="skeleton h-3 w-40" />
        <div className="skeleton h-12 w-4/5" />
        <div className="skeleton h-6 w-32" />
        <div className="skeleton mt-8 h-28 w-full" />
        <div className="skeleton h-48 w-full" />
      </div>
    </Container>
  );
}
