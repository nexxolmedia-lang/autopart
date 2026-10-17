import { appConfig } from "./config";

/**
 * Dates are displayed in the Solar Hijri (Jalali) calendar with Persian digits,
 * in Tehran time. Internally, calendar dates (e.g. delivery dates) are ISO
 * Gregorian strings ("YYYY-MM-DD") stored at UTC midnight.
 */
const base = { calendar: "persian", numberingSystem: "arabext" } as const;

const dateFormatter = new Intl.DateTimeFormat(appConfig.locale, { ...base, day: "numeric", month: "long", year: "numeric", timeZone: appConfig.timeZone });
const dateTimeFormatter = new Intl.DateTimeFormat(appConfig.locale, {
  ...base,
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: appConfig.timeZone,
});
const shortDateFormatter = new Intl.DateTimeFormat(appConfig.locale, { ...base, day: "numeric", month: "long", timeZone: appConfig.timeZone });
const calendarDateFormatter = new Intl.DateTimeFormat(appConfig.locale, { ...base, weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const dayChipWeekday = new Intl.DateTimeFormat(appConfig.locale, { ...base, weekday: "long", timeZone: "UTC" });
const dayChipDate = new Intl.DateTimeFormat(appConfig.locale, { ...base, day: "numeric", month: "long", timeZone: "UTC" });

type DateInput = Date | string | number;
const toDate = (value: DateInput) => (value instanceof Date ? value : new Date(value));

export const formatDate = (value: DateInput) => dateFormatter.format(toDate(value));
export const formatDateTime = (value: DateInput) => dateTimeFormatter.format(toDate(value)).replace("،", " ·");
export const formatShortDate = (value: DateInput) => shortDateFormatter.format(toDate(value));
/** For calendar dates stored at UTC midnight (delivery dates). */
export const formatCalendarDate = (value: DateInput) => {
  // ICU orders this combination unusually ("۱۴۰۵ مهر ۲۰, دوشنبه"); compose it explicitly.
  const parts = Object.fromEntries(calendarDateFormatter.formatToParts(toDate(value)).map((p) => [p.type, p.value]));
  return `${parts.weekday} ${parts.day} ${parts.month} ${parts.year}`;
};

/** "YYYY-MM-DD" for a calendar date stored at UTC midnight. */
export function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** Today's calendar date in the business time zone, as an ISO "YYYY-MM-DD" string. */
export function businessToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: appConfig.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || toIsoDate(date) !== value ? null : date;
}

export function formatRelative(value: DateInput, now: Date = new Date()): string {
  const diffSeconds = Math.round((toDate(value).getTime() - now.getTime()) / 1000);
  const abs = Math.abs(diffSeconds);
  const rtf = new Intl.RelativeTimeFormat("fa", { numeric: "auto" });
  if (abs < 60) return rtf.format(diffSeconds, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSeconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSeconds / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSeconds / 86400), "day");
  return formatDate(value);
}

export const DELIVERY_WINDOW_LABELS = {
  ANY: "هر ساعتی",
  MORNING: "صبح (۸ تا ۱۲)",
  AFTERNOON: "بعدازظهر (۱۲ تا ۱۷)",
} as const;

export type DeliveryDay = { iso: string; weekday: string; label: string };

/**
 * The next delivery days for a Jalali-friendly day picker. Fridays (the
 * Iranian weekend) are skipped. Browsers' native date inputs only offer the
 * Gregorian calendar, so the UI uses this list instead.
 */
export function upcomingDeliveryDays(todayIso: string, count = 14): DeliveryDay[] {
  const out: DeliveryDay[] = [];
  const start = parseIsoDate(todayIso);
  if (!start) return out;
  for (let t = start.getTime(); out.length < count; t += 86_400_000) {
    const d = new Date(t);
    if (d.getUTCDay() === 5) continue; // Friday
    out.push({ iso: toIsoDate(d), weekday: dayChipWeekday.format(d), label: dayChipDate.format(d) });
  }
  return out;
}
