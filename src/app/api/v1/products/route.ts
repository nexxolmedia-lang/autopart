import type { NextRequest } from "next/server";
import { requireActor } from "@/server/auth/session";
import { errorResponse, json } from "@/server/http";
import { searchOrderableProducts } from "@/server/modules/products/queries";

/**
 * GET /api/v1/products?q=&category=&page=&ids=a,b
 * Orderable products with prices and availability shaped for the caller's
 * permissions (visitors receive capped availability, never raw stock).
 */
export async function GET(request: NextRequest) {
  try {
    const actor = await requireActor();
    const sp = request.nextUrl.searchParams;
    const ids = sp.get("ids")?.split(",").filter(Boolean).slice(0, 100);
    const result = await searchOrderableProducts(actor, {
      q: sp.get("q")?.slice(0, 100) ?? undefined,
      category: sp.get("category") ?? undefined,
      ids,
      page: Number(sp.get("page")) || 1,
      pageSize: Number(sp.get("pageSize")) || 20,
    });
    return json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
