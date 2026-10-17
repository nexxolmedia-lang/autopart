import type { MovementType, Prisma } from "@prisma/client";
import { z } from "zod";
import { availableQuantity } from "@/lib/availability";
import { faNumber } from "@/lib/digits";
import { assertCan, type Actor } from "@/server/auth/actor";
import { prisma, transaction } from "@/server/db";
import { ConflictError, NotFoundError, ValidationError } from "@/server/errors";
import { parseInput, zx } from "@/server/validation";
import { recordAudit } from "../audit/service";
import { notifyPermissionHolders } from "../notifications/service";
import { lockInventoryRow, writePhysicalChange } from "./stock";

export const ADJUSTMENT_KINDS = {
  RECEIPT: { label: "ورود کالا", hint: "کالای دریافتی از تأمین‌کننده. تعداد دریافت‌شده را وارد کنید." },
  ADJUSTMENT: {
    label: "اصلاح موجودی (±)",
    hint: "اصلاح موجودی بابت خرابی، مفقودی یا کالای پیدا‌شده. برای کسر از موجودی عدد منفی وارد کنید.",
  },
  STOCK_COUNT: { label: "شمارش انبار", hint: "موجودی فیزیکی را برابر عدد شمارش‌شده در قفسه قرار دهید." },
  RETURN: { label: "مرجوعی مشتری", hint: "کالای سالم و قابل فروش که مشتری برگشت داده است." },
} as const satisfies Partial<Record<MovementType, { label: string; hint: string }>>;

export type AdjustmentKind = keyof typeof ADJUSTMENT_KINDS;

export const adjustStockSchema = z
  .object({
    productId: zx.id(),
    kind: z.enum(["RECEIPT", "ADJUSTMENT", "STOCK_COUNT", "RETURN"]),
    quantity: z.coerce.number({ error: "یک عدد صحیح وارد کنید." }).int("یک عدد صحیح وارد کنید.").min(-100_000).max(100_000),
    reason: zx.requiredText(300, "علت"),
    reference: zx.optionalText(80),
  })
  .superRefine((value, ctx) => {
    if ((value.kind === "RECEIPT" || value.kind === "RETURN") && value.quantity <= 0) {
      ctx.addIssue({ code: "custom", path: ["quantity"], message: "تعداد را وارد کنید (بزرگ‌تر از صفر)." });
    }
    if (value.kind === "ADJUSTMENT" && value.quantity === 0) {
      ctx.addIssue({ code: "custom", path: ["quantity"], message: "مقدار اصلاحیه نمی‌تواند صفر باشد." });
    }
    if (value.kind === "STOCK_COUNT" && value.quantity < 0) {
      ctx.addIssue({ code: "custom", path: ["quantity"], message: "تعداد شمارش‌شده نمی‌تواند منفی باشد." });
    }
  });

export type AdjustStockInput = z.input<typeof adjustStockSchema>;

export type AdjustStockResult = { before: number; after: number; reserved: number; available: number };

export async function adjustStock(actor: Actor, input: AdjustStockInput): Promise<AdjustStockResult> {
  assertCan(actor, "inventory.adjust", "شما مجوز تغییر موجودی را ندارید.");
  const data = parseInput(adjustStockSchema, input);

  return transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: data.productId },
      select: { id: true, sku: true, name: true, lowStockThreshold: true },
    });
    if (!product) throw new NotFoundError("کالا یافت نشد.");

    let row = await lockInventoryRow(tx, product.id);
    if (!row) {
      await tx.inventory.create({ data: { productId: product.id } });
      row = await lockInventoryRow(tx, product.id);
    }
    const before = row!.onHand;
    const reserved = row!.reserved;
    const after = data.kind === "STOCK_COUNT" ? data.quantity : before + data.quantity;

    if (after < 0) {
      throw new ValidationError("موجودی نمی‌تواند منفی شود.", {
        quantity: [`موجودی فعلی فقط ${faNumber(before)} عدد است.`],
      });
    }
    if (after < reserved) {
      throw new ConflictError(
        `${faNumber(reserved)} عدد برای سفارش‌های باز رزرو شده است و موجودی فیزیکی نمی‌تواند کمتر از آن شود؛ ابتدا آن سفارش‌ها را اصلاح یا لغو کنید.`,
        { quantity: [`حداقل مقدار مجاز ${faNumber(reserved)} است.`] },
      );
    }
    if (after === before) {
      throw new ValidationError("این تغییر موجودی را عوض نمی‌کند.", {
        quantity: ["مقدار جدید با موجودی فعلی برابر است."],
      });
    }

    await writePhysicalChange(tx, {
      productId: product.id,
      type: data.kind,
      before,
      after,
      reason: data.reason,
      reference: data.reference,
      userId: actor.id,
    });

    await recordAudit(tx, {
      actorId: actor.id,
      action: "inventory.adjusted",
      entityType: "Product",
      entityId: product.id,
      summary: `${ADJUSTMENT_KINDS[data.kind].label}: ${product.sku} از ${faNumber(before)} به ${faNumber(after)}`,
      changes: { kind: data.kind, before, after, change: after - before, reason: data.reason, reference: data.reference ?? null },
      ipAddress: actor.ipAddress,
    });

    const available = availableQuantity(after, reserved);
    const wasAbove = availableQuantity(before, reserved) > product.lowStockThreshold;
    if (wasAbove && available <= product.lowStockThreshold) {
      await notifyPermissionHolders(tx, "inventory.adjust", {
        title: `کمبود موجودی: ${product.sku}`,
        body: `موجودی قابل فروش «${product.name}» به ${faNumber(available)} عدد رسید.`,
        href: `/admin/inventory?q=${encodeURIComponent(product.sku)}`,
      });
    }

    return { before, after, reserved, available };
  });
}

