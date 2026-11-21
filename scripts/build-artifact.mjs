#!/usr/bin/env node
// Build artifact claude.ai "NQ Trade Plan · Composite × pRTH × OVN" (slug 8cbed587-6959-483d-a389-64da7c4149bb).
// artifact/app.js = apps/web/public/assets/js/plan-core.js + artifact/app.src.js (thay "__VA_LINES__" bằng artifact/va_lines.txt).
// Sau khi build: publish artifact/index.html + artifact/app.js lên artifact (Claude dùng publish_files).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rd = (p) => fs.readFileSync(path.join(root, p), "utf8");
const core = rd("apps/web/public/assets/js/plan-core.js");
const src = rd("artifact/app.src.js").replace("__VA_LINES__", rd("artifact/va_lines.txt").trim());
const out = "/* plan-core.js (đồng bộ từ repo HiamDeren/zendojo) */\n" + core + "\n\n/* ---------- UI artifact ---------- */\n" + src;
fs.writeFileSync(path.join(root, "artifact/app.js"), out);
console.log(`✓ artifact/app.js (${out.length} bytes). Publish artifact/index.html + artifact/app.js.`);
