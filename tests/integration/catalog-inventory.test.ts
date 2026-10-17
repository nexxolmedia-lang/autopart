import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { ConflictError, ForbiddenError, ValidationError } from "@/server/errors";
import { adjustStock, listMovements } from "@/server/modules/inventory/service";
import { createOrder } from "@/server/modules/orders/service";
import { createProduct as createProductService, setProductArchived, updateProduct } from "@/server/modules/products/service";
import { searchOrderableProducts } from "@/server/modules/products/queries";
import { createProduct, createWorld, stockOf } from "./helpers";

type World = Awaited<ReturnType<typeof createWorld>>;
let w: World;

beforeAll(async () => {
  w = await createWorld();
});

const baseInput = (w: World, overrides: Record<string, unknown> = {}) => ({
  sku: "VLX-BD-9001",
  name: "دیسک ترمز جلو",
  description: "دیسک هواخنک",
  categoryId: w.category.id,
  brandId: w.brand.id,
  price: 94_720_000,
  specs: [{ label: "قطر", value: "۲۶۶ میلی‌متر" }],
  fitments: [{ make: "ایران‌خودرو", model: "پژو ۴۰۵", yearFrom: 1994 }],
  ...overrides,
});

describe("product management", () => {
  it("creates a product with opening stock recorded as a movement", async () => {
    const product = await createProductService(w.manager.actor, baseInput(w), { initialStock: 12, binLocation: "B-01-1" });
    expect(product.price).toBe(94_720_000);
    expect(await stockOf(product.id)).toEqual({ onHand: 12, reserved: 0, available: 12 });
    const movements = await prisma.inventoryMovement.findMany({ where: { productId: product.id } });
    expect(movements).toHaveLength(1);
    expect(movements[0]).toMatchObject({ type: "RECEIPT", quantityBefore: 0, quantityChange: 12, quantityAfter: 12, userId: w.manager.user.id });
  });

  it("rejects duplicate SKUs", async () => {
    await expect(createProductService(w.manager.actor, baseInput(w, { name: "تکراری" }))).rejects.toBeInstanceOf(ConflictError);
  });

  it("validates required fields and prices", async () => {
    const attempt = createProductService(w.manager.actor, baseInput(w, { sku: "X", name: "", price: -5 }));
    await expect(attempt).rejects.toBeInstanceOf(ValidationError);
    const error = (await attempt.catch((e: unknown) => e)) as ValidationError;
    expect(Object.keys(error.fieldErrors)).toEqual(expect.arrayContaining(["sku", "name", "price"]));
  });

  it("edits a product and audits price changes", async () => {
    const product = await prisma.product.findUniqueOrThrow({ where: { sku: "VLX-BD-9001" } });
    await updateProduct(w.manager.actor, product.id, baseInput(w, { price: 99_000_000, name: "دیسک ترمز جلو (جفت)" }));
    const updated = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(updated.price).toBe(99_000_000);
    expect(updated.name).toBe("دیسک ترمز جلو (جفت)");
    const audit = await prisma.auditLog.findFirst({ where: { entityId: product.id, action: "product.price_changed" } });
    expect(audit?.changes).toMatchObject({ price: { from: 94_720_000, to: 99_000_000 } });
  });

  it("requires pricing permission to change prices", async () => {
    const product = await prisma.product.findUniqueOrThrow({ where: { sku: "VLX-BD-9001" } });
    const role = await prisma.role.create({ data: { key: "CATALOGUE_EDITOR", name: "ویراستار کاتالوگ", permissions: { create: [{ permissionKey: "products.manage" }] } } });
    const user = await prisma.user.create({ data: { email: "editor@test.example", name: "ویراستار", passwordHash: "x", roleId: role.id } });
    const actor = { id: user.id, name: user.name, email: user.email, roleKey: role.key, roleName: role.name, permissions: new Set(["products.manage"] as const) };
    await expect(updateProduct(actor, product.id, baseInput(w, { price: 1_000 }))).rejects.toBeInstanceOf(ForbiddenError);
    // Non-price edits are fine.
    await expect(updateProduct(actor, product.id, baseInput(w, { price: 99_000_000, shortDescription: "جدید" }))).resolves.toBeTruthy();
  });

  it("archives instead of deleting, hiding the product from ordering", async () => {
    const product = await prisma.product.findUniqueOrThrow({ where: { sku: "VLX-BD-9001" } });
    await setProductArchived(w.manager.actor, product.id, true);
    const { items } = await searchOrderableProducts(w.visitor.actor, { q: "VLX-BD-9001" });
    expect(items).toHaveLength(0);
    await expect(createOrder(w.visitor.actor, { customerId: w.customer.id, items: [{ productId: product.id, quantity: 1 }] }, { submit: true })).rejects.toBeInstanceOf(ValidationError);
    await setProductArchived(w.manager.actor, product.id, false);
  });
});

