import { expect, type Page } from "@playwright/test";

export const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "AutoPart-Demo-2026";

export const ACCOUNTS = {
  admin: "admin@autopart.test",
  manager: "manager@autopart.test",
  visitor: "visitor@autopart.test",
  warehouse: "warehouse@autopart.test",
} as const;

export async function login(page: Page, email: string, landing: RegExp) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(DEMO_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(landing, { timeout: 30_000 });
}

/** Fails the test on uncaught page errors (hydration errors, runtime exceptions). */
export function trackPageErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}
