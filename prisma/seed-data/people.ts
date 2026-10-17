/** Demonstration people and businesses — all fictional. */

export const DEMO_USERS = [
  { key: "admin", email: "admin@autopart.test", name: "علی محمدی", role: "ADMIN", phone: "021-5555-0101" },
  { key: "manager", email: "manager@autopart.test", name: "مریم احمدی", role: "MANAGER", phone: "021-5555-0102" },
  { key: "visitor", email: "visitor@autopart.test", name: "رضا کریمی", role: "VISITOR", phone: "0912-555-0110" },
  { key: "visitor2", email: "sara.hosseini@autopart.test", name: "سارا حسینی", role: "VISITOR", phone: "0912-555-0111" },
  { key: "visitor3", email: "mehdi.jafari@autopart.test", name: "مهدی جعفری", role: "VISITOR", phone: "0912-555-0112" },
  { key: "warehouse", email: "warehouse@autopart.test", name: "حسین رحیمی", role: "WAREHOUSE", phone: "021-5555-0120" },
  { key: "supervisor", email: "supervisor@autopart.test", name: "نرگس صالحی", role: "WAREHOUSE_SUPERVISOR", phone: "021-5555-0121" },
] as const;

export type DemoUserKey = (typeof DEMO_USERS)[number]["key"];

export const DEMO_CUSTOMERS: {
  businessName: string;
  contactName: string;
  phone: string;
  email?: string;
  addressLine1: string;
  city: string;
  region?: string;
  postalCode?: string;
  notes?: string;
  visitors: DemoUserKey[];
}[] = [
  { businessName: "تعمیرگاه مرکزی پارس", contactName: "محمد رضایی", phone: "021-5555-2101", email: "parts@pars-garage.example", addressLine1: "خیابان آزادی، نبش کوچه دهم، پلاک ۴۲", city: "تهران", region: "تهران", postalCode: "1345678912", notes: "متخصص خودروهای پژو. تحویل صبح ترجیح دارد.", visitors: ["visitor"] },
  { businessName: "اتو سرویس شمال تهران", contactName: "امیر نوری", phone: "021-5555-2102", addressLine1: "بزرگراه صدر، خیابان قیطریه، پلاک ۱۸", city: "تهران", region: "تهران", postalCode: "1938765432", visitors: ["visitor"] },
  { businessName: "مرکز خدمات ناوگان شرق", contactName: "فاطمه موسوی", phone: "021-5555-2103", email: "fleet@sharq-service.example", addressLine1: "جاده خاوران، شهرک صنعتی، واحد ۱۲", city: "تهران", region: "تهران", postalCode: "1789456123", notes: "تعمیر ناوگان شرکت‌های پخش — بیشتر نیسان وانت و ایسوزو.", visitors: ["visitor"] },
  { businessName: "تعمیرگاه البرز موتور", contactName: "سعید کاظمی", phone: "026-5555-2104", addressLine1: "بلوار طالقانی، نبش خیابان دوم", city: "کرج", region: "البرز", postalCode: "3145789654", visitors: ["visitor"] },
  { businessName: "تکنیک خودرو قزوین", contactName: "زهرا قاسمی", phone: "028-5555-2105", addressLine1: "خیابان نادری، پلاک ۷۷", city: "قزوین", region: "قزوین", postalCode: "3413698745", visitors: ["visitor"] },
  { businessName: "عیب‌یابی خودرو قم", contactName: "حمید شریفی", phone: "025-5555-2106", addressLine1: "بلوار امین، جنب پمپ بنزین", city: "قم", region: "قم", postalCode: "3716547893", visitors: ["visitor", "visitor2"] },
  { businessName: "تعمیرگاه سپاهان", contactName: "مجید صادقی", phone: "031-5555-2107", email: "info@sepahan-auto.example", addressLine1: "خیابان کاوه، روبروی پایانه، پلاک ۱۵", city: "اصفهان", region: "اصفهان", postalCode: "8193745612", visitors: ["visitor2"] },
  { businessName: "لاستیک و سرویس نقش جهان", contactName: "لیلا امینی", phone: "031-5555-2108", addressLine1: "خیابان هزارجریب، پلاک ۲۰۳", city: "اصفهان", region: "اصفهان", postalCode: "8174698532", visitors: ["visitor2"] },
  { businessName: "خدمات ناوگان فارس", contactName: "کامران زارعی", phone: "071-5555-2109", email: "fleet@fars-fleet.example", addressLine1: "شهرک صنعتی بزرگ، خیابان ۱۰", city: "شیراز", region: "فارس", postalCode: "7158963214", notes: "نگهداری ناوگان ۶۰ دستگاهی شهرداری. صورتحساب ماهانه تجمیعی.", visitors: ["visitor2"] },
  { businessName: "موتور سنتر زند", contactName: "نسرین کریمی", phone: "071-5555-2110", addressLine1: "خیابان زند، نبش کوچه ۳۲", city: "شیراز", region: "فارس", postalCode: "7134569874", visitors: ["visitor2"] },
  { businessName: "تعمیرگاه دشتستان", contactName: "رسول بهرامی", phone: "061-5555-2111", addressLine1: "کیانپارس، خیابان هفتم", city: "اهواز", region: "خوزستان", postalCode: "6155874123", visitors: ["visitor2"] },
  { businessName: "خودرو تک مشهد", contactName: "مرتضی رحمانی", phone: "051-5555-2112", email: "info@khodrotech.example", addressLine1: "بلوار وکیل‌آباد، پلاک ۲۵۰", city: "مشهد", region: "خراسان رضوی", postalCode: "9187456321", visitors: ["visitor3"] },
  { businessName: "مرکز خودروهای تجاری توس", contactName: "جواد عباسی", phone: "051-5555-2113", addressLine1: "جاده آسیایی، شهرک صنعتی توس", city: "مشهد", region: "خراسان رضوی", postalCode: "9198745632", visitors: ["visitor3"] },
  { businessName: "تعمیرگاه آذربایجان", contactName: "یوسف نجفی", phone: "041-5555-2114", addressLine1: "خیابان ابوریحان، پلاک ۸۸", city: "تبریز", region: "آذربایجان شرقی", postalCode: "5165874123", visitors: ["visitor3"] },
  { businessName: "اتو سرویس خزر", contactName: "شیرین حیدری", phone: "011-5555-2115", addressLine1: "خیابان طالقانی، پلاک ۴۰", city: "ساری", region: "مازندران", postalCode: "4815896321", visitors: ["visitor3"] },
  { businessName: "تعمیرگاه زاگرس", contactName: "بهروز مرادی", phone: "083-5555-2116", addressLine1: "بلوار شهید بهشتی، پلاک ۱۲۶", city: "کرمانشاه", region: "کرمانشاه", postalCode: "6714589632", visitors: [] },
];

