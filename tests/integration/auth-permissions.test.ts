import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { ForbiddenError, NotFoundError, RateLimitError, UnauthenticatedError } from "@/server/errors";
import { login, resolveSession, revokeSession } from "@/server/modules/auth/service";
import { listCustomers, getCustomerDetail } from "@/server/modules/customers/service";
import { adjustStock } from "@/server/modules/inventory/service";
import { getOrderDetail, listOrders } from "@/server/modules/orders/queries";
import { adjustOrderLines, createOrder, transitionOrder } from "@/server/modules/orders/service";
import { updateProduct } from "@/server/modules/products/service";
import { setRolePermissions, updateUser } from "@/server/modules/users/service";
import { TEST_PASSWORD, createProduct, createUser, createWorld } from "./helpers";

type World = Awaited<ReturnType<typeof createWorld>>;
let w: World;

beforeAll(async () => {
  w = await createWorld();
});

describe("authentication", () => {
  it("signs in with valid credentials and resolves the session", async () => {
    const { token, actor, expiresAt } = await login({ email: w.visitor.user.email, password: TEST_PASSWORD }, { ipAddress: "10.0.0.1" });
    expect(actor.id).toBe(w.visitor.user.id);
    expect(actor.permissions.has("orders.create")).toBe(true);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    const resolved = await resolveSession(token);
    expect(resolved?.id).toBe(w.visitor.user.id);
    // Only a hash of the token is stored.
    const stored = await prisma.session.findFirst({ where: { userId: w.visitor.user.id } });
    expect(stored?.tokenHash).not.toBe(token);
    await revokeSession(token);
    expect(await resolveSession(token)).toBeNull();
  });

  it("rejects an invalid password with a generic message", async () => {
    await expect(login({ email: w.visitor.user.email, password: "wrong-password-1" })).rejects.toBeInstanceOf(UnauthenticatedError);
    await expect(login({ email: "nobody@test.example", password: "wrong-password-1" })).rejects.toThrow("ایمیل یا رمز عبور نادرست است.");
  });

  it("refuses deactivated accounts", async () => {
    const { user } = await createUser("VISITOR", { isActive: false });
    await expect(login({ email: user.email, password: TEST_PASSWORD })).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it("throttles repeated failures for the same email", async () => {
    const { user } = await createUser("VISITOR");
    for (let i = 0; i < 5; i++) await expect(login({ email: user.email, password: "nope-nope-1" })).rejects.toBeInstanceOf(UnauthenticatedError);
    // Even the correct password is refused while throttled.
    await expect(login({ email: user.email, password: TEST_PASSWORD })).rejects.toBeInstanceOf(RateLimitError);
  });

  it("ends sessions when an administrator deactivates a user", async () => {
    const { user } = await createUser("VISITOR");
    const { token } = await login({ email: user.email, password: TEST_PASSWORD });
    await updateUser(w.admin.actor, user.id, { name: user.name, email: user.email, roleId: user.roleId, isActive: false });
    expect(await resolveSession(token)).toBeNull();
  });
});

describe("role-based access", () => {
  it("prevents visitors from reading another visitor's orders (IDOR)", async () => {
    const product = await createProduct({ categoryId: w.category.id, brandId: w.brand.id, onHand: 5 });
    const ref = await createOrder(w.otherVisitor.actor, { customerId: w.otherCustomer.id, items: [{ productId: product.id, quantity: 1 }] }, { submit: true });
    await expect(getOrderDetail(w.visitor.actor, "visitor", ref.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(transitionOrder(w.visitor.actor, ref.id, "cancel")).rejects.toBeInstanceOf(NotFoundError);
    const mine = await listOrders(w.visitor.actor, "visitor");
    expect(mine.rows.some((o) => o.id === ref.id)).toBe(false);
    // The manager sees everything.
    expect((await getOrderDetail(w.manager.actor, "admin", ref.id)).id).toBe(ref.id);
  });

  it("prevents visitors from ordering for customers assigned to someone else", async () => {
    const product = await createProduct({ categoryId: w.category.id, brandId: w.brand.id, onHand: 5 });
    await expect(createOrder(w.visitor.actor, { customerId: w.otherCustomer.id, items: [{ productId: product.id, quantity: 1 }] }, { submit: true })).rejects.toBeInstanceOf(NotFoundError);
    await expect(getCustomerDetail(w.visitor.actor, w.otherCustomer.id)).rejects.toBeInstanceOf(NotFoundError);
    const visible = await listCustomers(w.visitor.actor);
    expect(visible.rows.map((c) => c.id)).toEqual([w.customer.id]);
  });

  it("prevents visitors and warehouse operators from changing inventory", async () => {
    const product = await createProduct({ categoryId: w.category.id, brandId: w.brand.id, onHand: 5 });
    const input = { productId: product.id, kind: "RECEIPT" as const, quantity: 10, reason: "test" };
    await expect(adjustStock(w.visitor.actor, input)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(adjustStock(w.warehouse.actor, input)).rejects.toBeInstanceOf(ForbiddenError);
    // The supervisor role is explicitly authorised.
    await expect(adjustStock(w.supervisor.actor, input)).resolves.toMatchObject({ before: 5, after: 15 });
  });

  it("prevents visitors from approving orders or changing prices", async () => {
    const product = await createProduct({ categoryId: w.category.id, brandId: w.brand.id, onHand: 5, price: 2_000_000 });
    const ref = await createOrder(w.visitor.actor, { customerId: w.customer.id, items: [{ productId: product.id, quantity: 1 }] }, { submit: true });
    await expect(transitionOrder(w.visitor.actor, ref.id, "approve")).rejects.toBeInstanceOf(ForbiddenError);
    const order = await prisma.order.findUniqueOrThrow({ where: { id: ref.id }, include: { items: true } });
    await expect(adjustOrderLines(w.visitor.actor, ref.id, { expectedVersion: order.version, lines: [{ itemId: order.items[0]!.id, quantity: 1, unitPrice: 1 }] })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      updateProduct(w.visitor.actor, product.id, { sku: product.sku, name: product.name, description: product.description, categoryId: product.categoryId, brandId: product.brandId, price: 1 }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("applies role permission changes on the next request", async () => {
    const role = await prisma.role.findUniqueOrThrow({ where: { key: "WAREHOUSE" } });
    const { user } = await createUser("WAREHOUSE");
    const { token } = await login({ email: user.email, password: TEST_PASSWORD });
    expect((await resolveSession(token))?.permissions.has("inventory.adjust")).toBe(false);
    await setRolePermissions(w.admin.actor, role.id, ["panel.warehouse", "inventory.view", "orders.fulfil", "inventory.adjust"]);
    expect((await resolveSession(token))?.permissions.has("inventory.adjust")).toBe(true);
    await setRolePermissions(w.admin.actor, role.id, ["panel.warehouse", "inventory.view", "orders.fulfil"]);
  });

  it("does not let anyone edit the Administrator role", async () => {
    const role = await prisma.role.findUniqueOrThrow({ where: { key: "ADMIN" } });
    await expect(setRolePermissions(w.admin.actor, role.id, [])).rejects.toBeInstanceOf(ForbiddenError);
  });
});
