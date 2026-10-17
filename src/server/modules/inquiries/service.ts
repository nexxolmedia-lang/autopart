import { z } from "zod";
import { assertCan, type Actor } from "@/server/auth/actor";
import { prisma } from "@/server/db";
import { NotFoundError, RateLimitError } from "@/server/errors";
import { parseInput, zx } from "@/server/validation";
import { notifyPermissionHolders } from "../notifications/service";

export const INQUIRY_TOPICS = {
  trade_account: "افتتاح حساب همکاری",
  quote: "درخواست پیش‌فاکتور",
  availability: "استعلام موجودی قطعه",
  other: "سایر موارد",
} as const;

export const inquirySchema = z.object({
  name: zx.requiredText(120, "نام شما"),
  company: zx.optionalText(120),
  email: z.string().trim().toLowerCase().pipe(z.email("نشانی ایمیل معتبر وارد کنید.")),
  phone: zx.optionalText(40),
  topic: z.enum(Object.keys(INQUIRY_TOPICS) as [keyof typeof INQUIRY_TOPICS, ...(keyof typeof INQUIRY_TOPICS)[]], { error: "موضوع را انتخاب کنید." }),
  message: z.string().trim().min(10, "لطفاً دست‌کم یک جمله بنویسید.").max(3000, "پیام باید کمتر از ۳۰۰۰ نویسه باشد."),
  /** Honeypot — real people never fill this in. */
  website: z.string().max(0).optional().or(z.literal("")),
});

export type InquiryInput = z.input<typeof inquirySchema>;

export async function submitInquiry(input: InquiryInput, context: { ipAddress?: string | null; now?: Date } = {}) {
  const data = parseInput(inquirySchema, input);
  const now = context.now ?? new Date();
  if (context.ipAddress) {
    const recent = await prisma.contactInquiry.count({
      where: { ipAddress: context.ipAddress, createdAt: { gte: new Date(now.getTime() - 3_600_000) } },
    });
    if (recent >= 5) throw new RateLimitError("به‌تازگی چند پیام از شما دریافت کرده‌ایم. لطفاً بعداً دوباره تلاش کنید یا تماس بگیرید.");
  }
  const { website: _honeypot, ...fields } = data;
  void _honeypot;
  const inquiry = await prisma.contactInquiry.create({ data: { ...fields, ipAddress: context.ipAddress ?? null } });
  await notifyPermissionHolders(prisma, "inquiries.view", {
    title: `پیام جدید: ${INQUIRY_TOPICS[data.topic]}`,
    body: `${data.name}${data.company ? ` · ${data.company}` : ""}`,
    href: "/admin/inquiries",
  });
  return inquiry;
}

export async function listInquiries(actor: Actor, filter: { status?: "open" | "handled" | "all"; page?: number } = {}) {
  assertCan(actor, "inquiries.view");
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = 20;
  const where = filter.status === "handled" ? { handledAt: { not: null } } : filter.status === "all" ? {} : { handledAt: null };
  const [total, rows] = await Promise.all([
    prisma.contactInquiry.count({ where }),
    prisma.contactInquiry.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  return { rows, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function setInquiryHandled(actor: Actor, id: string, handled: boolean) {
  assertCan(actor, "inquiries.view");
  const existing = await prisma.contactInquiry.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("پیام یافت نشد.");
  await prisma.contactInquiry.update({ where: { id }, data: { handledAt: handled ? new Date() : null } });
}
