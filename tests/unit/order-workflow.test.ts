import { describe, expect, it } from "vitest";
import { SYSTEM_ROLES } from "@/lib/permissions";
import { availableActions, checkTransition, formatOrderNumber, parseOrderNumber, type OrderStatusKey } from "@/lib/order-workflow";

const actor = (id: string, role: keyof typeof SYSTEM_ROLES) => ({ id, permissions: new Set<string>(SYSTEM_ROLES[role].permissions) });
const visitor = actor("v1", "VISITOR");
const otherVisitor = actor("v2", "VISITOR");
const manager = actor("m1", "MANAGER");
const warehouse = actor("w1", "WAREHOUSE");
const admin = actor("a1", "ADMIN");
const order = (status: OrderStatusKey, visitorId = "v1") => ({ status, visitorId });

describe("order workflow", () => {
  it("lets only the owning visitor submit a draft", () => {
    expect(checkTransition("submit", order("DRAFT"), visitor).allowed).toBe(true);
    expect(checkTransition("submit", order("DRAFT"), otherVisitor)).toMatchObject({ allowed: false, code: "FORBIDDEN" });
    expect(checkTransition("submit", order("SUBMITTED"), visitor)).toMatchObject({ allowed: false, code: "INVALID_TRANSITION" });
  });

  it("allows managers to review, approve and reject submitted orders", () => {
    expect(availableActions(order("SUBMITTED"), manager)).toEqual(expect.arrayContaining(["start_review", "approve", "reject", "cancel"]));
    expect(checkTransition("approve", order("UNDER_REVIEW"), manager).allowed).toBe(true);
    expect(checkTransition("reject", order("UNDER_REVIEW"), manager)).toEqual({ allowed: true, reasonRequired: true });
  });

  it("never lets visitors approve, reject or fulfil", () => {
    for (const action of ["approve", "reject", "start_review", "start_preparing", "dispatch"] as const) {
      expect(checkTransition(action, order(action === "start_preparing" ? "APPROVED" : action === "dispatch" ? "READY_FOR_DISPATCH" : "SUBMITTED"), visitor).allowed).toBe(false);
    }
  });

  it("blocks self-approval unless the actor holds orders.approve_own", () => {
    const managerOwnOrder = order("SUBMITTED", "m1");
    expect(checkTransition("approve", managerOwnOrder, manager)).toMatchObject({ allowed: false, code: "FORBIDDEN" });
    expect(checkTransition("approve", order("SUBMITTED", "a1"), admin).allowed).toBe(true);
  });

  it("lets a visitor withdraw only until the order desk picks the order up", () => {
    expect(checkTransition("cancel", order("SUBMITTED"), visitor)).toEqual({ allowed: true, reasonRequired: false });
    expect(checkTransition("cancel", order("UNDER_REVIEW"), visitor)).toMatchObject({ allowed: false, code: "FORBIDDEN" });
    expect(checkTransition("cancel", order("APPROVED"), manager)).toEqual({ allowed: true, reasonRequired: true });
  });

  it("does not allow cancelling once goods have left the warehouse", () => {
    for (const status of ["DISPATCHED", "DELIVERED", "REJECTED", "CANCELLED"] as const) {
      expect(checkTransition("cancel", order(status), admin)).toMatchObject({ allowed: false, code: "INVALID_TRANSITION" });
    }
  });

  it("gives the warehouse only fulfilment steps, in order", () => {
    expect(availableActions(order("APPROVED"), warehouse)).toEqual(["start_preparing"]);
    expect(availableActions(order("PREPARING"), warehouse)).toEqual(["mark_ready"]);
    expect(availableActions(order("READY_FOR_DISPATCH"), warehouse)).toEqual(["dispatch"]);
    expect(availableActions(order("DISPATCHED"), warehouse)).toEqual(["deliver"]);
    expect(availableActions(order("SUBMITTED"), warehouse)).toEqual([]);
    expect(checkTransition("dispatch", order("PREPARING"), warehouse)).toMatchObject({ allowed: false, code: "INVALID_TRANSITION" });
  });

  it("formats and parses order numbers", () => {
    expect(formatOrderNumber(53)).toBe("AP-000053");
    expect(parseOrderNumber("AP-000053")).toBe(53);
    expect(parseOrderNumber("ap53")).toBe(53);
    expect(parseOrderNumber("53")).toBe(53);
    expect(parseOrderNumber("brake")).toBeNull();
  });
});
