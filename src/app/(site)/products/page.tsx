import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogView, CatalogViewSkeleton } from "@/components/catalog/catalog-view";
import { PageHeader } from "@/components/site/page-header";
import { Container } from "@/components/site/section";

export const metadata: Metadata = {
  title: "کاتالوگ قطعات",
  description: "قطعات موتور، ترمز، فیلتر، جلوبندی، گیربکس، خنک‌کاری و برق خودرو با قیمت همکار و موجودی لحظه‌ای.",
};

export default function ProductsPage(props: PageProps<"/products">) {
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "خانه" }, { label: "کاتالوگ" }]}
        eyebrow="کاتالوگ قطعات"
        title="همه قطعات، یک‌جا."
        description="قیمت‌ها برای همکاران و بدون مالیات بر ارزش افزوده است. موجودی نمایش‌داده‌شده برابر موجودی انبار منهای اقلام رزروشده برای سفارش‌های باز است."
      />
      <Container className="py-10 md:py-14">
        <Suspense fallback={<CatalogViewSkeleton />}>
          <Results searchParams={props.searchParams} />
        </Suspense>
      </Container>
    </>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/products">["searchParams"] }) {
  return <CatalogView params={await searchParams} pathname="/products" />;
}
