/**
 * Persian digit helpers. Display uses Persian digits (۰–۹); identifiers such as
 * SKUs, order numbers, phone numbers and emails keep Latin characters and are
 * rendered left-to-right.
 */
const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC = "٠١٢٣٤٥٦٧٨٩";

/** Normalise Persian / Arabic-Indic digits to ASCII (for parsing user input). */
export function toLatinDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (d) => {
    const p = PERSIAN.indexOf(d);
    return String(p >= 0 ? p : ARABIC.indexOf(d));
  });
}

/** Replace ASCII digits in a string with Persian digits. */
export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => PERSIAN[Number(d)]!);
}

const integerFormatter = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 });

/** Localised number with Persian digits and separators: 12500 → «۱۲٬۵۰۰». */
export function faNumber(value: number, decimals = false): string {
  return (decimals ? decimalFormatter : integerFormatter).format(value);
}
