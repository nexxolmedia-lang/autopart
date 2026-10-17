import "server-only";
import { cookies, headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import type { PermissionKey } from "@/lib/permissions";
import { resolveSession, revokeSession } from "@/server/modules/auth/service";
import { ForbiddenError, UnauthenticatedError } from "@/server/errors";
import type { Actor } from "./actor";

import { SECURE_COOKIES, SESSION_COOKIE } from "./cookie-name";

export { SESSION_COOKIE };

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: SECURE_COOKIES,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await revokeSession(token);
  store.delete(SESSION_COOKIE);
}

export async function getClientIp(): Promise<string | null> {
  const h = await headers();
  // Behind a trusted reverse proxy (Vercel, Fly, Nginx) the first hop is the client.
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || null;
}

export async function getUserAgent(): Promise<string | null> {
  return (await headers()).get("user-agent");
}

/** The current actor, or null. Memoised per request. */
export const getActor = cache(async (): Promise<Actor | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  // Session validity depends on the current time: always resolve at request time.
  await connection();
  return resolveSession(token, await getClientIp());
});

// ── Guards for Server Components (pages / layouts) ────────────────────────────

/** Redirects to the login page when there is no valid session. */
export async function requirePageActor(nextPath?: string): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login");
  return actor;
}

/** Renders the 403 page when the actor lacks the permission. */
export async function requirePagePermission(permission: PermissionKey, nextPath?: string): Promise<Actor> {
  const actor = await requirePageActor(nextPath);
  if (!actor.permissions.has(permission)) forbidden();
  return actor;
}

export async function requirePageAnyPermission(permissions: PermissionKey[], nextPath?: string): Promise<Actor> {
  const actor = await requirePageActor(nextPath);
  if (!permissions.some((p) => actor.permissions.has(p))) forbidden();
  return actor;
}

// ── Guards for Server Actions / Route Handlers (throw domain errors) ─────────

export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) throw new UnauthenticatedError();
  return actor;
}

export async function requirePermission(permission: PermissionKey): Promise<Actor> {
  const actor = await requireActor();
  if (!actor.permissions.has(permission)) throw new ForbiddenError();
  return actor;
}
