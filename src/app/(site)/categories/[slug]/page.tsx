import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogView, CatalogViewSkeleton } from "@/components/catalog/catalog-view";
import { PageHeader } from "@/components/site/page-header";
import { Container } from "@/components/site/section";
import { getCategoryBySlug } from "@/server/modules/products/queries";

export async function generateMetadata(props: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const category = await getCategoryBySlug(slug);
  return category ? { title: category.name, description: category.description ?? undefined } : { title: "دسته‌بندی یافت نشد" };
}

export default function CategoryPage(props: PageProps<"/categories/[slug]">) {
  return (
    <Suspense fallback={<CategorySkeleton />}>
      <CategoryContent {...props} />
    </Suspense>
  );
}

async function CategoryContent({ params, searchParams }: PageProps<"/categories/[slug]">) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "خانه" }, { href: "/products", label: "کاتالوگ" }, { label: category.name }]}
        eyebrow="دسته‌بندی"
        title={category.name}
        description={category.description}
        aside={
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/parts/${category.illustration}.svg`} alt="" className="hidden h-36 w-56 rounded-xs bg-[#f5f3ee] object-contain p-3 md:block" />
        }
      />
      <Container className="py-10 md:py-14">
        <CatalogView params={await searchParams} pathname={`/categories/${slug}`} lockedCategory={slug} />
      </Container>
    </>
  );
}

function CategorySkeleton() {
  return (
    <>
      <div className="h-[280px] bg-ink" />
      <Container className="py-10 md:py-14">
        <CatalogViewSkeleton />
      </Container>
    </>
  );
}
