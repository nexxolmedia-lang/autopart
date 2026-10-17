import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CustomerForm } from "@/components/customers/customer-form";
import { firstParam } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";
import { createVisitorCustomerAction } from "../actions";

export const metadata: Metadata = { title: "مشتری جدید" };

export default async function NewVisitorCustomerPage(props: PageProps<"/visitor/customers/new">) {
  await requirePagePermission("customers.create", "/visitor/customers/new");
  const returnTo = firstParam((await props.searchParams).return) === "order" ? "order" : "";
  return (
    <div className="space-y-6">
      <Link href={returnTo ? "/visitor/orders/new" : "/visitor/customers"} className="inline-flex items-center gap-1.5 text-[13px] text-steel-600 hover:text-ink">
        <ArrowRight className="h-3.5 w-3.5" aria-hidden /> {returnTo ? "بازگشت به سفارش" : "مشتریان"}
      </Link>
      <div>
        <p className="type-eyebrow text-steel-500">حساب جدید</p>
        <h1 className="type-display mt-1.5 text-[2rem] leading-snug">افزودن مشتری</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-steel-600">مشتری به‌طور خودکار به شما تخصیص داده می‌شود. میز سفارش بعداً می‌تواند تخصیص را تغییر دهد.</p>
      </div>
      <CustomerForm action={createVisitorCustomerAction} submitLabel={returnTo ? "ذخیره و شروع سفارش" : "ذخیره مشتری"} hidden={returnTo ? { return: "order" } : undefined} />
    </div>
  );
}
