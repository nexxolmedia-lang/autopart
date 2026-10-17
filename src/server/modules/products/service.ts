import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { faNumber } from "@/lib/digits";
import { formatMoney } from "@/lib/money";
import { slugify } from "@/lib/utils";
import { assertCan, can, type Actor } from "@/server/auth/actor";
import { transaction, type Tx } from "@/server/db";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/server/errors";
import { parseInput } from "@/server/validation";
import { diff, recordAudit } from "../audit/service";
import {
  brandSchema,
  categorySchema,
  productCreateExtras,
  productSchema,
  type BrandInput,
  type CategoryInput,
  type ProductInput,
} from "./schemas";

function isUniqueViolation(error: unknown, field?: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return false;
  if (!field) return true;
  const target = (error.meta?.target ?? []) as string[] | string;
  return Array.isArray(target) ? target.includes(field) : String(target).includes(field);
}

async function assertCatalogueRefs(tx: Tx, categoryId: string, brandId: string) {
  const [category, brand] = await Promise.all([
    tx.category.findUnique({ where: { id: categoryId }, select: { id: true } }),
    tx.brand.findUnique({ where: { id: brandId }, select: { id: true } }),
  ]);
  const fieldErrors: Record<string, string[]> = {};
  if (!category) fieldErrors.categoryId = ["دسته‌بندی را انتخاب کنید."];
  if (!brand) fieldErrors.brandId = ["برند را انتخاب کنید."];
  if (Object.keys(fieldErrors).length) throw new ValidationError("لطفاً موارد مشخص‌شده را بررسی کنید.", fieldErrors);
}

async function uniqueSlug(tx: Tx, base: string, excludeId?: string): Promise<string> {
  const root = base || "product";
  let candidate = root;
  for (let i = 2; i < 200; i++) {
    const clash = await tx.product.findFirst({ where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } });
    if (!clash) return candidate;
    candidate = `${root}-${i}`;
  }
  throw new ConflictError("ساخت نشانی یکتا برای این کالا ممکن نشد.");
}

export async function createProduct(actor: Actor, input: ProductInput, extras: { initialStock?: number; binLocation?: string } = {}) {
  assertCan(actor, "products.manage", "شما مجوز ایجاد کالا را ندارید.");
  if (!can(actor, "pricing.manage")) throw new ForbiddenError("تعیین قیمت فروش نیازمند مجوز قیمت‌گذاری است.");
  const data = parseInput(productSchema, input);
  const stock = parseInput(productCreateExtras, extras);
  if (stock.initialStock > 0 && !can(actor, "inventory.adjust")) {
    throw new ForbiddenError("ثبت موجودی اولیه نیازمند مجوز انبار است.");
  }

  try {
    return await transaction(async (tx) => {
      await assertCatalogueRefs(tx, data.categoryId, data.brandId);
      const existingSku = await tx.product.findUnique({ where: { sku: data.sku }, select: { id: true } });
      if (existingSku) throw new ConflictError("کالایی با این کد کالا (SKU) وجود دارد.", { sku: ["این کد کالا قبلاً استفاده شده است."] });
      const slug = await uniqueSlug(tx, data.slug ?? slugify(`${data.name} ${data.sku}`));
      const { specs, fitments, ...fields } = data;

      const product = await tx.product.create({
        data: {
          ...fields,
          slug,
          specs: specs as Prisma.InputJsonValue,
          fitments: { create: fitments },
          inventory: { create: { onHand: stock.initialStock, binLocation: stock.binLocation ?? null } },
        },
      });
      if (stock.initialStock > 0) {
        await tx.inventoryMovement.create({
          data: {
            productId: product.id,
            type: "RECEIPT",
            quantityBefore: 0,
            quantityChange: stock.initialStock,
            quantityAfter: stock.initialStock,
            reason: "موجودی اولیه",
            userId: actor.id,
          },
        });
      }
      await recordAudit(tx, {
        actorId: actor.id,
        action: "product.created",
        entityType: "Product",
        entityId: product.id,
        summary: `کالای ${product.sku} با قیمت ${formatMoney(product.price)} ایجاد شد`,
        changes: { sku: product.sku, name: product.name, price: product.price, initialStock: stock.initialStock },
        ipAddress: actor.ipAddress,
      });
      return product;
    });
  } catch (error) {
    if (isUniqueViolation(error, "sku")) throw new ConflictError("کالایی با این کد کالا (SKU) وجود دارد.", { sku: ["این کد کالا قبلاً استفاده شده است."] });
    if (isUniqueViolation(error, "slug")) throw new ConflictError("این نامک (slug) قبلاً استفاده شده است.", { slug: ["نامک دیگری انتخاب کنید."] });
    throw error;
  }
}

