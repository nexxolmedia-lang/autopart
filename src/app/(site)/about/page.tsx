import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { Container, SectionHeading } from "@/components/site/section";
import { ButtonLink } from "@/components/ui/button";
import { toPersianDigits } from "@/lib/digits";

export const metadata: Metadata = {
  title: "درباره ما",
  description: "اتوپارت چگونه قطعات تعمیرگاه‌ها و ناوگان‌ها را تأمین می‌کند — و چرا سامانه سفارش‌گیری خودمان را ساختیم.",
};

const WORKFLOW = [
  { role: "ویزیتور", text: "با اپلیکیشن اتوپارت به تعمیرگاه‌ها سر می‌زند، قیمت و موجودی لحظه‌ای را می‌بیند و سفارش را همان‌جا ثبت می‌کند." },
  { role: "میز سفارش", text: "هر سفارش را بررسی می‌کند، تعداد، قیمت و زمان تحویل را تأیید و سپس آن را برای انبار آزاد می‌کند." },
  { role: "انبار", text: "بر اساس محل قفسه‌ها جمع‌آوری می‌کند، هر قلم را علامت می‌زند و ارسال را تأیید می‌کند — موجودی خودکار به‌روز می‌شود." },
  { role: "مدیریت", text: "فروش به تفکیک مشتری، کالا و ویزیتور را می‌بیند و هر تغییر در سابقه ممیزی ثبت می‌شود." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "خانه" }, { label: "درباره ما" }]}
        eyebrow="درباره اتوپارت"
        title={
          <>
            توزیع قطعه،
            <br />
            <span className="text-bone/45">با مهندسی دوباره.</span>
          </>
        }
        description="اتوپارت توزیع‌کننده قطعات خودرو برای تعمیرگاه‌های مستقل و ناوگان‌های حمل‌ونقل است. سفارش‌گیری تلفنی و پیام‌رسانی را با یک سامانه یکپارچه جایگزین کردیم که ویزیتورها، میز سفارش و انبار همه از آن استفاده می‌کنند."
      />

      <Container className="grid gap-12 py-16 md:grid-cols-[200px_1fr] md:py-24">
        <p className="type-eyebrow border-t border-ink pt-4 text-steel-500">مسئله</p>
        <div className="border-t border-ink pt-4">
          <p className="type-heading max-w-3xl text-[clamp(1.5rem,2.6vw,2.2rem)] leading-normal">
            سفارش‌هایی که با تلفن و پیام‌رسان گرفته می‌شوند گم می‌شوند، تکرار می‌شوند یا روی موجودی‌ای قول داده می‌شوند که دیگر وجود ندارد.
          </p>
          <p className="mt-6 max-w-2xl text-[16px] leading-loose text-steel-700">
            ویزیتوری که در تعمیرگاه مشتری بود نمی‌دانست انبار چه مقدار کالا دارد. انبار وقتی از سفارش باخبر می‌شد که کسی عکس صفحه را برایش می‌فرستاد. قیمت‌ها از
            حافظه اعلام می‌شد. اتوپارت را ساختیم تا همه از یک سابقه واحد و زنده کار کنند.
          </p>
        </div>
      </Container>

      <section className="bg-bone py-16 md:py-24">
        <Container>
          <SectionHeading eyebrow="یک سامانه، چهار نقش" title="همه روی یک سابقه." />
          <ol className="mt-12 grid gap-px border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW.map((w, i) => (
              <li key={w.role} className="bg-paper p-7">
                <span className="type-data text-[12px] text-ember">{toPersianDigits(String(i + 1).padStart(2, "0"))}</span>
                <h3 className="type-heading mt-6 text-xl">{w.role}</h3>
                <p className="mt-3 text-[14.5px] leading-loose text-steel-700">{w.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <Container className="grid gap-12 py-16 md:grid-cols-[200px_1fr] md:py-24">
        <p className="type-eyebrow border-t border-ink pt-4 text-steel-500">تعهدات ما</p>
        <div className="border-t border-ink pt-4">
          <dl className="grid gap-10 md:grid-cols-2">
            {[
              ["موجودی صادقانه", "آنچه واقعاً قابل تعهد است را نشان می‌دهیم: موجودی فیزیکی منهای رزروهای باز. اگر نوشته موجود است، موجود است."],
              ["قیمت شفاف", "قیمت‌های همکار در کاتالوگ منتشر می‌شود و هنگام ثبت سفارش روی هر قلم ثابت می‌ماند."],
              ["قابلیت پیگیری", "هر تأیید، اصلاح، جمع‌آوری و ارسال با نام انجام‌دهنده و زمان دقیق ثبت می‌شود."],
              ["بدون وابستگی", "مشتریان می‌توانند از طریق ویزیتور، تلفن یا ایمیل سفارش دهند — سامانه پشتیبان همکاران ماست، نه جایگزین آن‌ها."],
            ].map(([title, text]) => (
              <div key={title}>
                <dt className="type-heading text-xl">{title}</dt>
                <dd className="mt-2 text-[15px] leading-loose text-steel-700">{text}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-12 flex flex-wrap gap-3">
            <ButtonLink href="/contact?topic=trade_account" size="lg">
              افتتاح حساب همکاری <ArrowLeft className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/products" size="lg" variant="outline">
              مشاهده کاتالوگ
            </ButtonLink>
          </div>
        </div>
      </Container>
    </>
  );
}
