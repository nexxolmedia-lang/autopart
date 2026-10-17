/**
 * Reporting. All figures are computed from live order and inventory data.
 * "Sales" means orders that were approved (and have not been rejected or
 * cancelled) — see SALES_STATUSES. Days are bucketed in the business time zone.
 */
import { Prisma } from "@prisma/client";
import { appConfig } from "@/lib/config";
import { businessToday, parseIsoDate, toIsoDate } from "@/lib/format";
import { ORDER_STATUSES, SALES_STATUSES, type OrderStatusKey } from "@/lib/order-workflow";
import { assertCan, type Actor } from "@/server/auth/actor";
import { prisma } from "@/server/db";
import { ValidationError } from "@/server/errors";

export type DateRange = { from: string; to: string };

const TZ = appConfig.timeZone;
const SALES = Prisma.join([...SALES_STATUSES].map((s) => Prisma.sql`${s}::"OrderStatus"`));

export function resolveRange(input: { from?: string; to?: string }, now = new Date(), defaultDays = 30): DateRange {
  const today = businessToday(now);
  const to = input.to && parseIsoDate(input.to) ? input.to : today;
  const fallbackFrom = toIsoDate(new Date(parseIsoDate(to)!.getTime() - (defaultDays - 1) * 86_400_000));
  const from = input.from && parseIsoDate(input.from) ? input.from : fallbackFrom;
  if (from > to) throw new ValidationError("تاریخ شروع باید قبل از تاریخ پایان باشد.", { from: ["تاریخ شروع باید قبل از تاریخ پایان باشد."] });
  const span = (parseIsoDate(to)!.getTime() - parseIsoDate(from)!.getTime()) / 86_400_000;
  if (span > 731) throw new ValidationError("بازه حداکثر دو سال می‌تواند باشد.", { from: ["بازه بیش از حد طولانی است."] });
  return { from, to };
}

const localDay = Prisma.sql`(o."submittedAt" AT TIME ZONE 'UTC' AT TIME ZONE ${TZ})::date`;
const inRange = (range: DateRange) =>
  Prisma.sql`o."submittedAt" IS NOT NULL AND ${localDay} BETWEEN ${range.from}::date AND ${range.to}::date`;

export async function ordersByDate(actor: Actor, range: DateRange) {
  assertCan(actor, "reports.view");
  const rows = await prisma.$queryRaw<{ day: Date; orders: number; sales_orders: number; sales_rials: bigint | null }[]>`
    SELECT ${localDay} AS day,
           COUNT(*)::int AS orders,
           COUNT(*) FILTER (WHERE o.status IN (${SALES}))::int AS sales_orders,
           SUM(o."total") FILTER (WHERE o.status IN (${SALES})) AS sales_rials
      FROM "Order" o
     WHERE ${inRange(range)}
     GROUP BY day
     ORDER BY day`;
  const byDay = new Map(rows.map((r) => [toIsoDate(r.day), r]));
  const out: { date: string; orders: number; salesOrders: number; sales: number }[] = [];
  for (let t = parseIsoDate(range.from)!.getTime(); t <= parseIsoDate(range.to)!.getTime(); t += 86_400_000) {
    const date = toIsoDate(new Date(t));
    const row = byDay.get(date);
    out.push({ date, orders: row?.orders ?? 0, salesOrders: row?.sales_orders ?? 0, sales: Number(row?.sales_rials ?? 0) });
  }
  return out;
}

export async function ordersByStatus(actor: Actor, range: DateRange) {
  assertCan(actor, "reports.view");
  const rows = await prisma.$queryRaw<{ status: OrderStatusKey; orders: number; total_rials: bigint | null }[]>`
    SELECT o.status, COUNT(*)::int AS orders, SUM(o."total") AS total_rials
      FROM "Order" o
     WHERE ${inRange(range)}
     GROUP BY o.status`;
  const byStatus = new Map(rows.map((r) => [r.status, r]));
  return ORDER_STATUSES.filter((s) => s !== "DRAFT").map((status) => ({
    status,
    orders: byStatus.get(status)?.orders ?? 0,
    total: Number(byStatus.get(status)?.total_rials ?? 0),
  }));
}

export async function salesByProduct(actor: Actor, range: DateRange, limit = 50) {
  assertCan(actor, "reports.view");
  const rows = await prisma.$queryRaw<{ product_id: string; sku: string; name: string; brand: string; units: bigint; orders: number; revenue_rials: bigint }[]>`
    SELECT i."productId" AS product_id, p.sku, p.name, b.name AS brand,
           SUM(i.quantity) AS units, COUNT(DISTINCT o.id)::int AS orders, SUM(i."lineTotal") AS revenue_rials
      FROM "OrderItem" i
      JOIN "Order" o ON o.id = i."orderId"
      JOIN "Product" p ON p.id = i."productId"
      JOIN "Brand" b ON b.id = p."brandId"
     WHERE ${inRange(range)} AND o.status IN (${SALES}) AND i.quantity > 0
     GROUP BY i."productId", p.sku, p.name, b.name
     ORDER BY revenue_rials DESC
     LIMIT ${limit}`;
  return rows.map((r) => ({ productId: r.product_id, sku: r.sku, name: r.name, brand: r.brand, units: Number(r.units), orders: r.orders, revenue: Number(r.revenue_rials) }));
}

