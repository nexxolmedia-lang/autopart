/**
 * Stock primitives. Every function here must be called inside a transaction.
 *
 * Strategy
 *   physical  = Inventory.onHand   (what is on the shelves)
 *   reserved  = Inventory.reserved (promised to submitted, not yet dispatched orders)
 *   available = onHand - reserved  (what can still be promised)
 *
 *   submit / quantity increase → reserved += q   (conditional, atomic)
 *   reject / cancel / decrease → reserved -= q
 *   dispatch                   → onHand -= q AND reserved -= q (+ DISPATCH movement)
 *
 * Over-selling is prevented by a single conditional UPDATE:
 *     UPDATE "Inventory" SET reserved = reserved + q
 *     WHERE "productId" = $1 AND "onHand" - reserved >= q
 * PostgreSQL takes a row lock for the UPDATE and, under READ COMMITTED,
 * re-evaluates the WHERE clause against the latest committed row after any
 * concurrent writer commits — so two visitors racing for the last units cannot
 * both succeed. CHECK constraints (reserved <= onHand, both >= 0) back this up.
 *
 * Callers lock rows in a deterministic order (sorted product ids) to avoid
 * deadlocks between multi-line orders.
 */
import type { MovementType } from "@prisma/client";
import type { Tx } from "@/server/db";
import { ConflictError, InsufficientStockError, type StockShortage } from "@/server/errors";

export type StockLine = { productId: string; quantity: number };

export function sortLines<T extends { productId: string }>(lines: readonly T[]): T[] {
  return [...lines].sort((a, b) => (a.productId < b.productId ? -1 : a.productId > b.productId ? 1 : 0));
}

/** Reserve stock for every line, or throw InsufficientStockError listing every shortage. */
export async function reserveStock(tx: Tx, lines: readonly StockLine[]): Promise<void> {
  const shortages: StockLine[] = [];
  for (const line of sortLines(lines)) {
    if (line.quantity <= 0) continue;
    const updated = await tx.$executeRaw`
      UPDATE "Inventory"
         SET "reserved" = "reserved" + ${line.quantity}, "updatedAt" = NOW()
       WHERE "productId" = ${line.productId}
         AND "onHand" - "reserved" >= ${line.quantity}`;
    if (updated === 0) shortages.push(line);
  }
  if (shortages.length > 0) throw new InsufficientStockError(await describeShortages(tx, shortages));
}

async function describeShortages(tx: Tx, lines: StockLine[]): Promise<StockShortage[]> {
  const products = await tx.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) } },
    select: { id: true, sku: true, name: true, inventory: { select: { onHand: true, reserved: true } } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  return lines.map((line) => {
    const product = byId.get(line.productId);
    const available = product?.inventory ? Math.max(0, product.inventory.onHand - product.inventory.reserved) : 0;
    return {
      productId: line.productId,
      sku: product?.sku ?? "—",
      name: product?.name ?? "کالای نامشخص",
      requested: line.quantity,
      available,
    };
  });
}

/** Return previously reserved units to the available pool. */
export async function releaseStock(tx: Tx, lines: readonly StockLine[]): Promise<void> {
  for (const line of sortLines(lines)) {
    if (line.quantity <= 0) continue;
    const updated = await tx.$executeRaw`
      UPDATE "Inventory"
         SET "reserved" = "reserved" - ${line.quantity}, "updatedAt" = NOW()
       WHERE "productId" = ${line.productId}
         AND "reserved" >= ${line.quantity}`;
    if (updated === 0) {
      // Indicates a bookkeeping bug — refuse rather than silently corrupt stock.
      throw new ConflictError("سوابق رزرو موجودی ناسازگار است و عملیات انجام نشد.");
    }
  }
}

export type ConsumeLine = StockLine & { reason: string; reference: string; orderId: string; userId: string | null };

/**
 * Goods physically leave the warehouse: decrement both on-hand and reserved,
 * and write an auditable DISPATCH movement for each line.
 */
export async function consumeReservedStock(tx: Tx, lines: readonly ConsumeLine[]): Promise<void> {
  for (const line of sortLines(lines)) {
    if (line.quantity <= 0) continue;
    const rows = await tx.$queryRaw<{ onHand: number }[]>`
      UPDATE "Inventory"
         SET "onHand" = "onHand" - ${line.quantity},
             "reserved" = "reserved" - ${line.quantity},
             "updatedAt" = NOW()
       WHERE "productId" = ${line.productId}
         AND "reserved" >= ${line.quantity}
         AND "onHand" >= ${line.quantity}
   RETURNING "onHand"`;
    const after = rows[0]?.onHand;
    if (after === undefined) {
      throw new ConflictError("سوابق رزرو موجودی ناسازگار است و ارسال ثبت نشد.");
    }
    await tx.inventoryMovement.create({
      data: {
        productId: line.productId,
        type: "DISPATCH",
        quantityBefore: after + line.quantity,
        quantityChange: -line.quantity,
        quantityAfter: after,
        reason: line.reason,
        reference: line.reference,
        orderId: line.orderId,
        userId: line.userId,
      },
    });
  }
}

/** Lock an inventory row for a read-modify-write adjustment. */
export async function lockInventoryRow(
  tx: Tx,
  productId: string,
): Promise<{ onHand: number; reserved: number } | null> {
  const rows = await tx.$queryRaw<{ onHand: number; reserved: number }[]>`
    SELECT "onHand", "reserved" FROM "Inventory" WHERE "productId" = ${productId} FOR UPDATE`;
  return rows[0] ?? null;
}

export async function writePhysicalChange(
  tx: Tx,
  input: {
    productId: string;
    type: MovementType;
    before: number;
    after: number;
    reason: string;
    reference?: string | null;
    userId: string | null;
    orderId?: string | null;
  },
): Promise<void> {
  await tx.inventory.update({ where: { productId: input.productId }, data: { onHand: input.after } });
  await tx.inventoryMovement.create({
    data: {
      productId: input.productId,
      type: input.type,
      quantityBefore: input.before,
      quantityChange: input.after - input.before,
      quantityAfter: input.after,
      reason: input.reason,
      reference: input.reference ?? null,
      userId: input.userId,
      orderId: input.orderId ?? null,
    },
  });
}
