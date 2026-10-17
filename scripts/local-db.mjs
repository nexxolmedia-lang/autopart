#!/usr/bin/env node
/**
 * Local PostgreSQL for development machines without Docker or a system install.
 *
 * Uses the `embedded-postgres` package, which ships real PostgreSQL binaries
 * through npm. Data is persisted in `.local-db/` (git-ignored) so it survives
 * restarts — this is a genuine PostgreSQL server, not an in-memory substitute.
 *
 *   npm run db:local          # start (foreground, Ctrl+C to stop)
 *
 * If you already run PostgreSQL (Docker, Homebrew, managed service…), skip this
 * and point DATABASE_URL at it instead.
 */
import EmbeddedPostgres from "embedded-postgres";
import { existsSync, rmSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const port = Number(process.env.LOCAL_DB_PORT ?? 54329);
const dataDir = path.resolve(root, process.env.LOCAL_DB_DIR ?? ".local-db/data");
const user = process.env.LOCAL_DB_USER ?? "autopart";
const password = process.env.LOCAL_DB_PASSWORD ?? "autopart";
const databases = (process.env.LOCAL_DB_NAMES ?? "autopart_dev,autopart_test").split(",");

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user,
  password,
  port,
  persistent: true,
  authMethod: "scram-sha-256",
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  onLog: () => {},
  onError: (message) => {
    const text = String(message ?? "").trim();
    if (text) console.error(`[postgres] ${text}`);
  },
});

/** True when something already accepts connections on the port. */
function portInUse(p) {
  return new Promise((resolve) => {
    const socket = net.connect({ port: p, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

async function main() {
  if (await portInUse(port)) {
    console.log(`PostgreSQL is already running on port ${port}. Nothing to do.`);
    process.exit(0);
  }
  // A crash or killed session can leave a stale lock file behind; nothing is listening, so remove it.
  const pidFile = path.join(dataDir, "postmaster.pid");
  if (existsSync(pidFile)) {
    console.log("Removing stale postmaster.pid from a previous session.");
    rmSync(pidFile);
  }
  const fresh = !existsSync(path.join(dataDir, "PG_VERSION"));
  if (fresh) {
    console.log(`Initialising PostgreSQL cluster in ${path.relative(root, dataDir)} …`);
    await pg.initialise();
  }
  await pg.start();

  const client = pg.getPgClient();
  await client.connect();
  for (const name of databases) {
    const { rowCount } = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
    if (!rowCount) {
      await client.query(`CREATE DATABASE "${name}"`);
      console.log(`Created database ${name}`);
    }
  }
  await client.end();

  console.log(`\nPostgreSQL is running on port ${port}`);
  for (const name of databases) {
    console.log(`  postgresql://${user}:${password}@localhost:${port}/${name}`);
  }
  console.log("\nPress Ctrl+C to stop.\n");

  const shutdown = async () => {
    console.log("\nStopping PostgreSQL …");
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  // Keep the process alive.
  setInterval(() => {}, 1 << 30);
}

main().catch(async (error) => {
  console.error(error ?? "PostgreSQL failed to start (see .local-db/data for logs).");
  try {
    await pg.stop();
  } catch {}
  process.exit(1);
});
