import { expect, test } from "@playwright/test";
import { ACCOUNTS, login, trackPageErrors } from "./helpers";

/**
 * Visitor app on a phone: choose a customer, add a part with limited stock,
 * see the "up to N" limit enforced, fix it and submit. Stock is then reserved.
 */
test("visitor places an order within available stock", async ({ page }) => {
  const errors = trackPageErrors(page);
  await login(page, ACCOUNTS.visitor, /\/visitor$/);
  await page.goto("/visitor/orders/new");

  await page.getByRole("button", { name: /انتخاب مشتری/ }).click();
  const picker = page.getByRole("dialog");
  await picker.getByRole("button", { name: /تعمیرگاه مرکزی پارس/ }).click();

  await page.getByLabel("جستجوی قطعه برای افزودن").fill("VLX-BC-0712");
  await page.getByRole("button", { name: /^افزودن کالیپر ترمز جلو چپ/ }).click();

  const quantity = page.getByLabel(/^تعداد کالیپر ترمز جلو چپ/);
  await quantity.fill("3");
  // Seeded with exactly two available: the app explains the limit and blocks review.
  await expect(page.getByRole("alert").filter({ hasText: "۲" })).toBeVisible();
  await expect(page.getByRole("button", { name: /بازبینی سفارش/ })).toBeDisabled();
  await page.getByRole("button", { name: "تنظیم روی ۲" }).click();
  await expect(quantity).toHaveValue("2");

  await page.getByRole("button", { name: /بازبینی سفارش/ }).click();
  const review = page.getByRole("dialog");
  await expect(review).toContainText("تعمیرگاه مرکزی پارس");
  await review.getByRole("button", { name: "ثبت سفارش" }).click();

  await expect(page).toHaveURL(/\/visitor\/orders\/[a-z0-9]+\?placed=1/, { timeout: 30_000 });
  await expect(page.getByText("ثبت‌شده").first()).toBeVisible();
  await expect(page.getByText(/AP-\d{6}/).first()).toBeVisible();

  // The part is now fully reserved: the composer shows it as unavailable.
  await page.goto("/visitor/orders/new");
  await page.getByLabel("جستجوی قطعه برای افزودن").fill("VLX-BC-0712");
  await expect(page.getByRole("button", { name: /کالیپر ترمز جلو چپ.*ناموجود است/ })).toBeVisible();
  expect(errors).toEqual([]);
});
