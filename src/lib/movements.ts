import type { StatusTone } from "./order-workflow";

export type MovementTypeKey = "RECEIPT" | "ADJUSTMENT" | "STOCK_COUNT" | "DISPATCH" | "RETURN";

export const MOVEMENT_LABELS: Record<MovementTypeKey, { label: string; tone: StatusTone }> = {
  RECEIPT: { label: "ورود کالا", tone: "success" },
  ADJUSTMENT: { label: "اصلاح موجودی", tone: "progress" },
  STOCK_COUNT: { label: "شمارش انبار", tone: "info" },
  DISPATCH: { label: "خروج (ارسال سفارش)", tone: "neutral" },
  RETURN: { label: "مرجوعی", tone: "attention" },
};
