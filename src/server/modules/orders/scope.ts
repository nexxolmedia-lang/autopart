import type { Prisma } from "@prisma/client";
import { WAREHOUSE_STATUSES } from "@/lib/order-workflow";
import { can, type Actor } from "@/server/auth/actor";
import { ForbiddenError } from "@/server/errors";

export type OrderPanel = "admin" | "visitor" | "warehouse";

/**
 * Row-level visibility for orders — applied to every order read and to the
 * row lock in every command, which is what prevents insecure direct object
 * references (guessing another visitor's order id yields "not found").
 *
 * Without a panel, returns the union of everything the actor may see.
 */
export function orderScope(actor: Actor, panel?: OrderPanel): Prisma.OrderWhereInput {
  const none: Prisma.OrderWhereInput = { id: "__no_access__" };
  const own: Prisma.OrderWhereInput = { visitorId: actor.id };
  const warehouse: Prisma.OrderWhereInput = { status: { in: [...WAREHOUSE_STATUSES] } };

  switch (panel) {
    case "admin":
      if (!can(actor, "orders.view_all")) throw new ForbiddenError();
      return {};
    case "visitor":
      if (!can(actor, "orders.view_own")) throw new ForbiddenError();
      return own;
    case "warehouse":
      if (!can(actor, "orders.fulfil")) throw new ForbiddenError();
      return warehouse;
    default: {
      if (can(actor, "orders.view_all")) return {};
      const scopes: Prisma.OrderWhereInput[] = [];
      if (can(actor, "orders.view_own") || can(actor, "orders.create")) scopes.push(own);
      if (can(actor, "orders.fulfil")) scopes.push(warehouse);
      if (scopes.length === 0) return none;
      return scopes.length === 1 ? scopes[0]! : { OR: scopes };
    }
  }
}
