import "server-only";
import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";
import { InsufficientStockError, isDomainError, ForbiddenError, type FieldErrors } from "./errors";

/**
 * JSON API helpers for Route Handlers (`/api/v1/*`). These endpoints use the
 * same session cookie as the web app; the same services back both, so a future
 * native client only needs a token-based authenticator in `requireActor`.
 */
export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { ...init, headers: { "Cache-Control": "no-store", ...(init?.headers ?? {}) } });
}

export function errorResponse(error: unknown) {
  // Let Next.js control-flow errors (prerender bail-outs, redirects, notFound) through.
  unstable_rethrow(error);
  if (error instanceof InsufficientStockError) {
    return json({ error: { code: error.code, message: error.message, shortages: error.shortages } }, { status: error.status });
  }
  if (isDomainError(error)) {
    const fieldErrors = "fieldErrors" in error ? (error as { fieldErrors?: FieldErrors }).fieldErrors : undefined;
    return json({ error: { code: error.code, message: error.message, fieldErrors } }, { status: error.status });
  }
  console.error("[api] unexpected error", error);
  return json({ error: { code: "INTERNAL", message: "خطای غیرمنتظره در سرور." } }, { status: 500 });
}

/**
 * CSRF defence for cookie-authenticated, state-changing requests: the Origin
 * (or Referer) must match the host. Server Actions get the equivalent check
 * from Next.js automatically.
 */
export function assertSameOrigin(request: Request) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const origin = request.headers.get("origin") ?? request.headers.get("referer");
  if (!host || !origin) throw new ForbiddenError("درخواست بین‌سایتی مسدود شد.");
  try {
    if (new URL(origin).host !== host) throw new ForbiddenError("درخواست بین‌سایتی مسدود شد.");
  } catch (error) {
    if (error instanceof ForbiddenError) throw error;
    throw new ForbiddenError("درخواست بین‌سایتی مسدود شد.");
  }
}
