import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PageTitle, Panel } from "@/components/admin/page-title";
import { PasswordResetForm, UserForm } from "@/components/admin/user-forms";
import { StatusBadge } from "@/components/ui/badges";
import { faNumber } from "@/lib/digits";
import { formatDateTime } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { formatOrderNumber } from "@/lib/order-workflow";
import { firstParam } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";
import { listOrders } from "@/server/modules/orders/queries";
import { getUserDetail, listRolesWithPermissions } from "@/server/modules/users/service";
import { resetPasswordAction, updateUserAction } from "../actions";

export const metadata: Metadata = { title: "کاربر" };

export default async function UserDetailPage(props: PageProps<"/admin/users/[id]">) {
  const { id } = await props.params;
  const actor = await requirePagePermission("users.manage", `/admin/users/${id}`);
  const [user, roles] = await Promise.all([getUserDetail(actor, id), listRolesWithPermissions()]);
  const orders = actor.permissions.has("orders.view_all") ? await listOrders(actor, "admin", { visitorId: id, pageSize: 8 }) : null;
  const created = firstParam((await props.searchParams).created) === "1";

  return (
    <>
      <PageTitle back={{ href: "/admin/users", label: "کاربران" }} eyebrow={user.role.name} title={user.name} description={`آخرین ورود: ${user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "هرگز"} · ${faNumber(user._count.sessions)} نشست فعال`} />
      {created ? (
        <p role="status" className="mb-6 flex items-center gap-2 border border-ok/30 bg-ok-50 p-3.5 text-[14px] text-ok">
          <CheckCircle2 className="h-4 w-4" aria-hidden /> کاربر ایجاد شد.
        </p>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Panel title="اطلاعات حساب">
            <UserForm
              action={updateUserAction.bind(null, user.id)}
              roles={roles.map((r) => ({ id: r.id, name: r.name }))}
              mode="edit"
              isSelf={user.id === actor.id}
              defaults={{ name: user.name, email: user.email, phone: user.phone, roleId: user.roleId, isActive: user.isActive }}
            />
          </Panel>
          {orders && orders.rows.length ? (
            <Panel title="آخرین سفارش‌های ثبت‌شده" bodyClassName="p-0 md:p-0">
              <ul className="divide-y divide-line">
                {orders.rows.map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 px-4 py-3 text-[13.5px] hover:bg-bone/40 md:px-5">
                      <span className="ltr type-data font-semibold">{formatOrderNumber(o.number)}</span>
                      <span className="flex-1 truncate">{o.customerName}</span>
                      <StatusBadge status={o.status} />
                      <span className="type-data">{o.total !== null ? formatMoney(o.total) : ""}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
        <aside className="space-y-6">
          <Panel title="بازنشانی رمز عبور">
            <PasswordResetForm action={resetPasswordAction.bind(null, user.id)} />
          </Panel>
          {user.customerAssignments.length ? (
            <Panel title={`مشتریان تخصیص‌یافته · ${faNumber(user.customerAssignments.length)}`}>
              <ul className="space-y-2 text-[13.5px]">
                {user.customerAssignments.map((a) => (
                  <li key={a.customerId}>
                    <Link href={`/admin/customers/${a.customer.id}`} className="hover:text-ember-700">
                      {a.customer.businessName}
                    </Link>
                    <span className="text-[12px] text-steel-500"> · {a.customer.city}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </aside>
      </div>
    </>
  );
}
