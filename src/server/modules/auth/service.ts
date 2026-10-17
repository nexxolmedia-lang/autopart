/**
 * Authentication: credential verification, login throttling and DB-backed
 * sessions. Framework-agnostic — cookie handling lives in `server/auth/session.ts`.
 *
 * Session tokens are 256-bit random values. Only their SHA-256 hash is stored,
 * so a database leak does not yield usable session cookies.
 */
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { appConfig } from "@/lib/config";
import { faNumber } from "@/lib/digits";
import { isPermissionKey, type PermissionKey } from "@/lib/permissions";
import type { Actor } from "@/server/auth/actor";
import { getDummyHash, hashPassword, needsRehash, verifyPassword } from "@/server/auth/password";
import { prisma } from "@/server/db";
import { RateLimitError, UnauthenticatedError, ValidationError } from "@/server/errors";
import { recordAudit } from "../audit/service";

const LOGIN_WINDOW_MINUTES = 15;
const MAX_FAILURES_PER_EMAIL = 5;
const MAX_FAILURES_PER_IP = 25;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("نشانی ایمیل معتبر وارد کنید.")),
  password: z.string().min(1, "رمز عبور را وارد کنید.").max(256),
});

export type LoginInput = z.input<typeof loginSchema>;

export type LoginContext = { ipAddress?: string | null; userAgent?: string | null; now?: Date };

export type LoginResult = { token: string; expiresAt: Date; actor: Actor };

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function assertNotThrottled(email: string, ipAddress: string | null | undefined, now: Date) {
  const since = new Date(now.getTime() - LOGIN_WINDOW_MINUTES * 60_000);
  const [byEmail, byIp] = await Promise.all([
    prisma.loginAttempt.count({ where: { email, success: false, createdAt: { gte: since } } }),
    ipAddress
      ? prisma.loginAttempt.count({ where: { ipAddress, success: false, createdAt: { gte: since } } })
      : Promise.resolve(0),
  ]);
  if (byEmail >= MAX_FAILURES_PER_EMAIL || byIp >= MAX_FAILURES_PER_IP) {
    throw new RateLimitError(`تلاش‌های ناموفق ورود بیش از حد مجاز است. ${faNumber(LOGIN_WINDOW_MINUTES)} دقیقه دیگر دوباره تلاش کنید.`);
  }
}

export async function login(input: LoginInput, context: LoginContext = {}): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("لطفاً موارد مشخص‌شده را بررسی کنید.", z.flattenError(parsed.error).fieldErrors);
  }
  const { email, password } = parsed.data;
  const now = context.now ?? new Date();
  const ipAddress = context.ipAddress ?? null;

  await assertNotThrottled(email, ipAddress, now);

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: { include: { permissions: true } } },
  });

  // Always run the KDF so response timing does not reveal whether the account exists.
  const valid = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));

  if (!user || !valid || !user.isActive) {
    await prisma.loginAttempt.create({ data: { email, ipAddress, success: false } });
    throw new UnauthenticatedError("ایمیل یا رمز عبور نادرست است.");
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + appConfig.sessionTtlHours * 3_600_000);

  await prisma.$transaction(async (tx) => {
    await tx.session.create({
      data: {
        tokenHash: hashToken(token),
        userId: user.id,
        expiresAt,
        ipAddress,
        userAgent: context.userAgent?.slice(0, 400) ?? null,
      },
    });
    await tx.loginAttempt.create({ data: { email, ipAddress, success: true } });
    await tx.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: now,
        // Transparently upgrade hashes created with weaker parameters.
        ...(needsRehash(user.passwordHash) ? { passwordHash: await hashPassword(password) } : {}),
      },
    });
    await recordAudit(tx, {
      actorId: user.id,
      action: "auth.login",
      entityType: "User",
      entityId: user.id,
      summary: `${user.name} وارد سامانه شد`,
      ipAddress,
    });
  });

  return {
    token,
    expiresAt,
    actor: toActor(user, ipAddress),
  };
}

type UserWithRole = {
  id: string;
  name: string;
  email: string;
  role: { key: string; name: string; permissions: { permissionKey: string }[] };
};

function toActor(user: UserWithRole, ipAddress: string | null): Actor {
  const permissions = new Set<PermissionKey>();
  for (const { permissionKey } of user.role.permissions) {
    if (isPermissionKey(permissionKey)) permissions.add(permissionKey);
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roleKey: user.role.key,
    roleName: user.role.name,
    permissions,
    ipAddress,
  };
}

/** Resolve a raw session token into an Actor, or null if invalid/expired/deactivated. */
export async function resolveSession(token: string, ipAddress: string | null = null, now = new Date()): Promise<Actor | null> {
  if (!token || token.length > 128) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { role: { include: { permissions: true } } } } },
  });
  if (!session || session.expiresAt <= now || !session.user.isActive) return null;
  return toActor(session.user, ipAddress);
}

export async function revokeSession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

/** Housekeeping — safe to call from a scheduled job. */
export async function purgeExpiredAuthRecords(now = new Date()): Promise<void> {
  const cutoff = new Date(now.getTime() - 30 * 24 * 3_600_000);
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } }),
  ]);
}
