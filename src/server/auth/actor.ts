import type { PermissionKey } from "@/lib/permissions";
import { ForbiddenError } from "../errors";

/**
 * The authenticated principal performing an operation. Services receive an
 * Actor explicitly — they never read cookies or headers — which keeps business
 * logic testable and reusable from Server Actions, Route Handlers or jobs.
 */
export type Actor = {
  id: string;
  name: string;
  email: string;
  roleKey: string;
  roleName: string;
  permissions: ReadonlySet<PermissionKey>;
  ipAddress?: string | null;
};

export function can(actor: Actor, permission: PermissionKey): boolean {
  return actor.permissions.has(permission);
}

export function canAny(actor: Actor, ...permissions: PermissionKey[]): boolean {
  return permissions.some((p) => actor.permissions.has(p));
}

export function assertCan(actor: Actor, permission: PermissionKey, message?: string): void {
  if (!actor.permissions.has(permission)) throw new ForbiddenError(message);
}

export function assertCanAny(actor: Actor, permissions: PermissionKey[], message?: string): void {
  if (!permissions.some((p) => actor.permissions.has(p))) throw new ForbiddenError(message);
}

/** Serializable view of the actor for Client Components. */
export type ActorSummary = {
  id: string;
  name: string;
  email: string;
  roleKey: string;
  roleName: string;
  permissions: PermissionKey[];
};

export function summarizeActor(actor: Actor): ActorSummary {
  return {
    id: actor.id,
    name: actor.name,
    email: actor.email,
    roleKey: actor.roleKey,
    roleName: actor.roleName,
    permissions: [...actor.permissions],
  };
}
