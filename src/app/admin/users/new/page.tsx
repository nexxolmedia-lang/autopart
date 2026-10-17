import type { Metadata } from "next";
import { PageTitle, Panel } from "@/components/admin/page-title";
import { UserForm } from "@/components/admin/user-forms";
import { requirePagePermission } from "@/server/auth/session";
import { listRolesWithPermissions } from "@/server/modules/users/service";
import { createUserAction } from "../actions";

export const metadata: Metadata = { title: "کاربر جدید" };

export default async function NewUserPage() {
  await requirePagePermission("users.manage", "/admin/users/new");
  const roles = await listRolesWithPermissions();
  return (
    <>
      <PageTitle back={{ href: "/admin/users", label: "کاربران" }} eyebrow="مدیریت سیستم" title="کاربر جدید" />
      <Panel className="max-w-3xl">
        <UserForm action={createUserAction} roles={roles.map((r) => ({ id: r.id, name: r.name }))} mode="create" />
      </Panel>
    </>
  );
}
