import type { NextRequest } from "next/server";
import { formatDate } from "@/lib/format";
import { ORDER_STATUS_META } from "@/lib/order-workflow";
import { requirePermission } from "@/server/auth/session";
import { errorResponse } from "@/server/http";
import {
  inventoryLevels,
  ordersByDate,
  ordersByStatus,
  resolveRange,
  salesByCustomer,
  salesByProduct,
  salesByVisitor,
  toCsv,
} from "@/server/modules/reports/service";

/**
 * GET /admin/reports/export/{report}?from=YYYY-MM-DD&to=YYYY-MM-DD → CSV
 * UTF-8 with BOM so spreadsheet apps render Persian text correctly.
 * Amounts are whole rials.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/admin/reports/export/[report]">) {
  try {
    const actor = await requirePermission("reports.view");
    const { report } = await ctx.params;
    const sp = request.nextUrl.searchParams;
    const range = resolveRange({ from: sp.get("from") ?? undefined, to: sp.get("to") ?? undefined });
    let csv: string;

    switch (report) {
      case "orders-by-date": {
        const rows = await ordersByDate(actor, range);
        csv = toCsv(["تاریخ (میلادی)", "تاریخ (شمسی)", "سفارش‌های ثبت‌شده", "سفارش‌های تأییدشده", "فروش تأییدشده (ریال)"], rows.map((r) => [r.date, formatDate(`${r.date}T12:00:00Z`), r.orders, r.salesOrders, r.sales]));
        break;
      }
      case "orders-by-status": {
        const rows = await ordersByStatus(actor, range);
        csv = toCsv(["وضعیت", "کد", "تعداد سفارش", "مبلغ (ریال)"], rows.map((r) => [ORDER_STATUS_META[r.status].label, r.status, r.orders, r.total]));
        break;
      }
      case "sales-by-product": {
        const rows = await salesByProduct(actor, range, 500);
        csv = toCsv(["کد کالا", "نام کالا", "برند", "تعداد فروش", "تعداد سفارش", "فروش (ریال)"], rows.map((r) => [r.sku, r.name, r.brand, r.units, r.orders, r.revenue]));
        break;
      }
      case "sales-by-customer": {
        const rows = await salesByCustomer(actor, range, 500);
        csv = toCsv(["کد مشتری", "مشتری", "شهر", "تعداد سفارش", "فروش (ریال)", "آخرین سفارش"], rows.map((r) => [r.code, r.name, r.city, r.orders, r.revenue, r.lastOrder ? formatDate(r.lastOrder) : ""]));
        break;
      }
      case "sales-by-visitor": {
        const rows = await salesByVisitor(actor, range);
        csv = toCsv(["ویزیتور", "ثبت‌شده", "تأییدشده", "ردشده", "مشتریان", "فروش (ریال)", "میانگین سفارش (ریال)"], rows.map((r) => [r.name, r.submitted, r.approved, r.rejected, r.customers, r.revenue, r.average]));
        break;
      }
      case "inventory": {
        const rows = await inventoryLevels(actor);
        csv = toCsv(["کد کالا", "نام کالا", "دسته", "قفسه", "فیزیکی", "رزروشده", "آزاد", "حد هشدار", "کمبود", "ارزش موجودی (ریال)"], rows.map((r) => [r.sku, r.name, r.category, r.bin ?? "", r.onHand, r.reserved, r.available, r.threshold, r.isLow ? "بله" : "خیر", r.stockValue]));
        break;
      }
      default:
        return new Response("Not found", { status: 404 });
    }

    const filename = `autopart-${report}-${range.from}_${range.to}.csv`;
    return new Response(`﻿${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
