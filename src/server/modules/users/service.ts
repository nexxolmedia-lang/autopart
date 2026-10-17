import { Prisma } from "@prisma/client";
import { z } from "zod";
import { faNumber } from "@/lib/digits";
import { PERMISSION_KEYS, isPermissionKey, type PermissionKey } from "@/lib/permissions";
import { assertCan, type Actor } from "@/server/auth/actor";
import { hashPassword, validatePasswordStrength } from "@/server/auth/password";
import { prisma, transaction } from "@/server/db";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/server/errors";
import { parseInput, zx } from "@/server/validation";
import { diff, recordAudit } from "../audit/service";

const passwordField = z
  .string()
  .max(128)
  .superRefine((value, ctx) => {
    const problem = validatePasswordStrength(value);
    if (problem) ctx.addIssue({ code: "custom", message: problem });
  });

const userBase = {
  name: zx.requiredText(120, "نام"),
  email: z.string().trim().toLowerCase().pipe(z.email("نشانی ایمیل معتبر وارد کنید.")),
  phone: zx.optionalText(40),
  roleId: zx.id(),
  isActive: z.boolean().default(true),
};

export const createUserSchema = z.object({ ...userBase, password: passwordField });
export const updateUserSchema = z.object(userBase);

export type CreateUserInput = z.input<typeof createUserSchema>;
export type UpdateUserInput = z.input<typeof updateUserSchema>;

function emailTaken(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createUser(actor: Actor, input: CreateUserInput) {
  assertCan(actor, "users.manage", "شما مجوز مدیریت کاربران را ندارید.");
  const data = parseInput(createUserSchema, input);
  try {
    return await transaction(async (tx) => {
      const role = await tx.role.findUnique({ where: { id: data.roleId } });
      if (!role) throw new ValidationError("نقش را انتخاب کنید.", { roleId: ["نقش را انتخاب کنید."] });
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone ?? null,
          roleId: role.id,
          isActive: data.isActive,
          passwordHash: await hashPassword(data.password),
          passwordChangedAt: new Date(),
        },
      });
      await recordAudit(tx, {
        actorId: actor.id,
        action: "user.created",
        entityType: "User",
        entityId: user.id,
        summary: `کاربر ${user.email} با نقش «${role.name}» ایجاد شد`,
        changes: { name: user.name, email: user.email, role: role.key, isActive: user.isActive },
        ipAddress: actor.ipAddress,
      });
      return user;
    });
  } catch (error) {
    if (emailTaken(error)) throw new ConflictError("حسابی با این ایمیل وجود دارد.", { email: ["این ایمیل قبلاً استفاده شده است."] });
    throw error;
  }
}

export async function updateUser(actor: Actor, userId: string, input: UpdateUserInput) {
  assertCan(actor, "users.manage", "شما مجوز مدیریت کاربران را ندارید.");
  const data = parseInput(updateUserSchema, input);
  try {
    return await transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { id: userId }, include: { role: true } });
      if (!existing) throw new NotFoundError("کاربر یافت نشد.");
      const role = await tx.role.findUnique({ where: { id: data.roleId }, include: { permissions: true } });
      if (!role) throw new ValidationError("نقش را انتخاب کنید.", { roleId: ["نقش را انتخاب کنید."] });

      if (existing.id === actor.id) {
        if (!data.isActive) throw new ForbiddenError("نمی‌توانید حساب خودتان را غیرفعال کنید.");
        if (!role.permissions.some((p) => p.permissionKey === "users.manage")) {
          throw new ForbiddenError("نمی‌توانید دسترسی مدیریت کاربران را از خودتان بگیرید.");
        }
      }

      const changes = diff(
        { name: existing.name, email: existing.email, phone: existing.phone, roleId: existing.roleId, isActive: existing.isActive },
        { name: data.name, email: data.email, phone: data.phone ?? null, roleId: role.id, isActive: data.isActive },
      );
      const user = await tx.user.update({
        where: { id: userId },
        data: { name: data.name, email: data.email, phone: data.phone ?? null, roleId: role.id, isActive: data.isActive },
      });
      // Deactivation or a role change takes effect immediately: end existing sessions.
      if (!data.isActive || existing.roleId !== role.id) await tx.session.deleteMany({ where: { userId } });

      if (Object.keys(changes).length > 0) {
        await recordAudit(tx, {
          actorId: actor.id,
          action: !data.isActive && existing.isActive ? "user.deactivated" : data.isActive && !existing.isActive ? "user.reactivated" : "user.updated",
          entityType: "User",
          entityId: userId,
          summary: `اطلاعات کاربر ${user.email} ویرایش شد (${Object.keys(changes).join("، ")})`,
          changes: changes as Prisma.InputJsonValue,
          ipAddress: actor.ipAddress,
        });
      }
      return user;
    });
  } catch (error) {
    if (emailTaken(error)) throw new ConflictError("حسابی با این ایمیل وجود دارد.", { email: ["این ایمیل قبلاً استفاده شده است."] });
    throw error;
  }
}

