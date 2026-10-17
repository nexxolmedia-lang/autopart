import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";
import { defineConfig } from "vitest/config";

// Read .env without exporting it wholesale (DATABASE_URL must not leak into tests).
const env: Record<string, string | undefined> = existsSync(".env") ? parseEnv(readFileSync(".env", "utf8")) : {};
const testDatabaseUrl = env.TEST_DATABASE_URL ?? process.env.TEST_DATABASE_URL;
// globalSetup runs in this (main) process: expose the URL there as well.
if (testDatabaseUrl) process.env.TEST_DATABASE_URL = testDatabaseUrl;

const alias = {
  "@": path.resolve(import.meta.dirname, "src"),
  // `server-only` throws outside the React Server bundle; it is a no-op in tests.
  "server-only": path.resolve(import.meta.dirname, "tests/stubs/server-only.ts"),
};

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        resolve: { alias },
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          globalSetup: ["tests/integration/global-setup.ts"],
          // One shared PostgreSQL database: run files sequentially.
          fileParallelism: false,
          testTimeout: 60_000,
          hookTimeout: 120_000,
          env: {
            DATABASE_URL: testDatabaseUrl ?? "",
            TEST_DATABASE_URL: testDatabaseUrl ?? "",
            TZ: "UTC",
          },
        },
      },
    ],
  },
});
