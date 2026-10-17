import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OrderComposer, type ComposerProduct } from "@/components/visitor/order-composer";
import { toIsoDate } from "@/lib/format";
import { formatOrderNumber } from "@/lib/order-workflow";
import { requirePagePermission } from "@/server/auth/session";
import { composerDateBounds, loadComposerProducts } from "@/server/modules/orders/composer";
import { getOrderDetail } from "@/server/modules/orders/queries";

export const metadata: Metadata = { title: "ویرایش پیش‌نویس" };

export default async function EditDraftPage(props: PageProps<"/visitor/orders/[id]/edit">) {
  const { id } = await props.params;
  const actor = await requirePagePermission("orders.create", `/visitor/orders/${id}/edit`);
  const order = await getOrderDetail(actor, "visitor", id);
  if (order.status !== "DRAFT") redirect(`/visitor/orders/${id}`);
  const products = await loadComposerProducts(actor, order.items.map((i) => i.productId));
  const lines = order.items.flatMap((item) => {
    const product = products.get(item.productId) as ComposerProduct | undefined;
    return product ? [{ product, quantity: item.requestedQuantity }] : [];
  });
  const bounds = composerDateBounds();
  const date = order.requestedDeliveryDate ? toIsoDate(order.requestedDeliveryDate) : "";
  return (
    <OrderComposer
      actorId={actor.id}
      today={bounds.today}
      maxDate={bounds.maxDate}
      initial={{
        orderId: order.id,
        orderLabel: formatOrderNumber(order.number),
        customer: { id: order.customer.id, code: order.customer.code, businessName: order.customer.businessName, city: order.customer.city, addressLine1: order.customer.addressLine1 },
        lines,
        note: order.visitorNote ?? "",
        date: date >= bounds.today ? date : "",
        window: order.requestedDeliveryWindow,
      }}
    />
  );
}
