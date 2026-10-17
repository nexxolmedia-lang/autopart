/**
 * Order commands. Every state change:
 *   1. runs inside one database transaction,
 *   2. locks the order row (SELECT … FOR UPDATE) so concurrent actions serialise,
 *   3. validates the transition against `lib/order-workflow` for this actor,
 *   4. applies stock effects through `inventory/stock` primitives,
 *   5. records a status event and an audit entry.
 * Prices and totals are always computed here from catalogue data — never taken
 * from the client.
 */
import { Prisma, type DeliveryWindow, type OrderStatus } from "@prisma/client";
import { calculateLine, calculateTotals, formatMoney } from "@/lib/money";
import {
  EDITABLE_BY_DESK_STATUSES,
  ORDER_ACTION_META,
  ORDER_STATUS_META,
  TERMINAL_STATUSES,
  checkTransition,
  formatOrderNumber,
  type OrderAction,
} from "@/lib/order-workflow";
import { faNumber } from "@/lib/digits";
import { businessToday, parseIsoDate } from "@/lib/format";
import { assertCan, assertCanAny, can, type Actor } from "@/server/auth/actor";
import { prisma, transaction, type Tx } from "@/server/db";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/server/errors";
import { parseInput } from "@/server/validation";
import { recordAudit } from "../audit/service";
import { getAccessibleCustomer } from "../customers/service";
import { consumeReservedStock, releaseStock, reserveStock } from "../inventory/stock";
import { notifyPermissionHolders, notifyUsers } from "../notifications/service";
import { orderScope } from "./scope";
import {
  deliveryArrangementSchema,
  lineAdjustmentSchema,
  orderDraftSchema,
  transitionPayloadSchema,
  type DeliveryArrangementInput,
  type LineAdjustmentInput,
  type OrderDraftInput,
  type TransitionPayload,
} from "./schemas";

export type OrderRef = { id: string; number: number; status: OrderStatus };

const MAX_DELIVERY_DAYS_AHEAD = 180;

function validateDeliveryDate(value: string | undefined, now: Date, field: string): Date | null {
  if (!value) return null;
  const date = parseIsoDate(value);
  if (!date) throw new ValidationError("تاریخ تحویل را بررسی کنید.", { [field]: ["تاریخ معتبر انتخاب کنید."] });
  const today = parseIsoDate(businessToday(now))!;
  if (date < today) throw new ValidationError("تاریخ تحویل را بررسی کنید.", { [field]: ["تاریخ تحویل نمی‌تواند گذشته باشد."] });
  if (date.getTime() - today.getTime() > MAX_DELIVERY_DAYS_AHEAD * 86_400_000) {
    throw new ValidationError("تاریخ تحویل را بررسی کنید.", { [field]: [`تاریخی در ${faNumber(MAX_DELIVERY_DAYS_AHEAD)} روز آینده انتخاب کنید.`] });
  }
  return date;
}

function formatAddress(c: { addressLine1: string; addressLine2: string | null; city: string; region: string | null; postalCode: string | null }) {
  return [c.addressLine1, c.addressLine2, [c.city, c.region].filter(Boolean).join("، "), c.postalCode].filter(Boolean).join("\n");
}

type PricedLine = {
  productId: string;
  productName: string;
  sku: string;
  brandName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  sortOrder: number;
};

/** Load the products for an order and price each line from the live catalogue. */
async function priceLines(tx: Tx, items: { productId: string; quantity: number }[]): Promise<PricedLine[]> {
  const products = await tx.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    select: { id: true, sku: true, name: true, status: true, price: true, brand: { select: { name: true } } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  const fieldErrors: Record<string, string[]> = {};
  const lines = items.map((item, index) => {
    const product = byId.get(item.productId);
    if (!product || product.status !== "ACTIVE") {
      fieldErrors[`items.${index}.productId`] = [
        product ? `«${product.name}» (${product.sku}) دیگر قابل سفارش نیست.` : "این کالا وجود ندارد.",
      ];
      return null;
    }
    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      brandName: product.brand.name,
      quantity: item.quantity,
      unitPrice: product.price,
      lineTotal: calculateLine(product.price, item.quantity).net,
      sortOrder: index,
    };
  });
  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError("برخی از کالاهای این سفارش دیگر قابل سفارش نیستند.", fieldErrors);
  }
  return lines as PricedLine[];
}

