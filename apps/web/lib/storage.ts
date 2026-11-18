// Quy ước Supabase Storage cho nghiệp vụ trading.
// Một bucket private "trading" (cùng tên schema), chia folder theo ngày rồi theo loại:
//   YYYY/MM/DD/plan/plan_<date>_<symbol>.png   ảnh trade plan (server vẽ)
//   YYYY/MM/DD/journal/<file>                   ảnh journal: chụp lệnh, recap cuối phiên
// Mở một ngày là thấy đủ plan + journal của ngày đó.

export const TRADING_BUCKET = "trading";
export const STORAGE_KINDS = ["plan", "journal"] as const;
export type StorageKind = (typeof STORAGE_KINDS)[number];

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Ký tự lạ trong tên file → "_" (giữ chữ, số, gạch dưới, gạch ngang, dấu chấm). */
export function safeName(s: string) {
  return String(s).replace(/[^A-Za-z0-9_.-]/g, "_");
}

/** Đường dẫn trong bucket: YYYY/MM/DD/<kind>/<file>. `date` dạng YYYY-MM-DD (ngày phiên, giờ ET). */
export function dayPath(date: string, kind: StorageKind, file: string) {
  const m = DATE_RE.exec(date);
  if (!m) throw new Error(`date phải dạng YYYY-MM-DD: ${date}`);
  if (!STORAGE_KINDS.includes(kind)) throw new Error(`kind không hợp lệ: ${kind}`);
  return `${m[1]}/${m[2]}/${m[3]}/${kind}/${safeName(file)}`;
}

/** Ảnh trade plan của một ngày + symbol. */
export function planImagePath(date: string, symbol: string) {
  return dayPath(date, "plan", `plan_${date}_${safeName(symbol)}.png`);
}
