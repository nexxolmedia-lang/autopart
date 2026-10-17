import { appConfig } from "./config";
import { faNumber } from "./digits";

export type PublicAvailability = "IN_STOCK" | "LIMITED" | "OUT_OF_STOCK";

export const AVAILABILITY_LABELS: Record<PublicAvailability, string> = {
  IN_STOCK: "موجود",
  LIMITED: "موجودی محدود",
  OUT_OF_STOCK: "ناموجود",
};

export function availableQuantity(onHand: number, reserved: number): number {
  return Math.max(0, onHand - reserved);
}

/** Public label — never reveals quantities. */
export function publicAvailability(available: number, lowStockThreshold: number): PublicAvailability {
  if (available <= 0) return "OUT_OF_STOCK";
  if (available <= Math.max(lowStockThreshold, 0)) return "LIMITED";
  return "IN_STOCK";
}

export type VisitorAvailability = {
  status: PublicAvailability;
  /** Exact orderable quantity, only disclosed when at or below the display cap. */
  upTo: number | null;
  label: string;
};

/**
 * What a field visitor sees. Exact numbers are revealed only when they matter
 * (low stock); otherwise a capped figure is shown. The server remains the
 * authority — this is a display contract, not a security boundary.
 */
export function visitorAvailability(available: number, lowStockThreshold: number, cap: number = appConfig.visitorStockDisplayCap): VisitorAvailability {
  const status = publicAvailability(available, lowStockThreshold);
  if (available <= 0) return { status, upTo: 0, label: "ناموجود" };
  if (available <= cap) return { status, upTo: available, label: `قابل سفارش تا ${faNumber(available)} عدد` };
  return { status, upTo: null, label: `بیش از ${faNumber(cap)} عدد موجود` };
}
