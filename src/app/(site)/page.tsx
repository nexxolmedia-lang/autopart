import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowLeft, ArrowUpLeft, ClipboardCheck, Lock, PackageCheck, ScanLine, Smartphone, Timer } from "lucide-react";
import { ProductCard, ProductGridSkeleton } from "@/components/catalog/product-card";
import { imageSrc } from "@/components/catalog/product-image";
import { HeroIllustration } from "@/components/site/hero-illustration";
import { PhoneMockup } from "@/components/site/phone-mockup";
import { Container, SectionHeading } from "@/components/site/section";
import { ButtonLink } from "@/components/ui/button";
import { AvailabilityLabel } from "@/components/ui/badges";
import { faNumber, toPersianDigits } from "@/lib/digits";
import { formatMoney } from "@/lib/money";
import {
  getBrandsWithCounts,
  getCatalogOverview,
  getCategoriesWithCounts,
  getFeaturedProducts,
  getPopularProducts,
} from "@/server/modules/products/queries";

const n2 = (n: number) => toPersianDigits(String(n).padStart(2, "0"));

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryIndex />
      <Featured />
      <Ordering />
      <Popular />
      <Manufacturers />
      <Principles />
      <ClosingCta />
    </>
  );
}

// ── ۰۱ Hero ──────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink text-bone">
      <div className="blueprint-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute -end-40 top-1/3 h-[520px] w-[520px] rounded-full bg-ember/10 blur-[120px]" aria-hidden />
      <Container className="relative grid gap-10 pb-0 pt-12 md:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
        <div className="flex flex-col pb-10 lg:pb-24">
          <p className="type-eyebrow animate-rise text-bone/55">
            <span className="text-ember">۰۱</span>
            <span className="mx-2 opacity-50">/</span>توزیع قطعات خودرو
          </p>
          <h1 className="type-display mt-6 animate-rise text-[clamp(2.6rem,5.6vw,4.8rem)] [animation-delay:80ms]">
            از موتور تا اکسل.
            <br />
            <span className="text-bone/40">حساب هر قطعه</span>
            <br />
            <span className="text-bone/40">دقیق و روشن.</span>
          </h1>
          <p className="mt-8 max-w-xl animate-rise text-[17px] leading-loose text-bone/70 [animation-delay:160ms]">
            اتوپارت قطعات موتور، ترمز، جلوبندی، خنک‌کاری و برق خودرو را برای تعمیرگاه‌ها و ناوگان‌های حمل‌ونقل تأمین می‌کند — با نمایش لحظه‌ای
            موجودی و اپلیکیشنی که ویزیتورها با آن، سفارش را همان‌جا در محل مشتری ثبت می‌کنند.
          </p>
          <div className="mt-10 flex animate-rise flex-wrap gap-3 [animation-delay:240ms]">
            <ButtonLink href="/products" size="lg">
              مشاهده کاتالوگ <ArrowLeft className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/#ordering" size="lg" variant="outline-light">
              روند سفارش همکاران
            </ButtonLink>
          </div>
          <form action="/search" role="search" className="mt-10 max-w-xl animate-rise [animation-delay:320ms]">
            <label htmlFor="hero-search" className="type-eyebrow text-bone/45">
              جستجوی قطعه
            </label>
            <div className="mt-2 flex border border-bone/20 bg-ink-2 focus-within:border-ember">
              <input
                id="hero-search"
                name="q"
                type="search"
                placeholder="مثلاً لنت ترمز پژو ۴۰۵، KSL-TK-4410، EF7"
                className="h-12 flex-1 bg-transparent px-4 text-[15px] text-bone placeholder:text-bone/35 focus:outline-none"
              />
              <button type="submit" className="flex items-center gap-2 border-s border-bone/20 px-5 text-sm font-medium text-bone transition-colors hover:bg-bone hover:text-ink">
                جستجو
              </button>
            </div>
          </form>
        </div>
        <div className="relative -mx-4 flex items-center justify-center md:mx-0 lg:pb-16">
          <HeroIllustration className="h-auto w-full max-w-[520px]" />
        </div>
      </Container>
      <Suspense fallback={<StatStrip />}>
        <LiveStats />
      </Suspense>
    </section>
  );
}