export async function updateProduct(actor: Actor, productId: string, input: ProductInput) {
  assertCan(actor, "products.manage", "شما مجوز ویرایش کالا را ندارید.");
  const data = parseInput(productSchema, input);

  try {
    return await transaction(async (tx) => {
      const existing = await tx.product.findUnique({ where: { id: productId }, include: { fitments: true } });
      if (!existing) throw new NotFoundError("کالا یافت نشد.");
      if (data.price !== existing.price && !can(actor, "pricing.manage")) {
        throw new ForbiddenError("شما مجوز تغییر قیمت فروش را ندارید.");
      }
      await assertCatalogueRefs(tx, data.categoryId, data.brandId);
      if (data.sku !== existing.sku) {
        const clash = await tx.product.findUnique({ where: { sku: data.sku }, select: { id: true } });
        if (clash) throw new ConflictError("کالایی با این کد کالا (SKU) وجود دارد.", { sku: ["این کد کالا قبلاً استفاده شده است."] });
      }
      const slug = data.slug && data.slug !== existing.slug ? await uniqueSlug(tx, data.slug, productId) : existing.slug;
      const { specs, fitments, ...fields } = data;

      const before = {
        sku: existing.sku,
        name: existing.name,
        slug: existing.slug,
        shortDescription: existing.shortDescription,
        description: existing.description,
        categoryId: existing.categoryId,
        brandId: existing.brandId,
        price: existing.price,
        oeReferences: existing.oeReferences,
        specs: existing.specs,
        weightGrams: existing.weightGrams,
        lowStockThreshold: existing.lowStockThreshold,
        isFeatured: existing.isFeatured,
        fitments: existing.fitments.map((f) => ({ make: f.make, model: f.model, yearFrom: f.yearFrom, yearTo: f.yearTo ?? undefined, engine: f.engine ?? undefined })),
      };
      const after = {
        ...fields,
        slug,
        shortDescription: fields.shortDescription ?? null,
        weightGrams: fields.weightGrams ?? null,
        specs,
        fitments: fitments.map((f) => ({ make: f.make, model: f.model, yearFrom: f.yearFrom, yearTo: f.yearTo, engine: f.engine })),
      };
      const changes = diff(before as Record<string, unknown>, after as Record<string, unknown>);

      const product = await tx.product.update({
        where: { id: productId },
        data: {
          ...fields,
          slug,
          shortDescription: fields.shortDescription ?? null,
          weightGrams: fields.weightGrams ?? null,
          specs: specs as Prisma.InputJsonValue,
          fitments: { deleteMany: {}, create: fitments },
        },
      });

      if (Object.keys(changes).length > 0) {
        const priceChange = changes.price as { from: number; to: number } | undefined;
        await recordAudit(tx, {
          actorId: actor.id,
          action: priceChange ? "product.price_changed" : "product.updated",
          entityType: "Product",
          entityId: productId,
          summary: priceChange
            ? `قیمت ${product.sku} از ${formatMoney(priceChange.from)} به ${formatMoney(priceChange.to)} تغییر کرد`
            : `کالای ${product.sku} ویرایش شد (${Object.keys(changes).join("، ")})`,
          changes: changes as Prisma.InputJsonValue,
          ipAddress: actor.ipAddress,
        });
      }
      return product;
    });
  } catch (error) {
    if (isUniqueViolation(error, "sku")) throw new ConflictError("کالایی با این کد کالا (SKU) وجود دارد.", { sku: ["این کد کالا قبلاً استفاده شده است."] });
    throw error;
  }
}

