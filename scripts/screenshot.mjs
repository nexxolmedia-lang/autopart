#!/usr/bin/env node
/**
 * Visual QA helper: full-page screenshots of a running instance.
 *
 *   node scripts/screenshot.mjs <url> <out.png> [width=1440] [height=900] [--login=email] [--full]
 *
 * With --login the script signs in first using SEED_DEMO_PASSWORD (dev only).
 */
import { chromium } from "@playwright/test";

const [url, out, width = "1440", height = "900", ...flags] = process.argv.slice(2);
if (!url || !out) {
  console.error("usage: screenshot.mjs <url> <out.png> [width] [height] [--login=email] [--full]");
  process.exit(1);
}
const login = flags.find((f) => f.startsWith("--login="))?.split("=")[1];
const full = flags.includes("--full");
const clipY = flags.find((f) => f.startsWith("--y="))?.split("=")[1];
const mobile = Number(width) < 768;

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: Number(width), height: Number(height) },
  deviceScaleFactor: mobile ? 2 : 1,
  isMobile: mobile,
  hasTouch: mobile,
  reducedMotion: "reduce",
});
const page = await context.newPage();
if (login) {
  const origin = new URL(url).origin;
  await page.goto(`${origin}/login`);
  await page.fill('input[name="email"]', login);
  await page.fill('input[name="password"]', process.env.SEED_DEMO_PASSWORD ?? "AutoPart-Demo-2026");
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30_000 }), page.click('button[type="submit"]')]);
}
await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(600);
await page.screenshot(clipY ? { path: out, fullPage: true, clip: { x: 0, y: Number(clipY), width: Number(width), height: Number(height) } } : { path: out, fullPage: full });
await browser.close();
console.log(`saved ${out}`);
