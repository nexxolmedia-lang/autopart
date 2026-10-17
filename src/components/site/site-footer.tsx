import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { appConfig } from "@/lib/config";

const COLUMNS = [
  {
    title: "کاتالوگ",
    links: [
      { href: "/categories/engine", label: "قطعات موتور" },
      { href: "/categories/brakes", label: "سیستم ترمز" },
      { href: "/categories/filters", label: "فیلترها" },
      { href: "/categories/suspension", label: "جلوبندی و فرمان" },
      { href: "/categories/electrical", label: "برق و جرقه‌زنی" },
      { href: "/products", label: "همه قطعات ←" },
    ],
  },
  {
    title: "شرکت",
    links: [
      { href: "/about", label: "درباره اتوپارت" },
      { href: "/brands", label: "برندها" },
      { href: "/#ordering", label: "روند سفارش" },
      { href: "/contact", label: "تماس و حساب همکاری" },
    ],
  },
  {
    title: "همکاران",
    links: [
      { href: "/login", label: "ورود همکاران" },
      { href: "/visitor/install", label: "نصب اپلیکیشن ویزیتور" },
      { href: "/contact?topic=trade_account", label: "افتتاح حساب همکاری" },
      { href: "/contact?topic=quote", label: "درخواست پیش‌فاکتور" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-ink text-bone">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      <div className="relative mx-auto max-w-[1320px] px-4 pb-10 pt-16 md:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo dark />
            <p className="mt-5 max-w-sm text-[15px] leading-loose text-bone/65">
              تأمین قطعات موتور، ترمز، جلوبندی، خنک‌کاری و برق خودرو برای تعمیرگاه‌های مستقل و ناوگان‌های حمل‌ونقل.
            </p>
            <dl className="mt-8 grid gap-4 text-sm">
              <div>
                <dt className="type-eyebrow text-bone/40">واحد فروش</dt>
                <dd className="mt-1">
                  <a href={`tel:${appConfig.contact.phoneHref}`} className="ltr tabular link-underline">
                    {appConfig.contact.phone}
                  </a>
                  <span className="mx-2 text-bone/30">/</span>
                  <a href={`mailto:${appConfig.contact.salesEmail}`} className="ltr link-underline">
                    {appConfig.contact.salesEmail}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="type-eyebrow text-bone/40">انبار و فروشگاه</dt>
                <dd className="mt-1 text-bone/80">{appConfig.contact.addressLines.join("، ")}</dd>
              </div>
            </dl>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h2 className="type-eyebrow text-ember">{col.title}</h2>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-[14px] text-bone/70 transition-colors hover:text-bone">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-16 flex flex-col gap-4 border-t border-bone/10 pt-6 text-[12.5px] leading-relaxed text-bone/45 md:flex-row md:items-center md:justify-between">
          <p>© اتوپارت — سامانه نمایشی (نمونه‌کار)</p>
          <p className="max-w-2xl md:text-end">
            محیط نمایشی: برندها، کالاها، قیمت‌ها، موجودی، مشتریان و اطلاعات تماس ساختگی هستند. نام خودروها فقط برای نمایش سازگاری قطعات آمده است.
          </p>
        </div>
      </div>
    </footer>
  );
}
