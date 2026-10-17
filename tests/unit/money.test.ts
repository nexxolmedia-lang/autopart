import { describe, expect, it } from "vitest";
import { MAX_UNIT_PRICE, amountToInput, bpsToPercent, calculateLine, calculateTotals, formatMoney, parseAmount, parsePercentToBps } from "@/lib/money";

describe("calculateLine", () => {
  it("multiplies price by quantity without discount", () => {
    expect(calculateLine(1_250_000, 4)).toEqual({ gross: 5_000_000, discountAmount: 0, net: 5_000_000 });
  });

  it("applies basis-point discounts with half-up rounding", () => {
    // 3 × 333,333 = 999,999; 5% discount = 49,999.95 → net 949,999.05 → rounds to 949,999
    expect(calculateLine(333_333, 3, 500)).toEqual({ gross: 999_999, discountAmount: 50_000, net: 949_999 });
    // exact half rounds up: 1 rial × 1 at 50% → 0.5 → 1
    expect(calculateLine(1, 1, 5_000).net).toBe(1);
  });

  it("stays exact for large rial amounts", () => {
    const line = calculateLine(MAX_UNIT_PRICE, 9_999, 1);
    expect(line.gross).toBe(MAX_UNIT_PRICE * 9_999);
    expect(Number.isSafeInteger(line.gross)).toBe(true);
    expect(line.gross - line.discountAmount).toBe(line.net);
  });

  it("rejects invalid inputs instead of computing with floats", () => {
    expect(() => calculateLine(10.5, 1)).toThrow(RangeError);
    expect(() => calculateLine(10, -1)).toThrow(RangeError);
    expect(() => calculateLine(10, 1, 10_001)).toThrow(RangeError);
    expect(() => calculateLine(MAX_UNIT_PRICE + 1, 1)).toThrow(RangeError);
  });

  it("allows zero quantity (a line the order desk decided not to supply)", () => {
    expect(calculateLine(5_000_000, 0, 1_000)).toEqual({ gross: 0, discountAmount: 0, net: 0 });
  });
});

describe("calculateTotals", () => {
  it("sums gross, discount and net across lines", () => {
    const totals = calculateTotals([
      { unitPrice: 10_000_000, quantity: 2, discountBps: 1_000 },
      { unitPrice: 2_500_000, quantity: 3 },
    ]);
    expect(totals).toEqual({ subtotal: 27_500_000, discountAmount: 2_000_000, total: 25_500_000 });
    expect(totals.subtotal - totals.discountAmount).toBe(totals.total);
  });

  it("returns zeros for an empty order", () => {
    expect(calculateTotals([])).toEqual({ subtotal: 0, discountAmount: 0, total: 0 });
  });
});

describe("parsing user input", () => {
  it("parses rial amounts in Latin, Persian and Arabic digits with separators", () => {
    expect(parseAmount("12,500,000")).toBe(12_500_000);
    expect(parseAmount("۱۲٬۵۰۰٬۰۰۰")).toBe(12_500_000);
    expect(parseAmount("١٢٥٠٠٠٠٠")).toBe(12_500_000);
    expect(parseAmount(" 7120000 ")).toBe(7_120_000);
  });

  it("rejects decimals, negatives and garbage (rials have no minor unit)", () => {
    for (const bad of ["", "abc", "-5", "12.5", "1e6", "999999999999999"]) expect(parseAmount(bad)).toBeNull();
  });

  it("parses percentages to basis points", () => {
    expect(parsePercentToBps("5")).toBe(500);
    expect(parsePercentToBps("12.5")).toBe(1_250);
    expect(parsePercentToBps("۱۲٫۵")).toBe(1_250);
    expect(parsePercentToBps("٪۱۰".replace("٪", ""))).toBe(1_000);
    expect(parsePercentToBps("")).toBe(0);
    expect(parsePercentToBps("101")).toBeNull();
    expect(parsePercentToBps("abc")).toBeNull();
  });

  it("round-trips helpers", () => {
    expect(amountToInput(12_500_000)).toBe("12500000");
    expect(bpsToPercent(1_250)).toBe("12.5");
    expect(bpsToPercent(500)).toBe("5");
  });
});

describe("formatMoney", () => {
  it("formats whole rials with Persian digits and the currency label", () => {
    expect(formatMoney(125_000_000)).toBe("۱۲۵٬۰۰۰٬۰۰۰ ریال");
    expect(formatMoney(0)).toBe("۰ ریال");
  });
});
