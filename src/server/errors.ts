/**
 * Domain errors. Services throw these; the HTTP / Server Action layer converts
 * them into safe, user-facing responses. Anything else is treated as an
 * unexpected failure and logged without leaking details to the client.
 */
import { faNumber } from "@/lib/digits";

export type FieldErrors = Record<string, string[]>;

export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number = 400,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends DomainError {
  constructor(
    message: string,
    readonly fieldErrors: FieldErrors = {},
  ) {
    super(message, "VALIDATION_FAILED", 422);
  }
}

export class UnauthenticatedError extends DomainError {
  constructor(message = "برای ادامه وارد حساب کاربری شوید.") {
    super(message, "UNAUTHENTICATED", 401);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "شما مجوز انجام این عملیات را ندارید.") {
    super(message, "FORBIDDEN", 403);
  }
}

export class NotFoundError extends DomainError {
  constructor(message = "مورد درخواستی یافت نشد.") {
    super(message, "NOT_FOUND", 404);
  }
}

export class ConflictError extends DomainError {
  constructor(
    message: string,
    readonly fieldErrors: FieldErrors = {},
  ) {
    super(message, "CONFLICT", 409);
  }
}

export class RateLimitError extends DomainError {
  constructor(message = "تعداد تلاش‌ها بیش از حد مجاز است. چند دقیقه دیگر دوباره تلاش کنید.") {
    super(message, "RATE_LIMITED", 429);
  }
}

export type StockShortage = {
  productId: string;
  sku: string;
  name: string;
  requested: number;
  available: number;
};

export class InsufficientStockError extends DomainError {
  constructor(readonly shortages: StockShortage[]) {
    super(InsufficientStockError.describe(shortages), "INSUFFICIENT_STOCK", 409);
  }

  static describe(shortages: StockShortage[]): string {
    if (shortages.length === 1) {
      const s = shortages[0]!;
      return s.available > 0
        ? `از «${s.name}» (${s.sku}) در حال حاضر فقط ${faNumber(s.available)} عدد قابل سفارش است.`
        : `«${s.name}» (${s.sku}) در حال حاضر ناموجود است.`;
    }
    return `تعداد ${faNumber(shortages.length)} قلم از موجودی قابل سفارش بیشتر است.`;
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
