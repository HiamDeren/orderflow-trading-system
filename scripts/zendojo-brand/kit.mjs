// Brand kit ZenDojo (D49): xuất PNG độ phân giải cao từ SVG gốc của build.py.
// Chạy từ apps/web (có sharp):  node ../../scripts/zendojo-brand/kit.mjs /tmp/zendojo /tmp/ZenDojo-brand-kit
// Phần cần trình duyệt (logo kèm chữ, bảng màu, ảnh OG @2x, favicon.ico, zip) làm ở kit.py.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(path.resolve("package.json"));
const sharp = require("sharp");
const SRC = process.argv[2] || "/tmp/zendojo";
const KIT = process.argv[3] || "/tmp/ZenDojo-brand-kit";
const dir = (d) => (fs.mkdirSync(path.join(KIT, d), { recursive: true }), path.join(KIT, d));

// render SVG ở mật độ đủ để ra đúng kích thước rồi resize (không phóng ảnh nhỏ)
async function png(svgFile, w, h, out, fit = "cover") {
  const meta = await sharp(path.join(SRC, svgFile)).metadata();
  const density = Math.min(2400, Math.ceil((72 * Math.max(w / meta.width, h / meta.height)) * 1.05));
  await sharp(path.join(SRC, svgFile), { density }).resize(w, h, { fit, position: "centre" }).png({ compressionLevel: 9 }).toFile(out);
}

const KINDS = { tsu: "ツ" };
const SHAPES = ["square", "round", "none"];

// 1 · logo: SVG gốc + PNG 1024 / 2048 / 4096
const lsvg = dir("01-logo/svg"), lpng = dir("01-logo/png");
for (const k of Object.keys(KINDS)) {
  for (const sh of SHAPES) {
    fs.copyFileSync(path.join(SRC, `logo-${k}-${sh}.svg`), path.join(lsvg, `zendojo-logo-${k}-${sh}.svg`));
    for (const n of [1024, 2048, 4096]) await png(`logo-${k}-${sh}.svg`, n, n, path.join(lpng, `zendojo-logo-${k}-${sh}-${n}.png`));
  }
}

// 3 · avatar: vuông tràn nền (Discord, Facebook… tự cắt tròn) + bản tròn sẵn
const av = dir("03-avatar");
for (const k of Object.keys(KINDS)) {
  for (const n of [1024, 2048]) {
    await png(`logo-${k}-full.svg`, n, n, path.join(av, `zendojo-avatar-${k}-${n}.png`));
    await png(`logo-${k}-round.svg`, n, n, path.join(av, `zendojo-avatar-${k}-round-${n}.png`));
  }
}

// 4 · icon: favicon / app (logo chính ツ, vuông bo góc) + maskable (chừa vùng an toàn)
const ic = dir("04-icons");
for (const n of [16, 32, 48, 64, 128, 180, 192, 256, 512, 1024]) await png("logo-tsu-square.svg", n, n, path.join(ic, `icon-${n}.png`));
fs.copyFileSync(path.join(ic, "icon-180.png"), path.join(ic, "apple-touch-icon-180.png"));
for (const n of [512, 1024]) {
  const inner = await sharp(path.join(SRC, "logo-tsu-full.svg"), { density: 72 * (n / 512) * 1.1 }).resize(Math.round(n * 0.8), Math.round(n * 0.8)).png().toBuffer();
  await sharp({ create: { width: n, height: n, channels: 4, background: "#0F1115" } })
    .composite([{ input: inner, gravity: "centre" }]).png().toFile(path.join(ic, `maskable-${n}.png`));
}

// 5 · hình nền
const bgd = dir("05-backgrounds");
await png("login-bg.svg", 3840, 2400, path.join(bgd, "zendojo-wallpaper-3840x2400-16x10.png"));
await png("login-bg.svg", 3840, 2160, path.join(bgd, "zendojo-wallpaper-3840x2160-4K.png"));
await png("login-bg.svg", 5120, 2880, path.join(bgd, "zendojo-wallpaper-5120x2880-5K.png"));
await png("login-bg.svg", 2560, 1440, path.join(bgd, "zendojo-wallpaper-2560x1440-QHD.png"));
await png("mobile-bg.svg", 1440, 3120, path.join(bgd, "zendojo-mobile-1440x3120.png"));
await png("mobile-bg.svg", 1290, 2796, path.join(bgd, "zendojo-mobile-1290x2796-iphone.png"));
await png("login-bg.svg", 1920, 1080, path.join(bgd, "zendojo-discord-banner-1920x1080.png"));
await png("login-bg.svg", 960, 540, path.join(bgd, "zendojo-discord-banner-960x540.png"));
await png("og-bg.svg", 2400, 1260, path.join(SRC, "og-bg@2x.png"));
// biểu ngữ hồ sơ Discord: tối thiểu 680×240 (≈ 17:6), xuất gấp 3
await png("profile-banner.svg", 2040, 720, path.join(bgd, "zendojo-discord-profile-banner-2040x720.png"));

// 5b · hình nền lấy ㋡ làm hình chính
const tb = dir("05-backgrounds/tsu");
await png("tsu-bg-16x9.svg", 5120, 2880, path.join(tb, "zendojo-tsu-wallpaper-5120x2880-5K.png"));
await png("tsu-bg-16x9.svg", 3840, 2160, path.join(tb, "zendojo-tsu-wallpaper-3840x2160-4K.png"));
await png("tsu-bg-16x9.svg", 2560, 1440, path.join(tb, "zendojo-tsu-wallpaper-2560x1440-QHD.png"));
await png("tsu-bg-16x10.svg", 3840, 2400, path.join(tb, "zendojo-tsu-wallpaper-3840x2400-16x10.png"));
await png("tsu-bg-mobile.svg", 1440, 3120, path.join(tb, "zendojo-tsu-mobile-1440x3120.png"));
await png("tsu-bg-mobile.svg", 1290, 2796, path.join(tb, "zendojo-tsu-mobile-1290x2796-iphone.png"));
await png("tsu-bg-16x9.svg", 1920, 1080, path.join(tb, "zendojo-tsu-discord-banner-1920x1080.png"));
await png("tsu-bg-16x9.svg", 960, 540, path.join(tb, "zendojo-tsu-discord-banner-960x540.png"));
await png("tsu-bg-profile-banner.svg", 2040, 720, path.join(tb, "zendojo-tsu-discord-profile-banner-2040x720.png"));

// 6 · minh hoạ
const il = dir("06-illustrations");
await png("empty.svg", 1440, 600, path.join(il, "zendojo-empty-1440x600.png"));
await png("empty.svg", 2880, 1200, path.join(il, "zendojo-empty-2880x1200.png"));

// source: toàn bộ SVG gốc (vector, phóng to bao nhiêu cũng nét)
const src = dir("source-svg");
for (const f of fs.readdirSync(SRC).filter((f) => f.endsWith(".svg"))) fs.copyFileSync(path.join(SRC, f), path.join(src, f));
console.log("kit raster ok →", KIT);
