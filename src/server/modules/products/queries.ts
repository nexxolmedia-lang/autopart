import type { Prisma } from "@prisma/client";
import { availableQuantity, publicAvailability, visitorAvailability, type PublicAvailability, type VisitorAvailability } from "@/lib/availability";
import { assertCan, assertCanAny, can, type Actor } from "@/server/auth/actor";
import { prisma } from "@/server/db";
import { NotFoundError } from "@/server/errors";

export type ImageRef = { url: string | null; assetId: string | null; alt: string };

export type ProductSpec = { label: string; value: string };

export function readSpecs(value: Prisma.JsonValue): ProductSpec[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      const { label, value: v } = entry as Record<string, unknown>;
      if (typeof label === "string" && typeof v === "string") return [{ label, value: v }];
    }
    return [];
  });
}

const cardSelect = {
  id: true,
  slug: true,
  sku: true,
  name: true,
  shortDescription: true,
  price: true,
  lowStockThreshold: true,
  isFeatured: true,
  brand: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true, illustration: true } },
  images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, assetId: true, alt: true } },
  inventory: { select: { onHand: true, reserved: true } },
} satisfies Prisma.ProductSelect;

/** Row shape after the money extension (BIGINT price → number). */
type CardRow = Omit<Prisma.ProductGetPayload<{ select: typeof cardSelect }>, "price"> & { price: number };

export type PublicProductCard = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  shortDescription: string | null;
  price: number;
  brand: { name: string; slug: string };
  category: { name: string; slug: string; illustration: string };
  image: ImageRef | null;
  availability: PublicAvailability;
};

function toPublicCard(row: CardRow): PublicProductCard {
  const available = availableQuantity(row.inventory?.onHand ?? 0, row.inventory?.reserved ?? 0);
  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    shortDescription: row.shortDescription,
    price: row.price,
    brand: row.brand,
    category: row.category,
    image: row.images[0] ?? null,
    // Exact quantities never leave the server for public visitors.
    availability: publicAvailability(available, row.lowStockThreshold),
  };
}

// ── Public catalogue ─────────────────────────────────────────────────────────

export type CatalogSort = "relevance" | "price_asc" | "price_desc" | "name" | "newest";

export type CatalogFilter = {
  q?: string;
  category?: string;
  brands?: string[];
  inStock?: boolean;
  sort?: CatalogSort;
  page?: number;
  pageSize?: number;
};

/** Each whitespace-separated term must match somewhere (name, SKU, OE number, brand, vehicle…). */
export function searchWhere(q: string | undefined): Prisma.ProductWhereInput {
  const terms = (q ?? "")
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .slice(0, 6);
  if (terms.length === 0) return {};
  return {
    AND: terms.map((term) => ({
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { sku: { contains: term, mode: "insensitive" } },
        { oeReferences: { has: term.toUpperCase() } },
        { shortDescription: { contains: term, mode: "insensitive" } },
        { brand: { name: { contains: term, mode: "insensitive" } } },
        { category: { name: { contains: term, mode: "insensitive" } } },
        { fitments: { some: { OR: [{ make: { contains: term, mode: "insensitive" } }, { model: { contains: term, mode: "insensitive" } }, { engine: { contains: term, mode: "insensitive" } }] } } },
      ],
    })),
  };
}

async function inStockProductIds(): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ productId: string }[]>`
    SELECT "productId" FROM "Inventory" WHERE "onHand" - "reserved" > 0`;
  return rows.map((r) => r.productId);
}