export async function salesByCustomer(actor: Actor, range: DateRange, limit = 50) {
  assertCan(actor, "reports.view");
  const rows = await prisma.$queryRaw<{ customer_id: string; code: string; name: string; city: string; orders: number; revenue_rials: bigint; last_order: Date }[]>`
    SELECT c.id AS customer_id, c.code, c."businessName" AS name, c.city,
           COUNT(*)::int AS orders, SUM(o."total") AS revenue_rials, MAX(o."submittedAt") AS last_order
      FROM "Order" o JOIN "Customer" c ON c.id = o."customerId"
     WHERE ${inRange(range)} AND o.status IN (${SALES})
     GROUP BY c.id, c.code, c."businessName", c.city
     ORDER BY revenue_rials DESC
     LIMIT ${limit}`;
  return rows.map((r) => ({ customerId: r.customer_id, code: r.code, name: r.name, city: r.city, orders: r.orders, revenue: Number(r.revenue_rials), lastOrder: r.last_order }));
}

export async function salesByVisitor(actor: Actor, range: DateRange) {
  assertCan(actor, "reports.view");
  const rows = await prisma.$queryRaw<
    { visitor_id: string; name: string; submitted: number; approved: number; rejected: number; revenue_rials: bigint | null; customers: number }[]
  >`
    SELECT u.id AS visitor_id, u.name,
           COUNT(*)::int AS submitted,
           COUNT(*) FILTER (WHERE o.status IN (${SALES}))::int AS approved,
           COUNT(*) FILTER (WHERE o.status = 'REJECTED')::int AS rejected,
           SUM(o."total") FILTER (WHERE o.status IN (${SALES})) AS revenue_rials,
           COUNT(DISTINCT o."customerId")::int AS customers
      FROM "Order" o JOIN "User" u ON u.id = o."visitorId"
     WHERE ${inRange(range)}
     GROUP BY u.id, u.name
     ORDER BY revenue_rials DESC NULLS LAST`;
  return rows.map((r) => {
    const revenue = Number(r.revenue_rials ?? 0);
    return {
      visitorId: r.visitor_id,
      name: r.name,
      submitted: r.submitted,
      approved: r.approved,
      rejected: r.rejected,
      customers: r.customers,
      revenue,
      average: r.approved > 0 ? Math.round(revenue / r.approved) : 0,
    };
  });
}

export async function inventoryLevels(actor: Actor) {
  assertCan(actor, "reports.view");
  const rows = await prisma.$queryRaw<
    { product_id: string; sku: string; name: string; category: string; on_hand: number; reserved: number; threshold: number; price: bigint; bin: string | null }[]
  >`
    SELECT p.id AS product_id, p.sku, p.name, c.name AS category, i."onHand" AS on_hand, i.reserved,
           p."lowStockThreshold" AS threshold, p."price" AS price, i."binLocation" AS bin
      FROM "Product" p JOIN "Inventory" i ON i."productId" = p.id JOIN "Category" c ON c.id = p."categoryId"
     WHERE p.status = 'ACTIVE'
     ORDER BY c."sortOrder", p.sku`;
  return rows.map((r) => {
    const available = Math.max(0, r.on_hand - r.reserved);
    return {
      productId: r.product_id,
      sku: r.sku,
      name: r.name,
      category: r.category,
      onHand: r.on_hand,
      reserved: r.reserved,
      available,
      threshold: r.threshold,
      bin: r.bin,
      isLow: available <= r.threshold,
      stockValue: r.on_hand * Number(r.price),
    };
  });
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function salesSummary(actor: Actor, now = new Date()) {
  assertCan(actor, "reports.view");
  const today = businessToday(now);
  const current = resolveRange({ to: today }, now, 30);
  const prevTo = toIsoDate(new Date(parseIsoDate(current.from)!.getTime() - 86_400_000));
  const previous = resolveRange({ to: prevTo }, now, 30);
  const totals = async (range: DateRange) => {
    const [row] = await prisma.$queryRaw<{ orders: number; revenue_rials: bigint | null }[]>`
      SELECT COUNT(*)::int AS orders, SUM(o."total") AS revenue_rials
        FROM "Order" o WHERE ${inRange(range)} AND o.status IN (${SALES})`;
    return { orders: row?.orders ?? 0, revenue: Number(row?.revenue_rials ?? 0) };
  };
  const [cur, prev] = await Promise.all([totals(current), totals(previous)]);
  return {
    range: current,
    current: cur,
    previous: prev,
    averageOrder: cur.orders ? Math.round(cur.revenue / cur.orders) : 0,
    changePct: prev.revenue > 0 ? ((cur.revenue - prev.revenue) / prev.revenue) * 100 : null,
  };
}

export async function recentActivity(actor: Actor, limit = 10) {
  assertCan(actor, "audit.view");
  return prisma.auditLog.findMany({
    where: { action: { not: "auth.login" } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: { select: { name: true } } },
  });
}

// ── CSV ──────────────────────────────────────────────────────────────────────

/** RFC 4180 CSV with spreadsheet formula-injection protection. */
export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return "";
    let text = String(value);
    if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n") + "\r\n";
}

export const amountToText = (cents: number) => (cents / 100).toFixed(2);
