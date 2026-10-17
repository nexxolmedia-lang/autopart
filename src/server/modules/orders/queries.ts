import type { OrderStatus, Prisma } from "@prisma/client";
import { AWAITING_REVIEW_STATUSES, ORDER_STATUSES, parseOrderNumber, type OrderStatusKey } from "@/lib/order-workflow";
import { parseIsoDate } from "@/lib/format";
import { can, type Actor } from "@/server/auth/actor";
import { prisma } from "@/server/db";
import { NotFoundError } from "@/server/errors";
import { orderScope, type OrderPanel } from "./scope";

export type OrderListFilter = {
  status?: string;
  q?: string;
  visitorId?: string;
  customerId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  sort?: "newest" | "oldest" | "total_desc" | "delivery";
};

const STATUS_GROUPS: Record<string, OrderStatusKey[]> = {
  awaiting: [...AWAITING_REVIEW_STATUSES],
  open: ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "PREPARING", "READY_FOR_DISPATCH", "DISPATCHED"],
  fulfilment: ["APPROVED", "PREPARING", "READY_FOR_DISPATCH"],
  closed: ["DELIVERED", "REJECTED", "CANCELLED"],
};

export function statusFilter(value: string | undefined): OrderStatus[] | undefined {
  if (!value) return undefined;
  if (STATUS_GROUPS[value]) return STATUS_GROUPS[value] as OrderStatus[];
  const upper = value.toUpperCase();
  return (ORDER_STATUSES as readonly string[]).includes(upper) ? [upper as OrderStatus] : undefined;
}

export async function listOrders(actor: Actor, panel: OrderPanel, filter: OrderListFilter = {}) {
  const scope = orderScope(actor, panel);
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, filter.pageSize ?? 20));
  const q = filter.q?.trim();
  const statuses = statusFilter(filter.status);
  const from = filter.from ? parseIsoDate(filter.from) : null;
  const to = filter.to ? parseIsoDate(filter.to) : null;
  const number = q ? parseOrderNumber(q) : null;

  const where: Prisma.OrderWhereInput = {
    AND: [
      scope,
      statuses ? { status: { in: statuses } } : panel === "admin" ? { status: { not: "DRAFT" } } : {},
      filter.visitorId && panel !== "visitor" ? { visitorId: filter.visitorId } : {},
      filter.customerId ? { customerId: filter.customerId } : {},
      from ? { createdAt: { gte: from } } : {},
      to ? { createdAt: { lt: new Date(to.getTime() + 86_400_000) } } : {},
      q
        ? {
            OR: [
              ...(number ? [{ number }] : []),
              { customerName: { contains: q, mode: "insensitive" as const } },
              { customer: { code: { contains: q, mode: "insensitive" as const } } },
              { items: { some: { sku: { contains: q, mode: "insensitive" as const } } } },
            ],
          }
        : {},
    ],
  };

  const orderBy: Prisma.OrderOrderByWithRelationInput[] =
    filter.sort === "oldest"
      ? [{ createdAt: "asc" }]
      : filter.sort === "total_desc"
        ? [{ total: "desc" }]
        : filter.sort === "delivery"
          ? [{ confirmedDeliveryDate: { sort: "asc", nulls: "last" } }, { requestedDeliveryDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }]
          : [{ createdAt: "desc" }];

  const [total, rows] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        number: true,
        status: true,
        customerName: true,
        total: true,
        currency: true,
        createdAt: true,
        submittedAt: true,
        requestedDeliveryDate: true,
        requestedDeliveryWindow: true,
        confirmedDeliveryDate: true,
        confirmedDeliveryWindow: true,
        visitor: { select: { id: true, name: true } },
        customer: { select: { id: true, code: true, city: true } },
        _count: { select: { items: true } },
        items: { select: { quantity: true, pickedAt: true } },
      },
    }),
  ]);

  return {
    rows: rows.map(({ items, ...row }) => ({
      ...row,
      unitCount: items.reduce((sum, i) => sum + i.quantity, 0),
      pickedLines: items.filter((i) => i.quantity > 0 && i.pickedAt).length,
      pickableLines: items.filter((i) => i.quantity > 0).length,
      // Prices are not part of the warehouse view.
      total: panel === "warehouse" ? null : row.total,
    })),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export type OrderListResult = Awaited<ReturnType<typeof listOrders>>;

/** Full order for the order desk and the visitor app. Internal notes only for staff. */
export async function getOrderDetail(actor: Actor, panel: "admin" | "visitor", orderId: string) {
  const order = await prisma.order.findFirst({
    where: { AND: [{ id: orderId }, orderScope(actor, panel)] },
    include: {
      customer: { select: { id: true, code: true, businessName: true, contactName: true, phone: true, email: true, city: true, addressLine1: true, isActive: true } },
      visitor: { select: { id: true, name: true, email: true, phone: true } },
      approvedBy: { select: { name: true } },
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              price: true,
              status: true,
              lowStockThreshold: true,
              inventory: { select: { onHand: true, reserved: true, binLocation: true } },
              images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, assetId: true, alt: true } },
              category: { select: { illustration: true } },
            },
          },
          reservation: { select: { quantity: true, status: true } },
          pickedBy: { select: { name: true } },
        },
      },
      statusEvents: { orderBy: { createdAt: "asc" }, include: { actor: { select: { name: true } } } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
    },
  });
  if (!order) throw new NotFoundError("سفارش یافت نشد.");

  // Internal notes are staff-only.
  if (panel === "visitor") order.notes = [];

  // Visitors never receive exact stock figures for order lines.
  if (panel === "visitor" || !can(actor, "inventory.view")) {
    for (const item of order.items) {
      const inv = item.product.inventory;
      if (inv) {
        inv.onHand = 0;
        inv.reserved = 0;
        inv.binLocation = null;
      }
    }
  }
  return order;
}

