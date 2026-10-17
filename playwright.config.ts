import { defineConfig, devices } from "@playwright/test";

const port = process.env.E2E_PORT ?? "3100";
const baseURL = `http://localhost:${port}`;

/**
 * End-to-end tests run against the production build and a dedicated, freshly
 * seeded database (see scripts/e2e-server.mjs). Run `npm run build` first.
 * Tests share one database, so they run serially.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    locale: "fa-IR",
    timezoneId: "Asia/Tehran",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /visitor-mobile/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /visitor-mobile/ },
  ],
  webServer: {
    command: "node scripts/e2e-server.mjs",
    url: `${baseURL}/api/health`,
    // Always start fresh so every run sees the same seeded stock.
    reuseExistingServer: false,
    timeout: 240_000,
    stdout: "pipe",
  },
});
