import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { ConflictError, InsufficientStockError, ValidationError } from "@/server/errors";
import { adjustOrderLines, createOrder, setItemPicked, transitionOrder, updateDraft } from "@/server/modules/orders/service";
import { updateProduct } from "@/server/modules/products/service";
import { createProduct, createWorld, stockOf } from "./helpers";

type World = Awaited<ReturnType<typeof createWorld>>;
let w: World;

beforeAll(async () => {
  w = await createWorld();
});

const product = (onHand: number, price = 2_000_000) => createProduct({ categoryId: w.category.id, brandId: w.brand.id, onHand, price });
const order = (id: string) => prisma.order.findUniqueOrThrow({ where: { id }, include: { items: { orderBy: { sortOrder: "asc" } }, reservations: true, statusEvents: { orderBy: { createdAt: "asc" } } } });

describe("order creation", () => {
  it("submits an order, prices it on the server and reserves stock", async () => {
    const a = await product(10, 1_250_000);
    const b = await product(5, 7_120_000);
    const ref = await createOrder(
      w.visitor.actor,
      {
        customerId: w.customer.id,
        // Any client-supplied prices are ignored by the schema.
        items: [{ productId: a.id, quantity: 4, price: 1 } as never, { productId: b.id, quantity: 2 }],
        visitorNote: "قبل از ارسال تماس بگیرید",
        requestedDeliveryWindow: "MORNING",
      },
      { submit: true },
    );
    expect(ref.status).toBe("SUBMITTED");
    const o = await order(ref.id);
    expect(o.items.map((i) => [i.requestedQuantity, i.unitPrice, i.lineTotal])).toEqual([
      [4, 1_250_000, 5_000_000],
      [2, 7_120_000, 14_240_000],
    ]);
    expect(o.total).toBe(19_240_000);
    expect(o.customerName).toBe(w.customer.businessName);
    expect(await stockOf(a.id)).toEqual({ onHand: 10, reserved: 4, available: 6 });
    expect(o.reservations.every((r) => r.status === "ACTIVE")).toBe(true);
    expect(o.statusEvents.map((e) => e.toStatus)).toEqual(["SUBMITTED"]);
    expect(await prisma.auditLog.count({ where: { entityId: ref.id, action: "order.submitted" } })).toBe(1);
    // The order desk is notified.
    expect(await prisma.notification.count({ where: { userId: w.manager.user.id, title: { contains: "سفارش جدید" } } })).toBeGreaterThan(0);
  });

  it("rejects quantities above available stock and leaves stock untouched", async () => {
    const p = await product(2);
    const attempt = createOrder(w.visitor.actor, { customerId: w.customer.id, items: [{ productId: p.id, quantity: 3 }] }, { submit: true });
    await expect(attempt).rejects.toBeInstanceOf(InsufficientStockError);
    const error = (await attempt.catch((e: unknown) => e)) as InsufficientStockError;
    expect(error.shortages).toEqual([expect.objectContaining({ productId: p.id, requested: 3, available: 2 })]);
    expect(error.message).toContain("۲");
    expect(await stockOf(p.id)).toEqual({ onHand: 2, reserved: 0, available: 2 });
    expect(await prisma.order.count({ where: { items: { some: { productId: p.id } } } })).toBe(0);
  });

  it("rolls back every line when one line is short", async () => {
    const plenty = await product(50);
    const scarce = await product(1);
    await expect(
      createOrder(w.visitor.actor, { customerId: w.customer.id, items: [{ productId: plenty.id, quantity: 5 }, { productId: scarce.id, quantity: 2 }] }, { submit: true }),
    ).rejects.toBeInstanceOf(InsufficientStockError);
    expect(await stockOf(plenty.id)).toMatchObject({ reserved: 0 });
  });

  it("validates quantities and duplicate lines", async () => {
    const p = await product(5);
    for (const quantity of [0, -1, 1.5, 10_000]) {
      await expect(createOrder(w.visitor.actor, { customerId: w.customer.id, items: [{ productId: p.id, quantity }] }, { submit: true })).rejects.toBeInstanceOf(ValidationError);
    }
    await expect(
      createOrder(w.visitor.actor, { customerId: w.customer.id, items: [{ productId: p.id, quantity: 1 }, { productId: p.id, quantity: 1 }] }, { submit: true }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(createOrder(w.visitor.actor, { customerId: w.customer.id, items: [] }, { submit: true })).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects delivery dates in the past", async () => {
    const p = await product(5);
    await expect(
      createOrder(w.visitor.actor, { customerId: w.customer.id, items: [{ productId: p.id, quantity: 1 }], requestedDeliveryDate: "2020-01-01" }, { submit: true }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("is idempotent for retried submissions", async () => {
    const p = await product(5);
    const key = "3b241101-e2bb-4255-8caf-4136c566a962";
    const input = { customerId: w.customer.id, items: [{ productId: p.id, quantity: 1 }], idempotencyKey: key };
    const [first, second] = await Promise.all([createOrder(w.visitor.actor, input, { submit: true }), createOrder(w.visitor.actor, input, { submit: true })]);
    expect(second.id).toBe(first.id);
    expect(await stockOf(p.id)).toMatchObject({ reserved: 1 });
  });

  it("saves drafts without reserving stock, edits them, then submits", async () => {
    const p = await product(5);
    const draft = await createOrder(w.visitor.actor, { customerId: w.customer.id, items: [{ productId: p.id, quantity: 2 }] }, { submit: false });
    expect(draft.status).toBe("DRAFT");
    expect(await stockOf(p.id)).toMatchObject({ reserved: 0 });
    await updateDraft(w.visitor.actor, draft.id, { customerId: w.customer.id, items: [{ productId: p.id, quantity: 3 }] }, { submit: false });
    await transitionOrder(w.visitor.actor, draft.id, "submit");
    expect(await stockOf(p.id)).toMatchObject({ reserved: 3 });
    // Submitted orders can no longer be edited by the visitor.
    await expect(updateDraft(w.visitor.actor, draft.id, { customerId: w.customer.id, items: [{ productId: p.id, quantity: 1 }] }, { submit: false })).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("order desk", () => {
  it("approves, adjusts lines with audit, and keeps the visitor's original request", async () => {
    const p = await product(10, 3_000_000);
    const ref = await createOrder(w.visitor.actor, { customerId: w.customer.id, items: [{ productId: p.id, quantity: 4 }] }, { submit: true });
    let o = await order(ref.id);
    await adjustOrderLines(w.manager.actor, ref.id, { expectedVersion: o.version, note: "تأیید تلفنی", lines: [{ itemId: o.items[0]!.id, quantity: 6, unitPrice: 2_800_000, discountBps: 500 }] });
    o = await order(ref.id);
    expect(o.status).toBe("UNDER_REVIEW");
    expect(o.items[0]).toMatchObject({ requestedQuantity: 4, requestedUnitPrice: 3_000_000, quantity: 6, unitPrice: 2_800_000, discountBps: 500, lineTotal: 15_960_000 });
    expect(o.total).toBe(15_960_000);
    expect(await stockOf(p.id)).toMatchObject({ reserved: 6 });
    const audit = await prisma.auditLog.findFirst({ where: { entityId: ref.id, action: "order.lines_adjusted" } });
    expect(audit?.changes).toMatchObject({ lines: [{ quantity: { from: 4, to: 6 }, unitPrice: { from: 3_000_000, to: 2_800_000 } }] });
    expect(await prisma.orderNote.count({ where: { orderId: ref.id } })).toBe(1);

    // Increasing beyond available stock is refused atomically.
    await expect(adjustOrderLines(w.manager.actor, ref.id, { expectedVersion: o.version, lines: [{ itemId: o.items[0]!.id, quantity: 11 }] })).rejects.toBeInstanceOf(InsufficientStockError);
    // Stale versions are rejected (optimistic concurrency between two managers).
    await expect(adjustOrderLines(w.manager.actor, ref.id, { expectedVersion: o.version - 1, lines: [{ itemId: o.items[0]!.id, quantity: 5 }] })).rejects.toBeInstanceOf(ConflictError);

    await transitionOrder(w.manager.actor, ref.id, "approve", { expectedVersion: o.version });
    o = await order(ref.id);
    expect(o.status).toBe("APPROVED");
    expect(o.approvedById).toBe(w.manager.user.id);
  });

  it("releases reserved stock when an order is rejected", async () => {
    const p = await product(5);
    const ref = await createOrder(w.visitor.actor, { customerId: w.customer.id, items: [{ productId: p.id, quantity: 3 }] }, { submit: true });
    await expect(transitionOrder(w.manager.actor, ref.id, "reject")).rejects.toBeInstanceOf(ValidationError); // reason required
    await transitionOrder(w.manager.actor, ref.id, "reject", { reason: "حساب مسدود" });
    const o = await order(ref.id);
    expect(o.status).toBe("REJECTED");
    expect(o.rejectionReason).toBe("حساب مسدود");
    expect(o.reservations.every((r) => r.status === "RELEASED")).toBe(true);
    expect(await stockOf(p.id)).toEqual({ onHand: 5, reserved: 0, available: 5 });
    await expect(transitionOrder(w.manager.actor, ref.id, "approve")).rejects.toBeInstanceOf(ConflictError);
  });

  it("releases reserved stock when an approved order is cancelled", async () => {
    const p = await product(5);
    const ref = await createOrder(w.visitor.actor, { customerId: w.customer.id, items: [{ productId: p.id, quantity: 2 }] }, { submit: true });
    await transitionOrder(w.manager.actor, ref.id, "approve");
    await transitionOrder(w.manager.actor, ref.id, "cancel", { reason: "مشتری منصرف شد" });
    expect(await stockOf(p.id)).toEqual({ onHand: 5, reserved: 0, available: 5 });
  });

  it("lets a visitor withdraw a submitted order before review", async () => {
    const p = await product(5);
    const ref = await createOrder(w.visitor.actor, { customerId: w.customer.id, items: [{ productId: p.id, quantity: 2 }] }, { submit: true });
    await transitionOrder(w.visitor.actor, ref.id, "cancel");
    expect((await order(ref.id)).status).toBe("CANCELLED");
    expect(await stockOf(p.id)).toMatchObject({ reserved: 0 });
  });
});

describe("fulfilment", () => {
  it("picks, dispatches (deducting stock exactly once) and delivers", async () => {
    const p = await product(8);
    const q = await product(4);
    const ref = await createOrder(w.visitor.actor, { customerId: w.customer.id, items: [{ productId: p.id, quantity: 3 }, { productId: q.id, quantity: 1 }] }, { submit: true });
    await transitionOrder(w.manager.actor, ref.id, "approve");
    await transitionOrder(w.warehouse.actor, ref.id, "start_preparing");
    let o = await order(ref.id);
    // Cannot mark ready until every line is picked.
    await setItemPicked(w.warehouse.actor, ref.id, o.items[0]!.id, true);
    await expect(transitionOrder(w.warehouse.actor, ref.id, "mark_ready")).rejects.toBeInstanceOf(ValidationError);
    await setItemPicked(w.warehouse.actor, ref.id, o.items[1]!.id, true);
    await transitionOrder(w.warehouse.actor, ref.id, "mark_ready");
    await transitionOrder(w.warehouse.actor, ref.id, "dispatch", { carrier: "خودروی اتوپارت", reference: "DSP-1" });
    expect(await stockOf(p.id)).toEqual({ onHand: 5, reserved: 0, available: 5 });
    expect(await stockOf(q.id)).toEqual({ onHand: 3, reserved: 0, available: 3 });
    await transitionOrder(w.warehouse.actor, ref.id, "deliver");
    // Delivery does not touch stock again.
    expect(await stockOf(p.id)).toEqual({ onHand: 5, reserved: 0, available: 5 });
    o = await order(ref.id);
    expect(o.status).toBe("DELIVERED");
    expect(o.reservations.every((r) => r.status === "CONSUMED")).toBe(true);
    const movements = await prisma.inventoryMovement.findMany({ where: { orderId: ref.id } });
    expect(movements).toHaveLength(2);
    expect(movements.every((m) => m.type === "DISPATCH")).toBe(true);
    expect(o.statusEvents.map((e) => e.toStatus)).toEqual(["SUBMITTED", "APPROVED", "PREPARING", "READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED"]);
    expect(o.statusEvents.every((e) => e.actorId)).toBe(true);
    // Warehouse staff cannot skip steps or reopen a delivered order.
    await expect(transitionOrder(w.warehouse.actor, ref.id, "dispatch")).rejects.toBeInstanceOf(ConflictError);
    await expect(transitionOrder(w.admin.actor, ref.id, "cancel", { reason: "x" })).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("historical pricing", () => {
  it("keeps the recorded price after the catalogue price changes", async () => {
    const p = await product(10, 5_000_000);
    const ref = await createOrder(w.visitor.actor, { customerId: w.customer.id, items: [{ productId: p.id, quantity: 2 }] }, { submit: true });
    await updateProduct(w.manager.actor, p.id, { sku: p.sku, name: p.name, description: p.description, categoryId: p.categoryId, brandId: p.brandId, price: 6_500_000 });
    const o = await order(ref.id);
    expect(o.items[0]).toMatchObject({ unitPrice: 5_000_000, requestedUnitPrice: 5_000_000, lineTotal: 10_000_000 });
    expect(o.total).toBe(10_000_000);
    // A new order uses the new price.
    const next = await createOrder(w.visitor.actor, { customerId: w.customer.id, items: [{ productId: p.id, quantity: 1 }] }, { submit: true });
    expect((await order(next.id)).items[0]!.unitPrice).toBe(6_500_000);
  });

  it("re-prices a draft at submission time", async () => {
    const p = await product(10, 1_000_000);
    const draft = await createOrder(w.visitor.actor, { customerId: w.customer.id, items: [{ productId: p.id, quantity: 1 }] }, { submit: false });
    await updateProduct(w.manager.actor, p.id, { sku: p.sku, name: p.name, description: p.description, categoryId: p.categoryId, brandId: p.brandId, price: 1_200_000 });
    await transitionOrder(w.visitor.actor, draft.id, "submit");
    expect((await order(draft.id)).items[0]!.unitPrice).toBe(1_200_000);
  });
});
