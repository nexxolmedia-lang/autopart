import "server-only";
import { PrismaClient } from "@prisma/client";

/**
 * Money columns are BIGINT (whole rials — order totals easily exceed 2³¹).
 * This extension exposes them as plain JS numbers everywhere (exact up to
 * 9 × 10¹⁵ rials), so the rest of the code never handles `bigint`.
 * Raw SQL and aggregate results bypass the extension and are converted at the
 * call site with `Number(...)`.
 */
const toNumber = (value: bigint | number) => Number(value);

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  }).$extends({
    name: "money-as-number",
    result: {
      product: {
        price: { needs: { price: true }, compute: (p) => toNumber(p.price) },
      },
      order: {
        subtotal: { needs: { subtotal: true }, compute: (o) => toNumber(o.subtotal) },
        discountAmount: { needs: { discountAmount: true }, compute: (o) => toNumber(o.discountAmount) },
        total: { needs: { total: true }, compute: (o) => toNumber(o.total) },
      },
      orderItem: {
        requestedUnitPrice: { needs: { requestedUnitPrice: true }, compute: (i) => toNumber(i.requestedUnitPrice) },
        unitPrice: { needs: { unitPrice: true }, compute: (i) => toNumber(i.unitPrice) },
        lineTotal: { needs: { lineTotal: true }, compute: (i) => toNumber(i.lineTotal) },
      },
    },
  });
}

export type AppPrismaClient = ReturnType<typeof createClient>;

const globalForPrisma = globalThis as unknown as { __autopartPrisma?: AppPrismaClient };

export const prisma: AppPrismaClient = globalForPrisma.__autopartPrisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.__autopartPrisma = prisma;

/** Interactive-transaction client (the extended client minus connection/transaction APIs). */
export type Tx = Omit<AppPrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;
export type Db = AppPrismaClient | Tx;

/** Interactive transaction with sensible limits for request-path work. */
export function transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return prisma.$transaction(fn, { maxWait: 10_000, timeout: 20_000 });
}
