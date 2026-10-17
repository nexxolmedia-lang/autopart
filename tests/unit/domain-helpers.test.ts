import { describe, expect, it } from "vitest";
import { availableQuantity, publicAvailability, visitorAvailability } from "@/lib/availability";
import { faNumber, toLatinDigits, toPersianDigits } from "@/lib/digits";
import { businessToday, formatCalendarDate, formatDate, parseIsoDate, upcomingDeliveryDays } from "@/lib/format";
import { SYSTEM_ROLES, homePathFor } from "@/lib/permissions";
import { hashPassword, needsRehash, validatePasswordStrength, verifyPassword } from "@/server/auth/password";

describe("availability", () => {
  it("never goes below zero", () => {
    expect(availableQuantity(5, 7)).toBe(0);
    expect(availableQuantity(10, 3)).toBe(7);
  });

  it("maps quantities to public labels without exposing numbers", () => {
    expect(publicAvailability(0, 5)).toBe("OUT_OF_STOCK");
    expect(publicAvailability(5, 5)).toBe("LIMITED");
    expect(publicAvailability(6, 5)).toBe("IN_STOCK");
  });

  it("reveals exact orderable quantity to visitors only at or below the cap", () => {
    expect(visitorAvailability(2, 3)).toMatchObject({ upTo: 2, status: "LIMITED", label: "قابل سفارش تا ۲ عدد" });
    expect(visitorAvailability(120, 3)).toMatchObject({ upTo: null, status: "IN_STOCK" });
    expect(visitorAvailability(0, 3)).toMatchObject({ upTo: 0, status: "OUT_OF_STOCK" });
  });
});

describe("Persian digits and Solar Hijri dates", () => {
  it("converts digits both ways", () => {
    expect(toPersianDigits("AP-12")).toBe("AP-۱۲");
    expect(toLatinDigits("۱۴۰۵/۰۷/۲۱")).toBe("1405/07/21");
    expect(faNumber(1234567)).toBe("۱٬۲۳۴٬۵۶۷");
  });

  it("formats dates in the Persian calendar", () => {
    expect(formatDate("2026-10-13T08:00:00Z")).toBe("۲۱ مهر ۱۴۰۵");
    expect(formatCalendarDate("2026-10-12T00:00:00Z")).toBe("دوشنبه ۲۰ مهر ۱۴۰۵");
  });

  it("computes 'today' in Tehran time", () => {
    // 22:00 UTC on 13 Oct is already 14 Oct in Tehran (UTC+3:30).
    expect(businessToday(new Date("2026-10-13T22:00:00Z"))).toBe("2026-10-14");
  });

  it("offers upcoming delivery days without Fridays", () => {
    const days = upcomingDeliveryDays("2026-10-13", 10);
    expect(days).toHaveLength(10);
    expect(days.some((d) => parseIsoDate(d.iso)!.getUTCDay() === 5)).toBe(false);
    expect(days[0]!.iso).toBe("2026-10-13");
  });

  it("validates ISO dates strictly", () => {
    expect(parseIsoDate("2026-02-30")).toBeNull();
    expect(parseIsoDate("2026-02-28")).not.toBeNull();
  });
});

describe("permissions", () => {
  it("routes each role to its workspace", () => {
    expect(homePathFor(SYSTEM_ROLES.ADMIN.permissions)).toBe("/admin");
    expect(homePathFor(SYSTEM_ROLES.MANAGER.permissions)).toBe("/admin");
    expect(homePathFor(SYSTEM_ROLES.WAREHOUSE.permissions)).toBe("/warehouse");
    expect(homePathFor(SYSTEM_ROLES.VISITOR.permissions)).toBe("/visitor");
  });

  it("keeps sensitive permissions out of the visitor and warehouse roles", () => {
    const visitor = new Set<string>(SYSTEM_ROLES.VISITOR.permissions);
    for (const p of ["inventory.adjust", "pricing.manage", "orders.review", "panel.admin", "orders.fulfil"]) expect(visitor.has(p)).toBe(false);
    const warehouse = new Set<string>(SYSTEM_ROLES.WAREHOUSE.permissions);
    for (const p of ["inventory.adjust", "pricing.manage", "orders.review", "customers.manage"]) expect(warehouse.has(p)).toBe(false);
  });
});

describe("password hashing", () => {
  it("hashes with scrypt and verifies", async () => {
    const hash = await hashPassword("Correct-Horse-9");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("Correct-Horse-9", hash)).toBe(true);
    expect(await verifyPassword("wrong-password-1", hash)).toBe(false);
    expect(needsRehash(hash)).toBe(false);
  });

  it("uses a unique salt per hash", async () => {
    expect(await hashPassword("Same-Password-1")).not.toBe(await hashPassword("Same-Password-1"));
  });

  it("rejects malformed stored hashes", async () => {
    expect(await verifyPassword("x", "plain-text")).toBe(false);
  });

  it("enforces a minimum password policy", () => {
    expect(validatePasswordStrength("short1")).not.toBeNull();
    expect(validatePasswordStrength("onlyletterspassword")).not.toBeNull();
    expect(validatePasswordStrength("Good-Password-1")).toBeNull();
  });
});