async function lockOrder(tx: Tx, actor: Actor, orderId: string) {
  const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "Order" WHERE id = ${orderId} FOR UPDATE`;
  if (locked.length === 0) throw new NotFoundError("سفارش یافت نشد.");
  const order = await tx.order.findFirst({
    where: { AND: [{ id: orderId }, orderScope(actor)] },
    include: {
      items: { orderBy: { sortOrder: "asc" }, include: { reservation: true } },
      reservations: true,
      customer: true,
    },
  });
  // Orders outside the actor's scope are reported as missing, not forbidden (no existence leak).
  if (!order) throw new NotFoundError("سفارش یافت نشد.");
  return order;
}

type LockedOrder = Awaited<ReturnType<typeof lockOrder>>;

function assertVersion(order: { version: number }, expected: number | undefined) {
  if (expected !== undefined && expected !== order.version) {
    throw new ConflictError("این سفارش در همین فاصله توسط کاربر دیگری تغییر کرده است. صفحه را بازخوانی کنید تا آخرین نسخه را ببینید.");
  }
}

async function addStatusEvent(tx: Tx, orderId: string, from: OrderStatus | null, to: OrderStatus, actorId: string, note?: string | null) {
  await tx.orderStatusEvent.create({ data: { orderId, fromStatus: from, toStatus: to, actorId, note: note ?? null } });
}

async function createReservations(tx: Tx, orderId: string, items: { id: string; productId: string; quantity: number }[]) {
  await reserveStock(
    tx,
    items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
  );
  await tx.stockReservation.createMany({
    data: items.map((i) => ({ orderId, orderItemId: i.id, productId: i.productId, quantity: i.quantity })),
  });
}

async function releaseOrderReservations(tx: Tx, order: LockedOrder, now: Date) {
  const active = order.reservations.filter((r) => r.status === "ACTIVE");
  await releaseStock(
    tx,
    active.map((r) => ({ productId: r.productId, quantity: r.quantity })),
  );
  if (active.length) {
    await tx.stockReservation.updateMany({
      where: { orderId: order.id, status: "ACTIVE" },
      data: { status: "RELEASED", releasedAt: now },
    });
  }
}

/** Run a transaction; translate a duplicate idempotency key into the original order. */
async function withIdempotency(actor: Actor, key: string | undefined, fn: () => Promise<OrderRef>): Promise<OrderRef> {
  try {
    return await fn();
  } catch (error) {
    if (key && error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.order.findUnique({ where: { idempotencyKey: key } });
      if (existing && existing.visitorId === actor.id) return { id: existing.id, number: existing.number, status: existing.status };
    }
    throw error;
  }
}

// ── Visitor commands ─────────────────────────────────────────────────────────

/**
 * Create an order for a customer. With `submit: true` stock is reserved
 * atomically and the order goes straight to the order desk; otherwise it is
 * saved as a draft (no reservation).
 */
export async function createOrder(
  actor: Actor,
  input: OrderDraftInput,
  options: { submit: boolean; now?: Date },
): Promise<OrderRef> {
  assertCan(actor, "orders.create", "شما مجوز ثبت سفارش را ندارید.");
  const data = parseInput(orderDraftSchema, input);
  const now = options.now ?? new Date();
  const requestedDate = validateDeliveryDate(data.requestedDeliveryDate, now, "requestedDeliveryDate");

  if (data.idempotencyKey) {
    const existing = await prisma.order.findUnique({ where: { idempotencyKey: data.idempotencyKey } });
    if (existing) {
      if (existing.visitorId !== actor.id) throw new ConflictError("درخواست تکراری است.");
      return { id: existing.id, number: existing.number, status: existing.status };
    }
  }

  return withIdempotency(actor, data.idempotencyKey, () =>
    transaction(async (tx) => {
      const customer = await getAccessibleCustomer(tx, actor, data.customerId);
      if (!customer.isActive) throw new ValidationError("این مشتری بایگانی شده است.", { customerId: ["یک مشتری فعال انتخاب کنید."] });

      const lines = await priceLines(tx, data.items);
      const totals = calculateTotals(lines);
      const status: OrderStatus = options.submit ? "SUBMITTED" : "DRAFT";

      const order = await tx.order.create({
        data: {
          status,
          customerId: customer.id,
          visitorId: actor.id,
          customerName: customer.businessName,
          deliveryAddress: formatAddress(customer),
          ...totals,
          visitorNote: data.visitorNote ?? null,
          requestedDeliveryDate: requestedDate,
          requestedDeliveryWindow: data.requestedDeliveryWindow as DeliveryWindow,
          idempotencyKey: data.idempotencyKey ?? null,
          submittedAt: options.submit ? now : null,
          items: {
            create: lines.map((l) => ({
              productId: l.productId,
              productName: l.productName,
              sku: l.sku,
              brandName: l.brandName,
              requestedQuantity: l.quantity,
              requestedUnitPrice: l.unitPrice,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              lineTotal: l.lineTotal,
              sortOrder: l.sortOrder,
            })),
          },
        },
        include: { items: true },
      });

      if (options.submit) await createReservations(tx, order.id, order.items);

      await addStatusEvent(tx, order.id, null, status, actor.id, options.submit ? "سفارش ثبت شد" : "پیش‌نویس ایجاد شد");
      await recordAudit(tx, {
        actorId: actor.id,
        action: options.submit ? "order.submitted" : "order.draft_created",
        entityType: "Order",
        entityId: order.id,
        summary: `سفارش ${formatOrderNumber(order.number)} برای «${customer.businessName}» ${options.submit ? "ثبت شد" : "به‌صورت پیش‌نویس ذخیره شد"} (${formatMoney(totals.total)})`,
        changes: { lines: lines.map((l) => ({ sku: l.sku, quantity: l.quantity, unitPrice: l.unitPrice })), ...totals },
        ipAddress: actor.ipAddress,
      });
      if (options.submit) await notifySubmitted(tx, actor, order.number, order.id, customer.businessName, totals.total);

      return { id: order.id, number: order.number, status: order.status };
    }),
  );
}

async function notifySubmitted(tx: Tx, actor: Actor, number: number, orderId: string, customerName: string, total: number) {
  await notifyPermissionHolders(
    tx,
    "orders.review",
    {
      title: `سفارش جدید ${formatOrderNumber(number)}`,
      body: `${actor.name} برای «${customerName}» سفارش ثبت کرد · ${formatMoney(total)}`,
      href: `/admin/orders/${orderId}`,
    },
    { excludeUserId: actor.id },
  );
}

/** Replace the contents of a draft; optionally submit it in the same transaction. */
export async function updateDraft(
  actor: Actor,
  orderId: string,
  input: OrderDraftInput,
  options: { submit: boolean; now?: Date },
): Promise<OrderRef> {
  assertCan(actor, "orders.create", "شما مجوز ویرایش سفارش را ندارید.");
  const data = parseInput(orderDraftSchema, input);
  const now = options.now ?? new Date();
  const requestedDate = validateDeliveryDate(data.requestedDeliveryDate, now, "requestedDeliveryDate");

  return transaction(async (tx) => {
    const order = await lockOrder(tx, actor, orderId);
    if (order.visitorId !== actor.id) throw new NotFoundError("سفارش یافت نشد.");
    if (order.status !== "DRAFT") {
      throw new ConflictError("این سفارش قبلاً ثبت شده و دیگر قابل ویرایش نیست. برای تغییرات با میز سفارش تماس بگیرید.");
    }
    const customer = await getAccessibleCustomer(tx, actor, data.customerId);
    if (!customer.isActive) throw new ValidationError("این مشتری بایگانی شده است.", { customerId: ["یک مشتری فعال انتخاب کنید."] });

    const lines = await priceLines(tx, data.items);
    const totals = calculateTotals(lines);

    await tx.orderItem.deleteMany({ where: { orderId } });
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        customerId: customer.id,
        customerName: customer.businessName,
        deliveryAddress: formatAddress(customer),
        ...totals,
        visitorNote: data.visitorNote ?? null,
        requestedDeliveryDate: requestedDate,
        requestedDeliveryWindow: data.requestedDeliveryWindow as DeliveryWindow,
        status: options.submit ? "SUBMITTED" : "DRAFT",
        submittedAt: options.submit ? now : null,
        version: { increment: 1 },
        items: {
          create: lines.map((l) => ({
            productId: l.productId,
            productName: l.productName,
            sku: l.sku,
            brandName: l.brandName,
            requestedQuantity: l.quantity,
            requestedUnitPrice: l.unitPrice,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            lineTotal: l.lineTotal,
            sortOrder: l.sortOrder,
          })),
        },
      },
      include: { items: true },
    });

    if (options.submit) {
      await createReservations(tx, orderId, updated.items);
      await addStatusEvent(tx, orderId, "DRAFT", "SUBMITTED", actor.id, "سفارش ثبت شد");
      await notifySubmitted(tx, actor, updated.number, updated.id, customer.businessName, totals.total);
    }
    await recordAudit(tx, {
      actorId: actor.id,
      action: options.submit ? "order.submitted" : "order.draft_updated",
      entityType: "Order",
      entityId: orderId,
      summary: `سفارش ${formatOrderNumber(updated.number)} ${options.submit ? "ثبت شد" : "(پیش‌نویس) به‌روزرسانی شد"} (${formatMoney(totals.total)})`,
      changes: { lines: lines.map((l) => ({ sku: l.sku, quantity: l.quantity, unitPrice: l.unitPrice })), ...totals },
      ipAddress: actor.ipAddress,
    });
    return { id: updated.id, number: updated.number, status: updated.status };
  });
}

// ── Workflow transitions ─────────────────────────────────────────────────────

export async function transitionOrder(
  actor: Actor,
  orderId: string,
  action: OrderAction,
  payload: TransitionPayload = {},
  options: { now?: Date } = {},
): Promise<OrderRef> {
  const data = parseInput(transitionPayloadSchema, payload);
  const now = options.now ?? new Date();

  return transaction(async (tx) => {
    const order = await lockOrder(tx, actor, orderId);
    assertVersion(order, data.expectedVersion);

    const check = checkTransition(action, order, actor);
    if (!check.allowed) {
      throw check.code === "FORBIDDEN" ? new ForbiddenError(check.message) : new ConflictError(check.message);
    }
    if (check.reasonRequired && !data.reason) {
      throw new ValidationError("لطفاً علت را بنویسید.", { reason: ["برای این اقدام ذکر علت الزامی است."] });
    }

    const from = order.status;
    const to = ORDER_ACTION_META[action].to;
    const number = formatOrderNumber(order.number);
    const update: Prisma.OrderUpdateInput = { status: to, version: { increment: 1 } };
    const auditChanges: Record<string, unknown> = { from, to };

    switch (action) {
      case "submit": {
        // Re-price at submission: the visitor submits against today's prices.
        const lines = await priceLines(
          tx,
          order.items.map((i) => ({ productId: i.productId, quantity: i.requestedQuantity })),
        );
        for (const [index, line] of lines.entries()) {
          const item = order.items[index]!;
          await tx.orderItem.update({
            where: { id: item.id },
            data: {
              productName: line.productName,
              sku: line.sku,
              brandName: line.brandName,
              requestedUnitPrice: line.unitPrice,
              unitPrice: line.unitPrice,
              quantity: line.quantity,
              discountBps: 0,
              lineTotal: line.lineTotal,
            },
          });
        }
        const customer = order.customer;
        if (!customer.isActive) throw new ValidationError("این مشتری بایگانی شده است.", { customerId: ["یک مشتری فعال انتخاب کنید."] });
        Object.assign(update, calculateTotals(lines), {
          submittedAt: now,
          customerName: customer.businessName,
          deliveryAddress: formatAddress(customer),
        });
        await createReservations(
          tx,
          order.id,
          order.items.map((i) => ({ id: i.id, productId: i.productId, quantity: i.requestedQuantity })),
        );
        break;
      }
      case "approve": {
        if (!order.items.some((i) => i.quantity > 0)) {
          throw new ValidationError("برای تأیید، سفارش باید دست‌کم یک قلم با تعداد بیشتر از صفر داشته باشد.");
        }
        Object.assign(update, {
          approvedAt: now,
          approvedBy: { connect: { id: actor.id } },
          confirmedDeliveryDate: order.confirmedDeliveryDate ?? order.requestedDeliveryDate,
          confirmedDeliveryWindow: order.confirmedDeliveryWindow ?? order.requestedDeliveryWindow,
        });
        break;
      }
      case "reject":
        await releaseOrderReservations(tx, order, now);
        Object.assign(update, { rejectionReason: data.reason, closedAt: now });
        auditChanges.reason = data.reason;
        break;
      case "cancel":
        await releaseOrderReservations(tx, order, now);
        Object.assign(update, { cancellationReason: data.reason ?? null, closedAt: now });
        auditChanges.reason = data.reason ?? null;
        break;
      case "mark_ready": {
        const unpicked = order.items.filter((i) => i.quantity > 0 && !i.pickedAt);
        if (unpicked.length > 0) {
          throw new ValidationError(
            `${faNumber(unpicked.length)} قلم هنوز جمع‌آوری نشده است: ${unpicked.map((i) => i.sku).join("، ")}`,
          );
        }
        break;
      }
      case "dispatch": {
        const active = order.reservations.filter((r) => r.status === "ACTIVE");
        const byItem = new Map(order.items.map((i) => [i.id, i]));
        for (const r of active) {
          const item = byItem.get(r.orderItemId);
          if (!item || item.quantity !== r.quantity) {
            throw new ConflictError("مقادیر رزروشده با اقلام سفارش مطابقت ندارد. از میز سفارش بخواهید سفارش را بررسی کند.");
          }
        }
        await consumeReservedStock(
          tx,
          active.map((r) => ({
            productId: r.productId,
            quantity: r.quantity,
            orderId: order.id,
            reference: number,
            reason: `Dispatched to ${order.customerName}`,
            userId: actor.id,
          })),
        );
        if (active.length) {
          await tx.stockReservation.updateMany({
            where: { orderId: order.id, status: "ACTIVE" },
            data: { status: "CONSUMED", consumedAt: now },
          });
        }
        Object.assign(update, {
          dispatchedAt: now,
          dispatchCarrier: data.carrier ?? null,
          dispatchReference: data.reference ?? null,
        });
        auditChanges.carrier = data.carrier ?? null;
        auditChanges.reference = data.reference ?? null;
        break;
      }
      case "deliver":
        Object.assign(update, { deliveredAt: now, closedAt: now });
        break;
      case "start_review":
      case "start_preparing":
        break;
    }

    const updated = await tx.order.update({ where: { id: order.id }, data: update });
    await addStatusEvent(tx, order.id, from, to, actor.id, data.reason ?? (action === "dispatch" ? describeDispatch(data) : null));
    await recordAudit(tx, {
      actorId: actor.id,
      action: `order.${action}`,
      entityType: "Order",
      entityId: order.id,
      summary: `${number}: ${ORDER_STATUS_META[from].label} ← ${ORDER_STATUS_META[to].label}`,
      changes: auditChanges as Prisma.InputJsonValue,
      ipAddress: actor.ipAddress,
    });
    await notifyTransition(tx, actor, order, action, data.reason);

    return { id: updated.id, number: updated.number, status: updated.status };
  });
}

function describeDispatch(data: { carrier?: string; reference?: string }) {
  const parts = [data.carrier, data.reference && `کد رهگیری ${data.reference}`].filter(Boolean);
  return parts.length ? `ارسال با ${parts.join("، ")}` : null;
}

async function notifyTransition(tx: Tx, actor: Actor, order: LockedOrder, action: OrderAction, reason?: string) {
  const number = formatOrderNumber(order.number);
  const visitorHref = `/visitor/orders/${order.id}`;
  switch (action) {
    case "submit":
      await notifySubmitted(tx, actor, order.number, order.id, order.customerName, order.total);
      break;
    case "approve":
      await notifyUsers(tx, [order.visitorId].filter((id) => id !== actor.id), {
        title: `سفارش ${number} تأیید شد`,
        body: `سفارش شما برای «${order.customerName}» تأیید شد.`,
        href: visitorHref,
      });
      await notifyPermissionHolders(tx, "orders.fulfil", {
        title: `سفارش ${number} به انبار ارسال شد`,
        body: `${order.customerName} · ${faNumber(order.items.filter((i) => i.quantity > 0).length)} قلم برای جمع‌آوری`,
        href: `/warehouse/orders/${order.id}`,
      }, { excludeUserId: actor.id });
      break;
    case "reject":
      await notifyUsers(tx, [order.visitorId].filter((id) => id !== actor.id), {
        title: `سفارش ${number} رد شد`,
        body: reason ? `علت: ${reason}` : undefined,
        href: visitorHref,
      });
      break;
    case "cancel":
      if (order.visitorId !== actor.id) {
        await notifyUsers(tx, [order.visitorId], { title: `سفارش ${number} لغو شد`, body: reason ? `علت: ${reason}` : undefined, href: visitorHref });
      } else if (order.status !== "DRAFT") {
        await notifyPermissionHolders(tx, "orders.review", {
          title: `سفارش ${number} توسط ویزیتور پس گرفته شد`,
          body: `${actor.name} سفارش «${order.customerName}» را پس گرفت.`,
          href: `/admin/orders/${order.id}`,
        });
      }
      break;
    case "dispatch":
      await notifyUsers(tx, [order.visitorId].filter((id) => id !== actor.id), {
        title: `سفارش ${number} ارسال شد`,
        body: `سفارش «${order.customerName}» در مسیر تحویل است.`,
        href: visitorHref,
      });
      break;
    case "deliver":
      await notifyUsers(tx, [order.visitorId].filter((id) => id !== actor.id), {
        title: `سفارش ${number} تحویل شد`,
        href: visitorHref,
      });
      break;
    default:
      break;
  }
}

// ── Order desk: adjustments ──────────────────────────────────────────────────

/**
 * Adjust quantities, unit prices or discounts on a submitted order. The
 * visitor's original request stays on each line (`requested*`), reservations
 * are moved by the exact delta, totals are recomputed and every change is
 * audited.
 */
export async function adjustOrderLines(actor: Actor, orderId: string, input: LineAdjustmentInput): Promise<OrderRef> {
  assertCan(actor, "orders.review", "شما مجوز اصلاح سفارش را ندارید.");
  const data = parseInput(lineAdjustmentSchema, input);

  return transaction(async (tx) => {
    const order = await lockOrder(tx, actor, orderId);
    assertVersion(order, data.expectedVersion);
    if (!EDITABLE_BY_DESK_STATUSES.includes(order.status)) {
      throw new ConflictError(`اقلام فقط در وضعیت «ثبت‌شده» یا «در حال بررسی» قابل اصلاح هستند (وضعیت فعلی: ${ORDER_STATUS_META[order.status].label}).`);
    }

    const itemsById = new Map(order.items.map((i) => [i.id, i]));
    const increases: { productId: string; quantity: number }[] = [];
    const decreases: { productId: string; quantity: number }[] = [];
    const lineChanges: Record<string, unknown>[] = [];
    const nextLines = new Map(order.items.map((i) => [i.id, { quantity: i.quantity, unitPrice: i.unitPrice, discountBps: i.discountBps }]));

    for (const change of data.lines) {
      const item = itemsById.get(change.itemId);
      if (!item) throw new ValidationError("A line in this request does not belong to the order.");
      const unitPrice = change.unitPrice ?? item.unitPrice;
      const discountBps = change.discountBps ?? item.discountBps;
      const pricingChanged = unitPrice !== item.unitPrice || discountBps !== item.discountBps;
      if (pricingChanged && !can(actor, "pricing.manage")) {
        throw new ForbiddenError("شما مجوز تغییر قیمت سفارش را ندارید.");
      }
      const delta = change.quantity - item.quantity;
      if (delta > 0) increases.push({ productId: item.productId, quantity: delta });
      if (delta < 0) decreases.push({ productId: item.productId, quantity: -delta });
      if (delta !== 0 || pricingChanged) {
        nextLines.set(item.id, { quantity: change.quantity, unitPrice, discountBps });
        lineChanges.push({
          sku: item.sku,
          quantity: delta !== 0 ? { from: item.quantity, to: change.quantity } : undefined,
          unitPrice: unitPrice !== item.unitPrice ? { from: item.unitPrice, to: unitPrice } : undefined,
          discountBps: discountBps !== item.discountBps ? { from: item.discountBps, to: discountBps } : undefined,
        });
      }
    }

    if (lineChanges.length === 0) {
      throw new ValidationError("تغییری اعمال نشده است.");
    }
    if (![...nextLines.values()].some((l) => l.quantity > 0)) {
      throw new ValidationError("دست‌کم یک قلم باید تعداد بیشتر از صفر داشته باشد؛ در غیر این صورت سفارش را رد یا لغو کنید.");
    }

    // Stock effects: grow reservations atomically (may throw InsufficientStock), shrink the rest.
    await reserveStock(tx, increases);
    await releaseStock(tx, decreases);

    for (const [itemId, line] of nextLines) {
      const item = itemsById.get(itemId)!;
      if (line.quantity === item.quantity && line.unitPrice === item.unitPrice && line.discountBps === item.discountBps) continue;
      await tx.orderItem.update({
        where: { id: itemId },
        data: {
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountBps: line.discountBps,
          lineTotal: calculateLine(line.unitPrice, line.quantity, line.discountBps).net,
        },
      });
      if (item.reservation && line.quantity !== item.quantity) {
        await tx.stockReservation.update({ where: { id: item.reservation.id }, data: { quantity: line.quantity } });
      }
    }

    const totals = calculateTotals([...nextLines.values()]);
    const moveToReview = order.status === "SUBMITTED";
    const updated = await tx.order.update({
      where: { id: orderId },
      data: { ...totals, version: { increment: 1 }, ...(moveToReview ? { status: "UNDER_REVIEW" } : {}) },
    });
    if (moveToReview) await addStatusEvent(tx, orderId, "SUBMITTED", "UNDER_REVIEW", actor.id, "شروع بررسی — اقلام اصلاح شد");
    if (data.note) await tx.orderNote.create({ data: { orderId, authorId: actor.id, body: data.note } });

    await recordAudit(tx, {
      actorId: actor.id,
      action: "order.lines_adjusted",
      entityType: "Order",
      entityId: orderId,
      summary: `${formatOrderNumber(order.number)}: ${faNumber(lineChanges.length)} قلم اصلاح شد؛ جمع از ${formatMoney(order.total)} به ${formatMoney(totals.total)}`,
      changes: JSON.parse(JSON.stringify({ lines: lineChanges, total: { from: order.total, to: totals.total }, note: data.note ?? null })),
      ipAddress: actor.ipAddress,
    });
    if (order.visitorId !== actor.id) {
      await notifyUsers(tx, [order.visitorId], {
        title: `سفارش ${formatOrderNumber(order.number)} توسط میز سفارش اصلاح شد`,
        body: `مبلغ جدید: ${formatMoney(totals.total)}`,
        href: `/visitor/orders/${orderId}`,
      });
    }
    return { id: updated.id, number: updated.number, status: updated.status };
  });
}

export async function updateDeliveryArrangement(actor: Actor, orderId: string, input: DeliveryArrangementInput, options: { now?: Date } = {}) {
  assertCan(actor, "orders.review", "شما مجوز تغییر برنامه تحویل را ندارید.");
  const data = parseInput(deliveryArrangementSchema, input);
  const date = validateDeliveryDate(data.confirmedDeliveryDate, options.now ?? new Date(), "confirmedDeliveryDate");
  return transaction(async (tx) => {
    const order = await lockOrder(tx, actor, orderId);
    assertVersion(order, data.expectedVersion);
    if (TERMINAL_STATUSES.includes(order.status) || order.status === "DISPATCHED" || order.status === "DRAFT") {
      throw new ConflictError("برنامه تحویل این سفارش دیگر قابل تغییر نیست.");
    }
    const changes = {
      confirmedDeliveryDate: { from: order.confirmedDeliveryDate?.toISOString().slice(0, 10) ?? null, to: data.confirmedDeliveryDate ?? null },
      confirmedDeliveryWindow: { from: order.confirmedDeliveryWindow, to: data.confirmedDeliveryWindow ?? null },
    };
    await tx.order.update({
      where: { id: orderId },
      data: { confirmedDeliveryDate: date, confirmedDeliveryWindow: data.confirmedDeliveryWindow ?? null, version: { increment: 1 } },
    });
    await recordAudit(tx, {
      actorId: actor.id,
      action: "order.delivery_updated",
      entityType: "Order",
      entityId: orderId,
      summary: `${formatOrderNumber(order.number)}: برنامه تحویل به‌روزرسانی شد`,
      changes,
      ipAddress: actor.ipAddress,
    });
  });
}

export async function addOrderNote(actor: Actor, orderId: string, body: string) {
  assertCanAny(actor, ["orders.review", "orders.fulfil"], "شما مجوز افزودن یادداشت داخلی را ندارید.");
  const text = body.trim();
  if (!text) throw new ValidationError("ابتدا یادداشت را بنویسید.", { body: ["یادداشت نمی‌تواند خالی باشد."] });
  if (text.length > 2000) throw new ValidationError("یادداشت بیش از حد طولانی است.", { body: ["حداکثر ۲۰۰۰ نویسه مجاز است."] });
  return transaction(async (tx) => {
    const order = await lockOrder(tx, actor, orderId);
    const note = await tx.orderNote.create({ data: { orderId: order.id, authorId: actor.id, body: text } });
    await recordAudit(tx, {
      actorId: actor.id,
      action: "order.note_added",
      entityType: "Order",
      entityId: order.id,
      summary: `${formatOrderNumber(order.number)}: یادداشت داخلی افزوده شد`,
      ipAddress: actor.ipAddress,
    });
    return note;
  });
}

// ── Warehouse ────────────────────────────────────────────────────────────────

export async function setItemPicked(actor: Actor, orderId: string, itemId: string, picked: boolean, options: { now?: Date } = {}) {
  assertCan(actor, "orders.fulfil", "شما مجوز جمع‌آوری سفارش را ندارید.");
  return transaction(async (tx) => {
    const order = await lockOrder(tx, actor, orderId);
    if (order.status !== "PREPARING") {
      throw new ConflictError("اقلام فقط در وضعیت «در حال آماده‌سازی» قابل جمع‌آوری هستند.");
    }
    const item = order.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundError("قلم سفارش یافت نشد.");
    if (item.quantity === 0) throw new ValidationError("این قلم چیزی برای جمع‌آوری ندارد.");
    await tx.orderItem.update({
      where: { id: itemId },
      data: picked ? { pickedAt: options.now ?? new Date(), pickedById: actor.id } : { pickedAt: null, pickedById: null },
    });
    await recordAudit(tx, {
      actorId: actor.id,
      action: picked ? "order.item_picked" : "order.item_unpicked",
      entityType: "Order",
      entityId: order.id,
      summary: `${formatOrderNumber(order.number)}: ${item.sku} × ${faNumber(item.quantity)} ${picked ? "جمع‌آوری شد" : "به فهرست جمع‌آوری برگشت"}`,
      ipAddress: actor.ipAddress,
    });
  });
}
