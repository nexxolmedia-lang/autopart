import { z } from "zod";
import { MAX_UNIT_PRICE } from "@/lib/money";
import { zx } from "@/server/validation";

export const SKU_PATTERN = /^[A-Z0-9][A-Z0-9-]{2,31}$/;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const currentYear = 2100; // generous upper bound; validated against yearFrom below

export const specSchema = z.object({
  label: zx.requiredText(60, "عنوان مشخصه"),
  value: zx.requiredText(120, "مقدار مشخصه"),
});

export const fitmentSchema = z
  .object({
    make: zx.requiredText(40, "سازنده خودرو"),
    model: zx.requiredText(60, "مدل"),
    yearFrom: z.coerce.number().int().min(1950, "سال باید ۱۹۵۰ یا بعد از آن باشد.").max(currentYear),
    yearTo: z
      .union([z.coerce.number().int().min(1950).max(currentYear), z.literal(""), z.null()])
      .optional()
      .transform((v) => (typeof v === "number" ? v : undefined)),
    engine: zx.optionalText(60),
  })
  .refine((f) => f.yearTo === undefined || f.yearTo >= f.yearFrom, { path: ["yearTo"], message: "سال پایان باید بعد از سال شروع باشد." });

export const productSchema = z.object({
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(SKU_PATTERN, "۳ تا ۳۲ حرف بزرگ لاتین، رقم یا خط تیره (مثلاً KSL-BD-2841)."),
  name: zx.requiredText(160, "نام کالا"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(96)
    .optional()
    .transform((v) => v || undefined)
    .refine((v) => !v || SLUG_PATTERN.test(v), "فقط حروف کوچک لاتین، رقم و خط تیره."),
  shortDescription: zx.optionalText(240),
  description: zx.requiredText(4000, "توضیحات"),
  categoryId: zx.id(),
  brandId: zx.id(),
  price: z
    .number({ error: "قیمت را وارد کنید." })
    .int()
    .min(0, "قیمت نمی‌تواند منفی باشد.")
    .max(MAX_UNIT_PRICE, "قیمت بیش از حد مجاز است."),
  oeReferences: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  specs: z.array(specSchema).max(40).default([]),
  fitments: z.array(fitmentSchema).max(100).default([]),
  weightGrams: z
    .union([z.coerce.number().int().min(0).max(1_000_000), z.literal(""), z.null()])
    .optional()
    .transform((v) => (typeof v === "number" ? v : undefined)),
  lowStockThreshold: z.coerce.number().int("فقط عدد صحیح.").min(0).max(100_000).default(5),
  isFeatured: z.boolean().default(false),
});

export type ProductInput = z.input<typeof productSchema>;

export const productCreateExtras = z.object({
  initialStock: z.coerce.number().int("فقط عدد صحیح.").min(0, "نمی‌تواند منفی باشد.").max(1_000_000).default(0),
  binLocation: z.string().trim().toUpperCase().max(24).optional().transform((v) => v || undefined),
});

export const categorySchema = z.object({
  name: zx.requiredText(80, "نام"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(80)
    .optional()
    .transform((v) => v || undefined)
    .refine((v) => !v || SLUG_PATTERN.test(v), "فقط حروف کوچک لاتین، رقم و خط تیره."),
  description: zx.optionalText(400),
  illustration: z.string().trim().max(40).default("generic"),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
  isActive: z.boolean().default(true),
});

export type CategoryInput = z.input<typeof categorySchema>;

export const brandSchema = z.object({
  name: zx.requiredText(80, "نام"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(80)
    .optional()
    .transform((v) => v || undefined)
    .refine((v) => !v || SLUG_PATTERN.test(v), "فقط حروف کوچک لاتین، رقم و خط تیره."),
  country: zx.optionalText(60),
  description: zx.optionalText(400),
  isActive: z.boolean().default(true),
});

export type BrandInput = z.input<typeof brandSchema>;
