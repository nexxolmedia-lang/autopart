import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/server/auth/cookie-name";

/**
 * Optimistic gate only: redirects visitors without a session cookie away from
 * the private areas before any rendering work. Real authorisation happens on
 * the server for every page, Server Action and Route Handler — this is never
 * relied on as a security boundary.
 */
const PUBLIC_EXCEPTIONS = ["/visitor/install"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_EXCEPTIONS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();
  if (!request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/visitor/:path*", "/warehouse/:path*"],
};
