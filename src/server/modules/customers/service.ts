import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { assertCan, assertCanAny, can, type Actor } from "@/server/auth/actor";
import { prisma, transaction, type Db } from "@/server/db";
import { ForbiddenError, NotFoundError, ValidationError } from "@/server/errors";
import { parseInput, zx } from "@/server/validation";
import { diff, recordAudit } from "../audit/service";

/**
 * Row-level visibility. Visitors only ever see customers assigned to them —
 * this filter is applied to every customer query and to order creation, so a
 * crafted customer id from another visitor resolves to "not found".
 */
export function customerScope(actor: Actor): Prisma.CustomerWhereInput {
  if (can(actor, "customers.view_all")) return {};
  if (can(actor, "customers.view_assigned")) return { assignments: { some: { userId: actor.id } } };
  return { id: "__no_access__" };
}

export async function getAccessibleCustomer(db: Db, actor: Actor, customerId: string) {
  const customer = await db.customer.findFirst({ where: { AND: [{ id: customerId }, customerScope(actor)] } });
  if (!customer) throw new NotFoundError("مشتری یافت نشد.");
  return customer;
}

export const customerSchema = z.object({
  businessName: zx.requiredText(120, "نام کسب‌وکار"),
  contactName: zx.optionalText(120),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => v || undefined)
    .refine((v) => !v || /^[+()\d\s.-]{6,}$/.test(v), "شماره تلفن معتبر وارد کنید."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(160)
    .optional()
    .transform((v) => v || undefined)
    .refine((v) => !v || z.email().safeParse(v).success, "نشانی ایمیل معتبر وارد کنید."),
  addressLine1: zx.requiredText(160, "نشانی"),
  addressLine2: zx.optionalText(160),
  city: zx.requiredText(80, "شهر"),
  region: zx.optionalText(80),
  postalCode: zx.optionalText(20),
  notes: zx.optionalText(1000),
});

export type CustomerInput = z.input<typeof customerSchema>;

async function nextCustomerCode(db: Db): Promise<string> {
  const [row] = await db.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)) AS max FROM "Customer" WHERE code ~ '^CUS-[0-9]+$'`;
  return `CUS-${String((row?.max ?? 0) + 1).padStart(5, "0")}`;
}

export async function createCustomer(
  actor: Actor,
  input: CustomerInput,
  options: { assignTo?: string[] } = {},
) {
  assertCan(actor, "customers.create", "شما مجوز ایجاد مشتری را ندارید.");
  const data = parseInput(customerSchema, input);

  // Visitors always own what they create; managers may assign explicitly.
  const assignees = can(actor, "customers.manage") ? [...new Set(options.assignTo ?? [])] : [actor.id];

  return transaction(async (tx) => {
    await assertAssignableVisitors(tx, assignees);
    // Advisory lock serialises code generation without a separate sequence table.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(4242001)`;
    const code = await nextCustomerCode(tx);
    const customer = await tx.customer.create({
      data: {
        ...data,
        code,
        createdById: actor.id,
        assignments: { create: assignees.map((userId) => ({ userId, assignedById: actor.id })) },
      },
    });
    await recordAudit(tx, {
      actorId: actor.id,
      action: "customer.created",
      entityType: "Customer",
      entityId: customer.id,
      summary: `مشتری ${customer.code} «${customer.businessName}» ایجاد شد`,
      changes: { ...data, assignees },
      ipAddress: actor.ipAddress,
    });
    return customer;
  });
}

export async function updateCustomer(actor: Actor, customerId: string, input: CustomerInput) {
  assertCan(actor, "customers.manage", "شما مجوز ویرایش مشتری را ندارید.");
  const data = parseInput(customerSchema, input);
  return transaction(async (tx) => {
    const existing = await tx.customer.findUnique({ where: { id: customerId } });
    if (!existing) throw new NotFoundError("مشتری یافت نشد.");
    const normalized = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? null])) as Record<string, unknown>;
    const changes = diff(existing as unknown as Record<string, unknown>, normalized);
    const updated = await tx.customer.update({ where: { id: customerId }, data: normalized });
    if (Object.keys(changes).length > 0) {
      await recordAudit(tx, {
        actorId: actor.id,
        action: "customer.updated",
        entityType: "Customer",
        entityId: customerId,
        summary: `اطلاعات مشتری ${existing.code} ویرایش شد (${Object.keys(changes).join("، ")})`,
        changes: changes as Prisma.InputJsonValue,
        ipAddress: actor.ipAddress,
      });
    }
    return updated;
  });
}

export async function setCustomerActive(actor: Actor, customerId: string, isActive: boolean) {
  assertCan(actor, "customers.manage");
  await transaction(async (tx) => {
    const existing = await tx.customer.findUnique({ where: { id: customerId } });
    if (!existing) throw new NotFoundError("مشتری یافت نشد.");
    if (existing.isActive === isActive) return;
    await tx.customer.update({ where: { id: customerId }, data: { isActive } });
    await recordAudit(tx, {
      actorId: actor.id,
      action: isActive ? "customer.reactivated" : "customer.archived",
      entityType: "Customer",
      entityId: customerId,
      summary: `مشتری ${existing.code} ${isActive ? "فعال شد" : "بایگانی شد"}`,
      ipAddress: actor.ipAddress,
    });
  });
}

