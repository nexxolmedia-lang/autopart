#!/usr/bin/env node
/**
 * Generates the technical line illustrations in public/parts/.
 *
 * The catalogue deliberately uses engineering-drawing style artwork instead of
 * stock photography: it is consistent across ~30 part types, weighs a few KB,
 * never breaks, and reinforces the "precision" brand language. Uploaded
 * product photos (admin → product → images) take precedence when present.
 *
 *   node scripts/generate-illustrations.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public/parts");
mkdirSync(out, { recursive: true });

const INK = "#16181b";
const MID = "#7d848d";
const LIGHT = "#c2c6cc";
const FILL = "#e9e6df";
const FILL2 = "#dcd8cf";
const EMBER = "#ff5b1a";

const f = (n) => Number(n.toFixed(2));
const attrs = (a = {}) =>
  Object.entries(a)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}="${v}"`)
    .join(" ");

const circle = (cx, cy, r, a) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" ${attrs(a)}/>`;
const ellipse = (cx, cy, rx, ry, a) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" ${attrs(a)}/>`;
const line = (x1, y1, x2, y2, a) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" ${attrs(a)}/>`;
const rect = (x, y, w, h, a = {}) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" ${attrs(a)}/>`;
const pathD = (d, a) => `<path d="${d}" ${attrs(a)}/>`;
const polygon = (pts, a) => `<polygon points="${pts.map(([x, y]) => `${f(x)},${f(y)}`).join(" ")}" ${attrs(a)}/>`;
const text = (x, y, s, a = {}) =>
  `<text x="${f(x)}" y="${f(y)}" font-family="Arial,Tahoma,sans-serif" font-size="8.5" fill="#4d535b" stroke="none" ${attrs(a)}>${s}</text>`;
const polar = (cx, cy, r, deg) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];

const thin = { strokeWidth: 0.9 };
const faint = { stroke: LIGHT, strokeWidth: 0.6 };
const center = { stroke: "#9ba1a9", strokeWidth: 0.7, strokeDasharray: "9 3 2 3" };
const dimA = { stroke: MID, strokeWidth: 0.7, markerStart: "url(#a)", markerEnd: "url(#a)" };
const ext = { stroke: MID, strokeWidth: 0.5 };
const accent = { stroke: EMBER, strokeWidth: 1.8 };

const dimH = (x1, x2, y, label, ly = y - 4) => line(x1, y, x2, y, dimA) + text((x1 + x2) / 2, ly, label, { textAnchor: "middle" });
const dimV = (x, y1, y2, label) =>
  line(x, y1, x, y2, dimA) + text(x - 4, (y1 + y2) / 2, label, { textAnchor: "middle", transform: `rotate(-90 ${f(x - 4)} ${f((y1 + y2) / 2)})` });
const tag = (x, y, label, tx, ty) =>
  line(x, y, tx, ty, { stroke: MID, strokeWidth: 0.6 }) + circle(x, y, 1.6, { fill: EMBER, stroke: "none" }) + text(tx + (tx > x ? 3 : -3), ty + 3, label, { textAnchor: tx > x ? "start" : "end" });

const svg = (body, title) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${title}">
<title>${title}</title>
<defs><marker id="a" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0.6L6 3L0 5.4z" fill="${MID}" stroke="none"/></marker></defs>
${body}
</svg>
`;

const holes = (cx, cy, R, n, r, start = -90, a = {}) =>
  Array.from({ length: n }, (_, i) => {
    const [x, y] = polar(cx, cy, R, start + (360 / n) * i);
    return circle(x, y, r, a);
  }).join("");

function gearPath(cx, cy, rOuter, rRoot, teeth, phase = 0) {
  const pts = [];
  for (let i = 0; i < teeth; i++) {
    const a0 = phase + (360 / teeth) * i;
    const step = 360 / teeth;
    pts.push(polar(cx, cy, rRoot, a0));
    pts.push(polar(cx, cy, rOuter, a0 + step * 0.18));
    pts.push(polar(cx, cy, rOuter, a0 + step * 0.48));
    pts.push(polar(cx, cy, rRoot, a0 + step * 0.66));
  }
  return "M" + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L") + "Z";
}

function threads(x1, x2, yTop, yBot, pitch, a = thin) {
  let s = "";
  for (let x = x1; x <= x2; x += pitch) s += line(x, yTop, x + pitch * 0.5, yBot, a);
  return s;
}

const drawings = {};

// ── Brakes ──────────────────────────────────────────────────────────────────
drawings["brake-disc"] = [
  "دیسک ترمز هواخنک",
  () => {
    const cx = 120, cy = 118;
    let s = line(18, cy, 300, cy, center) + line(cx, 14, cx, 222, center);
    s += circle(cx, cy, 92, { fill: FILL });
    for (const r of [58, 64, 70, 76, 82, 88]) s += circle(cx, cy, r, faint);
    s += circle(cx, cy, 52, thin) + circle(cx, cy, 40, { fill: "#f5f3ee", ...accent }) + circle(cx, cy, 11, { fill: "#fff" });
    s += holes(cx, cy, 25, 5, 4.4, -90, { fill: "#fff" });
    // section view
    const x = 252;
    s += pathD(`M${x} 26 h9 v184 h-9 Z`, { fill: FILL2 }) + pathD(`M${x + 19} 26 h9 v184 h-9 Z`, { fill: FILL2 });
    for (let y = 34; y < 206; y += 14) s += rect(x + 9, y, 10, 8, { ...thin, fill: FILL });
    s += pathD(`M${x + 28} 78 h12 v80 h-12`, { fill: "#f5f3ee" }) + line(x + 40, 104, x + 52, 104, thin) + line(x + 40, 132, x + 52, 132, thin);
    s += line(28, cy, 28, 232, ext) + line(212, cy, 212, 232, ext) + dimH(28, 212, 228, "Ø 266");
    s += dimH(x, x + 28, 14, "22", 10);
    s += tag(cx + 64, cy - 52, "سطح اصطکاکی", 210, 40);
    return s;
  },
];

drawings["brake-pads"] = [
  "لنت ترمز",
  () => {
    let s = "";
    const pad = (ox, oy) => {
      let p = pathD(`M${ox} ${oy + 10} q4 -10 16 -10 h88 q12 0 16 10 l6 40 q2 14 -12 16 h-108 q-14 -2 -12 -16 Z`, { fill: FILL2 });
      p += pathD(`M${ox + 12} ${oy + 14} q2 -6 10 -6 h76 q8 0 10 6 l4 32 q1 8 -8 9 h-88 q-9 -1 -8 -9 Z`, { fill: FILL });
      p += line(ox + 64, oy + 9, ox + 64, oy + 55, { ...thin, stroke: MID });
      p += line(ox + 16, oy + 16, ox + 22, oy + 9, thin) + line(ox + 108, oy + 9, ox + 114, oy + 16, thin);
      p += circle(ox + 4, oy + 22, 4, { fill: "#fff" }) + circle(ox + 124, oy + 22, 4, { fill: "#fff" });
      return p;
    };
    s += pad(26, 30) + pad(168, 30);
    s += pathD("M262 30 q8 -2 10 6 l3 10", accent) + circle(276, 47, 2.6, { fill: EMBER, stroke: "none" });
    // profile
    const y = 130;
    s += line(18, 175, 302, 175, center);
    s += rect(40, y + 30, 240, 9, { fill: FILL2 }) + rect(52, y + 39, 216, 22, { fill: FILL }) + rect(40, y + 22, 240, 8, { fill: "#f5f3ee", ...thin });
    for (let x = 64; x < 268; x += 18) s += line(x, y + 42, x, y + 58, faint);
    s += dimV(292, y + 22, y + 61, "20.3") + line(282, y + 22, 296, y + 22, ext) + line(270, y + 61, 296, y + 61, ext);
    s += tag(160, y + 26, "شیم ضدصدا", 120, 222) + tag(110, y + 50, "لایه اصطکاکی", 40, 222);
    s += dimH(26, 170, 20, "130");
    return s;
  },
];

drawings["brake-caliper"] = [
  "کالیپر ترمز شناور",
  () => {
    let s = line(20, 124, 300, 124, center) + line(150, 24, 150, 224, center);
    s += pathD("M70 70 q0 -30 30 -32 h100 q30 2 30 32 v86 q0 30 -30 32 h-100 q-30 -2 -30 -32 Z", { fill: FILL });
    s += pathD("M84 74 q0 -20 22 -22 h88 q22 2 22 22 v78 q0 22 -22 22 h-88 q-22 -2 -22 -22 Z", thin);
    s += circle(150, 124, 38, { fill: "#f5f3ee" }) + circle(150, 124, 30, thin) + circle(150, 124, 30, { ...accent, strokeDasharray: "4 4" });
    s += pathD("M70 92 h-26 q-10 0 -10 10 v44 q0 10 10 10 h26", { fill: FILL2 }) + circle(50, 108, 6, { fill: "#fff" }) + circle(50, 140, 6, { fill: "#fff" });
    s += pathD("M230 92 h26 q10 0 10 10 v44 q0 10 -10 10 h-26", { fill: FILL2 }) + circle(250, 108, 6, { fill: "#fff" }) + circle(250, 140, 6, { fill: "#fff" });
    s += rect(196, 22, 12, 18, { fill: FILL2 }) + rect(199, 12, 6, 10, thin) + line(196, 28, 208, 28, thin);
    s += tag(178, 100, "پیستون Ø54", 250, 64) + tag(202, 18, "پیچ هواگیری", 250, 30) + tag(50, 140, "پین راهنما", 26, 214);
    return s;
  },
];

// ── Filters ─────────────────────────────────────────────────────────────────
drawings["oil-filter"] = [
  "فیلتر روغن",
  () => {
    const cx = 120;
    let s = line(cx, 14, cx, 228, center);
    s += pathD(`M${cx - 52} 44 v148 a52 13 0 0 0 104 0 v-148`, { fill: FILL });
    s += ellipse(cx, 44, 52, 13, { fill: "#f5f3ee" }) + ellipse(cx, 44, 18, 5, thin);
    for (let i = -46; i <= 46; i += 6.5) s += line(cx + i, 58 + Math.abs(i) * 0.05, cx + i, 186 + 13 * Math.sqrt(1 - (i / 52) ** 2) - 6, { ...faint, stroke: "#a9aeb5" });
    s += pathD(`M${cx - 52} 192 a52 13 0 0 0 104 0`, accent);
    s += pathD(`M${cx - 52} 60 a52 13 0 0 0 104 0`, thin);
    // spin-on can
    const x = 252;
    s += line(x, 20, x, 226, center);
    s += pathD(`M${x - 34} 80 v100 q0 16 16 16 h36 q16 0 16 -16 v-100`, { fill: FILL2 }) + ellipse(x, 80, 34, 9, { fill: "#f5f3ee" }) + ellipse(x, 80, 9, 3, thin);
    for (let y = 98; y < 176; y += 9) s += line(x - 34, y, x + 34, y, faint);
    s += line(cx - 52, 208, cx - 52, 226, ext) + line(cx + 52, 208, cx + 52, 226, ext) + dimH(cx - 52, cx + 52, 222, "Ø 65");
    s += dimV(52, 44, 192, "141") + line(56, 44, cx - 54, 44, ext) + line(56, 192, cx - 54, 192, ext);
    s += tag(cx + 46, 194, "اورینگ", 200, 214);
    return s;
  },
];

drawings["air-filter"] = [
  "فیلتر هوا",
  () => {
    let s = "";
    const p = [
      [44, 96],
      [214, 52],
      [292, 104],
      [122, 148],
    ];
    s += polygon(p, { fill: FILL2 });
    s += polygon([[44, 96], [122, 148], [122, 172], [44, 120]], { fill: FILL });
    s += polygon([[122, 148], [292, 104], [292, 128], [122, 172]], { fill: "#f5f3ee" });
    const steps = 22;
    let zig = "";
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const ax = 56 + (214 - 56 + 10) * t, ay = 101 - 44 * t;
      const bx = 130 + (280 - 130) * t, by = 143 - 38 * t;
      zig += line(ax, ay, bx, by, i % 2 ? faint : { stroke: "#a9aeb5", strokeWidth: 0.8 });
    }
    s += zig;
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const x = 122 + (292 - 122) * t;
      const y = 148 - 44 * t;
      s += pathD(`M${f(x)} ${f(y + 2)} l4 ${10} l4 -10`, { ...thin, stroke: MID });
    }
    s += polygon(p, { ...thin });
    s += pathD("M44 96 l78 52 l170 -44", accent);
    s += dimH(44, 292, 210, "297 × 182 × 55");
    s += tag(178, 80, "مدیای چین‌دار", 196, 28) + tag(80, 120, "آب‌بند PU", 30, 186);
    return s;
  },
];

drawings["fuel-filter"] = [
  "فیلتر سوخت",
  () => {
    let s = line(20, 120, 300, 120, center);
    s += pathD("M86 74 h148 q14 0 14 14 v64 q0 14 -14 14 h-148 q-14 0 -14 -14 v-64 q0 -14 14 -14 Z", { fill: FILL });
    for (let x = 98; x < 230; x += 12) s += line(x, 76, x, 164, faint);
    s += rect(36, 112, 36, 16, { fill: FILL2 }) + rect(248, 112, 36, 16, { fill: FILL2 });
    s += rect(24, 108, 14, 24, { fill: "#f5f3ee" }) + rect(282, 108, 14, 24, { fill: "#f5f3ee" });
    s += rect(152, 166, 16, 16, { fill: FILL2 }) + rect(156, 182, 8, 10, thin);
    s += pathD("M40 98 h28", { ...accent, markerEnd: "url(#a)" }) + pathD("M252 98 h28", { ...accent, markerEnd: "url(#a)" });
    s += text(40, 92, "ورودی") + text(254, 92, "خروجی");
    s += dimH(72, 248, 206, "۴ میکرون · جداسازی آب ۹۳٪");
    s += tag(160, 186, "پیچ تخلیه", 210, 222);
    return s;
  },
];

drawings["cabin-filter"] = [
  "فیلتر کابین کربن فعال",
  () => {
    let s = "";
    s += rect(40, 70, 240, 100, { fill: FILL });
    let zig = "M40 70";
    for (let x = 40; x < 280; x += 10) zig += ` L${x + 5} 170 L${x + 10} 70`;
    s += pathD(zig, { stroke: "#a9aeb5", strokeWidth: 0.8 });
    s += rect(40, 172, 240, 10, { fill: "#2a2e33", stroke: INK });
    for (let x = 46; x < 280; x += 8) s += circle(x, 177, 1, { fill: "#7d848d", stroke: "none" });
    s += rect(40, 184, 240, 6, { fill: "#f5f3ee", ...thin });
    s += rect(40, 70, 240, 100, thin);
    s += dimH(40, 280, 52, "280") + dimV(26, 70, 190, "30");
    s += tag(240, 177, "کربن فعال", 252, 214) + tag(120, 120, "لایه ذرات", 60, 214);
    s += line(40, 50, 40, 66, ext) + line(280, 50, 280, 66, ext);
    s += pathD("M160 30 v26", { ...accent, markerEnd: "url(#a)" }) + text(166, 36, "جریان هوا");
    return s;
  },
];

// ── Engine ──────────────────────────────────────────────────────────────────
drawings["piston"] = [
  "پیستون و رینگ",
  () => {
    const cx = 116;
    let s = line(cx, 14, cx, 226, center);
    s += pathD(`M${cx - 62} 46 q0 -10 10 -12 q52 -10 104 0 q10 2 10 12 v132 q0 6 -8 8 l-6 30 h-96 l-6 -30 q-8 -2 -8 -8 Z`, { fill: FILL });
    s += pathD(`M${cx - 40} 40 q40 10 80 0`, thin);
    for (const [y, a] of [[60, accent], [74, thin], [88, thin]]) s += line(cx - 62, y, cx + 62, y, a);
    s += line(cx - 62, 92, cx + 62, 92, thin);
    s += circle(cx, 140, 20, { fill: "#f5f3ee" }) + circle(cx, 140, 13, thin);
    s += line(cx - 62, 140, cx + 62, 140, center);
    s += pathD(`M${cx - 50} 112 q10 28 0 56`, faint) + pathD(`M${cx + 50} 112 q-10 28 0 56`, faint);
    s += line(cx - 62, 196, cx - 62, 222, ext) + line(cx + 62, 196, cx + 62, 222, ext) + dimH(cx - 62, cx + 62, 222, "Ø 83");
    s += dimV(36, 34, 140, "37.65") + line(40, 34, cx - 56, 34, ext);
    // top view
    const tx = 252, ty = 82;
    s += circle(tx, ty, 46, { fill: FILL }) + circle(tx, ty, 34, thin) + pathD(`M${tx - 18} ${ty} a18 12 0 1 0 36 0 a18 12 0 1 0 -36 0`, { fill: "#f5f3ee" });
    s += line(tx - 52, ty, tx + 52, ty, center) + line(tx, ty - 52, tx, ty + 52, center);
    s += tag(cx + 62, 60, "رینگ اول", 214, 170) + tag(cx + 13, 140, "گژن‌پین Ø22", 214, 190);
    return s;
  },
];

drawings["piston-rings"] = [
  "ست رینگ پیستون",
  () => {
    let s = "";
    const r = (cy, w, a) => {
      let p = pathD(`M${160 + 96 * Math.cos(-1.42)} ${cy + 28 * Math.sin(-1.42)} A96 28 0 1 0 ${160 + 96 * Math.cos(-1.72)} ${cy + 28 * Math.sin(-1.72)}`, { ...a, strokeWidth: w });
      return p;
    };
    s += r(70, 3.4, { stroke: EMBER }) + r(112, 2.6, {}) + r(156, 4.2, {});
    s += pathD("M64 156 a96 28 0 0 0 192 0", { stroke: MID, strokeWidth: 0.6, strokeDasharray: "2 3" });
    // cross sections
    const sx = 30;
    s += text(sx - 6, 214, "مقطع‌ها", { fontSize: 7 });
    s += rect(sx + 60, 196, 6, 16, { fill: EMBER, stroke: EMBER, strokeWidth: 0.8 });
    s += polygon([[sx + 100, 196], [sx + 106, 196], [sx + 108, 212], [sx + 100, 212]], { fill: FILL2, strokeWidth: 0.9 });
    s += pathD(`M${sx + 140} 196 h8 v4 h-3 v8 h3 v4 h-8 v-4 h3 v-8 h-3 Z`, { fill: FILL2, strokeWidth: 0.9 });
    s += text(sx + 70, 222, "1", { textAnchor: "middle" }) + text(sx + 104, 222, "2", { textAnchor: "middle" }) + text(sx + 144, 222, "روغن", { textAnchor: "middle" });
    s += tag(256, 70, "پوشش CKS", 280, 36) + tag(64, 112, "رینگ مخروطی", 22, 86);
    s += dimH(64, 256, 20, "قطر سیلندر Ø 83");
    return s;
  },
];

drawings["bearing"] = [
  "یاتاقان",
  () => {
    let s = "";
    const shell = (cx, cy, flip, oil) => {
      const sweep = flip ? 1 : 0;
      let p = pathD(`M${cx - 70} ${cy} A70 70 0 0 ${sweep} ${cx + 70} ${cy} L${cx + 60} ${cy} A60 60 0 0 ${1 - sweep} ${cx - 60} ${cy} Z`, { fill: FILL });
      p += pathD(`M${cx - 64} ${cy} A64 64 0 0 ${sweep} ${cx + 64} ${cy}`, faint);
      if (oil) p += circle(cx, flip ? cy + 65 : cy - 65, 3.4, { fill: "#fff", ...accent, strokeWidth: 1.2 });
      p += rect(cx + 50, flip ? cy : cy - 6, 8, 6, { fill: FILL2, strokeWidth: 0.9 });
      return p;
    };
    s += shell(118, 104, false, true) + shell(118, 132, true, false);
    s += line(118, 20, 118, 222, center) + line(30, 118, 206, 118, center);
    // section
    s += rect(246, 50, 22, 140, { fill: FILL }) + rect(246, 50, 4, 140, { fill: "#c9c4b8", strokeWidth: 0.8 }) + rect(250, 50, 3, 140, { fill: EMBER, stroke: "none" });
    s += text(276, 84, "فولاد") + text(276, 120, "آلیاژ") + text(276, 156, "روکش");
    s += line(258, 82, 274, 82, ext) + line(252, 118, 274, 118, ext) + line(248, 154, 274, 154, ext);
    s += tag(118, 39, "سوراخ روغن", 160, 22);
    s += dimH(48, 188, 222, "Ø 58");
    return s;
  },
];

drawings["cylinder-head"] = [
  "سرسیلندر",
  () => {
    let s = "";
    s += pathD("M24 96 h272 v74 h-272 Z", { fill: FILL });
    s += pathD("M34 96 v-24 h252 v24", { fill: FILL2 });
    for (let i = 0; i < 5; i++) {
      const x = 50 + i * 55;
      s += pathD(`M${x - 14} 72 a14 14 0 0 1 28 0`, { fill: "#f5f3ee" }) + circle(x, 72, 7, thin);
    }
    s += line(24, 72, 296, 72, center);
    for (let i = 0; i < 4; i++) {
      const x = 76 + i * 56;
      s += circle(x - 12, 136, 9, { fill: "#f5f3ee" }) + circle(x + 12, 136, 9, { fill: "#f5f3ee" });
      s += circle(x, 154, 3, { fill: "#fff", ...thin });
    }
    for (let i = 0; i < 5; i++) s += circle(48 + i * 56, 112, 4.5, { fill: "#fff" });
    s += line(24, 170, 296, 170, accent);
    s += dimH(24, 296, 206, "صافی سطح Ra ≤ 1.0 µm · تست فشار ۳ بار") + line(24, 174, 24, 210, ext) + line(296, 174, 296, 210, ext);
    s += tag(160, 170, "سطح کف", 200, 192) + tag(50, 72, "یاتاقان میل‌سوپاپ", 30, 40);
    return s;
  },
];

drawings["valve"] = [
  "سوپاپ موتور",
  () => {
    let s = line(20, 120, 300, 120, center);
    s += pathD("M40 120 m0 -4 h176 q18 -2 26 -16 q6 -14 26 -16 h10 v72 h-10 q-20 -2 -26 -16 q-8 -14 -26 -16 h-176 Z", { fill: FILL });
    s += rect(270, 84, 6, 72, { fill: FILL2, strokeWidth: 0.9 });
    s += line(56, 116, 56, 124, thin) + line(62, 116, 62, 124, thin) + line(68, 116, 68, 124, thin);
    s += line(40, 116, 40, 124, accent);
    s += pathD("M250 92 l20 0 M250 148 l20 0", thin);
    // spring
    let d = "M70 182";
    for (let i = 0; i < 9; i++) d += ` l9 -16 l9 16`;
    s += pathD(d, { stroke: MID, strokeWidth: 1.2 });
    s += line(276, 70, 276, 64, ext) + line(276, 176, 276, 170, ext);
    s += dimV(300, 84, 156, "Ø 28.7") + dimH(40, 276, 56, "89.9");
    s += line(40, 60, 40, 112, ext) + line(276, 60, 276, 80, ext);
    s += tag(52, 120, "شیار قفل", 40, 214) + tag(150, 116, "ساق Ø5.97", 150, 30);
    return s;
  },
];

drawings["timing-kit"] = [
  "کیت تسمه تایم",
  () => {
    let s = "";
    const cam1 = [90, 64], cam2 = [210, 64], crank = [150, 186], tens = [244, 140], idler = [96, 138];
    s += pathD(gearPath(cam1[0], cam1[1], 34, 31, 30), { fill: FILL }) + circle(cam1[0], cam1[1], 10, { fill: "#fff" }) + circle(cam1[0], cam1[1], 22, thin);
    s += pathD(gearPath(cam2[0], cam2[1], 34, 31, 30, 6), { fill: FILL }) + circle(cam2[0], cam2[1], 10, { fill: "#fff" }) + circle(cam2[0], cam2[1], 22, thin);
    s += pathD(gearPath(crank[0], crank[1], 20, 18, 22), { fill: FILL2 }) + circle(crank[0], crank[1], 6, { fill: "#fff" });
    s += circle(tens[0], tens[1], 15, { fill: "#f5f3ee" }) + circle(tens[0], tens[1], 5, thin) + circle(idler[0], idler[1], 13, { fill: "#f5f3ee" }) + circle(idler[0], idler[1], 4, thin);
    s += pathD("M56 64 A34 34 0 0 1 124 58 M176 58 A34 34 0 0 1 244 64 L259 140 A15 15 0 0 1 252 154 L168 192 A20 20 0 0 1 134 196 L82 145 A13 13 0 0 1 84 132 Z", { stroke: INK, strokeWidth: 4.5, strokeLinejoin: "round", fill: "none" });
    s += pathD("M56 64 A34 34 0 0 1 124 58 M176 58 A34 34 0 0 1 244 64 L259 140 A15 15 0 0 1 252 154 L168 192 A20 20 0 0 1 134 196 L82 145 A13 13 0 0 1 84 132 Z", { stroke: "#f5f3ee", strokeWidth: 1.4, strokeDasharray: "2 3", fill: "none" });
    s += line(124, 58, 176, 58, { strokeWidth: 4.5 });
    s += circle(tens[0], tens[1], 15, accent);
    s += tag(tens[0] + 11, tens[1] + 10, "تسمه‌سفت‌کن خودکار", 270, 206) + tag(cam2[0] + 24, cam2[1] - 24, "۱۴۱ دندانه", 280, 24);
    return s;
  },
];

drawings["gasket"] = [
  "واشر سرسیلندر",
  () => {
    let s = pathD("M22 70 q0 -10 10 -10 h256 q10 0 10 10 v100 q0 10 -10 10 h-256 q-10 0 -10 -10 Z", { fill: FILL });
    for (let i = 0; i < 4; i++) {
      const cx = 68 + i * 62;
      s += circle(cx, 120, 28, { fill: "#f5f3ee", ...accent, strokeWidth: 1.4 }) + circle(cx, 120, 25, thin);
    }
    for (const x of [36, 99, 161, 223, 284]) {
      s += circle(x, 74, 4, { fill: "#fff" }) + circle(x, 166, 4, { fill: "#fff" });
    }
    for (const x of [52, 114, 176, 238]) s += pathD(`M${x} 166 h12 v-6 h-12 Z`, { fill: "#fff", strokeWidth: 0.9 });
    s += dimH(40, 96, 40, "Ø 81.0") + line(40, 44, 40, 116, ext) + line(96, 44, 96, 116, ext);
    s += text(22, 210, "سه‌لایه MLS · ۱٫۱۰ میلی‌متر · یک شیار", { fontSize: 8 });
    s += pathD("M292 70 v-8 h-4", { stroke: EMBER, strokeWidth: 2 });
    s += tag(96, 120, "حلقه آتش", 150, 214);
    return s;
  },
];

drawings["camshaft"] = [
  "میل‌سوپاپ",
  () => {
    let s = line(16, 120, 304, 120, center);
    s += rect(20, 110, 280, 20, { fill: FILL });
    for (let i = 0; i < 5; i++) s += rect(32 + i * 64, 104, 16, 32, { fill: "#f5f3ee" });
    for (let i = 0; i < 8; i++) {
      const x = 58 + i * 30 + (i % 2) * 2;
      const up = i % 2 === 0;
      s += pathD(`M${x} ${up ? 104 : 136} q8 ${up ? -26 : 26} 16 0`, { fill: FILL2 });
      s += line(x, 104, x, 136, thin) + line(x + 16, 104, x + 16, 136, thin);
    }
    s += rect(4, 112, 16, 16, { fill: FILL2 });
    s += pathD(gearPath(300, 120, 22, 19, 18), { fill: FILL2, strokeWidth: 1 });
    s += pathD("M58 104 q8 -26 16 0", accent);
    s += dimH(20, 300, 200, "۵ یاتاقان · سختی بادامک ۵۲ تا ۵۶ HRC");
    s += tag(66, 86, "بادامک سخت‌کاری‌شده", 110, 44);
    return s;
  },
];

drawings["engine-mount"] = [
  "دسته موتور هیدرولیکی",
  () => {
    let s = "";
    s += pathD("M40 150 h110 l20 -40 h110 v30 h-92 l-20 40 h-128 Z", { fill: FILL2 });
    s += circle(222, 125, 7, { fill: "#fff" }) + circle(258, 125, 7, { fill: "#fff" });
    s += pathD("M90 60 h120 q20 0 20 20 v40 q0 20 -20 20 h-120 q-20 0 -20 -20 v-40 q0 -20 20 -20 Z", { fill: FILL });
    s += circle(150, 100, 30, { fill: "#f5f3ee" }) + circle(150, 100, 18, { fill: "#2a2e33" }) + circle(150, 100, 8, { fill: "#fff" });
    s += pathD("M150 70 q20 30 0 60 q-20 -30 0 -60", { ...accent, strokeWidth: 1.2 });
    s += rect(142, 30, 16, 30, { fill: FILL2 }) + line(146, 30, 146, 18, thin) + line(154, 30, 154, 18, thin);
    s += circle(60, 168, 6, { fill: "#fff" }) + circle(120, 168, 6, { fill: "#fff" });
    s += tag(170, 100, "محفظه روغن", 250, 70) + tag(150, 22, "پیچ M12", 210, 24);
    s += dimH(40, 280, 212, "براکت آلومینیوم دایکست");
    return s;
  },
];

// ── Suspension ──────────────────────────────────────────────────────────────
drawings["shock-absorber"] = [
  "کمک‌فنر گازی",
  () => {
    let s = line(10, 120, 310, 120, center);
    s += circle(32, 120, 16, { fill: FILL2 }) + circle(32, 120, 7, { fill: "#fff" });
    s += rect(48, 100, 150, 40, { fill: FILL });
    for (let x = 60; x < 196; x += 10) s += line(x, 102, x, 138, faint);
    s += rect(198, 106, 14, 28, { fill: FILL2 });
    s += rect(212, 113, 64, 14, { fill: "#f5f3ee" });
    s += line(212, 113, 276, 113, accent);
    s += rect(276, 96, 10, 48, { fill: FILL2 }) + rect(286, 110, 18, 20, { fill: FILL2 }) + line(304, 114, 312, 114, thin) + line(304, 126, 312, 126, thin);
    let d = "M220 96";
    for (let i = 0; i < 5; i++) d += ` l6 48 l6 -48`;
    s += pathD(d, { stroke: MID, strokeWidth: 0.8, strokeDasharray: "3 2" });
    s += dimH(32, 304, 200, "طول باز ۵۱۲ / طول جمع ۳۴۸") + line(32, 140, 32, 204, ext) + line(304, 134, 304, 204, ext);
    s += tag(244, 113, "میل کروم Ø22", 236, 56) + tag(120, 120, "بدنه دوجداره", 100, 70);
    return s;
  },
];

drawings["control-arm"] = [
  "طبق",
  () => {
    let s = pathD("M52 170 L150 82 q10 -10 22 -6 L262 104 q14 6 8 20 L240 150 q-6 10 -18 8 L130 152 L74 196 q-16 8 -26 -4 q-8 -12 4 -22 Z", { fill: FILL });
    s += pathD("M78 168 L156 98 L246 118 L226 140 L128 138 L86 172", faint);
    s += circle(60, 182, 20, { fill: FILL2 }) + circle(60, 182, 12, { fill: "#2a2e33" }) + circle(60, 182, 5, { fill: "#fff" });
    s += circle(250, 132, 18, { fill: FILL2 }) + circle(250, 132, 10, { fill: "#2a2e33" }) + circle(250, 132, 4, { fill: "#fff" });
    s += circle(160, 88, 16, { fill: "#f5f3ee" }) + circle(160, 88, 8, accent) + line(160, 72, 160, 50, thin) + rect(154, 36, 12, 14, { fill: FILL2, strokeWidth: 0.9 });
    s += tag(168, 88, "سیبک", 220, 50) + tag(48, 170, "بوش", 24, 120);
    s += dimH(60, 250, 222, "فولاد فورج") + line(60, 202, 60, 226, ext) + line(250, 150, 250, 226, ext);
    return s;
  },
];

drawings["coil-spring"] = [
  "فنر لول",
  () => {
    let s = line(16, 120, 304, 120, center);
    const coils = 6.5, x0 = 46, x1 = 274, r = 52;
    let back = "", front = "";
    const n = 260;
    let prev = null;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const ang = t * coils * Math.PI * 2;
      const x = x0 + (x1 - x0) * t + Math.sin(ang) * 6;
      const y = 120 - Math.cos(ang) * r;
      if (prev) {
        const seg = `M${f(prev[0])} ${f(prev[1])} L${f(x)} ${f(y)}`;
        if (Math.sin(ang) > 0) front += seg;
        else back += seg;
      }
      prev = [x, y];
    }
    s += pathD(back, { stroke: "#a9aeb5", strokeWidth: 5 });
    s += pathD(front, { stroke: INK, strokeWidth: 7 }) + pathD(front, { stroke: "#e9e6df", strokeWidth: 3.4 });
    s += line(x0, 60, x0, 180, accent) + line(x1, 60, x1, 180, { ...accent });
    s += dimH(x0, x1, 210, "طول آزاد ۳۸۲") + dimV(300, 68, 172, "Ø 110");
    s += line(x1 + 4, 68, 304, 68, ext) + line(x1 + 4, 172, 304, 172, ext);
    s += text(46, 36, "مفتول Ø13.2 · کروم-سیلیسیم · پوشش اپوکسی");
    return s;
  },
];

// ── Transmission ────────────────────────────────────────────────────────────
drawings["clutch-kit"] = [
  "کیت کلاچ",
  () => {
    let s = "";
    const cx = 120, cy = 120;
    s += circle(cx, cy, 92, { fill: FILL2 });
    s += circle(cx, cy, 80, { fill: FILL });
    for (let i = 0; i < 18; i++) {
      const a = (360 / 18) * i;
      const p1 = polar(cx, cy, 30, a - 6), p2 = polar(cx, cy, 30, a + 6), p3 = polar(cx, cy, 74, a + 8), p4 = polar(cx, cy, 74, a - 8);
      s += polygon([p1, p2, p3, p4], { fill: "#f5f3ee", strokeWidth: 0.8 });
    }
    s += circle(cx, cy, 30, { fill: "#fff" }) + circle(cx, cy, 30, accent);
    s += holes(cx, cy, 86, 6, 3.6, -60, { fill: "#fff", strokeWidth: 0.9 });
    // disc
    const dx = 254;
    s += ellipse(dx, cy, 30, 86, { fill: FILL });
    s += ellipse(dx, cy, 22, 64, thin) + ellipse(dx, cy, 8, 18, { fill: "#fff" });
    for (let i = 0; i < 8; i++) {
      const y = cy - 70 + i * 20;
      s += circle(dx - 24 + Math.abs(i - 3.5) * 1.6, y, 1.6, { fill: INK, stroke: "none" });
    }
    s += line(cx - 100, cy, dx + 40, cy, center);
    s += line(28, 212, 28, 226, ext) + line(212, 212, 212, 226, ext) + dimH(28, 212, 222, "Ø 228 · ۲۸ هزارخار");
    s += tag(cx + 52, cy - 30, "فنر دیافراگمی", 220, 24);
    return s;
  },
];

drawings["cv-joint"] = [
  "پلوس و سرپلوس",
  () => {
    let s = line(10, 120, 310, 120, center);
    s += rect(14, 112, 30, 16, { fill: FILL2 });
    for (let x = 16; x < 44; x += 4) s += line(x, 112, x, 128, faint);
    s += pathD("M44 96 q24 -4 40 4 v40 q-16 8 -40 4 Z", { fill: FILL });
    let d = "M84 100";
    for (let i = 0; i < 6; i++) d += ` l8 6 l8 -6`;
    d += " v40";
    for (let i = 0; i < 6; i++) d += ` l-8 6 l-8 -6`;
    s += pathD(d + "Z", { fill: "#2a2e33", stroke: INK });
    s += rect(180, 114, 92, 12, { fill: FILL });
    s += line(84, 100, 180, 114, faint);
    s += pathD("M180 108 h10 v24 h-10 Z", { fill: FILL2 });
    s += rect(272, 108, 24, 24, { fill: FILL2 }) + rect(296, 112, 12, 16, thin);
    s += circle(64, 120, 14, { ...accent, strokeWidth: 1.4 });
    s += pathD(gearPath(64, 120, 22, 20, 45), { stroke: MID, strokeWidth: 0.5 });
    s += tag(64, 106, "سرپلوس · ۳۶ هزارخار", 70, 50) + tag(120, 104, "گردگیر TPE", 150, 72);
    s += dimH(14, 308, 200, "618");
    return s;
  },
];

// ── Cooling ─────────────────────────────────────────────────────────────────
drawings["radiator"] = [
  "رادیاتور آلومینیومی",
  () => {
    let s = rect(40, 44, 22, 160, { fill: FILL2 }) + rect(258, 44, 22, 160, { fill: FILL2 });
    s += rect(62, 52, 196, 144, { fill: FILL });
    for (let x = 66; x < 258; x += 4.5) s += line(x, 52, x, 196, faint);
    for (let y = 62; y < 196; y += 12) s += line(62, y, 258, y, { stroke: "#a9aeb5", strokeWidth: 0.7 });
    s += rect(62, 52, 196, 144, thin);
    s += rect(20, 60, 20, 16, { fill: "#f5f3ee" }) + rect(280, 172, 20, 16, { fill: "#f5f3ee" });
    s += pathD("M18 68 h-8", { ...accent, markerStart: "url(#a)" }) + text(6, 56, "ورودی");
    s += pathD("M302 180 h10", { ...accent, markerEnd: "url(#a)" }) + text(290, 202, "خروجی");
    s += circle(51, 34, 6, { fill: "#f5f3ee" }) + rect(48, 38, 6, 6, thin);
    s += dimH(62, 258, 224, "650 × 438 × 26") + line(62, 200, 62, 228, ext) + line(258, 200, 258, 228, ext);
    s += tag(160, 120, "هسته لحیم‌شده", 200, 24);
    return s;
  },
];

drawings["water-pump"] = [
  "واترپمپ",
  () => {
    let s = "";
    const cx = 116, cy = 120;
    s += pathD(`M${cx} ${cy - 86} q60 4 78 46 q16 40 -10 70 l-20 18 q-30 22 -70 14 q-46 -10 -62 -50 q-14 -40 12 -72 q28 -28 72 -26 Z`, { fill: FILL2 });
    s += circle(cx, cy, 60, { fill: FILL });
    for (let i = 0; i < 8; i++) {
      const a = (360 / 8) * i;
      const [x1, y1] = polar(cx, cy, 14, a);
      const [x2, y2] = polar(cx, cy, 56, a + 40);
      const [qx, qy] = polar(cx, cy, 40, a + 6);
      s += pathD(`M${f(x1)} ${f(y1)} Q${f(qx)} ${f(qy)} ${f(x2)} ${f(y2)}`, { strokeWidth: 2.2 });
    }
    s += circle(cx, cy, 14, { fill: "#f5f3ee" }) + circle(cx, cy, 5, { fill: "#fff" });
    s += circle(cx, cy, 56, { ...accent, strokeWidth: 1, strokeDasharray: "3 4" });
    s += holes(cx, cy, 76, 5, 4, -100, { fill: "#fff" });
    // side
    const sx = 250;
    s += rect(sx - 10, 60, 20, 120, { fill: FILL2 }) + rect(sx + 10, 104, 30, 32, { fill: FILL }) + rect(sx + 40, 112, 26, 16, { fill: "#f5f3ee" });
    s += pathD(`M${sx - 10} 84 h-20 v72 h20`, { fill: FILL });
    s += line(sx - 40, 120, sx + 70, 120, center);
    s += tag(cx + 30, cy - 40, "پروانه فلزی · ۸ پره", 200, 30) + tag(sx + 50, 128, "آب‌بند SiC", 250, 214);
    return s;
  },
];

drawings["thermostat"] = [
  "ترموستات",
  () => {
    let s = line(150, 16, 150, 226, center);
    s += pathD("M86 120 h128 v18 h-128 Z", { fill: FILL2 });
    s += circle(98, 129, 4, { fill: "#fff" }) + circle(202, 129, 4, { fill: "#fff" });
    s += pathD("M112 120 v-38 q0 -26 38 -26 q38 0 38 26 v38", { fill: FILL });
    s += rect(136, 28, 28, 28, { fill: "#f5f3ee" }) + rect(132, 24, 36, 6, { fill: FILL2, strokeWidth: 0.9 });
    s += rect(138, 138, 24, 46, { fill: "#2a2e33", stroke: INK }) + ellipse(150, 190, 14, 6, { fill: "#f5f3ee" });
    let d = "M126 146";
    for (let i = 0; i < 5; i++) d += ` l48 6 l-48 6`;
    s += pathD(d, { stroke: MID, strokeWidth: 1 });
    s += line(108, 196, 192, 196, accent);
    s += tag(150, 164, "المنت واکسی · ۸۷ درجه", 210, 176) + tag(168, 40, "محل سنسور", 214, 40);
    s += dimH(86, 214, 222, "پوسته PA66-GF35");
    return s;
  },
];

// ── Electrical ──────────────────────────────────────────────────────────────
drawings["spark-plug"] = [
  "شمع ایریدیوم",
  () => {
    let s = line(10, 120, 310, 120, center);
    s += rect(16, 112, 22, 16, { fill: FILL2 }) + rect(10, 114, 8, 12, thin);
    s += pathD("M38 108 h86 v24 h-86 Z", { fill: "#f5f3ee" });
    for (let x = 46; x < 120; x += 10) s += pathD(`M${x} 108 q3 -4 6 0 M${x} 132 q3 4 6 0`, thin);
    s += polygon([[124, 98], [168, 98], [176, 108], [176, 132], [168, 142], [124, 142], [116, 132], [116, 108]], { fill: FILL });
    s += line(124, 98, 124, 142, thin) + line(168, 98, 168, 142, thin);
    s += rect(176, 104, 10, 32, { fill: FILL2 });
    s += rect(186, 108, 76, 24, { fill: FILL });
    s += threads(190, 258, 108, 132, 5);
    s += rect(262, 116, 14, 8, { fill: "#f5f3ee" });
    s += pathD("M262 104 h28 v12", { strokeWidth: 2.4 }) + line(276, 120, 284, 120, { stroke: EMBER, strokeWidth: 2.6 });
    s += dimH(186, 262, 160, "M12 × 1.25 · 26.5") + line(186, 136, 186, 164, ext) + line(262, 136, 262, 164, ext);
    s += dimH(124, 168, 84, "آچارخور ۱۴");
    s += tag(282, 120, "ایریدیوم Ø0.6", 250, 206);
    return s;
  },
];

drawings["ignition-coil"] = [
  "کوئل مدادی",
  () => {
    let s = line(10, 120, 310, 120, center);
    s += pathD("M18 92 h56 q8 0 8 8 v40 q0 8 -8 8 h-56 Z", { fill: FILL2 });
    s += rect(30, 72, 30, 20, { fill: "#f5f3ee" }) + rect(36, 66, 18, 6, thin);
    for (let i = 0; i < 4; i++) s += rect(36 + i * 5, 76, 2, 10, { fill: INK, stroke: "none" });
    s += rect(82, 106, 168, 28, { fill: FILL });
    for (let x = 92; x < 248; x += 8) s += line(x, 106, x, 134, faint);
    s += pathD("M250 104 h24 q8 0 10 6 l14 4 v12 l-14 4 q-2 6 -10 6 h-24 Z", { fill: "#2a2e33" });
    s += line(298, 120, 308, 120, accent);
    s += pathD("M8 100 h4", thin) + circle(26, 140, 4, { fill: "#fff" });
    s += dimH(18, 298, 190, "خروجی بیش از ۳۵ کیلوولت · کوئل روی شمع");
    s += tag(166, 120, "سیم‌پیچ ثانویه", 170, 60) + tag(45, 72, "۴ پین", 90, 40);
    return s;
  },
];

drawings["alternator"] = [
  "دینام",
  () => {
    let s = "";
    const cx = 130, cy = 120;
    s += pathD(`M${cx - 40} ${cy - 84} h-34 q-10 0 -10 10 v20 q0 10 10 10 h14`, { fill: FILL2 }) + circle(cx - 66, cy - 66, 6, { fill: "#fff" });
    s += pathD(`M${cx + 40} ${cy + 84} h34 q10 0 10 -10 v-20 q0 -10 -10 -10 h-14`, { fill: FILL2 }) + circle(cx + 66, cy + 66, 6, { fill: "#fff" });
    s += circle(cx, cy, 82, { fill: FILL });
    for (let i = 0; i < 16; i++) {
      const a = (360 / 16) * i;
      const [x1, y1] = polar(cx, cy, 48, a);
      const [x2, y2] = polar(cx, cy, 74, a + 12);
      s += line(x1, y1, x2, y2, { strokeWidth: 3.4, stroke: "#2a2e33" });
    }
    s += circle(cx, cy, 44, { fill: "#f5f3ee" });
    for (const r of [40, 34, 28]) s += circle(cx, cy, r, thin);
    s += circle(cx, cy, 22, accent) + circle(cx, cy, 8, { fill: "#fff" });
    s += line(cx - 96, cy, cx + 96, cy, center) + line(cx, cy - 96, cx, cy + 96, center);
    // side
    s += rect(252, 64, 48, 112, { fill: FILL }) + rect(234, 92, 18, 56, { fill: "#f5f3ee" });
    for (let y = 96; y < 146; y += 8) s += line(234, y, 252, y, thin);
    for (let y = 72; y < 172; y += 10) s += line(258, y, 294, y, faint);
    s += tag(cx + 18, cy - 14, "پولی هرزگرد · ۶ شیار", 214, 24) + tag(276, 176, "۹۰ آمپر · ۱۴ ولت", 260, 214);
    return s;
  },
];

drawings["starter-motor"] = [
  "استارت",
  () => {
    let s = line(10, 140, 310, 140, center);
    s += rect(30, 104, 140, 72, { fill: FILL });
    for (let x = 40; x < 170; x += 12) s += line(x, 106, x, 174, faint);
    s += rect(20, 112, 10, 56, { fill: FILL2 });
    s += rect(66, 60, 110, 40, { fill: FILL2 }) + ellipse(176, 80, 6, 20, { fill: "#f5f3ee" });
    s += circle(92, 56, 4, thin) + circle(140, 56, 4, thin) + line(92, 52, 92, 44, thin) + line(140, 52, 140, 44, thin);
    s += pathD("M170 112 h40 l20 10 v36 l-20 10 h-40 Z", { fill: FILL2 });
    s += circle(206, 168, 6, { fill: "#fff" });
    s += rect(230, 132, 30, 16, { fill: "#f5f3ee" });
    s += pathD(gearPath(276, 140, 16, 13, 10), { fill: FILL, ...accent, strokeWidth: 1.4 });
    s += circle(276, 140, 4, { fill: "#fff" });
    s += dimH(20, 292, 214, "۱٫۴ کیلووات · ۱۲ ولت · ۱۰ دندانه");
    s += tag(276, 124, "دنده استارت", 290, 90) + tag(120, 80, "اتومات", 180, 30);
    return s;
  },
];

drawings["battery"] = [
  "باتری",
  () => {
    let s = "";
    const top = [[60, 88], [220, 60], [284, 92], [124, 120]];
    s += polygon(top, { fill: "#f5f3ee" });
    s += polygon([[60, 88], [124, 120], [124, 206], [60, 174]], { fill: FILL2 });
    s += polygon([[124, 120], [284, 92], [284, 178], [124, 206]], { fill: FILL });
    s += ellipse(120, 82, 10, 5, { fill: FILL2 }) + rect(110, 70, 20, 12, { fill: FILL2, strokeWidth: 0 }) + ellipse(120, 70, 10, 5, { fill: "#2a2e33" });
    s += ellipse(222, 100, 10, 5, { fill: FILL2 }) + rect(212, 88, 20, 12, { fill: FILL2, strokeWidth: 0 }) + ellipse(222, 88, 10, 5, { fill: EMBER, stroke: INK });
    s += line(110, 70, 110, 82, thin) + line(130, 70, 130, 82, thin) + line(212, 88, 212, 100, thin) + line(232, 88, 232, 100, thin);
    s += text(116, 58, "−", { fontSize: 14, fill: INK }) + text(218, 76, "+", { fontSize: 14, fill: EMBER });
    s += polygon([[150, 134], [262, 114], [262, 160], [150, 180]], thin);
    s += text(160, 150, "AGM 70Ah", { transform: "skewY(-10) translate(0 28)", fontSize: 10, fill: INK });
    s += text(160, 166, "760 A EN", { transform: "skewY(-10) translate(0 28)" });
    s += dimH(60, 284, 230, "278 × 175 × 190");
    return s;
  },
];

drawings["generic"] = [
  "قطعه خودرو",
  () => {
    let s = line(20, 120, 300, 120, center) + line(160, 20, 160, 220, center);
    s += pathD(gearPath(160, 120, 76, 66, 24), { fill: FILL });
    s += circle(160, 120, 44, { fill: "#f5f3ee" }) + polygon(Array.from({ length: 6 }, (_, i) => polar(160, 120, 24, i * 60 + 30)), { fill: FILL2 });
    s += circle(160, 120, 10, { fill: "#fff", ...accent });
    return s;
  },
];

let count = 0;
for (const [name, [title, draw]] of Object.entries(drawings)) {
  writeFileSync(path.join(out, `${name}.svg`), svg(draw(), title));
  count++;
}
console.log(`Wrote ${count} illustrations to ${path.relative(process.cwd(), out)}`);