export async function searchCatalog(filter: CatalogFilter) {
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.min(48, Math.max(6, filter.pageSize ?? 12));
  const stockIds = filter.inStock ? await inStockProductIds() : null;

  const base: Prisma.ProductWhereInput = {
    AND: [{ status: "ACTIVE" }, searchWhere(filter.q), stockIds ? { id: { in: stockIds } } : {}],
  };
  const categoryWhere: Prisma.ProductWhereInput = filter.category ? { category: { slug: filter.category } } : {};
  const brandWhere: Prisma.ProductWhereInput = filter.brands?.length ? { brand: { slug: { in: filter.brands } } } : {};
  const where: Prisma.ProductWhereInput = { AND: [base, categoryWhere, brandWhere] };

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    filter.sort === "price_asc"
      ? [{ price: "asc" }, { name: "asc" }]
      : filter.sort === "price_desc"
        ? [{ price: "desc" }, { name: "asc" }]
        : filter.sort === "name"
          ? [{ name: "asc" }]
          : filter.sort === "newest"
            ? [{ createdAt: "desc" }]
            : [{ isFeatured: "desc" }, { name: "asc" }];

  // Facet counts: categories ignore the category filter; brands ignore the brand filter.
  const [total, rows, categoryCounts, brandCounts, categories, brands] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize, select: cardSelect }),
    prisma.product.groupBy({ by: ["categoryId"], where: { AND: [base, brandWhere] }, _count: { _all: true } }),
    prisma.product.groupBy({ by: ["brandId"], where: { AND: [base, categoryWhere] }, _count: { _all: true } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, slug: true, name: true } }),
    prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, slug: true, name: true } }),
  ]);

  const catCount = new Map(categoryCounts.map((c) => [c.categoryId, c._count._all]));
  const brandCount = new Map(brandCounts.map((b) => [b.brandId, b._count._all]));

  return {
    items: rows.map(toPublicCard),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    facets: {
      categories: categories.map((c) => ({ slug: c.slug, name: c.name, count: catCount.get(c.id) ?? 0 })),
      brands: brands.map((b) => ({ slug: b.slug, name: b.name, count: brandCount.get(b.id) ?? 0 })),
    },
  };
}

export async function getFeaturedProducts(limit = 8): Promise<PublicProductCard[]> {
  const rows = await prisma.product.findMany({
    where: { status: "ACTIVE", isFeatured: true },
    orderBy: { name: "asc" },
    take: limit,
    select: cardSelect,
  });
  return rows.map(toPublicCard);
}

/** Most-ordered products over the last N days — computed from real order lines. */
export async function getPopularProducts(limit = 8, days = 120): Promise<PublicProductCard[]> {
  const since = new Date(Date.now() - days * 86_400_000);
  const top = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { order: { status: { notIn: ["DRAFT", "CANCELLED", "REJECTED"] }, submittedAt: { gte: since } }, product: { status: "ACTIVE" } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });
  if (top.length === 0) return [];
  const rows = await prisma.product.findMany({ where: { id: { in: top.map((t) => t.productId) } }, select: cardSelect });
  const byId = new Map(rows.map((r) => [r.id, r]));
  return top.flatMap((t) => {
    const row = byId.get(t.productId);
    return row ? [toPublicCard(row)] : [];
  });
}

export async function getCatalogOverview() {
  const [products, brands, categories] = await Promise.all([
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.brand.count({ where: { isActive: true, products: { some: { status: "ACTIVE" } } } }),
    prisma.category.count({ where: { isActive: true } }),
  ]);
  return { products, brands, categories };
}

export async function getCategoriesWithCounts() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } },
  });
  return categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    illustration: c.illustration,
    productCount: c._count.products,
  }));
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findFirst({ where: { slug, isActive: true } });
}

export async function getBrandsWithCounts() {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { products: { where: { status: "ACTIVE" } } } },
      products: { where: { status: "ACTIVE" }, select: { category: { select: { name: true } } }, take: 40 },
    },
  });
  return brands.map((b) => ({
    id: b.id,
    slug: b.slug,
    name: b.name,
    country: b.country,
    description: b.description,
    productCount: b._count.products,
    specialties: [...new Set(b.products.map((p) => p.category.name))].slice(0, 3),
  }));
}

export async function getPublicProduct(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      brand: true,
      category: true,
      images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, assetId: true, alt: true } },
      fitments: { orderBy: [{ make: "asc" }, { model: "asc" }, { yearFrom: "asc" }] },
      inventory: { select: { onHand: true, reserved: true } },
    },
  });
  if (!product) return null;
  const available = availableQuantity(product.inventory?.onHand ?? 0, product.inventory?.reserved ?? 0);
  const related = await prisma.product.findMany({
    where: { status: "ACTIVE", categoryId: product.categoryId, id: { not: product.id } },
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    take: 4,
    select: cardSelect,
  });
  const { inventory: _inventory, ...rest } = product;
  return {
    ...rest,
    specs: readSpecs(product.specs),
    availability: publicAvailability(available, product.lowStockThreshold),
    related: related.map(toPublicCard),
  };
}