async function assertAssignableVisitors(db: Db, userIds: string[]) {
  if (userIds.length === 0) return;
  const users = await db.user.findMany({
    where: { id: { in: userIds }, role: { permissions: { some: { permissionKey: "orders.create" } } } },
    select: { id: true },
  });
  if (users.length !== new Set(userIds).size) {
    throw new ValidationError("مشتری فقط به کاربرانی قابل تخصیص است که مجوز ثبت سفارش دارند.", {
      assignees: ["یک یا چند کاربر انتخاب‌شده مجوز ثبت سفارش ندارند."],
    });
  }
}

export async function setCustomerAssignments(actor: Actor, customerId: string, userIds: string[]) {
  assertCan(actor, "customers.manage", "شما مجوز تغییر تخصیص مشتریان را ندارید.");
  const ids = [...new Set(parseInput(z.array(zx.id()).max(50), userIds))];
  await transaction(async (tx) => {
    const customer = await tx.customer.findUnique({
      where: { id: customerId },
      include: { assignments: { include: { user: { select: { name: true } } } } },
    });
    if (!customer) throw new NotFoundError("مشتری یافت نشد.");
    await assertAssignableVisitors(tx, ids);
    const current = customer.assignments.map((a) => a.userId);
    const toRemove = current.filter((id) => !ids.includes(id));
    const toAdd = ids.filter((id) => !current.includes(id));
    if (toRemove.length === 0 && toAdd.length === 0) return;
    if (toRemove.length) await tx.customerAssignment.deleteMany({ where: { customerId, userId: { in: toRemove } } });
    if (toAdd.length) {
      await tx.customerAssignment.createMany({
        data: toAdd.map((userId) => ({ customerId, userId, assignedById: actor.id })),
      });
    }
    await recordAudit(tx, {
      actorId: actor.id,
      action: "customer.assignments_changed",
      entityType: "Customer",
      entityId: customerId,
      summary: `تخصیص ویزیتورهای مشتری ${customer.code} به‌روزرسانی شد`,
      changes: { added: toAdd, removed: toRemove },
      ipAddress: actor.ipAddress,
    });
  });
}

// ── Queries ──────────────────────────────────────────────────────────────────

export type CustomerFilter = {
  q?: string;
  visitorId?: string;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
};

export async function listCustomers(actor: Actor, filter: CustomerFilter = {}) {
  assertCanAny(actor, ["customers.view_all", "customers.view_assigned"]);
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, filter.pageSize ?? 25));
  const q = filter.q?.trim();
  if (filter.visitorId && !can(actor, "customers.view_all")) throw new ForbiddenError();

  const where: Prisma.CustomerWhereInput = {
    AND: [
      customerScope(actor),
      filter.includeInactive ? {} : { isActive: true },
      filter.visitorId ? { assignments: { some: { userId: filter.visitorId } } } : {},
      q
        ? {
            OR: [
              { businessName: { contains: q, mode: "insensitive" } },
              { contactName: { contains: q, mode: "insensitive" } },
              { code: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
            ],
          }
        : {},
    ],
  };

  const [total, rows] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: { businessName: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        assignments: { include: { user: { select: { id: true, name: true } } } },
        _count: { select: { orders: { where: { status: { not: "DRAFT" } } } } },
        orders: {
          where: { status: { not: "DRAFT" } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    }),
  ]);

  return { rows, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getCustomerDetail(actor: Actor, customerId: string) {
  assertCanAny(actor, ["customers.view_all", "customers.view_assigned"]);
  const customer = await prisma.customer.findFirst({
    where: { AND: [{ id: customerId }, customerScope(actor)] },
    include: {
      assignments: { include: { user: { select: { id: true, name: true, email: true } } } },
      createdBy: { select: { name: true } },
    },
  });
  if (!customer) throw new NotFoundError("مشتری یافت نشد.");
  return customer;
}

/** Lightweight list for pickers (order composer). */
export async function searchCustomersForPicker(actor: Actor, q: string, limit = 20) {
  assertCanAny(actor, ["customers.view_all", "customers.view_assigned"]);
  const term = q.trim();
  return prisma.customer.findMany({
    where: {
      AND: [
        customerScope(actor),
        { isActive: true },
        term
          ? {
              OR: [
                { businessName: { contains: term, mode: "insensitive" } },
                { code: { contains: term, mode: "insensitive" } },
                { city: { contains: term, mode: "insensitive" } },
                { contactName: { contains: term, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    orderBy: { businessName: "asc" },
    take: limit,
    select: { id: true, code: true, businessName: true, contactName: true, city: true, addressLine1: true, phone: true },
  });
}

export async function listAssignableVisitors() {
  return prisma.user.findMany({
    where: { isActive: true, role: { permissions: { some: { permissionKey: "orders.create" } } } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: { select: { name: true } } },
  });
}