export async function setBinLocation(actor: Actor, productId: string, binLocation: string): Promise<void> {
  assertCan(actor, "inventory.adjust", "شما مجوز تغییر اطلاعات انبار را ندارید.");
  const bin = parseInput(z.string().trim().max(24, "حداکثر ۲۴ نویسه مجاز است.").toUpperCase(), binLocation);
  await transaction(async (tx) => {
    const existing = await tx.inventory.findUnique({ where: { productId } });
    if (!existing) throw new NotFoundError("کالا یافت نشد.");
    await tx.inventory.update({ where: { productId }, data: { binLocation: bin || null } });
    await recordAudit(tx, {
      actorId: actor.id,
      action: "inventory.bin_changed",
      entityType: "Product",
      entityId: productId,
      summary: `محل قفسه از ${existing.binLocation ?? "—"} به ${bin || "—"} تغییر کرد`,
      changes: { binLocation: { from: existing.binLocation, to: bin || null } },
      ipAddress: actor.ipAddress,
    });
  });
}

// ── Queries ──────────────────────────────────────────────────────────────────

export type InventoryFilter = {
  q?: string;
  categoryId?: string;
  stock?: "low" | "out" | "all";
  page?: number;
  pageSize?: number;
};

export type InventoryRow = {
  productId: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  status: "ACTIVE" | "ARCHIVED";
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  binLocation: string | null;
  isLow: boolean;
  updatedAt: Date | null;
};

export async function listInventory(actor: Actor, filter: InventoryFilter = {}) {
  assertCan(actor, "inventory.view");
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, filter.pageSize ?? 25));
  const q = filter.q?.trim();

  // Low / out-of-stock filters compare columns across tables, so resolve ids with SQL first.
  let idFilter: string[] | undefined;
  if (filter.stock === "low" || filter.stock === "out") {
    const rows =
      filter.stock === "out"
        ? await prisma.$queryRaw<{ productId: string }[]>`
            SELECT i."productId" FROM "Inventory" i JOIN "Product" p ON p.id = i."productId"
             WHERE p.status = 'ACTIVE' AND i."onHand" - i."reserved" <= 0`
        : await prisma.$queryRaw<{ productId: string }[]>`
            SELECT i."productId" FROM "Inventory" i JOIN "Product" p ON p.id = i."productId"
             WHERE p.status = 'ACTIVE' AND i."onHand" - i."reserved" <= p."lowStockThreshold"`;
    idFilter = rows.map((r) => r.productId);
  }

  const where: Prisma.ProductWhereInput = {
    ...(idFilter ? { id: { in: idFilter } } : {}),
    ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { inventory: { binLocation: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: [{ status: "asc" }, { sku: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        sku: true,
        name: true,
        status: true,
        lowStockThreshold: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
        inventory: true,
      },
    }),
  ]);

  const rows: InventoryRow[] = products.map((p) => {
    const onHand = p.inventory?.onHand ?? 0;
    const reserved = p.inventory?.reserved ?? 0;
    const available = availableQuantity(onHand, reserved);
    return {
      productId: p.id,
      sku: p.sku,
      name: p.name,
      brand: p.brand.name,
      category: p.category.name,
      status: p.status,
      onHand,
      reserved,
      available,
      lowStockThreshold: p.lowStockThreshold,
      binLocation: p.inventory?.binLocation ?? null,
      isLow: p.status === "ACTIVE" && available <= p.lowStockThreshold,
      updatedAt: p.inventory?.updatedAt ?? null,
    };
  });

  return { rows, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function listLowStock(actor: Actor, limit = 8) {
  assertCan(actor, "inventory.view");
  return prisma.$queryRaw<
    { productId: string; sku: string; name: string; onHand: number; reserved: number; available: number; lowStockThreshold: number; binLocation: string | null }[]
  >`
    SELECT p.id AS "productId", p.sku, p.name, i."onHand", i."reserved",
           (i."onHand" - i."reserved")::int AS available, p."lowStockThreshold", i."binLocation"
      FROM "Inventory" i JOIN "Product" p ON p.id = i."productId"
     WHERE p.status = 'ACTIVE' AND i."onHand" - i."reserved" <= p."lowStockThreshold"
     ORDER BY (i."onHand" - i."reserved") ASC, p.sku ASC
     LIMIT ${limit}`;
}

export async function countLowStock(): Promise<number> {
  const [row] = await prisma.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*)::int AS count FROM "Inventory" i JOIN "Product" p ON p.id = i."productId"
     WHERE p.status = 'ACTIVE' AND i."onHand" - i."reserved" <= p."lowStockThreshold"`;
  return row?.count ?? 0;
}

export type MovementFilter = {
  productId?: string;
  type?: MovementType;
  q?: string;
  page?: number;
  pageSize?: number;
};

export async function listMovements(actor: Actor, filter: MovementFilter = {}) {
  assertCan(actor, "inventory.view");
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, filter.pageSize ?? 30));
  const q = filter.q?.trim();
  const where: Prisma.InventoryMovementWhereInput = {
    ...(filter.productId ? { productId: filter.productId } : {}),
    ...(filter.type ? { type: filter.type } : {}),
    ...(q
      ? {
          OR: [
            { product: { sku: { contains: q, mode: "insensitive" } } },
            { product: { name: { contains: q, mode: "insensitive" } } },
            { reference: { contains: q, mode: "insensitive" } },
            { reason: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.inventoryMovement.count({ where }),
    prisma.inventoryMovement.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        product: { select: { id: true, sku: true, name: true } },
        user: { select: { name: true } },
        order: { select: { id: true, number: true } },
      },
    }),
  ]);
  return { rows, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}
