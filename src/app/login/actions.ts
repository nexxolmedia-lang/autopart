"use server";

import { redirect } from "next/navigation";
import { homePathFor } from "@/lib/permissions";
import { runAction, formText, type ActionState } from "@/server/action-utils";
import { clearSessionCookie, getClientIp, getUserAgent, setSessionCookie } from "@/server/auth/session";
import { login } from "@/server/modules/auth/service";

/** Only allow same-site relative redirects after login (prevents open redirects). */
function safeNext(value: string | undefined, fallback: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

export async function loginAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  let destination: string | null = null;
  const result = await runAction(async () => {
    const { token, expiresAt, actor } = await login(
      { email: formText(form, "email") ?? "", password: formText(form, "password") ?? "" },
      { ipAddress: await getClientIp(), userAgent: await getUserAgent() },
    );
    await setSessionCookie(token, expiresAt);
    destination = safeNext(formText(form, "next"), homePathFor(actor.permissions));
  });
  if (result.ok && destination) redirect(destination);
  return result;
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login?signedOut=1");
}
