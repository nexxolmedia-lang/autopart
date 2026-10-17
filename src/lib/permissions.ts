/**
 * Permission catalogue.
 *
 * Permissions are the unit of authorisation; roles are just named bundles of
 * permissions stored in the database (and editable by administrators). Code
 * always checks permissions — never role names — so new roles can be added
 * without touching application logic.
 */
export const PERMISSIONS = {
  "panel.admin": { group: "دسترسی", description: "ورود به پنل مدیریت" },
  "panel.warehouse": { group: "دسترسی", description: "ورود به پنل انبار" },
  "panel.visitor": { group: "دسترسی", description: "ورود به اپلیکیشن ویزیتور" },

  "products.manage": { group: "کاتالوگ", description: "ایجاد، ویرایش و بایگانی کالاها، دسته‌ها و برندها" },
  "pricing.manage": { group: "کاتالوگ", description: "تعیین قیمت رسمی فروش و قیمت اقلام سفارش" },

  "inventory.view": { group: "انبار", description: "مشاهده موجودی دقیق و تاریخچه گردش کالا" },
  "inventory.adjust": { group: "انبار", description: "ثبت ورود کالا، اصلاحیه و شمارش موجودی" },

  "customers.view_assigned": { group: "مشتریان", description: "مشاهده مشتریان تخصیص‌یافته به خود" },
  "customers.view_all": { group: "مشتریان", description: "مشاهده همه مشتریان" },
  "customers.create": { group: "مشتریان", description: "ایجاد مشتری جدید" },
  "customers.manage": { group: "مشتریان", description: "ویرایش مشتریان و مدیریت تخصیص ویزیتورها" },

  "orders.create": { group: "سفارش‌ها", description: "ایجاد، ویرایش پیش‌نویس و ثبت سفارش برای مشتریان مجاز" },
  "orders.view_own": { group: "سفارش‌ها", description: "مشاهده سفارش‌های ثبت‌شده توسط خود" },
  "orders.view_all": { group: "سفارش‌ها", description: "مشاهده همه سفارش‌ها" },
  "orders.review": { group: "سفارش‌ها", description: "بررسی، اصلاح، تأیید و رد سفارش‌ها" },
  "orders.approve_own": { group: "سفارش‌ها", description: "تأیید سفارش‌هایی که خودشان ثبت کرده‌اند" },
  "orders.cancel": { group: "سفارش‌ها", description: "لغو سفارش پس از ثبت" },
  "orders.fulfil": { group: "سفارش‌ها", description: "آماده‌سازی، جمع‌آوری، ارسال و تحویل سفارش‌های تأییدشده" },

  "reports.view": { group: "گزارش‌ها", description: "مشاهده و خروجی گرفتن از گزارش‌ها" },
  "audit.view": { group: "گزارش‌ها", description: "مشاهده گزارش ممیزی" },
  "inquiries.view": { group: "گزارش‌ها", description: "مشاهده پیام‌های ارسالی از وب‌سایت" },

  "users.manage": { group: "مدیریت سیستم", description: "ایجاد و مدیریت حساب‌های کاربری" },
  "roles.manage": { group: "مدیریت سیستم", description: "تغییر مجوزهای هر نقش" },
} as const satisfies Record<string, { group: string; description: string }>;

export type PermissionKey = keyof typeof PERMISSIONS;

export const PERMISSION_KEYS = Object.keys(PERMISSIONS) as PermissionKey[];

export function isPermissionKey(value: string): value is PermissionKey {
  return Object.prototype.hasOwnProperty.call(PERMISSIONS, value);
}

/** Roles that ship with the platform. The ADMIN role always holds every permission. */
export const SYSTEM_ROLES = {
  ADMIN: {
    name: "مدیر سیستم",
    description: "دسترسی کامل به همه بخش‌های سامانه.",
    permissions: PERMISSION_KEYS,
  },
  MANAGER: {
    name: "مدیر فروش",
    description: "مسئول میز سفارش: بررسی و تأیید سفارش‌ها، مدیریت کاتالوگ، قیمت، موجودی و مشتریان.",
    permissions: [
      "panel.admin",
      "products.manage",
      "pricing.manage",
      "inventory.view",
      "inventory.adjust",
      "customers.view_all",
      "customers.create",
      "customers.manage",
      "orders.view_all",
      "orders.review",
      "orders.cancel",
      "orders.fulfil",
      "reports.view",
      "audit.view",
      "inquiries.view",
    ],
  },
  VISITOR: {
    name: "ویزیتور فروش",
    description: "نماینده فروش میدانی که به مشتریان سر می‌زند و با گوشی سفارش ثبت می‌کند.",
    permissions: ["panel.visitor", "orders.create", "orders.view_own", "customers.view_assigned", "customers.create"],
  },
  WAREHOUSE: {
    name: "انباردار",
    description: "آماده‌سازی، جمع‌آوری و ارسال سفارش‌های تأییدشده؛ دسترسی فقط‌خواندنی به موجودی.",
    permissions: ["panel.warehouse", "inventory.view", "orders.fulfil"],
  },
  WAREHOUSE_SUPERVISOR: {
    name: "سرپرست انبار",
    description: "انبارداری که مجاز به ثبت ورود کالا و اصلاح موجودی نیز هست.",
    permissions: ["panel.warehouse", "inventory.view", "inventory.adjust", "orders.fulfil"],
  },
} as const satisfies Record<string, { name: string; description: string; permissions: readonly PermissionKey[] }>;

export type SystemRoleKey = keyof typeof SYSTEM_ROLES;

export function hasPermission(permissions: Iterable<string>, permission: PermissionKey): boolean {
  for (const p of permissions) if (p === permission) return true;
  return false;
}

/** Landing page after login, chosen from the most capable panel the user can open. */
export function homePathFor(permissions: Iterable<string>): string {
  const set = new Set(permissions);
  if (set.has("panel.admin")) return "/admin";
  if (set.has("panel.warehouse")) return "/warehouse";
  if (set.has("panel.visitor")) return "/visitor";
  return "/";
}