/** Archive instead of delete: historical orders keep referencing the product. */
export async function setProductArchived(actor: Actor, productId: string, archived: boolean) {
  assertCan(actor, "products.manage", "شما مجوز بایگانی کالا را ندارید.");
  await transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundError("کالا یافت نشد.");
    const target = archived ? "ARCHIVED" : "ACTIVE";
    if (product.status === target) return;
    await tx.product.update({
      where: { id: productId },
      data: { status: target, archivedAt: archived ? new Date() : null, isFeatured: archived ? false : product.isFeatured },
    });
    await recordAudit(tx, {
      actorId: actor.id,
      action: archived ? "product.archived" : "product.restored",
      entityType: "Product",
      entityId: productId,
      summary: `کالای ${product.sku} ${archived ? "بایگانی شد" : "بازگردانی شد"}`,
      ipAddress: actor.ipAddress,
    });
  });
}

// ── Images ───────────────────────────────────────────────────────────────────

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGES_PER_PRODUCT = 8;

/** Identify an image by its magic bytes — the declared MIME type is not trusted. */
export function sniffImageType(bytes: Uint8Array): "image/png" | "image/jpeg" | "image/webp" | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export async function addProductImage(actor: Actor, productId: string, file: { bytes: Uint8Array; alt?: string }) {
  assertCan(actor, "products.manage", "شما مجوز مدیریت تصاویر کالا را ندارید.");
  if (file.bytes.byteLength === 0) throw new ValidationError("تصویری برای بارگذاری انتخاب کنید.", { image: ["فایلی دریافت نشد."] });
  if (file.bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new ValidationError("حجم تصویر زیاد است.", { image: ["حجم تصویر باید حداکثر ۲ مگابایت باشد."] });
  }
  const mimeType = sniffImageType(file.bytes);
  if (!mimeType) throw new ValidationError("قالب تصویر پشتیبانی نمی‌شود.", { image: ["تصویر PNG، JPEG یا WebP بارگذاری کنید."] });

  return transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId }, include: { _count: { select: { images: true } } } });
    if (!product) throw new NotFoundError("کالا یافت نشد.");
    if (product._count.images >= MAX_IMAGES_PER_PRODUCT) {
      throw new ValidationError("هر کالا حداکثر ۸ تصویر می‌تواند داشته باشد.", { image: ["ابتدا یک تصویر را حذف کنید."] });
    }
    const asset = await tx.imageAsset.create({
      data: {
        mimeType,
        byteSize: file.bytes.byteLength,
        sha256: createHash("sha256").update(file.bytes).digest("hex"),
        data: Buffer.from(file.bytes),
        createdById: actor.id,
      },
      select: { id: true },
    });
    // Uploaded photography goes first; bundled illustrations remain as fall-backs.
    await tx.productImage.updateMany({ where: { productId }, data: { sortOrder: { increment: 1 } } });
    const image = await tx.productImage.create({
      data: { productId, assetId: asset.id, alt: (file.alt?.trim() || product.name).slice(0, 160), sortOrder: 0 },
    });
    await recordAudit(tx, {
      actorId: actor.id,
      action: "product.image_added",
      entityType: "Product",
      entityId: productId,
      summary: `${product.sku}: تصویر بارگذاری شد (${faNumber(Math.round(file.bytes.byteLength / 1024))} کیلوبایت)`,
      ipAddress: actor.ipAddress,
    });
    return image;
  });
}

export async function removeProductImage(actor: Actor, imageId: string) {
  assertCan(actor, "products.manage", "شما مجوز مدیریت تصاویر کالا را ندارید.");
  await transaction(async (tx) => {
    const image = await tx.productImage.findUnique({ where: { id: imageId }, include: { product: { select: { id: true, sku: true } } } });
    if (!image) throw new NotFoundError("تصویر یافت نشد.");
    await tx.productImage.delete({ where: { id: imageId } });
    if (image.assetId) await tx.imageAsset.deleteMany({ where: { id: image.assetId, productImages: { none: {} } } });
    await recordAudit(tx, {
      actorId: actor.id,
      action: "product.image_removed",
      entityType: "Product",
      entityId: image.product.id,
      summary: `${image.product.sku}: تصویر حذف شد`,
      ipAddress: actor.ipAddress,
    });
  });
}