export async function quickSearch(q: string) {
  const term = q.trim();
  if (!term) return { products: [], categories: [], brands: [] };
  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({ where: { AND: [{ status: "ACTIVE" }, searchWhere(term)] }, take: 24, orderBy: [{ isFeatured: "desc" }, { name: "asc" }], select: cardSelect }),
    prisma.category.findMany({ where: { isActive: true, name: { contains: term, mode: "insensitive" } }, take: 6 }),
    prisma.brand.findMany({ where: { isActive: true, name: { contains: term, mode: "insensitive" } }, take: 6 }),
  ]);
  return { products: products.map(toPublicCard), categories, brands };
}

// ── Internal catalogue (visitor app / order composer) ────────────────────────

export type OrderableProduct = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  illustration: string;
  image: ImageRef | null;
  price: number;
  specs: ProductSpec[];
  availability: VisitorAvailability;
  /** Exact figures — populated only for actors with inventory.view. */
  stock: { onHand: number; reserved: number; available: number } | null;
};

/**
 * Product search for people placing orders. Visitors receive a capped
 * availability figure; staff with inventory access also get exact numbers.
 */
export async function searchOrderableProducts(
  actor: Actor,
  filter: { q?: string; category?: string; ids?: string[]; page?: number; pageSize?: number },
) {
  assertCanAny(actor, ["orders.create", "orders.review", "inventory.view"]);
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, filter.pageSize ?? 20));
  const where: Prisma.ProductWhereInput = {
    AND: [
      { status: "ACTIVE" },
      searchWhere(filter.q),
      filter.category ? { category: { slug: filter.category } } : {},
      filter.ids ? { id: { in: filter.ids } } : {},
    ],
  };
  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
      skip: filter.ids ? 0 : (page - 1) * pageSize,
      take: filter.ids ? 100 : pageSize,
      select: { ...cardSelect, specs: true },
    }),
  ]);
  const exact = can(actor, "inventory.view");
  const items: OrderableProduct[] = rows.map((row) => {
    const onHand = row.inventory?.onHand ?? 0;
    const reserved = row.inventory?.reserved ?? 0;
    const available = availableQuantity(onHand, reserved);
    return {
      id: row.id,
      slug: row.slug,
      sku: row.sku,
      name: row.name,
      brand: row.brand.name,
      category: row.category.name,
      illustration: row.category.illustration,
      image: row.images[0] ?? null,
      price: row.price,
      specs: readSpecs(row.specs).slice(0, 4),
      availability: visitorAvailability(available, row.lowStockThreshold),
      stock: exact ? { onHand, reserved, available } : null,
    };
  });
  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

// ── Admin catalogue ──────────────────────────────────────────────────────────

export type AdminProductFilter = {
  q?: string;
  category?: string;
  brand?: string;
  status?: "ACTIVE" | "ARCHIVED" | "ALL";
  page?: number;
  pageSize?: number;
};

export async function listProductsAdmin(actor: Actor, filter: AdminProductFilter = {}) {
  assertCanAny(actor, ["products.manage", "inventory.view", "orders.review"]);
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, filter.pageSize ?? 25));
  const where: Prisma.ProductWhereInput = {
    AND: [
      filter.status === "ALL" ? {} : { status: filter.status ?? "ACTIVE" },
      searchWhere(filter.q),
      filter.category ? { categoryId: filter.category } : {},
      filter.brand ? { brandId: filter.brand } : {},
    ],
  };
  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { ...cardSelect, status: true, updatedAt: true },
    }),
  ]);
  return {
    rows: rows.map((r) => {
      const onHand = r.inventory?.onHand ?? 0;
      const reserved = r.inventory?.reserved ?? 0;
      const available = availableQuantity(onHand, reserved);
      return { ...r, onHand, reserved, available, isLow: r.status === "ACTIVE" && available <= r.lowStockThreshold };
    }),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getProductForEdit(actor: Actor, productId: string) {
  assertCan(actor, "products.manage");
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      fitments: { orderBy: [{ make: "asc" }, { model: "asc" }] },
      images: { orderBy: { sortOrder: "asc" } },
      inventory: true,
      brand: true,
      category: true,
      _count: { select: { orderItems: true } },
    },
  });
  if (!product) throw new NotFoundError("کالا یافت نشد.");
  return { ...product, specs: readSpecs(product.specs) };
}

export async function getCatalogueOptions() {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { categories, brands };
}
