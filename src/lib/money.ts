/**
 * Monetary arithmetic.
 *
 * Amounts are whole Iranian rials stored as integers (BIGINT in PostgreSQL).
 * Intermediate products are computed with BigInt so large quantities × prices
 * never lose precision, and rounding is explicit (half-up) — no floating point
 * is ever used for money.
 */
import { appConfig } from "./config";
import { toLatinDigits } from "./digits";

export const BPS_DENOMINATOR = 10_000;
/** 100 billion rials per unit — far above any catalogue item, low enough to stay exact. */
export const MAX_UNIT_PRICE = 100_000_000_000;
export const MAX_LINE_QUANTITY = 9_999;

function divideHalfUp(numerator: bigint, denominator: bigint): bigint {
  // Values are non-negative in this domain.
  return (numerator * 2n + denominator) / (denominator * 2n);
}

export type LineAmounts = {
  gross: number;
  discountAmount: number;
  net: number;
};

export function calculateLine(unitPrice: number, quantity: number, discountBps = 0): LineAmounts {
  assertIntegerInRange("unitPrice", unitPrice, 0, MAX_UNIT_PRICE);
  assertIntegerInRange("quantity", quantity, 0, MAX_LINE_QUANTITY);
  assertIntegerInRange("discountBps", discountBps, 0, BPS_DENOMINATOR);

  const gross = BigInt(unitPrice) * BigInt(quantity);
  const net = divideHalfUp(gross * BigInt(BPS_DENOMINATOR - discountBps), BigInt(BPS_DENOMINATOR));
  return {
    gross: Number(gross),
    discountAmount: Number(gross - net),
    net: Number(net),
  };
}

export type OrderTotals = {
  subtotal: number;
  discountAmount: number;
  total: number;
};

export function calculateTotals(lines: ReadonlyArray<{ unitPrice: number; quantity: number; discountBps?: number }>): OrderTotals {
  let subtotal = 0;
  let discount = 0;
  let total = 0;
  for (const line of lines) {
    const amounts = calculateLine(line.unitPrice, line.quantity, line.discountBps ?? 0);
    subtotal += amounts.gross;
    discount += amounts.discountAmount;
    total += amounts.net;
  }
  return { subtotal, discountAmount: discount, total };
}

function assertIntegerInRange(name: string, value: number, min: number, max: number) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer between ${min} and ${max} (received ${value})`);
  }
}

/**
 * Parse a user-entered rial amount ("۱۲٬۵۰۰٬۰۰۰", "12,500,000", "12500000").
 * Accepts Persian, Arabic-Indic and Latin digits. Returns null when invalid.
 */
export function parseAmount(input: string): number | null {
  const cleaned = toLatinDigits(input).trim().replace(/[\s,٬_]/g, "");
  if (!/^\d{1,12}$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return value <= MAX_UNIT_PRICE ? value : null;
}

/** Percentage string ("12.5", "۱۲٫۵") → basis points (1250). */
export function parsePercentToBps(input: string): number | null {
  const cleaned = toLatinDigits(input).trim().replace(/[%٪]$/, "").replace("٫", ".");
  if (cleaned === "") return 0;
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ""] = cleaned.split(".");
  const bps = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return bps <= BPS_DENOMINATOR ? bps : null;
}

/** Value for an editable amount field (plain Latin digits, no separators). */
export function amountToInput(amount: number): string {
  return String(Math.trunc(amount));
}

export function bpsToPercent(bps: number): string {
  const whole = Math.floor(bps / 100);
  const fraction = bps % 100;
  return fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(2, "0").replace(/0$/, "")}`;
}

const numberFormatter = new Intl.NumberFormat(appConfig.locale, { maximumFractionDigits: 0 });

/** "۱۲۵٬۰۰۰٬۰۰۰ ریال" */
export function formatMoney(amount: number): string {
  return `${numberFormatter.format(amount)} ${appConfig.currencyLabel}`;
}

/** Amount without the currency label, for dense tables. */
export function formatAmount(amount: number): string {
  return numberFormatter.format(amount);
}
