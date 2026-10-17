import { connection } from "next/server";
import { prisma } from "@/server/db";

/** Liveness + database readiness probe for load balancers and uptime monitors. */
export async function GET() {
  await connection();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "up" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "degraded", database: "down" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