export const VISITOR_NOTES = [
  "مشتری لنت‌ها را قبل از معاینه فنی پنجشنبه لازم دارد.",
  "تحویل از درب پشتی — تعمیرگاه ساعت ۱۷:۳۰ تعطیل می‌شود.",
  "لطفاً قبل از ارسال با آقای رضایی تماس بگیرید.",
  "خودرو روی جک است، در صورت امکان فوری ارسال شود.",
  "اقلام ناموجود را مشتری در بازدید بعدی تحویل می‌گیرد.",
  "در صورت تعطیل بودن، به پذیرش تحویل داده شود.",
];

export const REJECTION_REASONS = [
  "حساب مشتری به دلیل بدهی معوق مسدود است — واحد مالی با مشتری تماس می‌گیرد.",
  "تکراری؛ همین سفارش قبلاً تلفنی ثبت شده است.",
];

export const CANCELLATION_REASONS = ["مشتری قطعه را از بازار محلی تهیه کرد.", "خودرو اسقاط شد و مشتری کار را لغو کرد."];

export const INTERNAL_NOTES = [
  "شرایط پرداخت ۳۰ روزه با واحد مالی تأیید شد. مجاز به ارسال.",
  "مشتری درخواست کرده شماره کارت تعمیر روی فاکتور درج شود.",
  "تخفیف تلفنی با مدیر تعمیرگاه برای خرید مکرر توافق شد.",
];
