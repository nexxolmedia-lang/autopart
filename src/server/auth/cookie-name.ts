/**
 * Cookie settings shared by the session layer and the edge proxy.
 *
 * Secure cookies are the default in production. Set COOKIE_SECURE=false only
 * for a production build served over plain HTTP on a private network.
 * Secure cookies use the `__Host-` prefix, which browsers bind to the exact
 * origin (no Domain attribute, Path=/, HTTPS only).
 */
export const SECURE_COOKIES =
  process.env.COOKIE_SECURE !== undefined ? process.env.COOKIE_SECURE === "true" : process.env.NODE_ENV === "production";

export const SESSION_COOKIE = SECURE_COOKIES ? "__Host-autopart_session" : "autopart_session";