export async function makePrimaryImage(actor: Actor, imageId: string) {
  assertCan(actor, "products.manage", "شما مجوز مدیریت تصاویر کالا را ندارید.");
  await transaction(async (tx) => {
    const image = await tx.productImage.findUnique({ where: { id: imageId } });
    if (!image) throw new NotFoundError("تصویر یافت نشد.");
    const images = await tx.productImage.findMany({ where: { productId: image.productId }, orderBy: { sortOrder: "asc" } });
    const ordered = [image, ...images.filter((i) => i.id !== image.id)];
    for (const [index, img] of ordered.entries()) {
      if (img.sortOrder !== index) await tx.productImage.update({ where: { id: img.id }, data: { sortOrder: index } });
    }
  });
}

// ── Categories & brands ──────────────────────────────────────────────────────

export async function saveCategory(actor: Actor, input: CategoryInput, categoryId?: string) {
  assertCan(actor, "products.manage", "شما مجوز مدیریت دسته‌بندی‌ها را ندارید.");
  const data = parseInput(categorySchema, input);
  // Persian names slugify to an empty string; fall back to a short stable token.
  const slug = data.slug ?? (slugify(data.name) || `c-${Date.now().toString(36)}`);
  try {
    return await transaction(async (tx) => {
      const existing = categoryId ? await tx.category.findUnique({ where: { id: categoryId } }) : null;
      if (categoryId && !existing) throw new NotFoundError("دسته‌بندی یافت نشد.");
      const category = existing
        ? await tx.category.update({ where: { id: existing.id }, data: { ...data, slug } })
        : await tx.category.create({ data: { ...data, slug } });
      await recordAudit(tx, {
        actorId: actor.id,
        action: existing ? "category.updated" : "category.created",
        entityType: "Category",
        entityId: category.id,
        summary: `دسته‌بندی «${category.name}» ${existing ? "ویرایش شد" : "ایجاد شد"}`,
        changes: existing ? (diff(existing as unknown as Record<string, unknown>, { ...data, slug }) as Prisma.InputJsonValue) : { ...data, slug },
        ipAddress: actor.ipAddress,
      });
      return category;
    });
  } catch (error) {
    if (isUniqueViolation(error, "slug")) throw new ConflictError("دسته‌بندی دیگری با این نامک وجود دارد.", { slug: ["نامک دیگری انتخاب کنید."] });
    throw error;
  }
}

export async function saveBrand(actor: Actor, input: BrandInput, brandId?: string) {
  assertCan(actor, "products.manage", "شما مجوز مدیریت برندها را ندارید.");
  const data = parseInput(brandSchema, input);
  // Persian names slugify to an empty string; fall back to a short stable token.
  const slug = data.slug ?? (slugify(data.name) || `c-${Date.now().toString(36)}`);
  try {
    return await transaction(async (tx) => {
      const existing = brandId ? await tx.brand.findUnique({ where: { id: brandId } }) : null;
      if (brandId && !existing) throw new NotFoundError("برند یافت نشد.");
      const brand = existing
        ? await tx.brand.update({ where: { id: existing.id }, data: { ...data, slug } })
        : await tx.brand.create({ data: { ...data, slug } });
      await recordAudit(tx, {
        actorId: actor.id,
        action: existing ? "brand.updated" : "brand.created",
        entityType: "Brand",
        entityId: brand.id,
        summary: `برند «${brand.name}» ${existing ? "ویرایش شد" : "ایجاد شد"}`,
        changes: existing ? (diff(existing as unknown as Record<string, unknown>, { ...data, slug }) as Prisma.InputJsonValue) : { ...data, slug },
        ipAddress: actor.ipAddress,
      });
      return brand;
    });
  } catch (error) {
    if (isUniqueViolation(error, "slug")) throw new ConflictError("برند دیگری با این نامک وجود دارد.", { slug: ["نامک دیگری انتخاب کنید."] });
    throw error;
  }
}
