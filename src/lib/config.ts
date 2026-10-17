/**
 * Business configuration shared by server and client code.
 * Only non-secret, public values belong here.
 */
export const appConfig = {
  name: "اتوپارت",
  latinName: "AutoPart",
  tagline: "توزیع قطعات خودرو",
  /** ISO 4217 code. Amounts are stored as whole rials. */
  currency: "IRR",
  currencyLabel: "ریال",
  locale: "fa-IR",
  timeZone: "Asia/Tehran",
  /** Catalogue prices exclude VAT; VAT is added on the invoice by the accounting system. */
  pricesIncludeVat: false,
  /**
   * Visitors see the exact orderable quantity only when stock is at or below this
   * value («حداکثر ۲ عدد»). Above it they see «بیش از ۵۰ عدد» — the server still
   * validates every submission against real availability.
   */
  visitorStockDisplayCap: 50,
  /** Sessions last this long before re-authentication is required. */
  sessionTtlHours: 24 * 7,
  contact: {
    // Demonstration placeholders — replace before production use.
    salesEmail: "sales@autopart.example",
    phone: "021-5555-0142",
    phoneHref: "+982155550142",
    addressLines: ["تهران، جاده مخصوص کرج، کیلومتر ۱۲", "شهرک صنعتی نمونه، واحد ۷"],
    hours: "شنبه تا چهارشنبه ۸ تا ۱۷ · پنجشنبه ۸ تا ۱۳",
  },
} as const;

export type AppConfig = typeof appConfig;
