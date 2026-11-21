// i18n cho dashboard: câu tiếng Việt là khoá, bản EN tra trong lib/i18n-en.ts. Thiếu bản dịch thì giữ tiếng Việt.
// Biến chèn dạng {name}: t("Recap {d}", { d: "17/11" }).
import EN from "@/lib/i18n-en";
import type { Lang } from "@/lib/prefs";

export function translate(lang: Lang, s: string, vars?: Record<string, string | number>) {
  let out = lang === "en" ? (EN[s] ?? s) : s;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}

export const DOW = {
  vi: ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};
export const DOW_SHORT = {
  vi: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};
export const MON_HEAD = { vi: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"], en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] };