async function LiveStats() {
  await connection();
  const overview = await getCatalogOverview();
  return <StatStrip overview={overview} />;
}

function StatStrip({ overview }: { overview?: { products: number; brands: number; categories: number } }) {
  const stats = [
    { value: overview?.products, label: "قطعه در کاتالوگ فعال" },
    { value: overview?.brands, label: "برند سازنده" },
    { value: overview?.categories, label: "دسته‌بندی محصول" },
  ];
  return (
    <div className="relative border-t border-bone/10 bg-ink-2/80">
      <Container className="grid grid-cols-2 md:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className={`py-5 pe-4 ${i > 0 ? "md:border-s md:border-bone/10 md:ps-6" : ""}`}>
            <p className="type-display text-3xl text-bone">{s.value !== undefined ? faNumber(s.value) : <span className="skeleton inline-block h-7 w-12 opacity-20" />}</p>
            <p className="mt-1 text-[12.5px] text-bone/50">{s.label}</p>
          </div>
        ))}
        <div className="col-span-2 flex items-center gap-3 border-t border-bone/10 py-5 md:col-span-1 md:border-s md:border-t-0 md:ps-6">
          <span className="relative flex h-2.5 w-2.5" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok/60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ok" />
          </span>
          <p className="text-[13px] leading-relaxed text-bone/70">موجودی با هر سفارش، رزرو و جابه‌جایی انبار دوباره محاسبه می‌شود.</p>
        </div>
      </Container>
    </div>
  );
}

// ── ۰۲ Category index ────────────────────────────────────────────────────────

function CategoryIndex() {
  return (
    <section className="py-20 md:py-28" aria-labelledby="categories-title">
      <Container>
        <SectionHeading
          index="۰۲"
          eyebrow="کاتالوگ"
          title={<span id="categories-title">نُه سیستم خودرو. یک تأمین‌کننده.</span>}
          description="دسته‌بندی‌ها همان‌طور چیده شده‌اند که یک تعمیرکار فکر می‌کند: بر اساس سیستم خودرو. هر دسته با کد کالا، شماره فنی یا مدل خودرو قابل جستجوست."
          action={
            <Link href="/products" className="group inline-flex items-center gap-2 text-sm font-medium">
              همه قطعات <ArrowLeft className="h-4 w-4 text-ember transition-transform group-hover:-translate-x-1" aria-hidden />
            </Link>
          }
        />
        <Suspense fallback={<CategoryGridSkeleton />}>
          <CategoryGrid />
        </Suspense>
      </Container>
    </section>
  );
}

