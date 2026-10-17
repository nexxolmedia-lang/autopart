/**
 * Order lifecycle — the single source of truth for which status changes are
 * legal and who may make them. Used by the server (enforcement) and by the UI
 * (to decide which buttons to offer). Pure and framework-free.
 *
 *   DRAFT ──submit──▶ SUBMITTED ──start_review──▶ UNDER_REVIEW
 *                         │  ╲                          │
 *                         │   ╲──approve / reject──────┤
 *                         ▼                             ▼
 *                     APPROVED ──start_preparing──▶ PREPARING ──mark_ready──▶ READY_FOR_DISPATCH
 *                                                                                  │
 *                                                       DELIVERED ◀──deliver── DISPATCHED ◀─dispatch─┘
 *
 *   cancel: any state before DISPATCHED (rules below). REJECTED / CANCELLED / DELIVERED are terminal.
 */
import type { PermissionKey } from "./permissions";

export const ORDER_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "PREPARING",
  "READY_FOR_DISPATCH",
  "DISPATCHED",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatusKey = (typeof ORDER_STATUSES)[number];

export type StatusTone = "neutral" | "info" | "attention" | "progress" | "success" | "danger" | "muted";

export const ORDER_STATUS_META: Record<OrderStatusKey, { label: string; tone: StatusTone; description: string }> = {
  DRAFT: { label: "پیش‌نویس", tone: "muted", description: "در حال آماده‌سازی توسط ویزیتور؛ هنوز برای میز سفارش ارسال نشده است." },
  SUBMITTED: { label: "ثبت‌شده", tone: "attention", description: "موجودی رزرو شده و سفارش در انتظار بررسی میز سفارش است." },
  UNDER_REVIEW: { label: "در حال بررسی", tone: "info", description: "میز سفارش در حال بررسی تعداد، قیمت و زمان تحویل است." },
  APPROVED: { label: "تأییدشده", tone: "progress", description: "تأیید شده و برای انبار ارسال شده است." },
  REJECTED: { label: "ردشده", tone: "danger", description: "توسط میز سفارش رد شد و موجودی رزروشده آزاد گردید." },
  PREPARING: { label: "در حال آماده‌سازی", tone: "progress", description: "در انبار در حال جمع‌آوری اقلام است." },
  READY_FOR_DISPATCH: { label: "آماده ارسال", tone: "progress", description: "جمع‌آوری و بسته‌بندی شده و منتظر ارسال است." },
  DISPATCHED: { label: "ارسال‌شده", tone: "info", description: "در مسیر تحویل به مشتری است." },
  DELIVERED: { label: "تحویل‌شده", tone: "success", description: "به مشتری تحویل داده شد." },
  CANCELLED: { label: "لغوشده", tone: "muted", description: "لغو شد و موجودی رزروشده آزاد گردید." },
};

/** Statuses during which stock is reserved for the order. */
export const RESERVING_STATUSES: readonly OrderStatusKey[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "PREPARING",
  "READY_FOR_DISPATCH",
];

/** Statuses the order desk is waiting on. */
export const AWAITING_REVIEW_STATUSES: readonly OrderStatusKey[] = ["SUBMITTED", "UNDER_REVIEW"];

/** Statuses released to (and visible in) the warehouse. */
export const WAREHOUSE_STATUSES: readonly OrderStatusKey[] = [
  "APPROVED",
  "PREPARING",
  "READY_FOR_DISPATCH",
  "DISPATCHED",
  "DELIVERED",
];

/** Statuses that count as confirmed sales for reporting. */
export const SALES_STATUSES: readonly OrderStatusKey[] = [
  "APPROVED",
  "PREPARING",
  "READY_FOR_DISPATCH",
  "DISPATCHED",
  "DELIVERED",
];

/** Line quantities / prices may be adjusted by the order desk only in these statuses. */
export const EDITABLE_BY_DESK_STATUSES: readonly OrderStatusKey[] = ["SUBMITTED", "UNDER_REVIEW"];

export const TERMINAL_STATUSES: readonly OrderStatusKey[] = ["REJECTED", "CANCELLED", "DELIVERED"];

export type OrderAction =
  | "submit"
  | "start_review"
  | "approve"
  | "reject"
  | "cancel"
  | "start_preparing"
  | "mark_ready"
  | "dispatch"
  | "deliver";

export const ORDER_ACTION_META: Record<OrderAction, { label: string; to: OrderStatusKey; requiresReason: boolean }> = {
  submit: { label: "ثبت سفارش", to: "SUBMITTED", requiresReason: false },
  start_review: { label: "شروع بررسی", to: "UNDER_REVIEW", requiresReason: false },
  approve: { label: "تأیید سفارش", to: "APPROVED", requiresReason: false },
  reject: { label: "رد سفارش", to: "REJECTED", requiresReason: true },
  cancel: { label: "لغو سفارش", to: "CANCELLED", requiresReason: true },
  start_preparing: { label: "شروع آماده‌سازی", to: "PREPARING", requiresReason: false },
  mark_ready: { label: "آماده ارسال", to: "READY_FOR_DISPATCH", requiresReason: false },
  dispatch: { label: "تأیید ارسال", to: "DISPATCHED", requiresReason: false },
  deliver: { label: "تأیید تحویل", to: "DELIVERED", requiresReason: false },
};

export type WorkflowActor = { id: string; permissions: ReadonlySet<string> | readonly string[] };
export type WorkflowOrder = { status: OrderStatusKey; visitorId: string };

