import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/page-title";
import { TaxonomyDialog } from "@/components/admin/taxonomy-dialog";
import { Badge } from "@/components/ui/badges";
import { tableClasses as t } from "@/components/ui/styles";
import { faNumber } from "@/lib/digits";
import { cn } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";
import { prisma } from "@/server/db";

export const metadata: Metadata = { title: "برندها" };

export default async function BrandsAdminPage() {
  await requirePagePermission("products.manage", "/admin/brands");
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } } });
  return (
    <>
      <PageTitle eyebrow="کاتالوگ" title="برندها" description="برندهای سازنده قطعات. برندهای دارای کالا فقط غیرفعال می‌شوند تا سوابق سفارش‌ها حفظ شود." actions={<TaxonomyDialog kind="brand" />} />
      <div className={t.wrap}>
        <table className={t.table}>
          <thead className={t.thead}>
            <tr>
              <th className={t.th}>برند</th>
              <th className={t.th}>کشور</th>
              <th className={cn(t.th, "text-end")}>کالای فعال</th>
              <th className={t.th}>وضعیت</th>
              <th className={t.th}>
                <span className="sr-only">عملیات</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {brands.map((b) => (
              <tr key={b.id} className={t.tr}>
                <td className={t.td}>
                  <p className="ltr text-end font-semibold">{b.name}</p>
                  <p className="line-clamp-1 max-w-md text-[12px] text-steel-500">{b.description}</p>
                </td>
                <td className={t.td}>{b.country ?? "—"}</td>
                <td className={cn(t.td, "type-data text-end")}>{faNumber(b._count.products)}</td>
                <td className={t.td}>{b.isActive ? <Badge tone="success">فعال</Badge> : <Badge tone="muted">غیرفعال</Badge>}</td>
                <td className={cn(t.td, "text-end")}>
                  <TaxonomyDialog kind="brand" values={{ id: b.id, name: b.name, slug: b.slug, country: b.country, description: b.description, isActive: b.isActive }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
