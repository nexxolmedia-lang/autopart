/**
 * Production operations (non-destructive). Run with:
 *
 *   npm run ops -- bootstrap
 *       Creates/updates the permission catalogue and the five system roles.
 *       Existing custom roles and permission choices on non-admin roles are kept;
 *       the Administrator role always receives every permission.
 *
 *   ADMIN_PASSWORD='…' npm run ops -- create-admin <email> "<full name>"
 *       Creates the first administrator (password read from the environment so
 *       it never appears in shell history or process lists).
 *
 *   npm run ops -- purge-auth
 *       Deletes expired sessions and login attempts older than 30 days
 *       (suitable for a daily cron job).
 */
import { PERMISSIONS, PERMISSION_KEYS, SYSTEM_ROLES } from "../src/lib/permissions";
import { hashPassword, validatePasswordStrength } from "../src/server/auth/password";
import { prisma } from "../src/server/db";
import { recordAudit } from "../src/server/modules/audit/service";
import { purgeExpiredAuthRecords } from "../src/server/modules/auth/service";

async function bootstrap() {
  for (const key of PERMISSION_KEYS) {
    const { group, description } = PERMISSIONS[key];
    await prisma.permission.upsert({ where: { key }, update: { group, description }, create: { key, group, description } });
  }
  for (const [key, role] of Object.entries(SYSTEM_ROLES)) {
    const existing = await prisma.role.findUnique({ where: { key } });
    if (!existing) {
      await prisma.role.create({
        data: { key, name: role.name, description: role.description, isSystem: true, permissions: { create: role.permissions.map((permissionKey) => ({ permissionKey })) } },
      });
      console.log(`created role ${key}`);
    } else if (key === "ADMIN") {
      await prisma.rolePermission.createMany({ data: PERMISSION_KEYS.map((permissionKey) => ({ roleId: existing.id, permissionKey })), skipDuplicates: true });
    }
  }
  console.log(`permissions: ${PERMISSION_KEYS.length}, system roles: ${Object.keys(SYSTEM_ROLES).length} — OK`);
}

async function createAdmin(email: string | undefined, name: string | undefined) {
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !name || !password) throw new Error('usage: ADMIN_PASSWORD=… npm run ops -- create-admin <email> "<full name>"');
  const problem = validatePasswordStrength(password);
  if (problem) throw new Error(problem);
  const role = await prisma.role.findUnique({ where: { key: "ADMIN" } });
  if (!role) throw new Error("Run `npm run ops -- bootstrap` first.");
  const normalized = email.trim().toLowerCase();
  if (await prisma.user.findUnique({ where: { email: normalized } })) throw new Error(`A user with email ${normalized} already exists.`);
  const user = await prisma.user.create({ data: { email: normalized, name: name.trim(), passwordHash: await hashPassword(password), roleId: role.id, passwordChangedAt: new Date() } });
  await recordAudit(prisma, { actorId: null, action: "user.created", entityType: "User", entityId: user.id, summary: `حساب مدیر سیستم ${user.name} از خط فرمان ایجاد شد` });
  console.log(`administrator ${normalized} created`);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  try {
    if (command === "bootstrap") await bootstrap();
    else if (command === "create-admin") await createAdmin(args[0], args[1]);
    else if (command === "purge-auth") {
      await purgeExpiredAuthRecords();
      console.log("expired auth records purged");
    } else {
      console.error("commands: bootstrap | create-admin <email> <name> | purge-auth");
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