export type TransitionCheck =
  | { allowed: true; reasonRequired: boolean }
  | { allowed: false; code: "INVALID_TRANSITION" | "FORBIDDEN"; message: string };

function has(actor: WorkflowActor, permission: PermissionKey): boolean {
  const perms = actor.permissions;
  return perms instanceof Set ? perms.has(permission) : (perms as readonly string[]).includes(permission);
}

const DENY_INVALID = (action: OrderAction, status: OrderStatusKey): TransitionCheck => ({
  allowed: false,
  code: "INVALID_TRANSITION",
  message: `سفارش در وضعیت «${ORDER_STATUS_META[status].label}» قابل «${ORDER_ACTION_META[action].label}» نیست.`,
});

const DENY_FORBIDDEN = (message: string): TransitionCheck => ({ allowed: false, code: "FORBIDDEN", message });

export function checkTransition(action: OrderAction, order: WorkflowOrder, actor: WorkflowActor): TransitionCheck {
  const isOwner = order.visitorId === actor.id;
  const { status } = order;

  switch (action) {
    case "submit":
      if (status !== "DRAFT") return DENY_INVALID(action, status);
      if (!isOwner || !has(actor, "orders.create")) return DENY_FORBIDDEN("فقط ویزیتوری که این پیش‌نویس را ایجاد کرده می‌تواند آن را ثبت کند.");
      return { allowed: true, reasonRequired: false };

    case "start_review":
      if (status !== "SUBMITTED") return DENY_INVALID(action, status);
      if (!has(actor, "orders.review")) return DENY_FORBIDDEN("شما مجوز بررسی سفارش‌ها را ندارید.");
      return { allowed: true, reasonRequired: false };

    case "approve":
    case "reject":
      if (status !== "SUBMITTED" && status !== "UNDER_REVIEW") return DENY_INVALID(action, status);
      if (!has(actor, "orders.review")) return DENY_FORBIDDEN("شما مجوز بررسی سفارش‌ها را ندارید.");
      if (action === "approve" && isOwner && !has(actor, "orders.approve_own")) {
        return DENY_FORBIDDEN("شما نمی‌توانید سفارشی را که خودتان ثبت کرده‌اید تأیید کنید.");
      }
      return { allowed: true, reasonRequired: action === "reject" };

    case "cancel": {
      if (status === "DRAFT") {
        if (isOwner && has(actor, "orders.create")) return { allowed: true, reasonRequired: false };
        if (has(actor, "orders.cancel")) return { allowed: true, reasonRequired: true };
        return DENY_FORBIDDEN("شما مجوز لغو این سفارش را ندارید.");
      }
      if (status === "SUBMITTED") {
        // A visitor may withdraw their own order until the order desk picks it up.
        if (isOwner && has(actor, "orders.create")) return { allowed: true, reasonRequired: false };
        if (has(actor, "orders.cancel")) return { allowed: true, reasonRequired: true };
        return DENY_FORBIDDEN("شما مجوز لغو این سفارش را ندارید.");
      }
      if (status === "UNDER_REVIEW" || status === "APPROVED" || status === "PREPARING" || status === "READY_FOR_DISPATCH") {
        if (has(actor, "orders.cancel")) return { allowed: true, reasonRequired: true };
        return DENY_FORBIDDEN(
          isOwner
            ? "این سفارش در حال پردازش است. برای لغو با میز سفارش تماس بگیرید."
            : "شما مجوز لغو این سفارش را ندارید.",
        );
      }
      return DENY_INVALID(action, status);
    }

    case "start_preparing":
      if (status !== "APPROVED") return DENY_INVALID(action, status);
      if (!has(actor, "orders.fulfil")) return DENY_FORBIDDEN("شما مجوز پردازش سفارش در انبار را ندارید.");
      return { allowed: true, reasonRequired: false };

    case "mark_ready":
      if (status !== "PREPARING") return DENY_INVALID(action, status);
      if (!has(actor, "orders.fulfil")) return DENY_FORBIDDEN("شما مجوز پردازش سفارش در انبار را ندارید.");
      return { allowed: true, reasonRequired: false };

    case "dispatch":
      if (status !== "READY_FOR_DISPATCH") return DENY_INVALID(action, status);
      if (!has(actor, "orders.fulfil")) return DENY_FORBIDDEN("شما مجوز ارسال سفارش را ندارید.");
      return { allowed: true, reasonRequired: false };

    case "deliver":
      if (status !== "DISPATCHED") return DENY_INVALID(action, status);
      if (!has(actor, "orders.fulfil")) return DENY_FORBIDDEN("شما مجوز تأیید تحویل را ندارید.");
      return { allowed: true, reasonRequired: false };
  }
}

const ALL_ACTIONS = Object.keys(ORDER_ACTION_META) as OrderAction[];

export function availableActions(order: WorkflowOrder, actor: WorkflowActor): OrderAction[] {
  return ALL_ACTIONS.filter((action) => checkTransition(action, order, actor).allowed);
}

export function formatOrderNumber(number: number): string {
  return `AP-${String(number).padStart(6, "0")}`;
}

/** Accepts "AP-000123", "ap123", "123" → 123. */
export function parseOrderNumber(input: string): number | null {
  const match = input.trim().match(/^(?:ap-?)?0*(\d{1,9})$/i);
  return match ? Number(match[1]) : null;
}
