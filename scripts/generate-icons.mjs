#!/usr/bin/env node
/**
 * Renders the PWA / home-screen icons from the logo mark into public/icons.
 * Uses the Playwright Chromium already installed for e2e tests, so no image
 * tooling is required. Re-run after changing the mark:
 *
 *   node scripts/generate-icons.mjs
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const out = path.join(import.meta.dirname, "..", "public", "icons");
mkdirSync(out, { recursive: true });

const mark = (accent = "#ff5b1a") => `
  <path d="M16 1.8 28.3 8.9v14.2L16 30.2 3.7 23.1V8.9Z" fill="#f2f0eb"/>
  <path d="M16 8.2 22.6 12v8L16 23.8 9.4 20v-8Z" fill="none" stroke="${accent}" stroke-width="2.3" stroke-linejoin="round"/>
  <path d="M12.7 19.4 16 11.6l3.3 7.8" fill="none" stroke="${accent}" stroke-width="2.3" stroke-linecap="square"/>`;

/** `scale` is the fraction of the canvas the mark occupies (maskable icons need a 20% safe zone). */
const svg = (scale, radius) => {
  const offset = (32 - 32 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="100%" height="100%">
    <rect width="32" height="32" rx="${radius}" fill="#0c0d0f"/>
    <path d="M0 26h32M0 6h32M6 0v32M26 0v32" stroke="#1c1f23" stroke-width="0.25"/>
    <g transform="translate(${offset} ${offset}) scale(${scale})">${mark()}</g>
  </svg>`;
};

const icons = [
  { file: "icon-192.png", size: 192, scale: 0.72, radius: 0 },
  { file: "icon-512.png", size: 512, scale: 0.72, radius: 0 },
  { file: "maskable-512.png", size: 512, scale: 0.56, radius: 0 },
  { file: "apple-touch-icon.png", size: 180, scale: 0.66, radius: 0 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const icon of icons) {
  await page.setViewportSize({ width: icon.size, height: icon.size });
  await page.setContent(`<html><body style="margin:0;background:#0c0d0f">${svg(icon.scale, icon.radius)}</body></html>`);
  await page.screenshot({ path: path.join(out, icon.file), omitBackground: false });
  console.log(`saved public/icons/${icon.file}`);
}
await browser.close();