describe("inventory", () => {
  it("records receipts, adjustments and counts with before/after quantities", async () => {
    const product = await createProduct({ categoryId: w.category.id, brandId: w.brand.id, onHand: 10 });
    await adjustStock(w.supervisor.actor, { productId: product.id, kind: "RECEIPT", quantity: 5, reason: "تحویل تأمین‌کننده", reference: "PO-1" });
    await adjustStock(w.supervisor.actor, { productId: product.id, kind: "ADJUSTMENT", quantity: -3, reason: "آسیب‌دیده" });
    await adjustStock(w.supervisor.actor, { productId: product.id, kind: "STOCK_COUNT", quantity: 11, reason: "شمارش" });
    expect(await stockOf(product.id)).toMatchObject({ onHand: 11 });
    const { rows } = await listMovements(w.manager.actor, { productId: product.id });
    expect(rows.map((m) => [m.type, m.quantityBefore, m.quantityChange, m.quantityAfter, m.user?.name])).toEqual([
      ["STOCK_COUNT", 12, -1, 11, w.supervisor.user.name],
      ["ADJUSTMENT", 15, -3, 12, w.supervisor.user.name],
      ["RECEIPT", 10, 5, 15, w.supervisor.user.name],
    ]);
    const audits = await prisma.auditLog.count({ where: { entityId: product.id, action: "inventory.adjusted" } });
    expect(audits).toBe(3);
  });

  it("never lets stock go negative", async () => {
    const product = await createProduct({ categoryId: w.category.id, brandId: w.brand.id, onHand: 2 });
    await expect(adjustStock(w.supervisor.actor, { productId: product.id, kind: "ADJUSTMENT", quantity: -3, reason: "x" })).rejects.toBeInstanceOf(ValidationError);
    await expect(adjustStock(w.supervisor.actor, { productId: product.id, kind: "STOCK_COUNT", quantity: -1, reason: "x" })).rejects.toBeInstanceOf(ValidationError);
    expect(await stockOf(product.id)).toMatchObject({ onHand: 2 });
  });

  it("refuses to reduce physical stock below what open orders have reserved", async () => {
    const product = await createProduct({ categoryId: w.category.id, brandId: w.brand.id, onHand: 5 });
    await createOrder(w.visitor.actor, { customerId: w.customer.id, items: [{ productId: product.id, quantity: 4 }] }, { submit: true });
    expect(await stockOf(product.id)).toEqual({ onHand: 5, reserved: 4, available: 1 });
    await expect(adjustStock(w.supervisor.actor, { productId: product.id, kind: "STOCK_COUNT", quantity: 3, reason: "شمارش" })).rejects.toBeInstanceOf(ConflictError);
    await expect(adjustStock(w.supervisor.actor, { productId: product.id, kind: "STOCK_COUNT", quantity: 4, reason: "شمارش" })).resolves.toMatchObject({ available: 0 });
  });

  it("is protected by database constraints even if the service layer is bypassed", async () => {
    const product = await createProduct({ categoryId: w.category.id, brandId: w.brand.id, onHand: 1 });
    await expect(prisma.inventory.update({ where: { productId: product.id }, data: { onHand: -1 } })).rejects.toThrow();
    await expect(prisma.inventory.update({ where: { productId: product.id }, data: { reserved: 2 } })).rejects.toThrow();
  });
});
