import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { ArchiveToggle, ImageManager } from "@/components/admin/product-extras";
import { PageTitle, Panel } from "@/components/admin/page-title";
import { Badge } from "@/components/ui/badges";
import { availableQuantity } from "@/lib/availability";
import { faNumber, toPersianDigits } from "@/lib/digits";
import { formatDateTime } from "@/lib/format";
import { firstParam } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";
import { getCatalogueOptions, getProductForEdit } from "@/server/modules/products/queries";
import { updateProductAction } from "../actions";

export const metadata: Metadata = { title: "ویرایش کالا" };

export default async function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  const { id } = await props.params;
  const actor = await requirePagePermission("products.manage", `/admin/products/${id}`);
  const [product, options] = await Promise.all([getProductForEdit(actor, id), getCatalogueOptions()]);
  const created = firstParam((await props.searchParams).created) === "1";
  const onHand = product.inventory?.onHand ?? 0;
  const reserved = product.inventory?.reserved ?? 0;

  return (
    <>
      <PageTitle
        back={{ href: "/admin/products", label: "کالاها" }}
        eyebrow={
          <span className="flex items-center gap-2">
            <span className="ltr">{product.sku}</span>
            {product.status === "ARCHIVED" ? <Badge tone="muted">بایگانی</Badge> : <Badge tone="success">فعال</Badge>}
          </span>
        }
        title={product.name}
        actions={
          <>
            {product.status === "ACTIVE" ? (
              <Link href={`/products/${product.slug}`} target="_blank" className="inline-flex h-10 items-center gap-2 border border-line px-3 text-[13px] hover:border-ink">
                <ExternalLink className="h-4 w-4" aria-hidden /> مشاهده در سایت
              </Link>
            ) : null}
            <ArchiveToggle productId={product.id} archived={product.status === "ARCHIVED"} />
          </>
        }
      />
      {created ? (
        <p role="status" className="mb-6 flex items-center gap-2 border border-ok/30 bg-ok-50 p-3.5 text-[14px] text-ok">
          <CheckCircle2 className="h-4 w-4" aria-hidden /> کالا ایجاد شد. اکنون می‌توانید تصویر اضافه کنید.
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Panel title="اطلاعات کالا">
          <ProductForm
            action={updateProductAction.bind(null, product.id)}
            mode="edit"
            categories={options.categories}
            brands={options.brands}
            canPrice={actor.permissions.has("pricing.manage")}
            canStock={false}
            defaults={{
              sku: product.sku,
              name: product.name,
              slug: product.slug,
              shortDescription: product.shortDescription,
              description: product.description,
              categoryId: product.categoryId,
              brandId: product.brandId,
              price: product.price.toLocaleString("en-US"),
              oeReferences: product.oeReferences,
              specs: product.specs,
              fitments: product.fitments.map((f) => ({
                make: f.make,
                model: f.model,
                yearFrom: String(f.yearFrom - 621),
                yearTo: f.yearTo ? String(f.yearTo - 621) : "",
                engine: f.engine ?? "",
              })),
              weightGrams: product.weightGrams,
              lowStockThreshold: product.lowStockThreshold,
              isFeatured: product.isFeatured,
            }}
          />
        </Panel>
        <aside className="space-y-6">
          <Panel title="تصاویر">
            <ImageManager productId={product.id} images={product.images} illustration={product.category.illustration} />
          </Panel>
          <Panel title="موجودی">
            <dl className="grid grid-cols-3 gap-2 text-center">
              {[
                ["فیزیکی", onHand],
                ["رزروشده", reserved],
                ["آزاد", availableQuantity(onHand, reserved)],
              ].map(([label, value]) => (
                <div key={label as string} className="bg-bone/60 p-3">
                  <dt className="text-[12px] text-steel-600">{label}</dt>
                  <dd className="type-display mt-1 text-xl">{faNumber(value as number)}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[12.5px] text-steel-600">
              قفسه: <span className="ltr">{product.inventory?.binLocation ?? "—"}</span>
            </p>
            {actor.permissions.has("inventory.view") ? (
              <Link href={`/admin/inventory?q=${encodeURIComponent(product.sku)}`} className="mt-3 inline-block text-[13px] font-medium text-steel-700 hover:text-ink">
                ثبت گردش / اصلاح موجودی ←
              </Link>
            ) : null}
          </Panel>
          <Panel title="سوابق">
            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-steel-600">استفاده در سفارش‌ها</dt>
                <dd>{toPersianDigits(product._count.orderItems)} قلم</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-steel-600">آخرین ویرایش</dt>
                <dd>{formatDateTime(product.updatedAt)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-[12px] leading-relaxed text-steel-500">تغییر قیمت فقط روی سفارش‌های جدید اثر دارد؛ قیمت سفارش‌های ثبت‌شده حفظ می‌شود و تغییر در گزارش ممیزی ثبت می‌گردد.</p>
          </Panel>
        </aside>
      </div>
    </>
  );
}
