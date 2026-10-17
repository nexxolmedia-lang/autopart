import "server-only";
import { unstable_rethrow } from "next/navigation";
import { InsufficientStockError, isDomainError, type FieldErrors, type StockShortage } from "./errors";

/**
 * Uniform result shape for Server Actions, consumed by `useActionState`.
 * Domain errors become friendly messages; anything unexpected is logged on the
 * server and reported generically (no stack traces or SQL reach the client).
 */
export type ActionState<T = unknown> = {
  ok?: boolean;
  message?: string;
  error?: string;
  code?: string;
  fieldErrors?: FieldErrors;
  shortages?: StockShortage[];
  data?: T;
  /** Changes on every submission so clients can react to repeated identical results. */
  at?: number;
};

export async function runAction<T>(fn: () => Promise<T>, success?: string | ((result: T) => string)): Promise<ActionState<T>> {
  try {
    const data = await fn();
    return { ok: true, data, message: typeof success === "function" ? success(data) : success, at: Date.now() };
  } catch (error) {
    // Let redirect()/notFound()/forbidden() propagate.
    unstable_rethrow(error);
    if (error instanceof InsufficientStockError) {
      return { ok: false, error: error.message, code: error.code, shortages: error.shortages, at: Date.now() };
    }
    if (isDomainError(error)) {
      const fieldErrors = "fieldErrors" in error ? (error as { fieldErrors?: FieldErrors }).fieldErrors : undefined;
      return { ok: false, error: error.message, code: error.code, fieldErrors, at: Date.now() };
    }
    console.error("[action] unexpected error", error);
    return { ok: false, error: "خطایی در سامانه رخ داد. لطفاً دوباره تلاش کنید.", code: "INTERNAL", at: Date.now() };
  }
}

/** FormData helpers. */
export const formText = (form: FormData, key: string): string | undefined => {
  const value = form.get(key);
  return typeof value === "string" ? value : undefined;
};

export const formBool = (form: FormData, key: string): boolean => {
  const value = form.get(key);
  return value === "on" || value === "true" || value === "1";
};
