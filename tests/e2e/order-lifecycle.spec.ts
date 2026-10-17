import { devices, expect, test, type Browser } from "@playwright/test";
import { ACCOUNTS, login } from "./helpers";

/**
 * The full order lifecycle across the three roles:
 * visitor submits (phone) → order desk approves → warehouse prepares,
 * picks, marks ready, dispatches and delivers → visitor sees "delivered".
 */
test.describe.serial("order lifecycle", () => {
  let orderId = "";
  let orderNumber = "";

  async function phone(browser: Browser) {
    const { defaultBrowserType: _ignored, ...pixel } = devices["Pixel 7"];
    return browser.newContext({ ...pixel, locale: "fa-IR", timezoneId: "Asia/Tehran" });
  }

  test("visitor submits an order", async ({ browser }) => {
    const context = await phone(browser);
    const page = await context.newPage();
    await login(page, ACCOUNTS.visitor, /\/visitor$/);
    await page.goto("/visitor/orders/new");
    await page.getByRole("button", { name: /انتخاب مشتری/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: /اتو سرویس شمال تهران/ }).click();
    await page.getByLabel("جستجوی قطعه برای افزودن").fill("KSL-TK-4410");
    await page.getByRole("button", { name: /^افزودن / }).first().click();
    await page.getByRole("button", { name: /بازبینی سفارش/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: "ثبت سفارش" }).click();
    await expect(page).toHaveURL(/\/visitor\/orders\/[a-z0-9]+\?placed=1/, { timeout: 30_000 });
    orderId = new URL(page.url()).pathname.split("/").pop()!;
    orderNumber = (await page.getByText(/AP-\d{6}/).first().textContent())!.match(/AP-\d{6}/)![0];
    await context.close();
  });

  test("order desk approves it", async ({ page }) => {
    await login(page, ACCOUNTS.manager, /\/admin$/);
    await page.goto("/admin/orders");
    await expect(page.getByText(orderNumber).first()).toBeVisible();
    await page.goto(`/admin/orders/${orderId}`);
    await page.getByRole("button", { name: "تأیید سفارش" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "تأیید سفارش" }).click();
    await expect(page.getByText("تأییدشده").first()).toBeVisible();
  });

  test("warehouse prepares, picks, dispatches and delivers", async ({ page }) => {
    await login(page, ACCOUNTS.warehouse, /\/warehouse$/);
    await page.goto("/warehouse/orders");
    await expect(page.getByText(orderNumber).first()).toBeVisible();
    await page.goto(`/warehouse/orders/${orderId}`);

    await page.getByRole("button", { name: "شروع آماده‌سازی" }).click();
    await expect(page.getByText("در حال آماده‌سازی").first()).toBeVisible();

    const ready = page.getByRole("button", { name: "آماده ارسال" });
    await expect(ready).toBeDisabled(); // nothing picked yet
    for (const box of await page.getByRole("checkbox", { name: /^جمع‌آوری / }).all()) {
      await box.click();
      await expect(box).toHaveAttribute("aria-checked", "true");
    }
    await expect(ready).toBeEnabled();
    await ready.click();
    await expect(page.getByRole("button", { name: "تأیید ارسال" })).toBeVisible();

    await page.getByRole("button", { name: "تأیید ارسال" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("روش ارسال / باربری").fill("خودروی اتوپارت");
    await dialog.getByRole("button", { name: "تأیید ارسال" }).click();
    await expect(page.getByRole("button", { name: "تأیید تحویل" })).toBeVisible();

    await page.getByRole("button", { name: "تأیید تحویل" }).click();
    await expect(page.getByText("تحویل‌شده").first()).toBeVisible();
  });

  test("visitor sees the delivered order with its history", async ({ browser }) => {
    const context = await phone(browser);
    const page = await context.newPage();
    await login(page, ACCOUNTS.visitor, /\/visitor$/);
    await page.goto(`/visitor/orders/${orderId}`);
    await expect(page.getByText("تحویل‌شده").first()).toBeVisible();
    await expect(page.getByText("ارسال‌شده").first()).toBeVisible();
    await context.close();
  });

  test("other roles cannot open the order desk", async ({ page }) => {
    await login(page, ACCOUNTS.warehouse, /\/warehouse$/);
    await page.goto(`/admin/orders/${orderId}`);
    await expect(page.getByText("این بخش در نقش شما نیست.")).toBeVisible();
    // Nothing about the order may reach the browser, not even in the streamed HTML.
    const html = await (await page.request.get(`/admin/orders/${orderId}`)).text();
    expect(html).not.toContain(orderNumber);
    expect(html).not.toContain("اتو سرویس شمال تهران");
  });
});
