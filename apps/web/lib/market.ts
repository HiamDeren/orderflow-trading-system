// News và Earnings qua Finnhub (gói free: 60 lệnh / phút). Cần biến FINNHUB_API_KEY trên Vercel.
// Chỉ gọi phía server, cache ngắn, không lưu database (giống lịch kinh tế, D37).
//   GET /api/v1/news?category=general|forex|merger → [{ id, datetime (unix s), headline, source, summary, url, category, related }]
//   GET /api/v1/calendar/earnings?from&to → { earningsCalendar: [{ symbol, date, hour: bmo|amc|dmh, epsEstimate, epsActual, revenueEstimate, revenueActual, quarter, year }] }

const BASE = process.env.FINNHUB_BASE_URL || "https://finnhub.io/api/v1";
export const NEWS_CATEGORIES = ["general", "forex", "merger"] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export type NewsItem = { id: string; ts: number; headline: string; source: string; summary: string; url: string; related: string };
export type Earning = {
  symbol: string;
  date: string;
  hour: "bmo" | "amc" | "dmh" | "";
  epsEstimate: number | null;
  epsActual: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
  quarter: number | null;
  year: number | null;
};
export type Result<T> = { ok: boolean; configured: boolean; items: T[]; error?: string };

// Cổ phiếu nặng trong Nasdaq-100 (ảnh hưởng NQ). Đổi tuỳ ý.
export const NQ_WATCH = [
  "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "GOOG", "META", "AVGO", "TSLA", "COST", "NFLX", "AMD", "PLTR", "TMUS", "CSCO",
  "PEP", "ADBE", "QCOM", "INTU", "AMAT", "TXN", "ISRG", "MU", "LRCX", "BKNG", "PANW", "ARM", "ASML", "INTC", "ADI",
  "KLAC", "CRWD", "MRVL", "SNPS", "CDNS", "MELI", "PDD", "ADP", "SBUX", "GILD", "AMGN", "CMCSA", "HON", "ABNB", "DASH",
  "FTNT", "ORLY", "REGN", "VRTX", "MDLZ", "CTAS", "WDAY", "ADSK", "ZS", "DDOG", "TEAM",
];

const num = (v: unknown) => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));

async function call<T>(path: string, revalidate: number): Promise<T> {
  const key = process.env.FINNHUB_API_KEY;
  const r = await fetch(`${BASE}${path}${path.includes("?") ? "&" : "?"}token=${encodeURIComponent(key || "")}`, {
    next: { revalidate },
    headers: { Accept: "application/json" },
  });
  if (r.status === 429) throw new Error("Finnhub giới hạn tần suất (429), thử lại sau ít phút");
  if (!r.ok) throw new Error(`Finnhub HTTP ${r.status}`);
  return (await r.json()) as T;
}

export function marketConfigured() {
  return !!process.env.FINNHUB_API_KEY;
}

export async function getNews(category: NewsCategory = "general", limit = 60): Promise<Result<NewsItem>> {
  if (!marketConfigured()) return { ok: false, configured: false, items: [] };
  try {
    const raw = await call<Record<string, unknown>[]>(`/news?category=${category}`, 300);
    const items = (Array.isArray(raw) ? raw : [])
      .map((n) => ({
        id: String(n.id ?? n.url),
        ts: Number(n.datetime) * 1000,
        headline: String(n.headline || "").trim(),
        source: String(n.source || ""),
        summary: String(n.summary || "").trim(),
        url: String(n.url || ""),
        related: String(n.related || ""),
      }))
      .filter((n) => n.headline && n.url.startsWith("http") && Number.isFinite(n.ts))
      .sort((a, b) => b.ts - a.ts)
      .slice(0, limit);
    return { ok: true, configured: true, items };
  } catch (e) {
    console.error("[market] news", String((e as Error).message));
    return { ok: false, configured: true, items: [], error: String((e as Error).message) };
  }
}

export async function getEarnings(from: string, to: string): Promise<Result<Earning>> {
  if (!marketConfigured()) return { ok: false, configured: false, items: [] };
  try {
    const raw = await call<{ earningsCalendar?: Record<string, unknown>[] }>(`/calendar/earnings?from=${from}&to=${to}`, 3600);
    const items = (raw.earningsCalendar || [])
      .map((e) => ({
        symbol: String(e.symbol || "").toUpperCase(),
        date: String(e.date || ""),
        hour: (["bmo", "amc", "dmh"].includes(String(e.hour)) ? String(e.hour) : "") as Earning["hour"],
        epsEstimate: num(e.epsEstimate),
        epsActual: num(e.epsActual),
        revenueEstimate: num(e.revenueEstimate),
        revenueActual: num(e.revenueActual),
        quarter: num(e.quarter),
        year: num(e.year),
      }))
      .filter((e) => e.symbol && /^\d{4}-\d{2}-\d{2}$/.test(e.date))
      .sort((a, b) => (a.date === b.date ? a.symbol.localeCompare(b.symbol) : a.date < b.date ? -1 : 1));
    return { ok: true, configured: true, items };
  } catch (e) {
    console.error("[market] earnings", String((e as Error).message));
    return { ok: false, configured: true, items: [], error: String((e as Error).message) };
  }
}

export function fmtMoney(n: number | null) {
  if (n === null) return "—";
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (a >= 1e6) return (n / 1e6).toFixed(1) + "M";
  return n.toLocaleString("en-US");
}
