import { z } from "zod";
import { BPS_DENOMINATOR, MAX_LINE_QUANTITY, MAX_UNIT_PRICE } from "@/lib/money";
import { zx } from "@/server/validation";

const deliveryWindow = z.enum(["ANY", "MORNING", "AFTERNOON"]);

const optionalIsoDate = z
  .union([zx.isoDate(), z.literal(""), z.null()])
  .optional()
  .transform((v) => v || undefined);

export const orderLineInputSchema = z.object({
  productId: zx.id(),
  quantity: z.coerce
    .number({ error: "تعداد را وارد کنید." })
    .int("تعداد باید عدد صحیح باشد.")
    .min(1, "تعداد باید حداقل ۱ باشد.")
    .max(MAX_LINE_QUANTITY, "تعداد نمی‌تواند بیشتر از ۹٬۹۹۹ باشد."),
});

/**
 * What a visitor sends when saving or submitting an order. Note what is NOT
 * here: prices, totals, statuses or stock — those are always derived on the
 * server and any such fields in a request are ignored.
 */
export const orderDraftSchema = z
  .object({
    customerId: zx.id(),
    items: z
      .array(orderLineInputSchema)
      .min(1, "دست‌کم یک کالا به سفارش اضافه کنید.")
      .max(100, "هر سفارش حداکثر ۱۰۰ قلم می‌تواند داشته باشد."),
    visitorNote: zx.optionalText(1000),
    requestedDeliveryDate: optionalIsoDate,
    requestedDeliveryWindow: deliveryWindow.default("ANY"),
    idempotencyKey: z.uuid().optional(),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.items.forEach((item, index) => {
      if (seen.has(item.productId)) {
        ctx.addIssue({ code: "custom", path: ["items", index, "productId"], message: "هر کالا فقط یک بار می‌تواند در سفارش باشد." });
      }
      seen.add(item.productId);
    });
  });

export type OrderDraftInput = z.input<typeof orderDraftSchema>;

export const transitionPayloadSchema = z.object({
  reason: zx.optionalText(500),
  expectedVersion: z.coerce.number().int().min(0).optional(),
  carrier: zx.optionalText(80),
  reference: zx.optionalText(80),
});

export type TransitionPayload = z.input<typeof transitionPayloadSchema>;

export const lineAdjustmentSchema = z.object({
  expectedVersion: z.coerce.number().int().min(0),
  note: zx.optionalText(500),
  lines: z
    .array(
      z.object({
        itemId: zx.id(),
        quantity: z.coerce.number().int("فقط عدد صحیح.").min(0, "نمی‌تواند منفی باشد.").max(MAX_LINE_QUANTITY),
        unitPrice: z.coerce.number().int().min(0, "قیمت نمی‌تواند منفی باشد.").max(MAX_UNIT_PRICE).optional(),
        discountBps: z.coerce.number().int().min(0).max(BPS_DENOMINATOR, "تخفیف نمی‌تواند بیش از ۱۰۰٪ باشد.").optional(),
      }),
    )
    .min(1)
    .max(100),
});

export type LineAdjustmentInput = z.input<typeof lineAdjustmentSchema>;

export const deliveryArrangementSchema = z.object({
  expectedVersion: z.coerce.number().int().min(0).optional(),
  confirmedDeliveryDate: optionalIsoDate,
  confirmedDeliveryWindow: deliveryWindow.optional(),
});

export type DeliveryArrangementInput = z.input<typeof deliveryArrangementSchema>;
