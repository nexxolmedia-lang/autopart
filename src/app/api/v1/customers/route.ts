import type { NextRequest } from "next/server";
import { requireActor } from "@/server/auth/session";
import { errorResponse, json } from "@/server/http";
import { searchCustomersForPicker } from "@/server/modules/customers/service";

/** GET /api/v1/customers?q= — customers the caller may order for. */
export async function GET(request: NextRequest) {
  try {
    const actor = await requireActor();
    const q = request.nextUrl.searchParams.get("q")?.slice(0, 80) ?? "";
    return json({ items: await searchCustomersForPicker(actor, q, 30) });
  } catch (error) {
    return errorResponse(error);
  }
}