export type OrderDetail = Awaited<ReturnType<typeof getOrderDetail>>;

/** Warehouse view: what to pick and where. No prices, no internal commercial data. */
export async function getWarehouseOrder(actor: Actor, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { AND: [{ id: orderId }, orderScope(actor, "warehouse")] },
    select: {
      id: true,
      number: true,
      status: true,
      version: true,
      customerName: true,
      deliveryAddress: true,
      visitorNote: true,
      requestedDeliveryDate: true,
      requestedDeliveryWindow: true,
      confirmedDeliveryDate: true,
      confirmedDeliveryWindow: true,
      dispatchCarrier: true,
      dispatchReference: true,
      approvedAt: true,
      dispatchedAt: true,
      deliveredAt: true,
      createdAt: true,
      customer: { select: { code: true, contactName: true, phone: true } },
      items: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          sku: true,
          productName: true,
          brandName: true,
          quantity: true,
          pickedAt: true,
          pickedBy: { select: { name: true } },
          product: {
            select: {
              weightGrams: true,
              inventory: { select: { binLocation: true, onHand: true } },
              images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, assetId: true, alt: true } },
              category: { select: { illustration: true } },
            },
          },
        },
      },
      statusEvents: { orderBy: { createdAt: "asc" }, select: { id: true, fromStatus: true, toStatus: true, note: true, createdAt: true, actor: { select: { name: true } } } },
      notes: { orderBy: { createdAt: "desc" }, select: { id: true, body: true, createdAt: true, author: { select: { name: true } } } },
    },
  });
  if (!order) throw new NotFoundError("سفارش یافت نشد.");
  return order;
}

export type WarehouseOrder = Awaited<ReturnType<typeof getWarehouseOrder>>;

export async function countOrdersByStatus(actor: Actor, panel: OrderPanel): Promise<Record<OrderStatusKey, number>> {
  const scope = orderScope(actor, panel);
  const groups = await prisma.order.groupBy({ by: ["status"], where: scope, _count: { _all: true } });
  const counts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatusKey, number>;
  for (const g of groups) counts[g.status] = g._count._all;
  return counts;
}

/** Audit entries attached to one order (order desk view). */
export async function getOrderAuditTrail(actor: Actor, orderId: string) {
  if (!can(actor, "orders.view_all")) return [];
  return prisma.auditLog.findMany({
    where: { entityType: "Order", entityId: orderId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { actor: { select: { name: true } } },
  });
}
