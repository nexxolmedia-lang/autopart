import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { PageTitle } from "@/components/admin/page-title";
import { Badge } from "@/components/ui/badges";
import { ButtonLink } from "@/components/ui/button";
import { inputClasses, selectClasses, tableClasses as t } from "@/components/ui/styles";
import { faNumber } from "@/lib/digits";
import { formatRelative } from "@/lib/format";
import { cn, firstParam } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";
import { listRolesWithPermissions, listUsers } from "@/server/modules/users/service";

export const metadata: Metadata = { title: "کاربران" };

export default async function UsersPage(props: PageProps<"/admin/users">) {
  const actor = await requirePagePermission("users.manage", "/admin/users");
  const params = await props.searchParams;
  const q = firstParam(params.q) ?? "";
  const roleId = firstParam(params.role) ?? "";
  const status = (firstParam(params.status) as "active" | "inactive" | "all" | undefined) ?? "active";
  const [users, roles] = await Promise.all([listUsers(actor, { q: q || undefined, roleId: roleId || undefined, status }), listRolesWithPermissions()]);
  const now = new Date();

  return (
    <>
      <PageTitle
        eyebrow="مدیریت سیستم"
        title="کاربران"
        description="حساب‌های کارکنان، ویزیتورها و انبارداران. غیرفعال کردن یک حساب، همه نشست‌های آن را بلافاصله می‌بندد."
        actions={
          <ButtonLink href="/admin/users/new">
            <Plus className="h-4 w-4" aria-hidden /> کاربر جدید
          </ButtonLink>
        }
      />
      <Form action="/admin/users" className="mb-5 grid gap-3 border border-line bg-white p-4 md:grid-cols-[1.5fr_1fr_1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" aria-hidden />
          <input name="q" type="search" defaultValue={q} placeholder="نام یا ایمیل" aria-label="جستجو" className={cn(inputClasses, "h-10 ps-9")} />
        </div>
        <select name="role" defaultValue={roleId} aria-label="نقش" className={cn(inputClasses, selectClasses, "h-10")}>
          <option value="">همه نقش‌ها</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status} aria-label="وضعیت" className={cn(inputClasses, selectClasses, "h-10")}>
          <option value="active">فعال</option>
          <option value="inactive">غیرفعال</option>
          <option value="all">همه</option>
        </select>
        <button type="submit" className="h-10 bg-ink px-4 text-sm font-medium text-bone hover:bg-graphite">
          اعمال
        </button>
      </Form>
      <div className={t.wrap}>
        <table className={t.table}>
          <thead className={t.thead}>
            <tr>
              <th className={t.th}>کاربر</th>
              <th className={t.th}>نقش</th>
              <th className={cn(t.th, "text-end")}>سفارش‌ها</th>
              <th className={cn(t.th, "text-end")}>مشتریان</th>
              <th className={t.th}>آخرین ورود</th>
              <th className={t.th}>وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={t.tr}>
                <td className={t.td}>
                  <Link href={`/admin/users/${u.id}`} className="font-medium hover:text-ember-700">
                    {u.name}
                  </Link>
                  <p className="ltr text-end text-[12px] text-steel-500">{u.email}</p>
                </td>
                <td className={t.td}>{u.role.name}</td>
                <td className={cn(t.td, "type-data text-end")}>{faNumber(u._count.ordersCreated)}</td>
                <td className={cn(t.td, "type-data text-end")}>{faNumber(u._count.customerAssignments)}</td>
                <td className={cn(t.td, "text-[13px] text-steel-600")}>{u.lastLoginAt ? formatRelative(u.lastLoginAt, now) : "هرگز"}</td>
                <td className={t.td}>{u.isActive ? <Badge tone="success">فعال</Badge> : <Badge tone="muted">غیرفعال</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
