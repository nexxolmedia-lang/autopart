#!/usr/bin/env node
/**
 * Builds a static, double-clickable gallery of every screen:
 *
 *   index.html            ← open this file directly in a browser
 *   preview/*.jpg         ← full-page screenshots
 *
 * Requires the app running locally (npm run db:local + npm run dev) with
 * DEMO_MODE=true. Re-run whenever the UI changes:
 *
 *   node scripts/build-preview.mjs [baseUrl=http://localhost:3000]
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium, devices } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3000";
const PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "AutoPart-Demo-2026";
const root = path.join(import.meta.dirname, "..");
const outDir = path.join(root, "preview");

const ACCOUNTS = { site: null, visitor: "visitor@autopart.test", admin: "admin@autopart.test", warehouse: "supervisor@autopart.test", system: null };
const MOBILE = new Set(["visitor"]);

const browser = await chromium.launch();

async function contextFor(section) {
  const { defaultBrowserType: _ignored, ...pixel } = devices["Pixel 7"];
  const ctx = MOBILE.has(section)
    ? await browser.newContext({ ...pixel, locale: "fa-IR", timezoneId: "Asia/Tehran", reducedMotion: "reduce" })
    : await browser.newContext({ viewport: { width: 1366, height: 860 }, locale: "fa-IR", timezoneId: "Asia/Tehran", reducedMotion: "reduce" });
  const email = ACCOUNTS[section];
  if (email) {
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`, { timeout: 120_000 });
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', PASSWORD);
    await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 120_000 }), page.click('button[type="submit"]')]);
    await page.close();
  }
  return ctx;
}

// 1. Read the live index (/all-pages) — the single source of truth for the page list.
const indexCtx = await browser.newContext();
const indexPage = await indexCtx.newPage();
const res = await indexPage.goto(`${BASE}/all-pages`, { waitUntil: "networkidle", timeout: 180_000 });
if (res?.status() !== 200) throw new Error(`/all-pages returned ${res?.status()} — is the app running with DEMO_MODE=true?`);
// The list streams in; wait until the last section has fully arrived.
await indexPage.waitForSelector('section#system a[href="/api/v1/orders"]', { timeout: 120_000 });
await indexPage.waitForTimeout(1000);
const sections = await indexPage.$$eval("section[id]", (els) =>
  els.map((s) => ({
    id: s.id,
    title: s.querySelector("h2")?.textContent?.trim() ?? s.id,
    hint: s.querySelector("h2 + p")?.textContent?.trim() ?? "",
    account: s.querySelector('a[href^="/login?next"] .ltr')?.textContent?.trim() ?? "",
    rows: [...s.querySelectorAll("ol li")].map((li) => {
      const a = li.querySelector("a");
      return {
        label: li.querySelector("p")?.textContent?.trim() ?? "",
        note: li.querySelector("p + p")?.textContent?.trim() ?? "",
        href: a?.getAttribute("href") ?? "",
        raw: a?.getAttribute("target") === "_blank",
      };
    }).filter((row) => row.href),
  })),
);
await indexCtx.close();

// 2. Screenshot every page with the right account.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
let n = 0;
for (const section of sections) {
  const ctx = await contextFor(section.id);
  const page = await ctx.newPage();
  for (const row of section.rows) {
    if (row.raw) continue; // CSV, JSON, manifest, service worker: linked, not pictured
    n++;
    const file = `${String(n).padStart(2, "0")}-${section.id}.jpg`;
    try {
      await page.goto(BASE + row.href, { waitUntil: "networkidle", timeout: 180_000 });
      await page.addStyleTag({ content: "nextjs-portal{display:none!important} *{caret-color:transparent!important}" });
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(outDir, file), fullPage: true, type: "jpeg", quality: 62 });
      row.image = `preview/${file}`;
      console.log(`ok   ${file}  ${decodeURIComponent(row.href)}`);
    } catch (error) {
      console.log(`FAIL ${decodeURIComponent(row.href)}: ${error.message.split("\n")[0]}`);
    }
  }
  await ctx.close();
}
await browser.close();

// 3. Write index.html (self-contained, RTL, Arial).
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fa = (v) => String(v).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
const stamp = new Intl.DateTimeFormat("fa-IR", { calendar: "persian", dateStyle: "long", timeStyle: "short", timeZone: "Asia/Tehran" }).format(new Date());
const shots = sections.reduce((t, s) => t + s.rows.filter((r) => r.image).length, 0);

// Portfolio copy per section (replaces the QA hints/accounts shown on /all-pages).
const SECTION_COPY = {
  site: { title: "وب‌سایت عمومی", role: "مشتریان و بازدیدکنندگان", text: "کاتالوگ قطعات با جستجو، فیلتر برند و موجودی، مرتب‌سازی و صفحه‌بندی؛ صفحه هر کالا با مشخصات فنی و خودروهای سازگار؛ فرم تماس و ورود همکاران." },
  visitor: { title: "اپلیکیشن موبایل ویزیتور (PWA)", role: "ویزیتورهای فروش", text: "قابل نصب روی اندروید و آیفون. ویزیتور مشتری را انتخاب می‌کند، کالا را با موجودی لحظه‌ای («قابل سفارش تا N عدد») اضافه می‌کند و سفارش را ثبت می‌کند؛ موجودی همان لحظه رزرو می‌شود." },
  admin: { title: "میز سفارش و پنل مدیریت", role: "مدیر فروش و مدیر سیستم", text: "بررسی، اصلاح قیمت و تعداد، تأیید یا رد سفارش‌ها؛ مدیریت کالا، قیمت، تصویر و موجودی با تاریخچه گردش؛ مشتریان و تخصیص ویزیتور؛ کاربران، نقش‌ها و مجوزها؛ گزارش‌ها با خروجی CSV و گزارش ممیزی." },
  warehouse: { title: "پنل انبار", role: "انباردار و سرپرست انبار", text: "صف آماده‌سازی، فهرست جمع‌آوری مرتب‌شده بر اساس قفسه، علامت‌گذاری اقلام، تأیید ارسال و تحویل؛ کسر خودکار موجودی فقط یک‌بار و هنگام ارسال." },
  system: { title: "صفحات سیستمی", role: "", text: "صفحه خطای ۴۰۴ و صفحه آفلاین اپلیکیشن." },
};

const card = (row, section) => {
  const shown = esc(decodeURIComponent(row.href));
  if (!row.image) return "";
  return `<li class="card${MOBILE.has(section.id) ? " phone" : ""}">
      <button class="shot" type="button" data-full="${esc(row.image)}" data-title="${esc(row.label)}" aria-label="نمایش بزرگ ${esc(row.label)}">
        <img src="${esc(row.image)}" alt="${esc(row.label)}" loading="lazy">
      </button>
      <div class="meta">
        <h3>${esc(row.label)}</h3>
        ${row.note ? `<p class="note">${esc(row.note)}</p>` : ""}
        <span class="url">${shown}</span>
      </div>
    </li>`;
};

const html = `<!doctype html>
<html lang="fa-IR" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>اتوپارت — نمونه‌کار</title>
<meta name="description" content="اتوپارت: سامانه یکپارچه توزیع قطعات خودرو — وب‌سایت، اپلیکیشن موبایل ویزیتور، میز سفارش و پنل انبار.">
<style>
  :root { --ink:#0c0d0f; --bone:#f2f0eb; --paper:#faf9f6; --line:#e3e0d8; --steel:#5d6470; --ember:#ff5b1a; --ember-d:#c03b06; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--paper); color:var(--ink); font-family: Arial, "Noto Sans Arabic", Tahoma, sans-serif; line-height:1.7; }
  header { background:var(--ink); color:var(--bone); padding:40px 16px 32px; background-image: linear-gradient(rgba(242,240,235,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(242,240,235,.05) 1px, transparent 1px); background-size: 32px 32px; }
  .wrap { max-width: 1320px; margin: 0 auto; padding: 0 16px; }
  header .eyebrow { color: var(--ember); font-size: 13px; font-weight: bold; margin: 0; }
  header h1 { font-size: clamp(30px, 5vw, 52px); margin: 10px 0 8px; line-height: 1.2; }
  header p { color: rgba(242,240,235,.7); max-width: 760px; margin: 0; font-size: 15px; }
  .stats { list-style:none; display:flex; flex-wrap:wrap; gap:10px; padding:0; margin:22px 0 0; }
  .stats li { border:1px solid rgba(242,240,235,.18); padding:6px 14px; font-size:14px; color: rgba(242,240,235,.8); }
  .stats b { color: var(--ember); font-size:18px; margin-left:4px; }
  .features { list-style:none; display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:8px 24px; padding:0; margin:22px 0 0; max-width: 980px; }
  .features li { position:relative; padding-right:18px; font-size:14px; color: rgba(242,240,235,.85); }
  .features li::before { content:""; position:absolute; right:0; top:.65em; width:8px; height:8px; background: var(--ember); }
  .tech { display:flex; flex-wrap:wrap; gap:6px; margin-top:22px; }
  .tech span { background: rgba(242,240,235,.08); color: var(--bone); font-size:12.5px; padding:4px 10px; }
  .info { display:flex; flex-wrap:wrap; gap:8px 20px; margin-top:18px; font-size:13.5px; color: rgba(242,240,235,.75); }
  .info b { color: var(--bone); }
  .ltr { direction: ltr; unicode-bidi: isolate; font-family: Consolas, "Courier New", monospace; }
  nav.toc { position: sticky; top: 0; z-index: 5; background: rgba(250,249,246,.95); backdrop-filter: blur(6px); border-bottom: 1px solid var(--line); }
  nav.toc .wrap { display:flex; gap:8px; overflow-x:auto; padding-top:10px; padding-bottom:10px; }
  nav.toc a { white-space:nowrap; border:1px solid var(--line); background:#fff; padding:5px 12px; font-size:13.5px; color:var(--ink); text-decoration:none; }
  nav.toc a:hover { border-color: var(--ink); }
  section { padding: 36px 0 8px; scroll-margin-top: 56px; }
  section > .wrap > .head { border-bottom: 2px solid var(--ink); padding-bottom: 10px; margin-bottom: 18px; display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-end; gap:8px 16px; }
  section h2 { margin:0; font-size: 24px; }
  .hint { margin: 4px 0 0; color: var(--steel); font-size: 14px; max-width: 900px; }
  .acct { background: var(--ink); color: var(--bone); font-size: 13px; padding: 6px 12px; }
  ul.grid { list-style:none; margin:0; padding:0; display:grid; gap:18px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
  ul.grid.phones { grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); }
  .card { background:#fff; border:1px solid var(--line); display:flex; flex-direction:column; min-width:0; }
  .shot { display:block; width:100%; padding:0; border:0; border-bottom:1px solid var(--line); background: var(--bone); cursor: zoom-in; aspect-ratio: 16 / 10; overflow:hidden; }
  .phone .shot { aspect-ratio: 9 / 16; }
  .shot img { width:100%; height:100%; object-fit: cover; object-position: top center; display:block; transition: transform .25s; }
  .shot:hover img { transform: scale(1.02); }
  .meta { padding: 10px 12px 12px; display:flex; flex-direction:column; gap:4px; flex:1; }
  .meta h3 { margin:0; font-size:14.5px; }
  .note { margin:0; font-size:12.5px; color:var(--steel); }
  .url { direction: ltr; unicode-bidi: isolate; font-family: Consolas, "Courier New", monospace; font-size:12.5px; color: var(--steel); word-break: break-all; margin-top:auto; align-self:flex-start; }
  ul.links { list-style:none; margin:18px 0 0; padding:0; border:1px solid var(--line); background:#fff; }
  .link { display:flex; flex-wrap:wrap; justify-content:space-between; gap:4px 16px; padding:10px 14px; border-top:1px solid var(--line); font-size:14px; }
  .link:first-child { border-top:0; }
  footer { margin-top: 48px; padding: 24px 16px 40px; color: var(--steel); font-size: 13px; border-top: 1px solid var(--line); }
  dialog { border:0; padding:0; max-width: min(1200px, 96vw); width: 96vw; max-height: 94vh; background: var(--ink); }
  dialog::backdrop { background: rgba(12,13,15,.8); }
  dialog .bar { position: sticky; top:0; display:flex; justify-content:space-between; align-items:center; gap:12px; padding:10px 14px; background: var(--ink); color: var(--bone); font-size:14px; }
  dialog button.close { background: var(--ember); color: var(--ink); border:0; padding:6px 14px; font: inherit; font-weight:bold; cursor:pointer; }
  dialog img { display:block; width:100%; height:auto; }
  dialog .scroll { overflow:auto; max-height: calc(94vh - 48px); }
  @media (prefers-reduced-motion: reduce) { .shot img { transition: none; } }
</style>
</head>
<body>
<header>
  <div class="wrap">
    <p class="eyebrow">نمونه‌کار · AutoPart</p>
    <h1>اتوپارت — سامانه یکپارچه توزیع قطعات خودرو</h1>
    <p>یک پلتفرم کامل برای شرکت پخش قطعات: وب‌سایت عمومی و کاتالوگ، اپلیکیشن موبایل برای ویزیتورهای فروش، میز سفارش و پنل مدیریت، و پنل انبار — کاملاً فارسی و راست‌چین، با مبالغ ریالی و تاریخ شمسی. تصاویر زیر از نسخه واقعی در حال اجرای برنامه گرفته شده‌اند؛ روی هر تصویر بزنید تا صفحه کامل نمایش داده شود.</p>
    <ul class="stats">
      <li><b>${fa(shots)}</b> صفحه</li>
      <li><b>۴</b> بخش کاربری</li>
      <li><b>۵</b> نقش با مجوزهای جداگانه</li>
      <li><b>۸۹</b> تست خودکار</li>
    </ul>
    <ul class="features">
      <li>موجودی لحظه‌ای با رزرو اتمی، بدون فروش بیش از موجودی</li>
      <li>گردش کار سفارش از ثبت تا تحویل با تاریخچه وضعیت</li>
      <li>ثبت قیمت تاریخی هر سفارش و گزارش ممیزی کامل</li>
      <li>نقش‌ها و مجوزهای قابل تنظیم و امنیت سمت سرور</li>
      <li>اپلیکیشن قابل نصب (PWA) با پشتیبانی آفلاین</li>
      <li>گزارش‌های فروش و موجودی با خروجی CSV</li>
    </ul>
    <div class="tech">
      ${["Next.js 16", "React 19", "TypeScript", "Tailwind CSS", "PostgreSQL", "Prisma", "PWA", "Vitest", "Playwright"].map((t) => `<span class="ltr">${t}</span>`).join("")}
    </div>
  </div>
</header>
<nav class="toc" aria-label="بخش‌ها"><div class="wrap">
  ${sections.filter((s) => s.rows.some((r) => r.image)).map((s) => `<a href="#${esc(s.id)}">${esc(SECTION_COPY[s.id]?.title ?? s.title)}</a>`).join("\n  ")}
</div></nav>
<main>
${sections
  .map((s) => {
    const pictured = s.rows.filter((r) => r.image);
    if (!pictured.length) return "";
    const copy = SECTION_COPY[s.id] ?? { title: s.title, role: "", text: "" };
    return `<section id="${esc(s.id)}"><div class="wrap">
  <div class="head">
    <div><h2>${esc(copy.title)}</h2>${copy.text ? `<p class="hint">${esc(copy.text)}</p>` : ""}</div>
    ${copy.role ? `<span class="acct">کاربران: ${esc(copy.role)}</span>` : ""}
  </div>
  ${pictured.length ? `<ul class="grid${MOBILE.has(s.id) ? " phones" : ""}">${pictured.map((r) => card(r, s)).join("\n")}</ul>` : ""}
</div></section>`;
  })
  .join("\n")}
</main>
<footer><div class="wrap">اتوپارت · نمونه‌کار — داده‌ها و برندهای نمایش‌داده‌شده نمایشی هستند. تصاویر از نسخه در حال اجرای برنامه گرفته شده‌اند (${esc(stamp)}).</div></footer>
<dialog id="viewer">
  <div class="bar"><span id="viewer-title"></span><button class="close" type="button" id="viewer-close">بستن ✕</button></div>
  <div class="scroll"><img id="viewer-img" alt=""></div>
</dialog>
<script>
  const viewer = document.getElementById("viewer");
  const img = document.getElementById("viewer-img");
  document.addEventListener("click", (e) => {
    const shot = e.target.closest(".shot");
    if (shot) {
      img.src = shot.dataset.full;
      img.alt = shot.dataset.title;
      document.getElementById("viewer-title").textContent = shot.dataset.title;
      viewer.showModal();
      viewer.querySelector(".scroll").scrollTop = 0;
    }
  });
  document.getElementById("viewer-close").addEventListener("click", () => viewer.close());
  viewer.addEventListener("click", (e) => { if (e.target === viewer) viewer.close(); });
</script>
</body>
</html>
`;
writeFileSync(path.join(root, "index.html"), html);
console.log(`\nwrote index.html with ${shots} screenshots`);
