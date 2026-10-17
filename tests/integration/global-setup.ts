import { execSync } from "node:child_process";

/**
 * Integration tests run against a real PostgreSQL database named by
 * TEST_DATABASE_URL. As a safety net the database name must contain "test" —
 * every test file truncates all tables.
 */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error("TEST_DATABASE_URL is not set. Point it at a disposable PostgreSQL database (see README → Testing).");
  }
  const dbName = new URL(url).pathname.replace(/^\//, "");
  if (!/test/i.test(dbName)) {
    throw new Error(`Refusing to run integration tests against "${dbName}": the database name must contain "test".`);
  }
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } });
}
