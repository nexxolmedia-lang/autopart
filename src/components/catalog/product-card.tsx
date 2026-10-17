import Link from "next/link";
import { ArrowUpLeft } from "lucide-react";
import { AvailabilityLabel } from "@/components/ui/badges";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { PublicProductCard } from "@/server/modules/products/queries";
import { ProductImage } from "./product-image";

export function ProductCard({ product, className, priority }: { product: PublicProductCard; className?: string; priority?: boolean }) {
  return (
    <article className={cn("group relative flex flex-col bg-white", className)}>
      <ProductImage image={product.image} illustration={product.category.illustration} alt={product.name} className="aspect-[4/3]" priority={priority} />
      <div className="flex flex-1 flex-col gap-3 border-t border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="type-eyebrow truncate text-steel-500">{product.brand.name}</p>
          <p className="ltr type-data shrink-0 text-[11px] text-steel-500">{product.sku}</p>
        </div>
        <h3 className="text-[15px] font-medium leading-snug text-ink">
          <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {product.name}
          </Link>
        </h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div>
            <p className="type-data text-[17px] font-medium text-ink">{formatMoney(product.price)}</p>
            <AvailabilityLabel availability={product.availability} className="mt-1 text-[12px]" />
          </div>
          <span className="flex h-8 w-8 items-center justify-center border border-line text-steel-600 transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-ember">
            <ArrowUpLeft className="h-4 w-4" aria-hidden />
          </span>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, className }: { products: PublicProductCard[]; className?: string }) {
  return (
    <ul className={cn("grid grid-cols-1 gap-px border border-line bg-line min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>
      {products.map((p, i) => (
        <li key={p.id} className="flex">
          <ProductCard product={p} className="w-full" priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-1 gap-px border border-line bg-line min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="در حال بارگذاری کالاها">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="bg-white">
          <div className="skeleton aspect-[4/3] rounded-none" />
          <div className="space-y-3 p-4">
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-4 w-4/5" />
            <div className="skeleton h-5 w-1/4" />
          </div>
        </li>
      ))}
    </ul>
  );
}
