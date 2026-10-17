import { PERMISSIONS, PERMISSION_KEYS, SYSTEM_ROLES, isPermissionKey, type PermissionKey, type SystemRoleKey } from "@/lib/permissions";
import type { Actor } from "@/server/auth/actor";
import { hashPassword } from "@/server/auth/password";
import { prisma } from "@/server/db";

export const TEST_PASSWORD = "Test-Password-123";

let passwordHash: string | undefined;

/** Wipe every table (the test database is disposable). */
export async function resetDatabase() {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(", ");
  if (list) await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
  await prisma.permission.createMany({
    data: PERMISSION_KEYS.map((key) => ({ key, group: PERMISSIONS[key].group, description: PERMISSIONS[key].description })),
  });
  for (const [key, role] of Object.entries(SYSTEM_ROLES)) {
    await prisma.role.create({
      data: { key, name: role.name, isSystem: true, permissions: { create: role.permissions.map((permissionKey) => ({ permissionKey })) } },
    });
  }
}

export async function toActor(userId: string): Promise<Actor> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { role: { include: { permissions: true } } } });
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roleKey: user.role.key,
    roleName: user.role.name,
    permissions: new Set(user.role.permissions.map((p) => p.permissionKey).filter(isPermissionKey) as PermissionKey[]),
    ipAddress: "127.0.0.1",
  };
}

let userCounter = 0;
export async function createUser(role: SystemRoleKey, overrides: { email?: string; isActive?: boolean; name?: string } = {}) {
  passwordHash ??= await hashPassword(TEST_PASSWORD);
  const r = await prisma.role.findUniqueOrThrow({ where: { key: role } });
  userCounter++;
  const user = await prisma.user.create({
    data: {
      email: overrides.email ?? `${role.toLowerCase()}${userCounter}@test.example`,
      name: overrides.name ?? `${role} ${userCounter}`,
      passwordHash,
      roleId: r.id,
      isActive: overrides.isActive ?? true,
    },
  });
  return { user, actor: await toActor(user.id) };
}

let skuCounter = 0;
export async function createCatalog() {
  const category = await prisma.category.create({ data: { slug: `cat-${Date.now()}`, name: "ترمز" } });
  const brand = await prisma.brand.create({ data: { slug: `brand-${Date.now()}`, name: "Valtrex Braking" } });
  return { category, brand };
}

export async function createProduct(opts: { categoryId: string; brandId: string; price?: number; onHand?: number; threshold?: number; status?: "ACTIVE" | "ARCHIVED" }) {
  skuCounter++;
  return prisma.product.create({
    data: {
      sku: `TST-${String(skuCounter).padStart(4, "0")}`,
      slug: `test-product-${skuCounter}`,
      name: `قطعه آزمایشی ${skuCounter}`,
      description: "توضیحات آزمایشی",
      categoryId: opts.categoryId,
      brandId: opts.brandId,
      price: opts.price ?? 1_000_000,
      lowStockThreshold: opts.threshold ?? 2,
      status: opts.status ?? "ACTIVE",
      inventory: { create: { onHand: opts.onHand ?? 10 } },
    },
  });
}

let customerSeq = 0;

export async function createCustomer(assignedTo: string[] = []) {
  // A process-local counter keeps codes unique even when customers are created in parallel.
  const n = ++customerSeq;
  return prisma.customer.create({
    data: {
      code: `TST-${process.pid}-${String(n).padStart(5, "0")}`,
      businessName: `تعمیرگاه آزمایشی ${n}`,
      addressLine1: "خیابان آزمایش",
      city: "تهران",
      assignments: { create: assignedTo.map((userId) => ({ userId })) },
    },
  });
}

export async function stockOf(productId: string) {
  const inv = await prisma.inventory.findUniqueOrThrow({ where: { productId } });
  return { onHand: inv.onHand, reserved: inv.reserved, available: inv.onHand - inv.reserved };
}

/** A standard world: catalogue, two visitors with their own customers, a manager and warehouse staff. */
export async function createWorld() {
  await resetDatabase();
  const { category, brand } = await createCatalog();
  const visitor = await createUser("VISITOR");
  const otherVisitor = await createUser("VISITOR");
  const manager = await createUser("MANAGER");
  const warehouse = await createUser("WAREHOUSE");
  const supervisor = await createUser("WAREHOUSE_SUPERVISOR");
  const admin = await createUser("ADMIN");
  const customer = await createCustomer([visitor.user.id]);
  const otherCustomer = await createCustomer([otherVisitor.user.id]);
  return { category, brand, visitor, otherVisitor, manager, warehouse, supervisor, admin, customer, otherCustomer };
}
