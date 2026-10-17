import { expect, test } from "@playwright/test";
import { trackPageErrors } from "./helpers";

test.describe("public website", () => {
  test("homepage renders in Persian, right-to-left", async ({ page }) => {
    const errors = trackPageErrors(page);
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "fa-IR");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("از موتور تا اکسل");
    const fontFamily = await page.locator("body").evaluate((el) => getComputedStyle(el).fontFamily);
    expect(fontFamily.toLowerCase()).toContain("arial");
    expect(errors).toEqual([]);
  });

  test("catalogue search finds a part by SKU and opens its page", async ({ page }) => {
    await page.goto("/products?q=VLX-BC-0712");
    const card = page.getByRole("link", { name: /کالیپر ترمز جلو چپ/ }).first();
    await expect(card).toBeVisible();
    await card.click();
    await expect(page).toHaveURL(/\/products\/[^/?]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("کالیپر ترمز جلو چپ بازسازی‌شده");
    await expect(page.getByText("VLX-BC-0712").first()).toBeVisible();
    // Prices are shown in rials with Persian digits.
    await expect(page.getByText(/[۰-۹٬]+ ریال/).first()).toBeVisible();
  });

  test("catalogue paginates and category pages filter", async ({ page }) => {
    await page.goto("/products");
    const firstPage = await page.locator('main a[href^="/products/"]').first().getAttribute("href");
    await page.getByRole("navigation", { name: "صفحه‌بندی" }).getByRole("link", { name: "صفحه بعد" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator('main a[href^="/products/"]').first()).not.toHaveAttribute("href", firstPage!);

    await page.goto("/categories/brakes");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.locator('main a[href^="/products/"]').count()).toBeGreaterThan(0);
  });

  test("unknown routes return a Persian 404", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("چیزی پیدا")).toBeVisible();
  });

  test("unknown products show the 404 page and are excluded from indexing", async ({ page }) => {
    // The page shell streams before the product lookup finishes, so the HTTP
    // status is already sent; Next.js renders the not-found UI and adds noindex.
    await page.goto("/products/this-part-does-not-exist");
    await expect(page.getByText("چیزی پیدا")).toBeVisible();
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
  });

  test("private areas redirect to sign-in", async ({ page }) => {
    await page.goto("/admin/orders");
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Forders/);
  });

  test("sign-in rejects a wrong password with a generic message", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[name="email"]').fill("visitor@autopart.test");
    await page.locator('input[name="password"]').fill("not-the-password-1");
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText("ایمیل یا رمز عبور نادرست است.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("sign-in returns to the page that was requested", async ({ page }) => {
    await page.goto("/visitor/customers");
    await expect(page).toHaveURL(/\/login\?next=/);
    await page.locator('input[name="email"]').fill("visitor@autopart.test");
    await page.locator('input[name="password"]').fill(process.env.SEED_DEMO_PASSWORD ?? "AutoPart-Demo-2026");
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/visitor\/customers$/, { timeout: 30_000 });
  });

  test("works offline after the first visit (service worker)", async ({ page, context }) => {
    await page.goto("/visitor/install");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload(); // now controlled by the worker, which stores this page
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await context.setOffline(true);
    try {
      await page.reload();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible(); // served from the page cache
      await page.goto("/about");
      await expect(page.getByText("اتصال برقرار نیست.")).toBeVisible(); // never visited: offline fallback
    } finally {
      await context.setOffline(false);
    }
  });

  test("serves an RTL web app manifest and the offline page", async ({ request }) => {
    const manifest = await (await request.get("/manifest.webmanifest")).json();
    expect(manifest).toMatchObject({ dir: "rtl", lang: "fa-IR", start_url: "/visitor", display: "standalone" });
    expect((await request.get("/sw.js")).status()).toBe(200);
    expect((await request.get("/offline")).status()).toBe(200);
    expect((await request.get("/icons/icon-512.png")).status()).toBe(200);
  });
});
