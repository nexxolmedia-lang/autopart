import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { InsufficientStockError } from "@/server/errors";
import { createOrder, transitionOrder } from "@/server/modules/orders/service";
import { createCustomer, createProduct, createUser, createWorld, stockOf } from "./helpers";

type World = Awaited<ReturnType<typeof createWorld>>;
let w: World;

beforeAll(async () => {
  w = await createWorld();
});

describe("concurrent ordering", () => {
  it("two visitors racing for the last two units: exactly one wins", async () => {
    const p = await createProduct({ categoryId: w.category.id, brandId: w.brand.id, onHand: 2 });
    const results = await Promise.allSettled([
      createOrder(w.visitor.actor, { customerId: w.customer.id, items: [{ productId: p.id, quantity: 2 }] }, { submit: true }),
      createOrder(w.otherVisitor.actor, { customerId: w.otherCustomer.id, items: [{ productId: p.id, quantity: 2 }] }, { submit: true }),
    ]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]!.reason).toBeInstanceOf(InsufficientStockError);
    expect(await stockOf(p.id)).toEqual({ onHand: 2, reserved: 2, available: 0 });
  });

  it("twenty simultaneous single-unit orders never oversell seven units", async () => {
    const p = await createProduct({ categoryId: w.category.id, brandId: w.brand.id, onHand: 7 });
    const visitors = await Promise.all(Array.from({ length: 4 }, () => createUser("VISITOR")));
    const customers = await Promise.all(visitors.map((v) => createCustomer([v.user.id])));
    const attempts = Array.from({ length: 20 }, (_, i) => {
      const v = visitors[i % visitors.length]!;
      const c = customers[i % customers.length]!;
      return createOrder(v.actor, { customerId: c.id, items: [{ productId: p.id, quantity: 1 }] }, { submit: true });
    });
    const results = await Promise.allSettled(attempts);
    const accepted = results.filter((r) => r.status === "fulfilled").length;
    expect(accepted).toBe(7);
    for (const r of results) if (r.status === "rejected") expect(r.reason).toBeInstanceOf(InsufficientStockError);
    expect(await stockOf(p.id)).toEqual({ onHand: 7, reserved: 7, available: 0 });
    const reservedTotal = await prisma.stockReservation.aggregate({ where: { productId: p.id, status: "ACTIVE" }, _sum: { quantity: true } });
    expect(reservedTotal._sum.quantity).toBe(7);
  });

  it("multi-line orders competing in opposite order do not deadlock or oversell", async () => {
    const a = await createProduct({ categoryId: w.category.id, brandId: w.brand.id, onHand: 3 });
    const b = await createProduct({ categoryId: w.category.id, brandId: w.brand.id, onHand: 3 });
    const results = await Promise.allSettled(
      Array.from({ length: 6 }, (_, i) =>
        createOrder(
          i % 2 ? w.visitor.actor : w.otherVisitor.actor,
          { customerId: i % 2 ? w.customer.id : w.otherCustomer.id, items: i % 2 ? [{ productId: a.id, quantity: 1 }, { productId: b.id, quantity: 1 }] : [{ productId: b.id, quantity: 1 }, { productId: a.id, quantity: 1 }] },
          { submit: true },
        ),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(3);
    expect(await stockOf(a.id)).toMatchObject({ reserved: 3, available: 0 });
    expect(await stockOf(b.id)).toMatchObject({ reserved: 3, available: 0 });
  });

  it("concurrent approve and cancel on the same order leave a consistent state", async () => {
    const p = await createProduct({ categoryId: w.category.id, brandId: w.brand.id, onHand: 5 });
    const ref = await createOrder(w.visitor.actor, { customerId: w.customer.id, items: [{ productId: p.id, quantity: 2 }] }, { submit: true });
    const results = await Promise.allSettled([
      transitionOrder(w.manager.actor, ref.id, "approve"),
      transitionOrder(w.admin.actor, ref.id, "cancel", { reason: "همزمانی" }),
    ]);
    expect(results.some((r) => r.status === "fulfilled")).toBe(true);
    const order = await prisma.order.findUniqueOrThrow({ where: { id: ref.id } });
    const stock = await stockOf(p.id);
    if (order.status === "CANCELLED") expect(stock.reserved).toBe(0);
    else expect(stock.reserved).toBe(2);
  });
});