export async function resetUserPassword(actor: Actor, userId: string, password: string) {
  assertCan(actor, "users.manage", "شما مجوز مدیریت کاربران را ندارید.");
  const value = parseInput(z.object({ password: passwordField }), { password }).password;
  await transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("کاربر یافت نشد.");
    await tx.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(value), passwordChangedAt: new Date() } });
    await tx.session.deleteMany({ where: { userId } });
    await recordAudit(tx, {
      actorId: actor.id,
      action: "user.password_reset",
      entityType: "User",
      entityId: userId,
      summary: `رمز عبور ${user.email} بازنشانی شد و همه نشست‌ها پایان یافت`,
      ipAddress: actor.ipAddress,
    });
  });
}

// ── Roles ────────────────────────────────────────────────────────────────────

export async function setRolePermissions(actor: Actor, roleId: string, permissionKeys: string[]) {
  assertCan(actor, "roles.manage", "شما مجوز تغییر مجوزهای نقش را ندارید.");
  const keys = [...new Set(permissionKeys)].filter(isPermissionKey) as PermissionKey[];
  await transaction(async (tx) => {
    const role = await tx.role.findUnique({ where: { id: roleId }, include: { permissions: true } });
    if (!role) throw new NotFoundError("نقش یافت نشد.");
    if (role.key === "ADMIN") throw new ForbiddenError("نقش «مدیر سیستم» همیشه همه مجوزها را دارد و قابل ویرایش نیست.");
    const actorUser = await tx.user.findUnique({ where: { id: actor.id }, select: { roleId: true } });
    if (actorUser?.roleId === role.id && (!keys.includes("roles.manage") || !keys.includes("users.manage"))) {
      throw new ForbiddenError("نمی‌توانید مجوزهای مدیریتی را از نقش خودتان حذف کنید.");
    }
    const current = role.permissions.map((p) => p.permissionKey);
    const added = keys.filter((k) => !current.includes(k));
    const removed = current.filter((k) => !keys.includes(k as PermissionKey));
    if (!added.length && !removed.length) return;
    await tx.rolePermission.deleteMany({ where: { roleId, permissionKey: { in: removed } } });
    await tx.rolePermission.createMany({ data: added.map((permissionKey) => ({ roleId, permissionKey })) });
    await recordAudit(tx, {
      actorId: actor.id,
      action: "role.permissions_changed",
      entityType: "Role",
      entityId: roleId,
      summary: `مجوزهای نقش «${role.name}» تغییر کرد (+${faNumber(added.length)} / −${faNumber(removed.length)})`,
      changes: { added, removed },
      ipAddress: actor.ipAddress,
    });
  });
}

export const roleSchema = z.object({
  name: zx.requiredText(60, "نام نقش"),
  description: zx.optionalText(240),
});

export async function createRole(actor: Actor, input: z.input<typeof roleSchema>) {
  assertCan(actor, "roles.manage", "شما مجوز ایجاد نقش را ندارید.");
  const data = parseInput(roleSchema, input);
  // Role keys are stable ASCII identifiers; Persian names get a generated key.
  const latin = data.name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
  const key = latin || `ROLE_${Date.now().toString(36).toUpperCase()}`;
  try {
    return await transaction(async (tx) => {
      const role = await tx.role.create({ data: { key, name: data.name, description: data.description ?? null } });
      await recordAudit(tx, {
        actorId: actor.id,
        action: "role.created",
        entityType: "Role",
        entityId: role.id,
        summary: `نقش «${role.name}» ایجاد شد`,
        ipAddress: actor.ipAddress,
      });
      return role;
    });
  } catch (error) {
    if (emailTaken(error)) throw new ConflictError("نقشی با این نام وجود دارد.", { name: ["نام دیگری انتخاب کنید."] });
    throw error;
  }
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function listUsers(actor: Actor, filter: { q?: string; roleId?: string; status?: "active" | "inactive" | "all" } = {}) {
  assertCan(actor, "users.manage");
  const q = filter.q?.trim();
  return prisma.user.findMany({
    where: {
      ...(filter.roleId ? { roleId: filter.roleId } : {}),
      ...(filter.status === "inactive" ? { isActive: false } : filter.status === "all" ? {} : { isActive: true }),
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      role: { select: { id: true, name: true, key: true } },
      _count: { select: { ordersCreated: { where: { status: { not: "DRAFT" } } }, customerAssignments: true } },
    },
  });
}

export async function getUserDetail(actor: Actor, userId: string) {
  assertCan(actor, "users.manage");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
      customerAssignments: { include: { customer: { select: { id: true, code: true, businessName: true, city: true, isActive: true } } } },
      _count: { select: { sessions: true } },
    },
  });
  if (!user) throw new NotFoundError("کاربر یافت نشد.");
  const { passwordHash: _omit, ...safe } = user;
  void _omit;
  return safe;
}

export async function listRolesWithPermissions() {
  const roles = await prisma.role.findMany({
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    include: { permissions: true, _count: { select: { users: true } } },
  });
  return roles.map((r) => ({
    id: r.id,
    key: r.key,
    name: r.name,
    description: r.description,
    isSystem: r.isSystem,
    userCount: r._count.users,
    permissions: r.permissions.map((p) => p.permissionKey).filter(isPermissionKey),
  }));
}

export { PERMISSION_KEYS };
