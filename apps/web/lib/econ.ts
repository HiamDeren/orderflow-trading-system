// Lịch kinh tế: chỉ gọi API phía server, cache ~15 phút, không lưu database (D37).
// Nguồn mặc định: feed JSON tuần hiện tại của ForexFactory (faireconomy). Đổi nguồn bằng biến ECON_CALENDAR_URL.
// Mỗi phần tử feed: { title, country: "USD", date: "2026-11-18T08:30:00-05:00", impact: High|Medium|Low|Holiday, forecast, previous }
// Lấy đủ mọi currency; lọc currency / mức tác động ở giao diện (cookie desk_econ, lib/econ-prefs.ts).
import { IMPACT_RANK, type Impact } from "@/lib/econ-prefs";
import { TZ_ET, TZ_VN, etDateOf, hhmm, inSession } from "@/lib/time";

export type { Impact } from "@/lib/econ-prefs";
export const ECON_SOURCE_PAGE = "https://www.forexfactory.com/calendar";
const DEFAULT_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
const REVALIDATE = 900;

export type EconEvent = {
  id: string;
  title: string;
  country: string;
  impact: Impact;
  ts: number;
  dateEt: string;
  timeEt: string;
  timeVn: string;
  allDay: boolean;
  forecast: string;
  previous: string;
  actual: string;
  inSession: boolean;
};
export type EconWeek = { ok: boolean; events: EconEvent[]; fetchedAt: string | null; error?: string };

const IMPACT: Record<string, Impact> = { high: "High", medium: "Medium", low: "Low", holiday: "Holiday" };

type Raw = { title?: string; country?: string; date?: string; impact?: string; forecast?: string; previous?: string; actual?: string };

export async function getEconWeek(): Promise<EconWeek> {
  const src = process.env.ECON_CALENDAR_URL || DEFAULT_URL;
  try {
    const r = await fetch(src, { next: { revalidate: REVALIDATE }, headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const raw = (await r.json()) as Raw[];
    if (!Array.isArray(raw)) throw new Error("dữ liệu không phải danh sách");
    const events: EconEvent[] = [];
    raw.forEach((e, i) => {
      const ts = Date.parse(String(e.date || ""));
      if (!Number.isFinite(ts)) return;
      const impact = IMPACT[String(e.impact || "").toLowerCase()] || "Low";
      const timeEt = hhmm(ts, TZ_ET);
      const allDay = impact === "Holiday" || timeEt === "00:00";
      const [h, m] = timeEt.split(":").map(Number);
      events.push({
        id: `${ts}-${i}`,
        title: String(e.title || "").trim() || "(không tên)",
        country: String(e.country || "").toUpperCase(),
        impact,
        ts,
        dateEt: etDateOf(ts),
        timeEt: allDay ? "Cả ngày" : timeEt,
        timeVn: allDay ? "" : hhmm(ts, TZ_VN),
        allDay,
        forecast: String(e.forecast ?? "").trim(),
        previous: String(e.previous ?? "").trim(),
        actual: String(e.actual ?? "").trim(),
        inSession: !allDay && inSession(h * 60 + m),
      });
    });
    events.sort((a, b) => a.ts - b.ts);
    return { ok: true, events, fetchedAt: r.headers.get("date") };
  } catch (e) {
    console.error("[econ] lỗi lấy lịch", String((e as Error).message));
    return { ok: false, events: [], fetchedAt: null, error: String((e as Error).message) };
  }
}

export function topImpact(list: { impact: Impact }[]): Impact | null {
  let best: Impact | null = null;
  for (const e of list) if (!best || IMPACT_RANK[e.impact] > IMPACT_RANK[best]) best = e.impact;
  return best;
}