async function CategoryGrid() {
  await connection();
  const categories = await getCategoriesWithCounts();
  return (
    <ul className="mt-12 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((c, i) => (
        <li key={c.id} className="bg-paper">
          <Link href={`/categories/${c.slug}`} className="group relative flex h-full flex-col p-6 transition-colors duration-300 hover:bg-white md:p-7">
            <div className="flex items-start justify-between">
              <span className="type-data text-[12px] text-steel-400 transition-colors group-hover:text-ember">{n2(i + 1)}</span>
              <span className="type-data text-[12px] text-steel-500">{faNumber(c.productCount)} قطعه</span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/parts/${c.illustration}.svg`} alt="" loading="lazy" className="mx-auto my-6 h-36 w-full max-w-[260px] object-contain transition-transform duration-500 ease-[var(--ease-precise)] group-hover:scale-[1.04]" />
            <div className="mt-auto flex items-end justify-between gap-4">
              <div>
                <h3 className="type-heading text-xl">{c.name}</h3>
                <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-steel-600">{c.description}</p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-line transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-ember">
                <ArrowUpLeft className="h-4 w-4" aria-hidden />
              </span>
            </div>
            <span className="absolute inset-x-0 bottom-0 h-0.5 origin-right scale-x-0 bg-ember transition-transform duration-500 group-hover:scale-x-100" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CategoryGridSkeleton() {
  return (
    <ul className="mt-12 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3" aria-label="در حال بارگذاری دسته‌بندی‌ها">
      {Array.from({ length: 9 }, (_, i) => (
        <li key={i} className="h-[320px] bg-paper p-7">
          <div className="skeleton mx-auto mt-10 h-32 w-48" />
          <div className="skeleton mt-10 h-5 w-1/2" />
        </li>
      ))}
    </ul>
  );
}

// ── ۰۳ Featured ──────────────────────────────────────────────────────────────

function Featured() {
  return (
    <section className="bg-bone py-20 md:py-28" aria-labelledby="featured-title">
      <Container>
        <SectionHeading
          index="۰۳"
          eyebrow="قطعات منتخب"
          title={<span id="featured-title">مشخص، موجود، آماده ارسال.</span>}
          description="گزیده‌ای از قطعات پرفروش از سراسر کاتالوگ، با قیمت روز همکار و موجودی لحظه‌ای."
        />
        <div className="mt-12">
          <Suspense fallback={<ProductGridSkeleton count={8} />}>
            <FeaturedGrid />
          </Suspense>
        </div>
      </Container>
    </section>
  );
}

async function FeaturedGrid() {
  await connection();
  const products = await getFeaturedProducts(8);
  return (
    <ul className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-px overflow-x-auto border-y border-line bg-line px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:border sm:px-0 lg:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id} className="flex w-[78vw] shrink-0 snap-start sm:w-auto">
          <ProductCard product={p} className="w-full" priority={i < 2} />
        </li>
      ))}
    </ul>
  );
}

// ── ۰۴ Ordering process ──────────────────────────────────────────────────────

const STEPS = [
  { icon: ScanLine, title: "بازدید", text: "ویزیتور اتوپارت به تعمیرگاه شما سر می‌زند — یا با واحد فروش تماس می‌گیرید." },
  { icon: Smartphone, title: "استعلام", text: "قیمت روز همکار و موجودی واقعی هر قطعه، در چند ثانیه روی گوشی ویزیتور." },
  { icon: Lock, title: "رزرو", text: "سفارش همان‌جا ثبت و موجودی بلافاصله رزرو می‌شود — بدون فروش تکراری یک کالا." },
  { icon: PackageCheck, title: "ارسال", text: "میز سفارش تأیید می‌کند، انبار جمع‌آوری و ارسال می‌کند و همه مراحل ثبت می‌شود." },
];

function Ordering() {
  return (
    <section id="ordering" className="relative scroll-mt-24 overflow-hidden bg-ink py-20 text-bone md:py-28" aria-labelledby="ordering-title">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <Container className="relative">
        <SectionHeading
          dark
          index="۰۴"
          eyebrow="سفارش همکاران"
          title={<span id="ordering-title">از کف تعمیرگاه تا ارسال.</span>}
          description="سفارش‌ها قبلاً با تماس تلفنی و پیام‌رسان می‌رسیدند. اپلیکیشن ویزیتور اتوپارت سفارش را همان‌جا که شکل می‌گیرد — نزد مشتری — ثبت می‌کند و مستقیم به میز سفارش می‌رساند."
        />
        <div className="mt-14 grid items-center gap-14 lg:grid-cols-[1fr_340px_1fr]">
          <ol className="space-y-px lg:col-span-1">
            {STEPS.slice(0, 2).map((s, i) => (
              <Step key={s.title} n={i + 1} {...s} />
            ))}
          </ol>
          <Suspense fallback={<div className="mx-auto h-[600px] w-[300px] rounded-[44px] border border-white/10" />}>
            <OrderingPhone />
          </Suspense>
          <ol className="space-y-px" start={3}>
            {STEPS.slice(2).map((s, i) => (
              <Step key={s.title} n={i + 3} {...s} />
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}

function Step({ n, icon: Icon, title, text }: { n: number; icon: typeof Timer; title: string; text: string }) {
  return (
    <li className="group border-t border-bone/15 py-6">
      <div className="flex items-start gap-5">
        <span className="type-data pt-1 text-[12px] text-ember">{n2(n)}</span>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-bone/50" aria-hidden />
            <h3 className="type-heading text-2xl">{title}</h3>
          </div>
          <p className="mt-2 max-w-sm text-[15px] leading-loose text-bone/60">{text}</p>
        </div>
      </div>
    </li>
  );
}

async function OrderingPhone() {
  await connection();
  const products = await getFeaturedProducts(6);
  return <PhoneMockup products={products.filter((p) => p.availability !== "OUT_OF_STOCK")} />;
}

// ── ۰۵ Popular ───────────────────────────────────────────────────────────────

function Popular() {
  return (
    <section className="py-20 md:py-28" aria-labelledby="popular-title">
      <Container>
        <SectionHeading
          index="۰۵"
          eyebrow="پرسفارش‌ترین‌ها"
          title={<span id="popular-title">تعمیرگاه‌ها بیشتر چه سفارش می‌دهند.</span>}
          description="رتبه‌بندی بر اساس تعداد قطعات در سفارش‌های تأییدشده ۱۲۰ روز اخیر — محاسبه‌شده از داده‌های واقعی سفارش‌های اتوپارت."
        />
        <Suspense fallback={<div className="mt-12 space-y-2">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton h-20" />)}</div>}>
          <PopularList />
        </Suspense>
      </Container>
    </section>
  );
}

async function PopularList() {
  await connection();
  const products = await getPopularProducts(6);
  if (products.length === 0) return <p className="mt-12 text-steel-600">پس از ثبت سفارش‌ها، این بخش با داده‌های واقعی پر می‌شود.</p>;
  return (
    <ol className="mt-12 border-t border-line">
      {products.map((p, i) => (
        <li key={p.id} className="border-b border-line">
          <Link href={`/products/${p.slug}`} className="group grid grid-cols-[44px_72px_1fr] items-center gap-4 py-4 transition-colors hover:bg-white sm:grid-cols-[64px_96px_1fr_auto_auto] sm:gap-6 sm:px-2">
            <span className="type-display text-3xl text-steel-300 transition-colors group-hover:text-ember sm:text-4xl">{faNumber(i + 1)}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageSrc(p.image, p.category.illustration)} alt="" className="h-14 w-full bg-[#f5f3ee] object-contain p-1 sm:h-16" loading="lazy" />
            <div className="min-w-0">
              <p className="type-eyebrow text-steel-500">
                {p.brand.name} · {p.category.name}
              </p>
              <p className="mt-1 truncate text-[16px] font-medium">{p.name}</p>
              <p className="type-data mt-0.5 text-[12px] text-steel-500 sm:hidden">
                <span className="ltr">{p.sku}</span> · {formatMoney(p.price)}
              </p>
            </div>
            <p className="ltr type-data hidden text-[12px] text-steel-500 sm:block">{p.sku}</p>
            <div className="hidden text-end sm:block">
              <p className="type-data text-[16px] font-medium">{formatMoney(p.price)}</p>
              <AvailabilityLabel availability={p.availability} className="text-[12px]" />
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}

// ── ۰۶ Manufacturers ─────────────────────────────────────────────────────────

function Manufacturers() {
  return (
    <section className="bg-bone py-20 md:py-28" aria-labelledby="brands-title">
      <Container>
        <SectionHeading
          index="۰۶"
          eyebrow="برندها"
          title={<span id="brands-title">متخصص، نه همه‌کاره.</span>}
          description="هر گروه کالا از سازنده‌ای می‌آید که روی یک سیستم خودرو تمرکز دارد — اصطکاک، فیلتراسیون و تلرانس، کار اصلی آن‌هاست."
          action={
            <Link href="/brands" className="group inline-flex items-center gap-2 text-sm font-medium">
              همه برندها <ArrowLeft className="h-4 w-4 text-ember transition-transform group-hover:-translate-x-1" aria-hidden />
            </Link>
          }
        />
        <Suspense fallback={<div className="skeleton mt-12 h-64" />}>
          <BrandWall />
        </Suspense>
      </Container>
    </section>
  );
}

async function BrandWall() {
  await connection();
  const brands = await getBrandsWithCounts();
  return (
    <ul className="mt-12 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
      {brands.map((b) => (
        <li key={b.id} className="bg-paper">
          <Link href={`/products?brand=${b.slug}`} className="group flex h-full flex-col p-6 transition-colors hover:bg-white">
            <p className="ltr type-display text-end text-[22px] leading-none">{b.name.split(" ")[0]!.toUpperCase()}</p>
            <p className="ltr mt-1 text-end text-[13px] text-steel-500">{b.name.split(" ").slice(1).join(" ")}</p>
            <p className="mt-6 text-[13.5px] leading-relaxed text-steel-700">{b.description}</p>
            <div className="mt-auto flex items-center justify-between pt-6 text-[12px]">
              <span className="type-eyebrow text-steel-500">{b.country}</span>
              <span className="type-data text-ink">{faNumber(b.productCount)} قطعه</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ── ۰۷ Principles ────────────────────────────────────────────────────────────

const PRINCIPLES = [
  {
    icon: Timer,
    title: "موجودی قابل اتکا",
    text: "آنچه در اپلیکیشن می‌بینید موجودی فیزیکی منهای هر عددی است که برای سفارش‌های باز رزرو شده — با هر تغییر محاسبه می‌شود، نه تخمین آخر شب.",
  },
  {
    icon: Lock,
    title: "قیمت در لحظه سفارش ثابت می‌شود",
    text: "قیمت هر قلم سفارش در همان لحظه ثبت ذخیره می‌شود. تغییر قیمت کاتالوگ، سوابق گذشته را تغییر نمی‌دهد و هر اصلاح میز سفارش ثبت می‌شود.",
  },
  {
    icon: ClipboardCheck,
    title: "سابقه کامل، بدون کاغذبازی",
    text: "تأییدها، تغییر تعداد، جمع‌آوری و ارسال با نام انجام‌دهنده و زمان دقیق ثبت می‌شود — برای پیگیری، حسابرسی و آرامش خیال.",
  },
  {
    icon: Smartphone,
    title: "قابل نصب روی اندروید و آیفون",
    text: "اپلیکیشن ویزیتور مستقیم از مرورگر روی صفحه اصلی گوشی نصب می‌شود. بدون نیاز به فروشگاه اپلیکیشن و همیشه به‌روز.",
  },
];

function Principles() {
  return (
    <section className="py-20 md:py-28" aria-labelledby="principles-title">
      <Container>
        <SectionHeading index="۰۷" eyebrow="شیوه کار ما" title={<span id="principles-title">ساخته‌شده برای بازار قطعه.</span>} />
        <div className="mt-12 grid gap-px border border-line bg-line md:grid-cols-2">
          {PRINCIPLES.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="flex gap-6 bg-paper p-7 md:p-9">
              <span className="type-data text-[12px] text-ember">{n2(i + 1)}</span>
              <div>
                <Icon className="h-6 w-6 text-ink" strokeWidth={1.5} aria-hidden />
                <h3 className="type-heading mt-5 text-[22px]">{title}</h3>
                <p className="mt-3 max-w-md text-[15px] leading-loose text-steel-700">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ── ۰۸ CTA ───────────────────────────────────────────────────────────────────

function ClosingCta() {
  return (
    <section className="relative overflow-hidden bg-ember text-ink">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{ backgroundImage: "repeating-linear-gradient(45deg, #0c0d0f 0 1px, transparent 1px 14px)" }}
        aria-hidden
      />
      <Container className="relative grid gap-10 py-16 md:grid-cols-[1fr_auto] md:items-end md:py-24">
        <div>
          <p className="type-eyebrow text-ink/70">۰۸ / حساب همکاری</p>
          <h2 className="type-display mt-4 max-w-3xl text-[clamp(2.2rem,4.8vw,4rem)]">حساب همکاری را در یک بازدید باز کنید.</h2>
          <p className="mt-5 max-w-xl text-[16px] leading-loose text-ink/75">
            درباره تعمیرگاه یا ناوگان خود بگویید. ویزیتور ما به محل شما می‌آید، حساب را فعال می‌کند و اولین سفارش را همان‌جا ثبت می‌کند.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/contact?topic=trade_account" variant="dark" size="lg">
            گفتگو با واحد فروش <ArrowLeft className="h-4 w-4 text-ember" aria-hidden />
          </ButtonLink>
          <ButtonLink href="/login" variant="outline" size="lg" className="border-ink/30">
            ورود همکاران
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
