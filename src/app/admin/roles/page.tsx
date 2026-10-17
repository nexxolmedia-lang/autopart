import type { Metadata } from "next";
import { PageTitle, Panel } from "@/components/admin/page-title";
import { NewRoleForm, RolePermissionsForm } from "@/components/admin/role-matrix";
import { faNumber } from "@/lib/digits";
import { requirePagePermission } from "@/server/auth/session";
import { listRolesWithPermissions } from "@/server/modules/users/service";

export const metadata: Metadata = { title: "نقش‌ها و مجوزها" };

export default async function RolesPage() {
  await requirePagePermission("roles.manage", "/admin/roles");
  const roles = await listRolesWithPermissions();
  return (
    <>
      <PageTitle
        eyebrow="مدیریت سیستم"
        title="نقش‌ها و مجوزها"
        description="هر نقش مجموعه‌ای از مجوزهاست و سامانه همیشه مجوزها را — نه نام نقش‌ها را — روی سرور بررسی می‌کند. می‌توانید نقش جدید بسازید، مثلاً «سرپرست انبار» با مجوز اصلاح موجودی."
      />
      <div className="space-y-6">
        {roles.map((r) => (
          <Panel
            key={r.id}
            title={
              <span>
                {r.name}
                <span className="ms-2 text-[12px] font-normal text-steel-500">
                  {faNumber(r.userCount)} کاربر · {faNumber(r.permissions.length)} مجوز
                </span>
              </span>
            }
          >
            {r.description ? <p className="mb-4 text-[13px] text-steel-600">{r.description}</p> : null}
            <RolePermissionsForm role={{ id: r.id, key: r.key, name: r.name, permissions: r.permissions }} />
          </Panel>
        ))}
        <Panel title="نقش جدید">
          <NewRoleForm />
        </Panel>
      </div>
    </>
  );
}
