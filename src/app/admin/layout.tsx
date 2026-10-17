import type { Metadata } from "next";
import { NotificationBell } from "@/components/app/notification-bell";
import { UserMenu } from "@/components/app/user-menu";
import { AdminMobileNav, AdminSidebar, type AdminNavItem } from "@/components/admin/admin-nav";
import { requirePagePermission } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { countLowStock } from "@/server/modules/inventory/service";
import { getPanelChrome } from "@/server/panel-data";

export const instant = false;

export const metadata: Metadata = {
  title: { default: "پنل مدیریت", template: "%s · مدیریت اتوپارت" },
  robots: { index: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const actor = await requirePagePermission("panel.admin", "/admin");
  const has = (p: Parameters<typeof actor.permissions.has>[0]) => actor.permissions.has(p);
  const [chrome, awaiting, lowStock, openInquiries] = await Promise.all([
    getPanelChrome(actor),
    has("orders.view_all") ? prisma.order.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }) : Promise.resolve(0),
    has("inventory.view") ? countLowStock() : Promise.resolve(0),
    has("inquiries.view") ? prisma.contactInquiry.count({ where: { handledAt: null } }) : Promise.resolve(0),
  ]);

  const items: (AdminNavItem & { show: boolean })[] = [
    { href: "/admin", label: "داشبورد", icon: "dashboard", group: "نمای کلی", show: true },
    { href: "/admin/orders", label: "سفارش‌ها", icon: "orders", group: "نمای کلی", badge: awaiting, show: has("orders.view_all") },
    { href: "/admin/reports", label: "گزارش‌ها", icon: "reports", group: "نمای کلی", show: has("reports.view") },
    { href: "/admin/products", label: "کالاها", icon: "products", group: "کاتالوگ و انبار", show: has("products.manage") },
    { href: "/admin/categories", label: "دسته‌بندی‌ها", icon: "categories", group: "کاتالوگ و انبار", show: has("products.manage") },
    { href: "/admin/brands", label: "برندها", icon: "brands", group: "کاتالوگ و انبار", show: has("products.manage") },
    { href: "/admin/inventory", label: "موجودی انبار", icon: "inventory", group: "کاتالوگ و انبار", badge: lowStock, show: has("inventory.view") },
    { href: "/admin/inventory/movements", label: "گردش کالا", icon: "movements", group: "کاتالوگ و انبار", show: has("inventory.view") },
    { href: "/admin/customers", label: "مشتریان", icon: "customers", group: "فروش", show: has("customers.view_all") },
    { href: "/admin/inquiries", label: "پیام‌های وب‌سایت", icon: "inquiries", group: "فروش", badge: openInquiries, show: has("inquiries.view") },
    { href: "/admin/users", label: "کاربران", icon: "users", group: "مدیریت سیستم", show: has("users.manage") },
    { href: "/admin/roles", label: "نقش‌ها و مجوزها", icon: "roles", group: "مدیریت سیستم", show: has("roles.manage") },
    { href: "/admin/audit", label: "گزارش ممیزی", icon: "audit", group: "مدیریت سیستم", show: has("audit.view") },
  ];
  const visible = items.filter((i) => i.show).map(({ show: _show, ...rest }) => rest);

  return (
    <div className="flex min-h-dvh bg-paper">
      <AdminSidebar items={visible} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 md:px-8">
            <AdminMobileNav items={visible} />
            <p className="hidden text-[13px] text-steel-500 sm:block">میز سفارش و مدیریت اتوپارت</p>
            <div className="ms-auto flex items-center gap-1">
              <NotificationBell items={chrome.notifications} unread={chrome.unread} />
              <UserMenu name={actor.name} role={actor.roleName} panels={chrome.panels} />
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
