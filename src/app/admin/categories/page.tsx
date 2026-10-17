import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/page-title";
import { TaxonomyDialog } from "@/components/admin/taxonomy-dialog";
import { Badge } from "@/components/ui/badges";
import { tableClasses as t } from "@/components/ui/styles";
import { faNumber } from "@/lib/digits";
import { cn } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";
import { prisma } from "@/server/db";

export const metadata: Metadata = { title: "دسته‌بندی‌ها" };

export default async function CategoriesPage() {
  await requirePagePermission("products.manage", "/admin/categories");
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } },
  });
  return (
    <>
      <PageTitle eyebrow="کاتالوگ" title="دسته‌بندی‌ها" description="دسته‌بندی‌ها ساختار کاتالوگ و منوی وب‌سایت را تعیین می‌کنند. دسته‌های دارای کالا حذف نمی‌شوند و می‌توانید آن‌ها را غیرفعال کنید." actions={<TaxonomyDialog kind="category" />} />
      <div className={t.wrap}>
        <table className={t.table}>
          <thead className={t.thead}>
            <tr>
              <th className={t.th}>ترتیب</th>
              <th className={t.th}>نام</th>
              <th className={t.th}>نامک</th>
              <th className={cn(t.th, "text-end")}>کالای فعال</th>
              <th className={t.th}>وضعیت</th>
              <th className={t.th}>
                <span className="sr-only">عملیات</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className={t.tr}>
                <td className={cn(t.td, "type-data")}>{faNumber(c.sortOrder)}</td>
                <td className={t.td}>
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/parts/${c.illustration}.svg`} alt="" className="h-9 w-12 bg-[#f5f3ee] object-contain p-0.5" />
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="line-clamp-1 max-w-md text-[12px] text-steel-500">{c.description}</p>
                    </div>
                  </div>
                </td>
                <td className={cn(t.td, "ltr text-end text-[13px] text-steel-600")}>{c.slug}</td>
                <td className={cn(t.td, "type-data text-end")}>{faNumber(c._count.products)}</td>
                <td className={t.td}>{c.isActive ? <Badge tone="success">فعال</Badge> : <Badge tone="muted">غیرفعال</Badge>}</td>
                <td className={cn(t.td, "text-end")}>
                  <TaxonomyDialog kind="category" values={{ id: c.id, name: c.name, slug: c.slug, description: c.description, illustration: c.illustration, sortOrder: c.sortOrder, isActive: c.isActive }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
