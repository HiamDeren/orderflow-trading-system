#!/usr/bin/env node
// Kiểm tra hồi quy engine plan (apps/web/public/assets/js/plan-core.js).
// Chạy plan-core trên các payload mẫu, so summary + plan chữ + vùng HVN với snapshot đã chốt.
//   node scripts/check-plan-core.mjs            → so sánh, sai thì exit 1
//   node scripts/check-plan-core.mjs --update   → ghi lại snapshot (chỉ khi cố ý đổi luật / chữ)
// Khi port sang TypeScript (web app), bản mới phải cho ra đúng snapshot này.
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const core = require(path.join(root, "apps/web/public/assets/js/plan-core.js"));
const SNAP = path.join(root, "scripts/plan-core.snapshot.json");
const CASES = ["apps/web/public/assets/sample_plan_20261112.json"];

const pick = (p) => ({
  summary: p.summary,
  zones: (p.zones || []).map((z) => ({ lo: z.lo, hi: z.hi })),
  text: p.text,
  svgBytes: p.svg ? p.svg.length : 0,
});

const now = {};
for (const c of CASES) {
  const J = JSON.parse(fs.readFileSync(path.join(root, c), "utf8"));
  const p = core.planFromJson(J);
  if (!p || p.error) {
    console.error(`✗ ${c}: planFromJson lỗi: ${p && p.error}`);
    process.exit(1);
  }
  if (!/^<svg[\s>]/.test(p.svg)) {
    console.error(`✗ ${c}: không ra SVG`);
    process.exit(1);
  }
  now[c] = pick(p);
}

if (process.argv.includes("--update") || !fs.existsSync(SNAP)) {
  fs.writeFileSync(SNAP, JSON.stringify(now, null, 2) + "\n");
  console.log(`✓ Đã ghi snapshot (${Object.keys(now).length} case) → scripts/plan-core.snapshot.json`);
  process.exit(0);
}

const old = JSON.parse(fs.readFileSync(SNAP, "utf8"));
let bad = 0;
for (const c of CASES) {
  const a = old[c],
    b = now[c];
  if (!a) {
    console.error(`✗ ${c}: chưa có trong snapshot (chạy --update)`);
    bad++;
    continue;
  }
  for (const k of ["summary", "zones", "text"]) {
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) {
      bad++;
      console.error(`✗ ${c}: '${k}' khác snapshot`);
      if (k === "text") {
        const la = a.text.split("\n"),
          lb = b.text.split("\n");
        for (let i = 0; i < Math.max(la.length, lb.length); i++)
          if (la[i] !== lb[i]) {
            console.error(`  dòng ${i + 1}\n  cũ: ${la[i]}\n  mới: ${lb[i]}`);
            break;
          }
      } else {
        console.error(`  cũ: ${JSON.stringify(a[k])}\n  mới: ${JSON.stringify(b[k])}`);
      }
    }
  }
  if (a.svgBytes !== b.svgBytes) console.log(`• ${c}: SVG đổi kích thước ${a.svgBytes} → ${b.svgBytes} (chỉ nhắc, mở ảnh xem lại)`);
}
if (bad) {
  console.error(`\n${bad} khác biệt. Nếu thay đổi là cố ý: node scripts/check-plan-core.mjs --update`);
  process.exit(1);
}
console.log(`✓ plan-core khớp snapshot (${CASES.length} case)`);
