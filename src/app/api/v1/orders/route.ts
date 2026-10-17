import type { NextRequest } from "next/server";
import { requireActor } from "@/server/auth/session";
import { assertSameOrigin, errorResponse, json } from "@/server/http";
import { listOrders } from "@/server/modules/orders/queries";
import { createOrder } from "@/server/modules/orders/service";
import { can } from "@/server/auth/actor";

/**
 * GET  /api/v1/orders?status=&q=&page=   — orders visible to the caller
 * POST /api/v1/orders  { customerId, items[], visitorNote?, requestedDeliveryDate?,
 *                        requestedDeliveryWindow?, idempotencyKey?, submit? }
 *
 * Prices, totals and stock are always computed server-side; any such fields in
 * the request body are ignored.
 */
export async function GET(request: NextRequest) {
  try {
    const actor = await requireActor();
    const sp = request.nextUrl.searchParams;
    const panel = can(actor, "orders.view_all") ? "admin" : can(actor, "orders.view_own") ? "visitor" : "warehouse";
    const result = await listOrders(actor, panel, {
      status: sp.get("status") ?? undefined,
      q: sp.get("q") ?? undefined,
      page: Number(sp.get("page")) || 1,
    });
    return json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const actor = await requireActor();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") return json({ error: { code: "BAD_REQUEST", message: "بدنه درخواست باید JSON باشد." } }, { status: 400 });
    const { submit = true, ...input } = body;
    const order = await createOrder(actor, input as Parameters<typeof createOrder>[1], { submit: submit !== false });
    return json({ order }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
