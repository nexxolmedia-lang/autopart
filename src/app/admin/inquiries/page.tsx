import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, Mail, Phone } from "lucide-react";
import { refresh } from "next/cache";
import { PageTitle } from "@/components/admin/page-title";
import { Badge } from "@/components/ui/badges";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { formatDateTime } from "@/lib/format";
import { cn, firstParam, toPositiveInt } from "@/lib/utils";
import { requirePagePermission, requirePermission } from "@/server/auth/session";
import { INQUIRY_TOPICS, listInquiries, setInquiryHandled } from "@/server/modules/inquiries/service";

export const metadata: Metadata = { title: "پیام‌های وب‌سایت" };

async function toggleHandled(form: FormData) {
  "use server";
  const actor = await requirePermission("inquiries.view");
  await setInquiryHandled(actor, String(form.get("id")), form.get("handled") === "1");
  refresh();
}

export default async function InquiriesPage(props: PageProps<"/admin/inquiries">) {
  const actor = await requirePagePermission("inquiries.view", "/admin/inquiries");
  const params = await props.searchParams;
  const status = (firstParam(params.status) as "open" | "handled" | "all" | undefined) ?? "open";
  const result = await listInquiries(actor, { status, page: toPositiveInt(firstParam(params.page), 1) });

  return (
    <>
      <PageTitle eyebrow="فروش" title="پیام‌های وب‌سایت" description="درخواست‌های ارسال‌شده از فرم تماس سایت عمومی." />
      <nav aria-label="وضعیت" className="mb-5 flex gap-2">
        {[
          ["open", "پاسخ‌داده‌نشده"],
          ["handled", "پیگیری‌شده"],
          ["all", "همه"],
        ].map(([v, l]) => (
          <Link key={v} href={`/admin/inquiries?status=${v}`} aria-current={status === v ? "page" : undefined} className={cn("flex h-9 items-center rounded-full border px-4 text-[13px] font-medium", status === v ? "border-ink bg-ink text-bone" : "border-line bg-white hover:border-ink")}>
            {l}
          </Link>
        ))}
      </nav>
      {result.rows.length === 0 ? (
        <EmptyState icon={<Inbox className="h-5 w-5" />} title="پیامی وجود ندارد" />
      ) : (
        <ul className="space-y-3">
          {result.rows.map((m) => (
            <li key={m.id} className="border border-line bg-white p-4 md:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={m.handledAt ? "success" : "attention"}>{m.handledAt ? "پیگیری‌شده" : "جدید"}</Badge>
                <span className="text-[13px] font-semibold">{INQUIRY_TOPICS[m.topic as keyof typeof INQUIRY_TOPICS] ?? m.topic}</span>
                <span className="ms-auto text-[12px] text-steel-500">{formatDateTime(m.createdAt)}</span>
              </div>
              <p className="mt-3 font-medium">
                {m.name}
                {m.company ? <span className="text-steel-600"> · {m.company}</span> : null}
              </p>
              <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-steel-800">{m.message}</p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-[13px]">
                <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5 hover:text-ember-700">
                  <Mail className="h-3.5 w-3.5" aria-hidden /> <span className="ltr">{m.email}</span>
                </a>
                {m.phone ? (
                  <a href={`tel:${m.phone.replace(/[^+\d]/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-ember-700">
                    <Phone className="h-3.5 w-3.5" aria-hidden /> <span className="ltr">{m.phone}</span>
                  </a>
                ) : null}
                <form action={toggleHandled} className="ms-auto">
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="handled" value={m.handledAt ? "0" : "1"} />
                  <button type="submit" className="h-9 border border-line px-3 text-[12.5px] font-medium hover:border-ink">
                    {m.handledAt ? "بازگشت به صف" : "علامت‌گذاری به‌عنوان پیگیری‌شده"}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination className="mt-6" pathname="/admin/inquiries" params={params} page={result.page} pageCount={result.pageCount} total={result.total} pageSize={result.pageSize} label="پیام" />
    </>
  );
}
