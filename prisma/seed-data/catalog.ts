/**
 * Demonstration catalogue (Persian).
 *
 * All manufacturers, SKUs, prices (rials) and stock figures are FICTIONAL and
 * exist only to make the demo presentable. Vehicle names are used
 * descriptively for fitment examples; fitment data is illustrative, not
 * verified. Fitment years are stored in the Gregorian calendar and displayed in
 * Solar Hijri.
 */

export const CATEGORIES = [
  { slug: "engine", name: "قطعات موتور", illustration: "timing-kit", description: "کیت تسمه تایم، واشر، میل‌سوپاپ و دسته موتور — قطعاتی که موتور را آب‌بند، هماهنگ و محکم نگه می‌دارند." },
  { slug: "cylinder-heads", name: "سرسیلندر و سوپاپ", illustration: "cylinder-head", description: "سرسیلندرهای نو و بازسازی‌شده، سوپاپ‌ها و قطعات مکانیزم سوپاپ؛ همه پیش از ارسال تست فشار می‌شوند." },
  { slug: "pistons", name: "پیستون و رینگ", illustration: "piston", description: "پیستون، رینگ و یاتاقان برای اورهال موتور، منطبق با قطر سیلندر و کورس استاندارد." },
  { slug: "filters", name: "فیلترها", illustration: "oil-filter", description: "فیلتر روغن، هوا، سوخت و کابین برای خودروهای سواری و تجاری سبک." },
  { slug: "brakes", name: "سیستم ترمز", illustration: "brake-disc", description: "دیسک، لنت و کالیپر ترمز با اصطکاک پایدار و مقاوم در برابر داغ‌شدن." },
  { slug: "suspension", name: "جلوبندی و فرمان", illustration: "shock-absorber", description: "کمک‌فنر، فنر لول و طبق که کیفیت سواری و دقت فرمان را بازمی‌گردانند." },
  { slug: "transmission", name: "گیربکس و کلاچ", illustration: "clutch-kit", description: "دیسک و صفحه کلاچ، سرپلوس و قطعات انتقال قدرت برای گیربکس دستی." },
  { slug: "cooling", name: "سیستم خنک‌کاری", illustration: "radiator", description: "رادیاتور، واترپمپ و ترموستات برای حفظ دمای کاری استاندارد موتور." },
  { slug: "electrical", name: "برق و جرقه‌زنی", illustration: "spark-plug", description: "قطعات جرقه‌زنی، شارژ و استارت؛ از شمع تا دینام و باتری." },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const BRANDS = [
  { slug: "kessler", name: "Kessler Motorenteile", country: "آلمان", description: "قطعات داخلی موتور و مکانیزم سوپاپ با تلرانس‌های استاندارد کارخانه." },
  { slug: "valtrex", name: "Valtrex Braking", country: "ایتالیا", description: "مواد اصطکاکی و قطعات ترمز طراحی‌شده برای ناوگان‌های پرکار." },
  { slug: "nordline", name: "Nordline Filtration", country: "سوئد", description: "مدیای فیلتراسیون با دوره تعویض طولانی، مناسب شرایط سخت کاری." },
  { slug: "arden", name: "Arden Electrics", country: "انگلستان", description: "قطعات شارژ، استارت و جرقه‌زنی همراه با برنامه بازسازی استاندارد." },
  { slug: "strada", name: "Strada Suspension", country: "اسپانیا", description: "کمک‌فنرهای دوجداره و تک‌جداره، فنر و قطعات فرمان." },
  { slug: "torvik", name: "Torvik Drivetrain", country: "نروژ", description: "سیستم‌های کلاچ و قطعات انتقال قدرت برای سواری و تجاری سبک." },
  { slug: "hollis", name: "Hollis Thermal", country: "ایرلند", description: "متخصص سیستم خنک‌کاری: رادیاتور، واترپمپ و مدیریت حرارت." },
  { slug: "sato", name: "Sato Precision", country: "ژاپن", description: "سنسور، شمع و یاتاقان دقیق برای خودروهای آسیایی و اروپایی." },
] as const;

export type BrandSlug = (typeof BRANDS)[number]["slug"];

export const VEHICLES = {
  p405: { make: "ایران‌خودرو", model: "پژو ۴۰۵", yearFrom: 1994, yearTo: 2021, engine: "XU7" },
  pars: { make: "ایران‌خودرو", model: "پژو پارس", yearFrom: 2000, yearTo: null, engine: "XU7P" },
  samand: { make: "ایران‌خودرو", model: "سمند", yearFrom: 2003, yearTo: 2022, engine: "EF7" },
  dena: { make: "ایران‌خودرو", model: "دنا پلاس", yearFrom: 2015, yearTo: null, engine: "EF7 توربو" },
  p206: { make: "ایران‌خودرو", model: "پژو ۲۰۶", yearFrom: 2002, yearTo: null, engine: "TU5" },
  pride: { make: "سایپا", model: "پراید ۱۳۱", yearFrom: 2008, yearTo: 2020, engine: "M13" },
  tiba: { make: "سایپا", model: "تیبا ۲", yearFrom: 2014, yearTo: null, engine: "M15" },
  quick: { make: "سایپا", model: "کوییک", yearFrom: 2017, yearTo: null, engine: "M15" },
  l90: { make: "پارس‌خودرو", model: "رنو تندر ۹۰", yearFrom: 2007, yearTo: null, engine: "K4M 1.6" },
  sandero: { make: "پارس‌خودرو", model: "رنو ساندرو", yearFrom: 2015, yearTo: 2019, engine: "K4M 1.6" },
  cerato: { make: "کیا", model: "سراتو", yearFrom: 2013, yearTo: 2018, engine: "2.0 MPI" },
  hilux: { make: "تویوتا", model: "هایلوکس", yearFrom: 2016, yearTo: null, engine: "2.7 بنزینی" },
  nissanvan: { make: "زامیاد", model: "نیسان وانت", yearFrom: 1996, yearTo: null, engine: "Z24" },
  isuzu: { make: "ایسوزو", model: "کامیونت NPR", yearFrom: 2010, yearTo: null, engine: "4HK1 دیزل" },
} as const;

export type VehicleKey = keyof typeof VEHICLES;

export type SeedProduct = {
  sku: string;
  name: string;
  brand: BrandSlug;
  category: CategorySlug;
  illustration: string;
  /** Trade price in rials (excl. VAT). */
  price: string;
  /** Units that should be AVAILABLE once the demo order history has been applied. */
  available: number;
  threshold: number;
  bin: string;
  featured?: boolean;
  weight?: number;
  short: string;
  description: string;
  specs: [string, string][];
  oe?: string[];
  fits: VehicleKey[];
  /** Orders draw from popular products more often. */
  popularity?: number;
};

const PEUGEOT: VehicleKey[] = ["p405", "pars", "samand", "dena"];
const IKCO_ALL: VehicleKey[] = ["p405", "pars", "samand", "dena", "p206"];
const RENAULT: VehicleKey[] = ["l90", "sandero"];
const SAIPA: VehicleKey[] = ["pride", "tiba", "quick"];
const COMMERCIAL: VehicleKey[] = ["nissanvan", "isuzu"];

export const PRODUCTS: SeedProduct[] = [
  // ── قطعات موتور ────────────────────────────────────────────────────────────
  {
    sku: "KSL-TK-4410", name: "کیت تسمه تایم به همراه واترپمپ", brand: "kessler", category: "engine", illustration: "timing-kit",
    price: "171920000", available: 18, threshold: 4, bin: "A-01-2", featured: true, weight: 3150, popularity: 3,
    short: "کیت کامل تسمه، تسمه‌سفت‌کن، هرزگرد و واترپمپ برای موتورهای EF7.",
    description: "همه آنچه برای سرویس تایمینگ لازم است در یک بسته: تسمه تایم HNBR با الیاف شیشه، تسمه‌سفت‌کن خودکار، بلبرینگ هرزگرد و واترپمپ با پروانه جوشی. قطعات با هم عرضه می‌شوند تا عمر کاری یکسانی داشته باشند.",
    specs: [["تعداد دندانه", "۱۴۱"], ["عرض تسمه", "۲۵٫۴ میلی‌متر"], ["پروانه واترپمپ", "پلاستیکی، ۷ پره"], ["دوره تعویض", "۶۰٬۰۰۰ کیلومتر"], ["محتویات", "تسمه، تسمه‌سفت‌کن، هرزگرد، واترپمپ، واشرها"]],
    oe: ["KX-EF7-TK01"], fits: ["samand", "dena"],
  },
  {
    sku: "KSL-TK-4420", name: "کیت زنجیر تایم موتور M15", brand: "kessler", category: "engine", illustration: "timing-kit",
    price: "149200000", available: 9, threshold: 3, bin: "A-01-3", weight: 1900, popularity: 2,
    short: "کیت زنجیر تایم شامل ریل‌های راهنما و زنجیرسفت‌کن هیدرولیکی.",
    description: "کیت زنجیر تایم با زنجیر تک‌ردیفه تقویت‌شده، ریل‌های راهنمای پلی‌آمیدی و زنجیرسفت‌کن هیدرولیکی. زنجیر در کارخانه پیش‌کشش داده شده تا ازدیاد طول در کارکرد به حداقل برسد.",
    specs: [["نوع زنجیر", "تک‌ردیفه غلتکی"], ["تعداد حلقه", "۱۳۴"], ["ریل راهنما", "۲ عدد PA66"], ["زنجیرسفت‌کن", "هیدرولیکی"]],
    fits: ["tiba", "quick"],
  },
  {
    sku: "KSL-GS-2203", name: "واشر سرسیلندر چندلایه فلزی ۱٫۱۰ میلی‌متر", brand: "kessler", category: "engine", illustration: "gasket",
    price: "51840000", available: 34, threshold: 6, bin: "A-02-1", weight: 380, popularity: 3,
    short: "واشر سرسیلندر سه‌لایه فولادی (MLS) با ضخامت فشرده ۱٫۱۰ میلی‌متر.",
    description: "واشر سرسیلندر سه‌لایه فولادی با لایه‌های بیرونی روکش‌دار الاستومری و لایه استاپر دور هر محفظه احتراق. ضخامت مناسب را بر اساس برآمدگی پیستون انتخاب کنید؛ این مدل با یک شیار مشخص می‌شود.",
    specs: [["ساختار", "سه‌لایه MLS"], ["ضخامت فشرده", "۱٫۱۰ میلی‌متر"], ["شناسه", "یک شیار"], ["قطر سیلندر", "۸۳ میلی‌متر"]],
    oe: ["KX-XU7-HG110"], fits: PEUGEOT,
  },
  {
    sku: "KSL-GS-2290", name: "واشر کامل موتور", brand: "kessler", category: "engine", illustration: "gasket",
    price: "126400000", available: 7, threshold: 3, bin: "A-02-2", weight: 1850,
    short: "ست کامل اورهال: واشر سرسیلندر، کارتل، درب سوپاپ، منیفولد و کاسه‌نمدها.",
    description: "ست کامل واشر برای اورهال موتور شامل واشر سرسیلندر، واشر درب سوپاپ، واشر کارتل، واشرهای منیفولد هوا و دود، لاستیک ساق سوپاپ و کاسه‌نمدهای میل‌لنگ.",
    specs: [["واشر سرسیلندر", "MLS، ۱٫۱۰ میلی‌متر"], ["لاستیک ساق سوپاپ", "۱۶ عدد FKM"], ["کاسه‌نمد میل‌لنگ", "PTFE، جلو و عقب"], ["تعداد قطعات", "۵۸"]],
    fits: PEUGEOT,
  },
  {
    sku: "KSL-CS-3105", name: "میل‌سوپاپ دود", brand: "kessler", category: "engine", illustration: "camshaft",
    price: "249600000", available: 5, threshold: 2, bin: "A-03-1", weight: 2650,
    short: "میل‌سوپاپ چدن سفید با بادامک‌های القایی‌سخت‌شده.",
    description: "میل‌سوپاپ دود ریخته‌گری‌شده از چدن سفید با بادامک‌های سخت‌کاری القایی و یاتاقان‌های سنگ‌خورده. به همراه پیچ چرخ‌دنده عرضه می‌شود؛ تعویض تایپت‌ها هم‌زمان توصیه می‌شود.",
    specs: [["جنس", "چدن سفید"], ["سختی بادامک", "۵۲ تا ۵۶ HRC"], ["تعداد یاتاقان", "۵"], ["سوپاپ در هر سیلندر", "۴"]],
    fits: ["samand", "dena"],
  },
  {
    sku: "STR-EM-1180", name: "دسته موتور هیدرولیکی سمت راست", brand: "strada", category: "engine", illustration: "engine-mount",
    price: "62720000", available: 22, threshold: 5, bin: "A-04-2", weight: 1420, popularity: 2,
    short: "دسته موتور روغنی که لرزش دور آرام را جذب می‌کند.",
    description: "دسته موتور هیدرولیکی با محفظه گلیکولی تنظیم‌شده برای فرکانس لرزش دور آرام. براکت آلومینیومی دایکست با پیچ‌های نصب‌شده.",
    specs: [["نوع", "هیدرولیکی"], ["سمت", "راست (سمت تایم)"], ["براکت", "آلومینیوم دایکست"], ["پیچ و مهره", "همراه دارد"]],
    fits: IKCO_ALL,
  },
  {
    sku: "STR-EM-1195", name: "دسته گیربکس سمت چپ", brand: "strada", category: "engine", illustration: "engine-mount",
    price: "42080000", available: 16, threshold: 4, bin: "A-04-3", weight: 980,
    short: "دسته گیربکس لاستیکی-فلزی برای گیربکس‌های دستی.",
    description: "دسته گیربکس از لاستیک طبیعی پیوندخورده به براکت فولادی. هم‌راستایی مجموعه انتقال قدرت را بازمی‌گرداند و صدای ضربه هنگام حرکت را از بین می‌برد.",
    specs: [["نوع", "لاستیکی-فلزی"], ["سمت", "چپ (سمت گیربکس)"], ["سختی لاستیک", "۶۵ Shore A"]],
    fits: ["tiba", "nissanvan"],
  },

  // ── سرسیلندر و سوپاپ ───────────────────────────────────────────────────────
  {
    sku: "KSL-CH-9001", name: "سرسیلندر لخت بازسازی‌شده", brand: "kessler", category: "cylinder-heads", illustration: "cylinder-head",
    price: "551200000", available: 3, threshold: 2, bin: "C-01-1", featured: true, weight: 14200, popularity: 1,
    short: "سرسیلندر آلومینیومی تست فشار و ترک‌یابی‌شده با کف تراش‌خورده.",
    description: "سرسیلندر آلومینیومی بازسازی‌شده در کارخانه: شست‌وشو، ترک‌یابی، تست فشار در ۳ بار و تراش کف در حد مجاز. به‌صورت لخت برای انتقال قطعات قبلی یا همراه با کیت سوپاپ عرضه می‌شود.",
    specs: [["جنس", "آلیاژ آلومینیوم"], ["تعداد سوپاپ", "۱۶ (۴ در هر سیلندر)"], ["تست فشار", "۳ بار، ۶۰ درجه"], ["صافی سطح", "Ra ≤ 1.0 µm"], ["تحویل قطعه کهنه", "الزامی"]],
    fits: ["samand", "dena"],
  },
  {
    sku: "KSL-CH-9010", name: "سرسیلندر کامل با مکانیزم سوپاپ", brand: "kessler", category: "cylinder-heads", illustration: "cylinder-head",
    price: "998400000", available: 2, threshold: 1, bin: "C-01-2", weight: 21800,
    short: "سرسیلندر مونتاژشده با سوپاپ، فنر، میل‌سوپاپ و تایپت.",
    description: "سرسیلندر کامل و آماده نصب شامل میل‌سوپاپ‌ها، اسبک‌ها، تایپت‌های هیدرولیکی، سوپاپ‌ها، فنرها و لاستیک ساق سوپاپ. نشیمنگاه سوپاپ‌ها تست خلأ شده و پیچ‌های سرسیلندر همراه آن است.",
    specs: [["مونتاژ", "کامل با میل‌سوپاپ"], ["نشیمنگاه سوپاپ", "تست خلأ"], ["پیچ سرسیلندر", "همراه (۱۰ عدد)"], ["تحویل قطعه کهنه", "الزامی"]],
    fits: ["p405", "pars"],
  },
  {
    sku: "KSL-VL-0112", name: "سوپاپ هوا ۲۸٫۷ میلی‌متر", brand: "kessler", category: "cylinder-heads", illustration: "valve",
    price: "9520000", available: 120, threshold: 24, bin: "C-02-1", weight: 60, popularity: 2,
    short: "ساق کروم‌کاری‌شده و نوک سخت‌کاری‌شده؛ فروش تکی.",
    description: "سوپاپ هوا از فولاد مقاوم در برابر حرارت با ساق کروم‌کاری‌شده برای مقاومت سایشی و نوک سخت‌کاری القایی.",
    specs: [["قطر سر", "۲۸٫۷ میلی‌متر"], ["قطر ساق", "۵٫۹۷ میلی‌متر"], ["طول", "۸۹٫۹ میلی‌متر"], ["جنس", "X45CrSi9-3"]],
    fits: PEUGEOT,
  },
  {
    sku: "KSL-VL-0118", name: "سوپاپ دود ۲۶ میلی‌متر", brand: "kessler", category: "cylinder-heads", illustration: "valve",
    price: "11680000", available: 96, threshold: 24, bin: "C-02-2", weight: 62,
    short: "سوپاپ دود دوفلزی با سر آلیاژ نیکل‌بالا.",
    description: "سوپاپ دود دوفلزی جوش اصطکاکی: سر از آلیاژ پرنیکل برای مقاومت حرارتی و ساق مارتنزیتی برای مقاومت سایشی. فروش تکی.",
    specs: [["قطر سر", "۲۶ میلی‌متر"], ["قطر ساق", "۵٫۹۵ میلی‌متر"], ["طول", "۸۹٫۶ میلی‌متر"], ["ساختار", "دوفلزی، جوش اصطکاکی"]],
    fits: PEUGEOT,
  },
  {
    sku: "KSL-HB-0450", name: "ست پیچ سرسیلندر", brand: "kessler", category: "cylinder-heads", illustration: "valve",
    price: "33840000", available: 40, threshold: 8, bin: "C-02-4", weight: 720, popularity: 2,
    short: "پیچ‌های کششی یک‌بارمصرف، ست ۱۰ عددی.",
    description: "پیچ‌های کششی یک‌بارمصرف برای نصب سرسیلندر. با هر تعویض واشر سرسیلندر، پیچ‌ها را نیز تعویض کنید.",
    specs: [["تعداد", "۱۰"], ["رزوه", "M12 × 1.5"], ["طول", "۱۸۰ میلی‌متر"], ["روش بستن", "گشتاور-زاویه"]],
    fits: PEUGEOT,
  },

  // ── پیستون و رینگ ──────────────────────────────────────────────────────────
  {
    sku: "KSL-PS-7712", name: "پیستون با رینگ، استاندارد", brand: "kessler", category: "pistons", illustration: "piston",
    price: "75600000", available: 28, threshold: 8, bin: "D-01-1", featured: true, weight: 610, popularity: 2,
    short: "پیستون آلومینیومی با پوشش گرافیتی دامنه، به همراه رینگ و گژن‌پین.",
    description: "پیستون ریخته‌گری آلومینیوم-سیلیسیم با گالری خنک‌کاری، دامنه با پوشش گرافیتی و شیار رینگ اول آنودایزشده. به همراه ست رینگ، گژن‌پین و خار عرضه می‌شود.",
    specs: [["قطر", "۸۳ میلی‌متر (استاندارد)"], ["ارتفاع تراکم", "۳۷٫۶۵ میلی‌متر"], ["قطر گژن‌پین", "۲۲ میلی‌متر"], ["گالری خنک‌کاری", "دارد"], ["پوشش دامنه", "گرافیت"]],
    fits: PEUGEOT,
  },
  {
    sku: "KSL-PS-7713", name: "پیستون با رینگ، سایز ۰٫۵۰", brand: "kessler", category: "pistons", illustration: "piston",
    price: "78560000", available: 12, threshold: 4, bin: "D-01-2", weight: 615,
    short: "پیستون اورسایز برای سیلندرهای تراش‌خورده.",
    description: "پیستون اورسایز (۰٫۵۰+ میلی‌متر) برای سیلندرهای تراش‌خورده، با ساختاری مشابه سایز استاندارد. به همراه ست رینگ و گژن‌پین.",
    specs: [["قطر", "۸۳٫۵ میلی‌متر (۰٫۵۰+)"], ["ارتفاع تراکم", "۳۷٫۶۵ میلی‌متر"], ["قطر گژن‌پین", "۲۲ میلی‌متر"]],
    fits: PEUGEOT,
  },
  {
    sku: "KSL-PR-7740", name: "ست رینگ پیستون ۴ سیلندر", brand: "kessler", category: "pistons", illustration: "piston-rings",
    price: "58240000", available: 24, threshold: 6, bin: "D-02-1", weight: 180, popularity: 2,
    short: "رینگ کمپرسی، رینگ دوم و رینگ روغن برای یک موتور.",
    description: "ست کامل رینگ برای چهار سیلندر: رینگ اول با پوشش کروم-سرامیک، رینگ دوم مخروطی و رینگ روغن سه‌تکه.",
    specs: [["قطر سیلندر", "۸۳ میلی‌متر"], ["رینگ اول", "۱٫۷۵ میلی‌متر، پوشش CKS"], ["رینگ دوم", "۱٫۵ میلی‌متر، مخروطی"], ["رینگ روغن", "۲ میلی‌متر، سه‌تکه"]],
    fits: PEUGEOT,
  },
  {
    sku: "SAT-PR-2201", name: "ست رینگ پیستون موتور M15", brand: "sato", category: "pistons", illustration: "piston-rings",
    price: "51280000", available: 10, threshold: 4, bin: "D-02-2", weight: 150,
    short: "ست رینگ کم‌اصطکاک برای موتورهای بنزینی کم‌حجم.",
    description: "ست رینگ کم‌اصطکاک با رینگ اول دارای پوشش PVD، مناسب موتورهای بنزینی کم‌مصرف.",
    specs: [["قطر سیلندر", "۷۸ میلی‌متر"], ["رینگ اول", "۱ میلی‌متر، PVD"], ["رینگ دوم", "۱ میلی‌متر"], ["رینگ روغن", "۲ میلی‌متر، سه‌تکه"]],
    fits: ["tiba", "quick"],
  },
  {
    sku: "SAT-BR-3320", name: "ست یاتاقان ثابت (استاندارد)", brand: "sato", category: "pistons", illustration: "bearing",
    price: "38960000", available: 19, threshold: 5, bin: "D-03-1", weight: 260,
    short: "یاتاقان ثابت سه‌لایه با لایه رویی پاششی.",
    description: "ست یاتاقان ثابت میل‌لنگ سه‌لایه با لایه رویی بدون سرب برای تحمل بار بالا.",
    specs: [["سایز", "استاندارد"], ["ساختار", "سه‌لایه، پاششی"], ["تعداد کفه", "۱۰"], ["بغل‌یاتاقان", "همراه دارد"]],
    fits: ["samand", "dena", "cerato"],
  },
  {
    sku: "SAT-BR-3340", name: "ست یاتاقان متحرک (استاندارد)", brand: "sato", category: "pistons", illustration: "bearing",
    price: "31920000", available: 21, threshold: 5, bin: "D-03-2", weight: 180,
    short: "یاتاقان شاتون برای چهار سیلندر.",
    description: "کفه‌های یاتاقان شاتون بدون سرب با سطح کاری پوشش‌دار پلیمری برای دوام بیشتر در ترافیک شهری.",
    specs: [["سایز", "استاندارد"], ["پوشش", "پلیمری"], ["تعداد کفه", "۸"]],
    fits: PEUGEOT,
  },

  // ── فیلترها ────────────────────────────────────────────────────────────────
  {
    sku: "NRD-OF-1045", name: "فیلتر روغن کارتریجی", brand: "nordline", category: "filters", illustration: "oil-filter",
    price: "7120000", available: 340, threshold: 60, bin: "F-01-1", featured: true, weight: 120, popularity: 6,
    short: "فیلتر کارتریجی بدون فلز با مدیای مصنوعی و اورینگ.",
    description: "المنت فیلتر روغن بدون فلز و سازگار با محیط زیست با مدیای تمام‌مصنوعی برای دوره تعویض طولانی. به همراه اورینگ‌های جایگزین عرضه می‌شود.",
    specs: [["نوع", "کارتریجی"], ["ارتفاع", "۱۴۱ میلی‌متر"], ["قطر بیرونی", "۶۵ میلی‌متر"], ["مدیا", "تمام‌مصنوعی"], ["اورینگ", "همراه دارد"]],
    oe: ["NX-EF7-OF45"], fits: ["samand", "dena"],
  },
  {
    sku: "NRD-OF-1060", name: "فیلتر روغن پیچی", brand: "nordline", category: "filters", illustration: "oil-filter",
    price: "5920000", available: 260, threshold: 50, bin: "F-01-2", weight: 280, popularity: 5,
    short: "فیلتر پیچی با سوپاپ ضدبرگشت.",
    description: "فیلتر روغن پیچی با سوپاپ ضدبرگشت سیلیکونی و سوپاپ کنارگذر، مناسب موتورهای بنزینی و دیزلی.",
    specs: [["نوع", "پیچی"], ["رزوه", "3/4\"-16 UNF"], ["ارتفاع", "۸۶ میلی‌متر"], ["فشار باز شدن کنارگذر", "۱ بار"]],
    fits: ["p405", "pars", "pride", "tiba", "quick"],
  },
  {
    sku: "NRD-AF-2210", name: "فیلتر هوا تخت", brand: "nordline", category: "filters", illustration: "air-filter",
    price: "13440000", available: 140, threshold: 30, bin: "F-02-1", weight: 310, popularity: 5,
    short: "فیلتر هوای پانلی چین‌دار با لایه پیش‌فیلتر.",
    description: "فیلتر هوای پانلی با لایه پیش‌فیلتر و مدیای سلولزی چین‌دار با راندمان جداسازی ۹۹٫۵ درصد.",
    specs: [["طول", "۲۹۷ میلی‌متر"], ["عرض", "۱۸۲ میلی‌متر"], ["ارتفاع", "۵۵ میلی‌متر"], ["راندمان", "۹۹٫۵٪ (ISO 5011)"]],
    fits: IKCO_ALL,
  },
  {
    sku: "NRD-AF-2245", name: "فیلتر هوا گرد سنگین", brand: "nordline", category: "filters", illustration: "air-filter",
    price: "19680000", available: 48, threshold: 10, bin: "F-02-2", weight: 680,
    short: "المنت گرد سنگین برای خودروهای تجاری سبک.",
    description: "المنت گرد فیلتر هوا با توری داخلی گالوانیزه، مناسب کار در محیط‌های پرگردوغبار.",
    specs: [["قطر بیرونی", "۱۶۲ میلی‌متر"], ["ارتفاع", "۲۸۲ میلی‌متر"], ["توری داخلی", "فولاد گالوانیزه"]],
    fits: COMMERCIAL,
  },
  {
    sku: "NRD-FF-3105", name: "فیلتر بنزین با رگلاتور", brand: "nordline", category: "filters", illustration: "fuel-filter",
    price: "24960000", available: 86, threshold: 15, bin: "F-03-1", weight: 520, popularity: 4,
    short: "فیلتر بنزین خطی برای سیستم‌های انژکتوری.",
    description: "فیلتر سوخت با مدیای الیاف شیشه پرظرفیت که سیستم انژکتور را در برابر ذرات و آب محافظت می‌کند.",
    specs: [["نوع", "خطی"], ["دقت فیلتراسیون", "۴ میکرون"], ["جداسازی آب", "۹۳٪"], ["اتصالات", "۸ میلی‌متر سریع"]],
    fits: [...PEUGEOT, ...RENAULT],
  },
  {
    sku: "NRD-FF-3150", name: "مجموعه پوسته فیلتر گازوئیل", brand: "nordline", category: "filters", illustration: "fuel-filter",
    price: "35920000", available: 14, threshold: 4, bin: "F-03-2", weight: 900,
    short: "پوسته کامل با گرمکن برای خودروهای دیزلی.",
    description: "پوسته کامل فیلتر گازوئیل با المنت و گرمکن برقی برای روشن شدن مطمئن در هوای سرد.",
    specs: [["گرمکن", "۱۲ ولت، ۲۵۰ وات"], ["دقت فیلتراسیون", "۵ میکرون"], ["محتویات", "پوسته، المنت، واشرها"]],
    fits: COMMERCIAL,
  },
  {
    sku: "NRD-CF-4120", name: "فیلتر کابین کربن فعال", brand: "nordline", category: "filters", illustration: "cabin-filter",
    price: "14720000", available: 120, threshold: 25, bin: "F-04-1", weight: 260, popularity: 4,
    short: "فیلتر گرده و بو با لایه کربن فعال.",
    description: "فیلتر کابین سه‌لایه که فیلتراسیون ذرات را با لایه کربن فعال برای جذب بوی دود و ازن ترکیب می‌کند.",
    specs: [["نوع", "کربن فعال"], ["طول", "۲۸۰ میلی‌متر"], ["عرض", "۲۰۶ میلی‌متر"], ["ارتفاع", "۳۰ میلی‌متر"]],
    fits: IKCO_ALL,
  },
  {
    sku: "NRD-CF-4135", name: "فیلتر کابین معمولی", brand: "nordline", category: "filters", illustration: "cabin-filter",
    price: "9280000", available: 0, threshold: 20, bin: "F-04-2", weight: 180,
    short: "فیلتر گرده استاندارد برای خودروهای کوچک.",
    description: "فیلتر کابین الکترواستاتیک که گرده و گردوغبار ریز تا ۲٫۵ میکرون را جذب می‌کند.",
    specs: [["نوع", "ذرات"], ["طول", "۲۳۵ میلی‌متر"], ["عرض", "۲۱۵ میلی‌متر"]],
    fits: [...RENAULT, ...SAIPA],
  },

  // ── سیستم ترمز ─────────────────────────────────────────────────────────────
  {
    sku: "VLX-BD-2841", name: "دیسک ترمز جلو هواخنک ۲۶۶ میلی‌متر (جفت)", brand: "valtrex", category: "brakes", illustration: "brake-disc",
    price: "94720000", available: 46, threshold: 8, bin: "B-01-1", featured: true, weight: 13200, popularity: 4,
    short: "دیسک چدنی G3000 هواخنک با پوشش ضدزنگ.",
    description: "دیسک ترمز جلو با تهویه داخلی از چدن خاکستری G3000 با پوشش زینک‌فلیک روی توپی و پره‌ها. بالانس‌شده و تست لنگی؛ به‌صورت جفت عرضه می‌شود.",
    specs: [["قطر", "۲۶۶ میلی‌متر"], ["ضخامت", "۲۲ میلی‌متر"], ["حداقل ضخامت", "۲۰ میلی‌متر"], ["سوراخ مرکزی", "۶۵ میلی‌متر"], ["تعداد سوراخ پیچ", "۴"], ["بسته‌بندی", "جفت"]],
    fits: IKCO_ALL,
  },
  {
    sku: "VLX-BD-2860", name: "دیسک ترمز عقب توپر (جفت)", brand: "valtrex", category: "brakes", illustration: "brake-disc",
    price: "55120000", available: 38, threshold: 8, bin: "B-01-2", weight: 9100, popularity: 3,
    short: "دیسک عقب توپر با پوشش محافظ، جفتی.",
    description: "دیسک ترمز عقب توپر با پوشش محافظی که با اولین ترمزها پاک می‌شود. به‌صورت جفت عرضه می‌شود.",
    specs: [["قطر", "۲۴۷ میلی‌متر"], ["ضخامت", "۸ میلی‌متر"], ["حداقل ضخامت", "۷ میلی‌متر"], ["بسته‌بندی", "جفت"]],
    fits: ["pars", "dena"],
  },
  {
    sku: "VLX-BD-2905", name: "دیسک ترمز جلو سنگین (جفت)", brand: "valtrex", category: "brakes", illustration: "brake-disc",
    price: "113600000", available: 6, threshold: 4, bin: "B-01-4", weight: 16400,
    short: "دیسک هواخنک سنگین برای خودروهای تجاری.",
    description: "دیسک جلو هواخنک سنگین برای خودروهای تجاری سبک با پره‌های جهت‌دار برای ظرفیت حرارتی بالا.",
    specs: [["قطر", "۲۹۰ میلی‌متر"], ["ضخامت", "۲۸ میلی‌متر"], ["پره‌ها", "جهت‌دار"], ["بسته‌بندی", "جفت"]],
    fits: COMMERCIAL,
  },
  {
    sku: "VLX-BP-1520", name: "لنت ترمز جلو کم‌فلز", brand: "valtrex", category: "brakes", illustration: "brake-pads",
    price: "37040000", available: 92, threshold: 15, bin: "B-02-1", featured: true, weight: 1750, popularity: 6,
    short: "لنت دارای تأییدیه ECE R90 با پخ، شیار و شیم ضدصدا.",
    description: "لنت جلو کم‌فلز با شیم چندلایه ضدصدا، بلوک اصطکاکی پخ‌دار و شیاردار و نشانگر سایش. دارای تأییدیه ECE R90.",
    specs: [["عرض", "۱۳۰ میلی‌متر"], ["ارتفاع", "۵۳ میلی‌متر"], ["ضخامت", "۱۸ میلی‌متر"], ["نشانگر سایش", "صوتی"], ["تأییدیه", "ECE R90"]],
    fits: IKCO_ALL,
  },
  {
    sku: "VLX-BP-1545", name: "لنت ترمز عقب دیسکی", brand: "valtrex", category: "brakes", illustration: "brake-pads",
    price: "31840000", available: 74, threshold: 12, bin: "B-02-2", weight: 980, popularity: 4,
    short: "لنت عقب برای خودروهای دارای ترمز دیسکی عقب.",
    description: "لنت ترمز عقب با ترکیب اصطکاکی پایدار و صدای کم، مناسب خودروهای دارای ترمز دیسکی در محور عقب.",
    specs: [["عرض", "۸۷ میلی‌متر"], ["ارتفاع", "۴۸ میلی‌متر"], ["ضخامت", "۱۵ میلی‌متر"], ["تأییدیه", "ECE R90"]],
    fits: ["pars", "dena", "cerato"],
  },
  {
    sku: "VLX-BP-1580", name: "لنت ترمز جلو تجاری", brand: "valtrex", category: "brakes", illustration: "brake-pads",
    price: "46560000", available: 33, threshold: 8, bin: "B-02-3", weight: 2100, popularity: 3,
    short: "لنت سنگین برای وانت و کامیونت، با سنسور سایش.",
    description: "ترکیب اصطکاکی مخصوص بار سنگین برای وانت و کامیونت، به همراه سنسور الکترونیکی سایش.",
    specs: [["عرض", "۱۵۵ میلی‌متر"], ["ارتفاع", "۶۸ میلی‌متر"], ["ضخامت", "۲۰ میلی‌متر"], ["سنسور سایش", "همراه دارد"]],
    fits: COMMERCIAL,
  },
  {
    sku: "VLX-BC-0712", name: "کالیپر ترمز جلو چپ بازسازی‌شده", brand: "valtrex", category: "brakes", illustration: "brake-caliper",
    price: "106000000", available: 2, threshold: 3, bin: "B-03-1", weight: 3600, popularity: 2,
    short: "کالیپر شناور تک‌پیستونی، تست فشار شده.",
    description: "کالیپر شناور تک‌پیستونی بازسازی‌شده با کاسه‌نمد، گردگیر، پیچ هواگیری و پین‌های راهنمای نو. هر عدد در ۱۶۰ بار تست فشار می‌شود.",
    specs: [["موقعیت", "جلو چپ"], ["قطر پیستون", "۵۴ میلی‌متر"], ["نوع", "شناور، تک‌پیستون"], ["تست فشار", "۱۶۰ بار"], ["تحویل قطعه کهنه", "الزامی"]],
    fits: IKCO_ALL,
  },
  {
    sku: "VLX-BC-0713", name: "کالیپر ترمز جلو راست بازسازی‌شده", brand: "valtrex", category: "brakes", illustration: "brake-caliper",
    price: "106000000", available: 4, threshold: 3, bin: "B-03-2", weight: 3600,
    short: "کالیپر شناور تک‌پیستونی، تست فشار شده.",
    description: "کالیپر شناور تک‌پیستونی بازسازی‌شده با کاسه‌نمد، گردگیر، پیچ هواگیری و پین‌های راهنمای نو. هر عدد در ۱۶۰ بار تست فشار می‌شود.",
    specs: [["موقعیت", "جلو راست"], ["قطر پیستون", "۵۴ میلی‌متر"], ["نوع", "شناور، تک‌پیستون"], ["تست فشار", "۱۶۰ بار"], ["تحویل قطعه کهنه", "الزامی"]],
    fits: IKCO_ALL,
  },
  {
    sku: "VLX-BF-0050", name: "روغن ترمز DOT 4، یک لیتری", brand: "valtrex", category: "brakes", illustration: "brake-pads",
    price: "7840000", available: 210, threshold: 40, bin: "B-04-1", weight: 1100, popularity: 3,
    short: "روغن ترمز کم‌گرانروی DOT 4 برای سیستم‌های ABS.",
    description: "روغن ترمز DOT 4 با گرانروی پایین، مناسب سیستم‌های ABS و ESC. نقطه جوش خشک ۲۶۵ درجه سانتی‌گراد.",
    specs: [["استاندارد", "DOT 4 LV / ISO 4925 Class 6"], ["نقطه جوش خشک", "۲۶۵ درجه"], ["نقطه جوش مرطوب", "۱۷۰ درجه"], ["حجم", "۱ لیتر"]],
    fits: [...IKCO_ALL, ...RENAULT, ...SAIPA],
  },

  // ── جلوبندی و فرمان ────────────────────────────────────────────────────────
  {
    sku: "STR-SA-5510", name: "کمک‌فنر جلو گازی دوجداره", brand: "strada", category: "suspension", illustration: "shock-absorber",
    price: "59920000", available: 30, threshold: 6, bin: "S-01-1", featured: true, weight: 3900, popularity: 3,
    short: "کمک‌فنر گازی برای جلوبندی مک‌فرسون.",
    description: "کمک‌فنر جلو دوجداره گازی با میل ۲۲ میلی‌متری کروم‌کاری‌شده و فنر برگشت. سوپاپ‌بندی مطابق مشخصات سواری کارخانه.",
    specs: [["نوع", "دوجداره، گازی"], ["قطر میل", "۲۲ میلی‌متر"], ["موقعیت نصب", "محور جلو"], ["طول باز", "۵۱۲ میلی‌متر"], ["طول جمع", "۳۴۸ میلی‌متر"]],
    fits: IKCO_ALL,
  },
  {
    sku: "STR-SA-5530", name: "کمک‌فنر عقب تک‌جداره", brand: "strada", category: "suspension", illustration: "shock-absorber",
    price: "49920000", available: 26, threshold: 6, bin: "S-01-2", weight: 2100, popularity: 2,
    short: "کمک‌فنر عقب پرفشار تک‌جداره.",
    description: "کمک‌فنر عقب تک‌جداره با پیستون شناور و شارژ نیتروژن ۲۵ بار برای میرایی یکنواخت زیر بار سنگین.",
    specs: [["نوع", "تک‌جداره، گازی"], ["فشار گاز", "۲۵ بار"], ["موقعیت نصب", "محور عقب"]],
    fits: ["cerato", "hilux"],
  },
  {
    sku: "STR-SA-5590", name: "کمک‌فنر جلو سنگین تجاری", brand: "strada", category: "suspension", illustration: "shock-absorber",
    price: "77440000", available: 0, threshold: 4, bin: "S-01-4", weight: 5200,
    short: "کمک‌فنر تقویت‌شده برای خودروهای تجاری.",
    description: "کمک‌فنر جلو تقویت‌شده با میل ۲۵ میلی‌متری برای خودروهایی که نزدیک حداکثر ظرفیت بار کار می‌کنند.",
    specs: [["نوع", "دوجداره، گازی"], ["قطر میل", "۲۵ میلی‌متر"], ["وزن ناخالص", "تا ۳٫۵ تن"]],
    fits: COMMERCIAL,
  },
  {
    sku: "STR-CA-6210", name: "طبق پایین جلو چپ", brand: "strada", category: "suspension", illustration: "control-arm",
    price: "70960000", available: 15, threshold: 4, bin: "S-02-1", weight: 3300, popularity: 2,
    short: "طبق فورج با بوش و سیبک.",
    description: "طبق پایین فورج‌شده به همراه بوش‌های لاستیکی پرس‌شده و سیبک. پیچ و مهره‌های قفلی نو همراه آن است.",
    specs: [["موقعیت", "جلو چپ، پایین"], ["جنس", "فولاد فورج"], ["سیبک", "همراه دارد"], ["پیچ و مهره", "همراه دارد"]],
    fits: IKCO_ALL,
  },
  {
    sku: "STR-CA-6211", name: "طبق پایین جلو راست", brand: "strada", category: "suspension", illustration: "control-arm",
    price: "70960000", available: 13, threshold: 4, bin: "S-02-2", weight: 3300,
    short: "طبق فورج با بوش و سیبک.",
    description: "طبق پایین فورج‌شده به همراه بوش‌های لاستیکی پرس‌شده و سیبک. پیچ و مهره‌های قفلی نو همراه آن است.",
    specs: [["موقعیت", "جلو راست، پایین"], ["جنس", "فولاد فورج"], ["سیبک", "همراه دارد"], ["پیچ و مهره", "همراه دارد"]],
    fits: IKCO_ALL,
  },
  {
    sku: "STR-TR-6402", name: "سیبک فرمان بیرونی", brand: "strada", category: "suspension", illustration: "control-arm",
    price: "19440000", available: 58, threshold: 10, bin: "S-02-4", weight: 520, popularity: 3,
    short: "سیبک فرمان با گردگیر پلی‌اورتان.",
    description: "سیبک بیرونی فرمان با گریس دائمی و گردگیر پلی‌اورتان.",
    specs: [["رزوه", "M14 × 1.5"], ["مخروط", "۱:۱۰"], ["گردگیر", "پلی‌اورتان"]],
    fits: [...IKCO_ALL, ...RENAULT],
  },
  {
    sku: "STR-CS-7105", name: "فنر لول جلو", brand: "strada", category: "suspension", illustration: "coil-spring",
    price: "32960000", available: 36, threshold: 8, bin: "S-03-1", weight: 2400,
    short: "فنر کروم-سیلیسیم ساچمه‌زنی‌شده با پوشش اپوکسی.",
    description: "فنر لول سردپیچ از فولاد کروم-سیلیسیم، ساچمه‌زنی‌شده برای عمر خستگی بیشتر و پوشش پودری اپوکسی.",
    specs: [["قطر مفتول", "۱۳٫۲ میلی‌متر"], ["طول آزاد", "۳۸۲ میلی‌متر"], ["تعداد حلقه", "۶٫۵"], ["پوشش", "پودر اپوکسی"]],
    fits: IKCO_ALL,
  },
  {
    sku: "STR-CS-7140", name: "فنر لول عقب تقویتی", brand: "strada", category: "suspension", illustration: "coil-spring",
    price: "42240000", available: 18, threshold: 4, bin: "S-03-2", weight: 3100,
    short: "فنر عقب با سختی بیشتر برای بار و یدک‌کشی.",
    description: "فنر عقب تقویتی با سختی بیشتر برای خودروهایی که به‌طور منظم بار حمل می‌کنند.",
    specs: [["قطر مفتول", "۱۴٫۵ میلی‌متر"], ["طول آزاد", "۳۵۶ میلی‌متر"], ["سختی", "۱۸٪ بیشتر از استاندارد"]],
    fits: ["nissanvan", "pars", "samand"],
  },

  // ── گیربکس و کلاچ ──────────────────────────────────────────────────────────
  {
    sku: "TRV-CK-3300", name: "کیت کلاچ با فلایویل دوتکه", brand: "torvik", category: "transmission", illustration: "clutch-kit",
    price: "374400000", available: 6, threshold: 2, bin: "T-01-1", featured: true, weight: 14600, popularity: 2,
    short: "کیت چهارتکه: فلایویل دوتکه، دیسک، صفحه و بلبرینگ.",
    description: "کیت کامل تعویض کلاچ شامل فلایویل دوتکه، دیسک خودتنظیم، صفحه کلاچ با لنت ارگانیک و بلبرینگ کلاچ.",
    specs: [["قطر", "۲۲۸ میلی‌متر"], ["تعداد هزارخار", "۲۸"], ["فلایویل", "دوتکه"], ["بلبرینگ", "همراه دارد"], ["پیچ‌ها", "همراه دارد"]],
    fits: ["dena"],
  },
  {
    sku: "TRV-CK-3320", name: "دیسک و صفحه کلاچ سه‌تکه", brand: "torvik", category: "transmission", illustration: "clutch-kit",
    price: "151520000", available: 14, threshold: 3, bin: "T-01-2", weight: 6200, popularity: 2,
    short: "دیسک، صفحه و بلبرینگ کلاچ.",
    description: "کیت سه‌تکه کلاچ برای فلایویل یک‌تکه، به همراه ابزار تنظیم.",
    specs: [["قطر", "۲۰۰ میلی‌متر"], ["تعداد هزارخار", "۲۰"], ["بلبرینگ", "مکانیکی"]],
    fits: [...PEUGEOT, ...RENAULT],
  },
  {
    sku: "TRV-CK-3390", name: "کیت کلاچ سنگین تجاری", brand: "torvik", category: "transmission", illustration: "clutch-kit",
    price: "329600000", available: 1, threshold: 2, bin: "T-01-4", weight: 16200,
    short: "کلاچ تقویت‌شده برای کامیونت و وانت.",
    description: "کیت کلاچ تقویت‌شده برای موتورهای دیزلی پرگشتاور تجاری.",
    specs: [["قطر", "۲۷۵ میلی‌متر"], ["حداکثر گشتاور", "۴۲۰ نیوتن‌متر"]],
    fits: COMMERCIAL,
  },
  {
    sku: "TRV-CV-4410", name: "سرپلوس چرخ با گردگیر", brand: "torvik", category: "transmission", illustration: "cv-joint",
    price: "50320000", available: 22, threshold: 5, bin: "T-02-1", weight: 1900, popularity: 2,
    short: "سرپلوس ساچمه‌ای با گردگیر، بست و گریس.",
    description: "سرپلوس سمت چرخ با گردگیر ترموپلاستیک، بست‌های استیل، خار، مهره سر پلوس و گریس مولیبدن.",
    specs: [["هزارخار بیرونی", "۳۶"], ["هزارخار داخلی", "۳۰"], ["دنده ABS", "۴۵ دندانه"], ["گردگیر", "TPE"]],
    fits: IKCO_ALL,
  },
  {
    sku: "TRV-DS-4480", name: "پلوس کامل جلو چپ", brand: "torvik", category: "transmission", illustration: "cv-joint",
    price: "118880000", available: 5, threshold: 2, bin: "T-02-3", weight: 6100,
    short: "پلوس نو کامل با هر دو سرپلوس.",
    description: "پلوس کامل نو با سرپلوس سه‌شاخه داخلی و سرپلوس ساچمه‌ای بیرونی، گریس‌کاری و گردگیر شده.",
    specs: [["سمت", "جلو چپ"], ["طول", "۶۱۸ میلی‌متر"], ["گیربکس", "دستی"]],
    fits: ["tiba", "l90"],
  },

  // ── سیستم خنک‌کاری ─────────────────────────────────────────────────────────
  {
    sku: "HOL-RD-8810", name: "رادیاتور آب آلومینیومی", brand: "hollis", category: "cooling", illustration: "radiator",
    price: "131200000", available: 11, threshold: 3, bin: "K-01-1", featured: true, weight: 4800, popularity: 2,
    short: "هسته کاملاً لحیم‌شده آلومینیومی.",
    description: "رادیاتور آلومینیومی کاملاً لحیم‌شده با مخازن پلاستیکی و هسته ۲۶ میلی‌متری. مناسب نسخه‌های دنده‌ای و اتوماتیک.",
    specs: [["ابعاد هسته", "۶۵۰ × ۴۳۸ × ۲۶ میلی‌متر"], ["ساختار", "آلومینیوم لحیم‌شده"], ["جنس مخزن", "PA66-GF30"]],
    fits: IKCO_ALL,
  },
  {
    sku: "HOL-RD-8850", name: "اینترکولر", brand: "hollis", category: "cooling", illustration: "radiator",
    price: "158800000", available: 4, threshold: 2, bin: "K-01-3", weight: 3900,
    short: "خنک‌کن هوای شارژ برای موتورهای توربو.",
    description: "خنک‌کن هوای شارژ صفحه‌ای لحیم‌شده که دمای هوای ورودی را برای توان بیشتر و آلایندگی کمتر پایین می‌آورد.",
    specs: [["ابعاد هسته", "۶۱۵ × ۴۰۵ × ۳۲ میلی‌متر"], ["نوع", "هوا به هوا"]],
    fits: ["dena", "isuzu"],
  },
  {
    sku: "HOL-WP-8105", name: "واترپمپ با واشر", brand: "hollis", category: "cooling", illustration: "water-pump",
    price: "46560000", available: 27, threshold: 6, bin: "K-02-1", weight: 1250, popularity: 3,
    short: "پوسته ریخته‌گری، پروانه فلزی، آب‌بند مکانیکی.",
    description: "واترپمپ با پوسته آلومینیومی ریخته‌گری، پروانه فلزی و آب‌بند مکانیکی سیلیکون‌کاربید. به همراه واشر عرضه می‌شود.",
    specs: [["پروانه", "فلزی، ۸ پره"], ["آب‌بند", "مکانیکی SiC"], ["محرک", "تسمه تایم"]],
    fits: [...RENAULT, ...SAIPA],
  },
  {
    sku: "HOL-WP-8140", name: "واترپمپ برقی کمکی", brand: "hollis", category: "cooling", illustration: "water-pump",
    price: "100800000", available: 8, threshold: 2, bin: "K-02-2", weight: 900,
    short: "پمپ ۱۲ ولتی کمکی برای مدار توربو و بخاری.",
    description: "پمپ آب کمکی بدون جاروبک ۱۲ ولتی برای خنک‌کاری توربو پس از خاموشی و مدار بخاری.",
    specs: [["ولتاژ", "۱۲ ولت"], ["موتور", "DC بدون جاروبک"], ["دبی", "۱٬۰۰۰ لیتر بر ساعت"]],
    fits: ["dena", "cerato"],
  },
  {
    sku: "HOL-TH-8320", name: "ترموستات با پوسته ۸۷ درجه", brand: "hollis", category: "cooling", illustration: "thermostat",
    price: "27680000", available: 44, threshold: 8, bin: "K-03-1", weight: 410, popularity: 3,
    short: "ترموستات واکسی در پوسته کامپوزیتی.",
    description: "ترموستات واکسی مونتاژشده در پوسته تقویت‌شده با الیاف شیشه، با محل سنسور دما و واشر.",
    specs: [["دمای باز شدن", "۸۷ درجه"], ["پوسته", "PA66-GF35"], ["واشر", "همراه دارد"]],
    fits: IKCO_ALL,
  },
  {
    sku: "HOL-CL-0105", name: "ضدیخ کنسانتره، ۱٫۵ لیتری", brand: "hollis", category: "cooling", illustration: "thermostat",
    price: "11360000", available: 160, threshold: 30, bin: "K-04-1", weight: 1650, popularity: 3,
    short: "ضدیخ OAT سیلیکاتی، نسبت اختلاط یک به یک.",
    description: "ضدیخ کنسانتره OAT پایه گلیسرول، سازگار با استانداردهای G12 و G13. با نسبت یک به یک با آب مقطر تا منفی ۳۷ درجه محافظت می‌کند.",
    specs: [["استاندارد", "G13 / TL 774 J"], ["رنگ", "بنفش"], ["حجم", "۱٫۵ لیتر"]],
    fits: [...IKCO_ALL, ...RENAULT],
  },

  // ── برق و جرقه‌زنی ─────────────────────────────────────────────────────────
  {
    sku: "SAT-SP-1112", name: "شمع ایریدیوم", brand: "sato", category: "electrical", illustration: "spark-plug",
    price: "10720000", available: 420, threshold: 80, bin: "E-01-1", featured: true, weight: 50, popularity: 6,
    short: "الکترود مرکزی ایریدیوم ۰٫۶ میلی‌متر، عمر طولانی.",
    description: "شمع با عمر طولانی، الکترود مرکزی ایریدیوم ۰٫۶ میلی‌متری جوش لیزری و پد پلاتینی. فیلر از پیش تنظیم شده است.",
    specs: [["رزوه", "M12 × 1.25"], ["طول رزوه", "۲۶٫۵ میلی‌متر"], ["آچارخور", "۱۴ میلی‌متر"], ["فیلر", "۰٫۸ میلی‌متر"], ["عمر کاری", "۶۰٬۰۰۰ کیلومتر"]],
    fits: ["samand", "dena", "tiba", "quick"],
  },
  {
    sku: "SAT-SP-1120", name: "شمع نیکلی", brand: "sato", category: "electrical", illustration: "spark-plug",
    price: "5520000", available: 380, threshold: 80, bin: "E-01-2", weight: 48, popularity: 4,
    short: "شمع مغزی‌مس نیکلی برای موتورهای بنزینی.",
    description: "شمع با مغزی مس و آلیاژ نیکل، دارای مقاومت برای حذف پارازیت.",
    specs: [["رزوه", "M14 × 1.25"], ["طول رزوه", "۱۹ میلی‌متر"], ["آچارخور", "۱۶ میلی‌متر"], ["فیلر", "۱ میلی‌متر"]],
    fits: ["p405", "pars", "pride", "p206"],
  },
  {
    sku: "SAT-GP-1180", name: "شمع گرمکن سرامیکی", brand: "sato", category: "electrical", illustration: "spark-plug",
    price: "18240000", available: 150, threshold: 30, bin: "E-01-3", weight: 40, popularity: 4,
    short: "شمع گرمکن سریع‌گرم برای موتورهای دیزلی.",
    description: "شمع گرمکن سرامیکی که در کمتر از دو ثانیه به ۱٬۰۰۰ درجه می‌رسد؛ برای روشن شدن تمیز در هوای سرد.",
    specs: [["ولتاژ", "۴٫۴ ولت"], ["رزوه", "M10 × 1.0"], ["زمان گرم شدن", "کمتر از ۲ ثانیه"]],
    fits: COMMERCIAL,
  },
  {
    sku: "ARD-IC-2240", name: "کوئل مدادی", brand: "arden", category: "electrical", illustration: "ignition-coil",
    price: "34000000", available: 64, threshold: 12, bin: "E-02-1", weight: 380, popularity: 3,
    short: "کوئل روی شمع با درایور داخلی.",
    description: "کوئل مدادی با طبقه قدرت داخلی و کلاهک سیلیکونی؛ جایگزین مستقیم سیستم‌های کوئل روی شمع.",
    specs: [["نوع", "مدادی (روی شمع)"], ["سوکت", "۴ پین"], ["ولتاژ خروجی", "بیش از ۳۵ کیلوولت"]],
    fits: ["samand", "dena", "tiba", "quick"],
  },
  {
    sku: "ARD-AL-3150", name: "دینام ۹۰ آمپر بازسازی‌شده", brand: "arden", category: "electrical", illustration: "alternator",
    price: "214400000", available: 7, threshold: 2, bin: "E-03-1", featured: true, weight: 6100, popularity: 2,
    short: "بازسازی کامل با آفتامات و بلبرینگ نو.",
    description: "دینام بازسازی‌شده مطابق مشخصات کارخانه با بلبرینگ، آفتامات، ذغال و پولی هرزگرد نو؛ صددرصد تست انتهای خط.",
    specs: [["جریان خروجی", "۹۰ آمپر"], ["ولتاژ", "۱۴ ولت"], ["پولی", "هرزگرد، ۶ شیار"], ["تحویل قطعه کهنه", "الزامی"]],
    fits: PEUGEOT,
  },
  {
    sku: "ARD-AL-3190", name: "دینام ۱۲۰ آمپر نو", brand: "arden", category: "electrical", illustration: "alternator",
    price: "311200000", available: 3, threshold: 2, bin: "E-03-2", weight: 6800,
    short: "دینام نو پرقدرت برای خودروهای تجاری.",
    description: "دینام نو ۱۲۰ آمپری برای خودروهای تجاری با مصرف‌کننده‌های برقی اضافه (یخچال، نورپردازی، اینورتر).",
    specs: [["جریان خروجی", "۱۲۰ آمپر"], ["ولتاژ", "۱۴ ولت"], ["پولی", "دکوپلر، ۶ شیار"]],
    fits: COMMERCIAL,
  },
  {
    sku: "ARD-ST-4105", name: "استارت ۱٫۴ کیلووات بازسازی‌شده", brand: "arden", category: "electrical", illustration: "starter-motor",
    price: "156800000", available: 9, threshold: 2, bin: "E-04-1", weight: 4200, popularity: 2,
    short: "استارت گیربکسی بازسازی‌شده.",
    description: "استارت گیربکسی ۱٫۴ کیلوواتی بازسازی‌شده با بلبرینگ و اتومات نو.",
    specs: [["توان", "۱٫۴ کیلووات"], ["ولتاژ", "۱۲ ولت"], ["تعداد دندانه", "۱۰"], ["تحویل قطعه کهنه", "الزامی"]],
    fits: [...PEUGEOT, "cerato"],
  },
  {
    sku: "ARD-BT-5070", name: "باتری ۷۰ آمپر ساعت سیلد", brand: "arden", category: "electrical", illustration: "battery",
    price: "134400000", available: 20, threshold: 5, bin: "E-05-1", weight: 20500, popularity: 3,
    short: "باتری AGM بدون نیاز به نگهداری.",
    description: "باتری AGM بدون نیاز به نگهداری با عمر چرخه‌ای سه برابر باتری‌های معمولی؛ مناسب خودروهای پرمصرف برقی.",
    specs: [["ظرفیت", "۷۰ آمپر ساعت"], ["جریان راه‌اندازی سرد", "۷۶۰ آمپر (EN)"], ["فناوری", "AGM"], ["ابعاد", "۲۷۸ × ۱۷۵ × ۱۹۰ میلی‌متر"]],
    fits: [...IKCO_ALL, "cerato"],
  },
  {
    sku: "ARD-BT-5095", name: "باتری ۹۰ آمپر ساعت تجاری", brand: "arden", category: "electrical", illustration: "battery",
    price: "123200000", available: 12, threshold: 4, bin: "E-05-2", weight: 23400,
    short: "باتری EFB برای خودروهای تجاری.",
    description: "باتری EFB با افزودنی کربن برای وانت و کامیونت‌هایی با مصرف‌کننده‌های جانبی زیاد.",
    specs: [["ظرفیت", "۹۰ آمپر ساعت"], ["جریان راه‌اندازی سرد", "۸۰۰ آمپر (EN)"], ["فناوری", "EFB"]],
    fits: COMMERCIAL,
  },
  {
    sku: "SAT-LS-6612", name: "سنسور اکسیژن", brand: "sato", category: "electrical", illustration: "spark-plug",
    price: "70640000", available: 19, threshold: 4, bin: "E-06-1", weight: 160,
    short: "سنسور اکسیژن بالادستی، ۴ سیم.",
    description: "سنسور اکسیژن صفحه‌ای برای کنترل حلقه‌بسته سوخت. گریس ضدگیرپاژ از پیش زده شده است.",
    specs: [["نوع", "صفحه‌ای"], ["تعداد سیم", "۴"], ["طول کابل", "۶۲۰ میلی‌متر"]],
    fits: ["samand", "dena", "pars", "tiba"],
  },
];

export const ADDITIONAL_PRODUCTS_NOTE =
  "Scenario B (insufficient stock): VLX-BC-0712 is seeded with exactly 2 units available.";
