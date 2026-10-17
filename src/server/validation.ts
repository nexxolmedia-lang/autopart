import { z } from "zod";
import { faNumber } from "@/lib/digits";
import { ValidationError } from "./errors";

/** Parse untrusted input or throw a ValidationError carrying per-field messages. */
export function parseInput<S extends z.ZodType>(schema: S, input: unknown, message = "لطفاً موارد مشخص‌شده را اصلاح کنید."): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const flat = z.flattenError(result.error);
    const fieldErrors: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(flat.fieldErrors as Record<string, string[] | undefined>)) {
      if (value?.length) fieldErrors[key] = value;
    }
    // Surface nested / form-level issues under their dotted path so array fields (items.0.quantity) stay addressable.
    for (const issue of result.error.issues) {
      if (issue.path.length > 1) {
        const key = issue.path.join(".");
        (fieldErrors[key] ??= []).push(issue.message);
      }
    }
    const formMessage = flat.formErrors[0] ?? message;
    throw new ValidationError(formMessage, fieldErrors);
  }
  return result.data;
}

/** Common field helpers. */
export const zx = {
  id: () => z.string().trim().min(1, "این فیلد الزامی است.").max(64),
  requiredText: (max: number, label = "این فیلد") =>
    z.string().trim().min(1, `${label} الزامی است.`).max(max, `${label} حداکثر ${faNumber(max)} نویسه باشد.`),
  optionalText: (max: number) =>
    z
      .string()
      .trim()
      .max(max, `حداکثر ${faNumber(max)} نویسه مجاز است.`)
      .optional()
      .transform((v) => (v ? v : undefined)),
  /** Checkbox / "true" | "false" from forms. */
  boolean: () =>
    z.union([z.boolean(), z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")]).transform((v) => v === true || v === "on" || v === "true"),
  isoDate: () => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ نامعتبر است."),
};
