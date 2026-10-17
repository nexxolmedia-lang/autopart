import type { Metadata } from "next";
import { VisitorCheckboxes } from "@/components/admin/customer-admin";
import { PageTitle, Panel } from "@/components/admin/page-title";
import { CustomerForm } from "@/components/customers/customer-form";
import { requirePagePermission } from "@/server/auth/session";
import { listAssignableVisitors } from "@/server/modules/customers/service";
import { createAdminCustomerAction } from "../actions";

export const metadata: Metadata = { title: "مشتری جدید" };

export default async function NewAdminCustomerPage() {
  const actor = await requirePagePermission("customers.create", "/admin/customers/new");
  const visitors = actor.permissions.has("customers.manage") ? await listAssignableVisitors() : [];
  return (
    <>
      <PageTitle back={{ href: "/admin/customers", label: "مشتریان" }} eyebrow="فروش" title="مشتری جدید" />
      <Panel className="max-w-3xl">
        <CustomerForm action={createAdminCustomerAction} submitLabel="ایجاد مشتری">
          {visitors.length ? (
            <fieldset className="min-w-0 border-t border-line pt-5">
              <legend className="mb-3 text-[14px] font-semibold">تخصیص به ویزیتور</legend>
              <VisitorCheckboxes visitors={visitors.map((v) => ({ id: v.id, name: v.name, email: v.email }))} selected={[]} />
            </fieldset>
          ) : null}
        </CustomerForm>
      </Panel>
    </>
  );
}
