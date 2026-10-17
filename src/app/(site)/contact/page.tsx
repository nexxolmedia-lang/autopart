import type { Metadata } from "next";
import { Suspense } from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { Container } from "@/components/site/section";
import { appConfig } from "@/lib/config";
import { firstParam } from "@/lib/utils";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "تماس و حساب همکاری", description: "با واحد فروش اتوپارت در تماس باشید یا حساب همکاری باز کنید." };

export default function ContactPage(props: PageProps<"/contact">) {
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "خانه" }, { label: "تماس" }]}
        eyebrow="تماس با ما"
        title="با واحد فروش صحبت کنید."
        description="حساب همکاری، پیش‌فاکتور و استعلام موجودی قطعه. یک همکار واقعی پاسخ می‌دهد — معمولاً همان روز."
      />
      <Container className="grid gap-12 py-12 md:py-16 lg:grid-cols-[1fr_380px] lg:gap-20">
        <div>
          <Suspense fallback={<ContactForm />}>
            <PrefilledForm searchParams={props.searchParams} />
          </Suspense>
        </div>
        <aside className="space-y-px border border-line bg-line self-start">
          {[
            { icon: Phone, label: "واحد فروش", value: <a href={`tel:${appConfig.contact.phoneHref}`} className="ltr tabular hover:text-ember">{appConfig.contact.phone}</a> },
            { icon: Mail, label: "ایمیل", value: <a href={`mailto:${appConfig.contact.salesEmail}`} className="ltr hover:text-ember">{appConfig.contact.salesEmail}</a> },
            { icon: Clock, label: "ساعات کاری", value: appConfig.contact.hours },
            { icon: MapPin, label: "انبار و فروشگاه", value: appConfig.contact.addressLines.map((l) => <span key={l} className="block">{l}</span>) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex gap-4 bg-paper p-6">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-ember" strokeWidth={1.6} aria-hidden />
              <div>
                <p className="type-eyebrow text-steel-500">{label}</p>
                <div className="mt-1.5 text-[15px] text-ink">{value}</div>
              </div>
            </div>
          ))}
          <div className="bg-ink p-6 text-[13px] leading-relaxed text-bone/60">اطلاعات تماس نمایشی است — در فایل <span className="ltr type-data text-bone/80">src/lib/config.ts</span> جایگزین کنید.</div>
        </aside>
      </Container>
    </>
  );
}

async function PrefilledForm({ searchParams }: { searchParams: PageProps<"/contact">["searchParams"] }) {
  const params = await searchParams;
  const part = firstParam(params.part)?.slice(0, 60);
  return <ContactForm defaultTopic={firstParam(params.topic)} defaultMessage={part ? `لطفاً موجودی و زمان تأمین قطعه ${part} را اعلام کنید.` : undefined} />;
}
