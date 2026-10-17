import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, PackageSearch, Search } from "lucide-react";
import { ProductGrid, ProductGridSkeleton } from "@/components/catalog/product-card";
import { Container } from "@/components/site/section";
import { EmptyState } from "@/components/ui/empty-state";
import { faNumber } from "@/lib/digits";
import { firstParam } from "@/lib/utils";
import { quickSearch } from "@/server/modules/products/queries";

export const metadata: Metadata = { title: "جستجو", robots: { index: false } };

const SUGGESTIONS = ["لنت ترمز", "پژو ۴۰۵", "فیلتر روغن", "سمند", "KSL-TK-4410", "شمع"];

export default function SearchPage(props: PageProps<"/search">) {
  return (
    <>
      <section className="border-b border-line bg-bone">
        <Container className="py-10 md:py-14">
          <p className="type-eyebrow text-steel-500">جستجو در کاتالوگ</p>
          <Suspense fallback={<SearchForm />}>
            <SearchFormWithQuery searchParams={props.searchParams} />
          </Suspense>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px] text-steel-600">
            <span>پیشنهاد:</span>
            {SUGGESTIONS.map((s) => (
              <Link key={s} href={`/search?q=${encodeURIComponent(s)}`} className="rounded-xs border border-line bg-white px-2.5 py-1 hover:border-ink">
                {s}
              </Link>
            ))}
          </div>
        </Container>
      </section>
      <Container className="py-10 md:py-14">
        <Suspense fallback={<ProductGridSkeleton count={8} />}>
          <Results searchParams={props.searchParams} />
        </Suspense>
      </Container>
    </>
  );
}

function SearchForm({ q }: { q?: string }) {
  return (
    <Form action="/search" className="mt-4 flex max-w-3xl border border-ink bg-white focus-within:ring-2 focus-within:ring-ember/40">
      <Search className="ms-4 h-5 w-5 self-center text-steel-500" aria-hidden />
      <input
        name="q"
        type="search"
        defaultValue={q}
        aria-label="جستجوی قطعه"
        placeholder="نام قطعه، کد کالا، شماره فنی، خودرو یا موتور"
        className="h-14 flex-1 bg-transparent px-3 text-[17px] focus:outline-none"
        autoFocus={!q}
      />
      <button type="submit" className="bg-ink px-6 text-sm font-medium text-bone hover:bg-graphite">
        جستجو
      </button>
    </Form>
  );
}

async function SearchFormWithQuery({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const q = firstParam((await searchParams).q);
  return <SearchForm q={q} />;
}

async function Results({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const q = firstParam((await searchParams).q)?.trim().slice(0, 100) ?? "";
  if (!q) {
    return <EmptyState icon={<Search className="h-5 w-5" />} title="دنبال چه قطعه‌ای هستید؟" description="در همه قطعات، برندها، دسته‌بندی‌ها و خودروهای کاتالوگ جستجو کنید." />;
  }
  const { products, categories, brands } = await quickSearch(q);
  const nothing = products.length === 0 && categories.length === 0 && brands.length === 0;
  if (nothing) {
    return (
      <EmptyState
        icon={<PackageSearch className="h-5 w-5" />}
        title={`نتیجه‌ای برای «${q}» پیدا نشد`}
        description="املای عبارت را بررسی کنید یا با کد کالا جستجو کنید. واحد فروش ما قطعات خارج از فهرست را هم تأمین می‌کند."
        action={
          <Link href={`/contact?topic=availability&part=${encodeURIComponent(q)}`} className="text-sm font-medium underline underline-offset-4">
            استعلام از واحد فروش
          </Link>
        }
      />
    );
  }
  return (
    <div className="space-y-12">
      <h1 className="type-heading text-2xl">
        نتایج جستجوی <span className="text-ember">«{q}»</span>
      </h1>
      {categories.length + brands.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {categories.length > 0 ? (
            <div>
              <h2 className="type-eyebrow border-t border-ink pt-3 text-steel-600">دسته‌بندی‌ها</h2>
              <ul className="mt-2">
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link href={`/categories/${c.slug}`} className="flex items-center justify-between border-b border-line py-3 hover:text-ember">
                      {c.name} <ArrowLeft className="h-4 w-4" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {brands.length > 0 ? (
            <div>
              <h2 className="type-eyebrow border-t border-ink pt-3 text-steel-600">برندها</h2>
              <ul className="mt-2">
                {brands.map((b) => (
                  <li key={b.id}>
                    <Link href={`/products?brand=${b.slug}`} className="flex items-center justify-between border-b border-line py-3 hover:text-ember">
                      {b.name} <ArrowLeft className="h-4 w-4" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
      {products.length > 0 ? (
        <section>
          <div className="flex items-end justify-between border-t border-ink pt-3">
            <h2 className="type-eyebrow text-steel-600">قطعات · {faNumber(products.length)}{products.length === 24 ? "+" : ""}</h2>
            <Link href={`/products?q=${encodeURIComponent(q)}`} className="text-[13px] font-medium hover:text-ember">
              ادامه در کاتالوگ ←
            </Link>
          </div>
          <ProductGrid products={products} className="mt-4" />
        </section>
      ) : null}
    </div>
  );
}
