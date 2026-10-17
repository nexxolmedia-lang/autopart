import type { Metadata } from "next";
import { OrderComposer, type ComposerCustomer, type ComposerProduct } from "@/components/visitor/order-composer";
import { firstParam } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { customerScope } from "@/server/modules/customers/service";
import { composerDateBounds, loadComposerProducts } from "@/server/modules/orders/composer";

export const metadata: Metadata = { title: "سفارش جدید" };

export default async function NewOrderPage(props: PageProps<"/visitor/orders/new">) {
  const actor = await requirePagePermission("orders.create", "/visitor/orders/new");
  const params = await props.searchParams;
  const customerId = firstParam(params.customer);
  const productId = firstParam(params.product);
  let customer: ComposerCustomer | null = null;
  if (customerId) {
    customer = await prisma.customer.findFirst({
      where: { AND: [{ id: customerId, isActive: true }, customerScope(actor)] },
      select: { id: true, code: true, businessName: true, city: true, addressLine1: true, contactName: true },
    });
  }
  const product = productId ? ((await loadComposerProducts(actor, [productId])).get(productId) as ComposerProduct | undefined) : undefined;
  const lines = product && product.availability.upTo !== 0 ? [{ product, quantity: 1 }] : [];
  const bounds = composerDateBounds();
  return (
    <OrderComposer
      key={`${customer?.id ?? "new"}:${productId ?? ""}`}
      actorId={actor.id}
      initial={{ customer, lines }}
      today={bounds.today}
      maxDate={bounds.maxDate}
    />
  );
}
