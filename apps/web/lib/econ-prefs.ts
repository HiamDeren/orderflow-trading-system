// Bộ lọc lịch kinh tế (mức tác động + currency), lưu trong cookie để Dashboard (server) và Calendar (client) dùng chung.
// File này không import gì của server: dùng được cả hai phía.

export const IMPACTS = ["High", "Medium", "Low", "Holiday"] as const;
export type Impact = (typeof IMPACTS)[number];
export const IMPACT_LABEL: Record<Impact, string> = { High: "Cao", Medium: "Vừa", Low: "Thấp", Holiday: "Nghỉ lễ" };
export const IMPACT_RANK: Record<Impact, number> = { High: 3, Medium: 2, Low: 1, Holiday: 0 };

export const CURRENCIES = ["AUD", "CAD", "CHF", "CNY", "EUR", "GBP", "JPY", "NZD", "USD"] as const;

export const PREFS_COOKIE = "desk_econ";
export type EconPrefs = { cur: string[]; imp: Impact[] };
const DEFAULT_PREFS: EconPrefs = { cur: ["USD"], imp: [...IMPACTS] };

export function parsePrefs(raw: string | undefined | null): EconPrefs {
  if (!raw) return { ...DEFAULT_PREFS };
  try {
    const j = JSON.parse(decodeURIComponent(raw)) as Partial<EconPrefs>;
    const cur = Array.isArray(j.cur) ? j.cur.filter((c) => (CURRENCIES as readonly string[]).includes(c)) : DEFAULT_PREFS.cur;
    const imp = Array.isArray(j.imp) ? (j.imp.filter((i) => (IMPACTS as readonly string[]).includes(i)) as Impact[]) : DEFAULT_PREFS.imp;
    return { cur, imp };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function prefsCookie(p: EconPrefs) {
  return `${PREFS_COOKIE}=${encodeURIComponent(JSON.stringify(p))}; path=/; max-age=31536000; samesite=lax`;
}

export function matches(p: EconPrefs, e: { country: string; impact: Impact }) {
  return p.cur.includes(e.country) && p.imp.includes(e.impact);
}
