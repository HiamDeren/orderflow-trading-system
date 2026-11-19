// Xuất PNG / WebP cho ZenDojo từ SVG gốc của build.py (SVG ensō nặng ~300 KB nên web dùng ảnh raster).
// Chạy từ apps/web (có sharp): node ../../scripts/zendojo-brand/raster.mjs /tmp/zendojo
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(path.resolve("package.json"));
const sharp = require("sharp");
const SRC = process.argv[2] || "/tmp/zendojo";
const OUT = path.resolve("public/assets/img/zendojo");
const s = (f) => sharp(path.join(SRC, f), { density: 144 });
for (const n of [32, 180, 192, 512]) await s("logo.svg").resize(n, n).png().toFile(`${OUT}/icon-${n}.png`);
await s("login-bg.svg").resize(1920, 1200).webp({ quality: 82 }).toFile(`${OUT}/login-bg.webp`);
await s("empty.svg").resize(720, 300).webp({ quality: 85 }).toFile(`${OUT}/empty.webp`);
await s("og-bg.svg").resize(1200, 630).png().toFile(path.join(SRC, "og-bg.png"));
await s("logo.svg").resize(512, 512).png().toFile(path.join(SRC, "discord-icon-512.png"));
console.log("raster ok →", OUT);
