#!/usr/bin/env node
/**
 * Starts the production build against a dedicated, freshly seeded e2e database
 * (used by playwright.config.ts as its webServer). Never touches the dev DB:
 *
 *   1. derives E2E_DATABASE_URL (default: DATABASE_URL with the database name "autopart_e2e")
 *   2. creates that database if needed, applies migrations and seeds demo data
 *   3. runs `next start` on E2E_PORT (default 3100)
 *
 * Requires `npm run build` first.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";
import { PrismaClient } from "@prisma/client";

const root = path.join(import.meta.dirname, "..");
const fileEnv = existsSync(path.join(root, ".env")) ? parseEnv(readFileSync(path.join(root, ".env"), "utf8")) : {};
const env = { ...fileEnv, ...process.env };

if (!env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");
const e2eUrl = env.E2E_DATABASE_URL ?? (() => {
  const url = new URL(env.DATABASE_URL);
  url.pathname = "/autopart_e2e";
  return url.toString();
})();
const dbName = new URL(e2eUrl).pathname.slice(1);
if (!dbName.includes("e2e")) throw new Error(`Refusing to reseed "${dbName}": the e2e database name must contain "e2e".`);
if (!existsSync(path.join(root, ".next", "BUILD_ID"))) throw new Error("No production build found. Run `npm run build` first.");

// 1. Create the database if it does not exist (connect through the main database).
const admin = new PrismaClient({ datasourceUrl: env.DATABASE_URL });
try {
  await admin.$executeRawUnsafe(`CREATE DATABASE "${dbName}" ENCODING 'UTF8' TEMPLATE template0`);
  console.log(`[e2e] created database ${dbName}`);
} catch (error) {
  if (!String(error).includes("already exists")) throw error;
} finally {
  await admin.$disconnect();
}

const port = env.E2E_PORT ?? "3100";
const childEnv = {
  ...env,
  DATABASE_URL: e2eUrl,
  APP_URL: `http://localhost:${port}`,
  DEMO_MODE: "true",
  NODE_ENV: "production",
  ALLOW_DEMO_SEED: "true",
  SEED_DEMO_PASSWORD: env.SEED_DEMO_PASSWORD ?? "AutoPart-Demo-2026",
};

const run = (args) => {
  const r = spawnSync("npx", args, { cwd: root, env: childEnv, stdio: "inherit", shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

// 2. Schema + fresh demo data.
run(["prisma", "migrate", "deploy"]);
run(["tsx", "--conditions=react-server", "prisma/seed.ts"]);

// 3. Serve the production build.
const server = spawn("npx", ["next", "start", "-p", port], { cwd: root, env: childEnv, stdio: "inherit", shell: true });
const stop = () => server.kill();
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
server.on("exit", (code) => process.exit(code ?? 0));
