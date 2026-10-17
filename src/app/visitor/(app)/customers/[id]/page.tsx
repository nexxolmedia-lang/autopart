import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, MapPin, Phone, Plus } from "lucide-react";
import { OrderRow } from "@/components/visitor/order-row";
import { ButtonLink } from "@/components/ui/button";
import { firstParam } from "@/lib/utils";
import { requirePageAnyPermission } from "@/server/auth/session";
import { getCustomerDetail } from "@/server/modules/customers/service";
import { listOrders } from "@/server/modules/orders/queries";

export const metadata: Metadata = { title: "مشتری" };

export default async function VisitorCustomerPage(props: PageProps<"/visitor/customers/[id]">) {
  const { id } = await props.params;
  const actor = await requirePageAnyPermission(["customers.view_assigned", "customers.view_all"], `/visitor/customers/${id}`);
  const customer = await getCustomerDetail(actor, id);
  const created = firstParam((await props.searchParams).created) === "1";
  const orders = await listOrders(actor, "visitor", { customerId: id, pageSize: 10 });
  const address = [customer.addressLine1, customer.addressLine2, customer.city, customer.region, customer.postalCode].filter(Boolean).join("، ");

  return (
    <div className="space-y-6">
      <Link href="/visitor/customers" className="inline-flex items-center gap-1.5 text-[13px] text-steel-600 hover:text-ink">
        <ArrowRight className="h-3.5 w-3.5" aria-hidden /> مشتریان
      </Link>
      {created ? (
        <p role="status" className="flex items-center gap-2 border border-ok/30 bg-ok-50 p-3.5 text-[13.5px] text-ok">
          <CheckCircle2 className="h-4 w-4" aria-hidden /> مشتری ایجاد و به شما تخصیص داده شد.
        </p>
      ) : null}
      <header className="border-b border-ink pb-5">
        <p className="ltr type-data text-end text-[12.5px] text-steel-500">{customer.code}</p>
        <h1 className="type-display mt-2 text-[2rem] leading-[1.02]">{customer.businessName}</h1>
        {customer.contactName ? <p className="mt-2 text-[14px] text-steel-700">فرد رابط: {customer.contactName}</p> : null}
      </header>
      {customer.isActive ? (
        <ButtonLink href={`/visitor/orders/new?customer=${customer.id}`} size="lg" className="w-full">
          <Plus className="h-4 w-4" aria-hidden /> سفارش جدید برای {customer.businessName}
        </ButtonLink>
      ) : (
        <p className="border border-line bg-bone p-3 text-sm text-steel-700">این مشتری بایگانی شده و سفارش جدید نمی‌پذیرد.</p>
      )}
      <ul className="grid gap-px border border-line bg-line text-[14px]">
        {customer.phone ? (
          <li>
            <a href={`tel:${customer.phone.replace(/[^+\d]/g, "")}`} className="flex items-center gap-3 bg-white px-4 py-3.5 hover:bg-bone/50">
              <Phone className="h-4 w-4 text-steel-500" aria-hidden />
              <span className="ltr tabular">{customer.phone}</span>
              <span className="ms-auto text-[12px] font-medium text-ember-700">تماس</span>
            </a>
          </li>
        ) : null}
        {customer.email ? (
          <li>
            <a href={`mailto:${customer.email}`} className="flex items-center gap-3 bg-white px-4 py-3.5 hover:bg-bone/50">
              <Mail className="h-4 w-4 text-steel-500" aria-hidden />
              <span className="ltr">{customer.email}</span>
            </a>
          </li>
        ) : null}
        <li>
          <a href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer noopener" className="flex items-center gap-3 bg-white px-4 py-3.5 hover:bg-bone/50">
            <MapPin className="h-4 w-4 shrink-0 text-steel-500" aria-hidden />
            <span>{address}</span>
            <span className="ms-auto shrink-0 text-[12px] font-medium text-ember-700">نقشه</span>
          </a>
        </li>
      </ul>
      {customer.notes ? (
        <section className="border border-line bg-bone/50 p-4">
          <p className="type-eyebrow text-steel-500">یادداشت</p>
          <p className="mt-1.5 whitespace-pre-line text-[14px]">{customer.notes}</p>
        </section>
      ) : null}
      <section>
        <h2 className="type-heading mb-3 text-lg">سفارش‌ها</h2>
        {orders.rows.length === 0 ? (
          <p className="border border-dashed border-line p-6 text-center text-sm text-steel-500">هنوز سفارشی برای این مشتری ثبت نشده است.</p>
        ) : (
          <ul className="divide-y divide-line border border-line">
            {orders.rows.map((o) => (
              <li key={o.id}>
                <OrderRow order={o} href={`/visitor/orders/${o.id}`} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
