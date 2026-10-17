import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { AssignmentsForm, CustomerArchiveButton } from "@/components/admin/customer-admin";
import { Kpi, PageTitle, Panel } from "@/components/admin/page-title";
import { CustomerForm } from "@/components/customers/customer-form";
import { StatusBadge } from "@/components/ui/badges";
import { tableClasses as t } from "@/components/ui/styles";
import { faNumber } from "@/lib/digits";
import { formatDate, formatDateTime } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { SALES_STATUSES, formatOrderNumber } from "@/lib/order-workflow";
import { cn, firstParam } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { getCustomerDetail, listAssignableVisitors } from "@/server/modules/customers/service";
import { listOrders } from "@/server/modules/orders/queries";
import { updateCustomerAction } from "../actions";

export const metadata: Metadata = { title: "پرونده مشتری" };

export default async function AdminCustomerPage(props: PageProps<"/admin/customers/[id]">) {
  const { id } = await props.params;
  const actor = await requirePagePermission("customers.view_all", `/admin/customers/${id}`);
  const canManage = actor.permissions.has("customers.manage");
  const [customer, orders, visitors, stats] = await Promise.all([
    getCustomerDetail(actor, id),
    listOrders(actor, "admin", { customerId: id, pageSize: 15 }),
    canManage ? listAssignableVisitors() : Promise.resolve([]),
    prisma.order.aggregate({ where: { customerId: id, status: { in: [...SALES_STATUSES] } }, _sum: { total: true }, _count: { _all: true } }),
  ]);
  const created = firstParam((await props.searchParams).created) === "1";

  return (
    <>
      <PageTitle
        back={{ href: "/admin/customers", label: "مشتریان" }}
        eyebrow={<span className="ltr">{customer.code}</span>}
        title={customer.businessName}
        description={`ایجاد ${formatDate(customer.createdAt)}${customer.createdBy ? ` توسط ${customer.createdBy.name}` : ""}`}
        actions={canManage ? <CustomerArchiveButton customerId={customer.id} active={customer.isActive} /> : null}
      />
      {created ? (
        <p role="status" className="mb-6 flex items-center gap-2 border border-ok/30 bg-ok-50 p-3.5 text-[14px] text-ok">
          <CheckCircle2 className="h-4 w-4" aria-hidden /> مشتری ایجاد شد.
        </p>
      ) : null}
      <section className="mb-6 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-3">
        <Kpi label="سفارش‌های تأییدشده" value={faNumber(stats._count._all)} />
        <Kpi label="مجموع خرید تأییدشده" value={<span className="text-[1.25rem]">{formatMoney(Number(stats._sum.total ?? 0))}</span>} />
        <Kpi label="ویزیتورها" value={faNumber(customer.assignments.length)} hint={customer.assignments.map((a) => a.user.name).join("، ") || "بدون ویزیتور"} />
      </section>
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Panel title="سفارش‌ها" bodyClassName="p-0 md:p-0">
            {orders.rows.length === 0 ? (
              <p className="p-6 text-center text-sm text-steel-500">سفارشی ثبت نشده است.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className={t.table}>
                  <thead className={t.thead}>
                    <tr>
                      <th className={t.th}>سفارش</th>
                      <th className={t.th}>ثبت</th>
                      <th className={t.th}>ویزیتور</th>
                      <th className={t.th}>وضعیت</th>
                      <th className={cn(t.th, "text-end")}>مبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.rows.map((o) => (
                      <tr key={o.id} className={t.tr}>
                        <td className={t.td}>
                          <Link href={`/admin/orders/${o.id}`} className="ltr type-data font-semibold hover:text-ember-700">
                            {formatOrderNumber(o.number)}
                          </Link>
                        </td>
                        <td className={cn(t.td, "text-[13px]")}>{formatDateTime(o.submittedAt ?? o.createdAt)}</td>
                        <td className={cn(t.td, "text-[13px]")}>{o.visitor.name}</td>
                        <td className={t.td}>
                          <StatusBadge status={o.status} />
                        </td>
                        <td className={cn(t.td, "type-data text-end")}>{o.total !== null ? formatMoney(o.total) : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
          {canManage ? (
            <Panel title="ویرایش اطلاعات">
              <CustomerForm action={updateCustomerAction.bind(null, customer.id)} submitLabel="ذخیره تغییرات" defaults={customer} />
            </Panel>
          ) : null}
        </div>
        <aside className="space-y-6">
          <Panel title="اطلاعات تماس">
            <dl className="space-y-2 text-[13.5px]">
              <div>
                <dt className="text-steel-500">فرد رابط</dt>
                <dd>{customer.contactName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-steel-500">تلفن</dt>
                <dd className="ltr text-end">{customer.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-steel-500">ایمیل</dt>
                <dd className="ltr text-end">{customer.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-steel-500">نشانی</dt>
                <dd>{[customer.addressLine1, customer.addressLine2, customer.city, customer.region, customer.postalCode].filter(Boolean).join("، ")}</dd>
              </div>
              {customer.notes ? (
                <div>
                  <dt className="text-steel-500">یادداشت</dt>
                  <dd className="whitespace-pre-line">{customer.notes}</dd>
                </div>
              ) : null}
            </dl>
          </Panel>
          {canManage ? (
            <Panel title="ویزیتورهای تخصیص‌یافته">
              <AssignmentsForm customerId={customer.id} visitors={visitors.map((v) => ({ id: v.id, name: v.name, email: v.email }))} selected={customer.assignments.map((a) => a.userId)} />
            </Panel>
          ) : null}
        </aside>
      </div>
    </>
  );
}
