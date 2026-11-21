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
// biome-ignore format: danh sách mã, giữ gọn
export const NQ_WATCH = [
  "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "GOOG", "META", "AVGO", "TSLA", "COST", "NFLX", "AMD", "PLTR", "TMUS", "CSCO",
  "PEP", "ADBE", "QCOM", "INTU", "AMAT", "TXN", "ISRG", "MU", "LRCX", "BKNG", "PANW", "ARM", "ASML", "INTC", "ADI",
  "KLAC", "CRWD", "MRVL", "SNPS", "CDNS", "MELI", "PDD", "ADP", "SBUX", "GILD", "AMGN", "CMCSA", "HON", "ABNB", "DASH",
  "FTNT", "ORLY", "REGN", "VRTX", "MDLZ", "CTAS", "WDAY", "ADSK", "ZS", "DDOG", "TEAM",
];

const num = (v: unknown) => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));

const TIMEOUT_MS = 8000;
const RETRY_429_MS = 1500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Key gửi qua header X-Finnhub-Token (không nằm trong URL / khoá cache / log). Timeout 8 giây.
// 429: thử lại 1 lần sau 1,5 giây (retry = 0 cho lệnh gọi theo lô như getQuotes, tránh dồn thêm tải).
export async function call<T>(path: string, revalidate: number, retry = 1): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    next: { revalidate },
    headers: { Accept: "application/json", "X-Finnhub-Token": process.env.FINNHUB_API_KEY || "" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (r.status === 429) {
    if (retry > 0) {
      await sleep(RETRY_429_MS);
      return call<T>(path, revalidate, retry - 1);
    }
    throw new Error("Finnhub giới hạn tần suất (429), thử lại sau ít phút");
  }
  if (!r.ok) throw new Error(`Finnhub HTTP ${r.status}`);
  return (await r.json()) as T;
}

// Chạy fn cho từng phần tử, tối đa `limit` lệnh cùng lúc (Finnhub free: 60 lệnh / phút).
export async function mapLimit<I, O>(items: I[], limit: number, fn: (item: I) => Promise<O>): Promise<O[]> {
  const out = new Array<O>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

export function marketConfigured() {
  return !!process.env.FINNHUB_API_KEY;
}

function parseNews(raw: unknown): NewsItem[] {
  return (Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [])
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
    .sort((a, b) => b.ts - a.ts);
}

export async function getNews(category: NewsCategory = "general", limit = 60): Promise<Result<NewsItem>> {
  if (!marketConfigured()) return { ok: false, configured: false, items: [] };
  try {
    const raw = await call<unknown>(`/news?category=${category}`, 300);
    return { ok: true, configured: true, items: parseNews(raw).slice(0, limit) };
  } catch (e) {
    console.error("[market] news", String((e as Error).message));
    return { ok: false, configured: true, items: [], error: String((e as Error).message) };
  }
}

// Tin theo mã (company-news), mặc định 14 ngày gần nhất
export async function getCompanyNews(symbol: string, days = 14, limit = 100): Promise<Result<NewsItem>> {
  if (!marketConfigured()) return { ok: false, configured: false, items: [] };
  try {
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const raw = await call<unknown>(`/company-news?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}`, 600);
    return { ok: true, configured: true, items: parseNews(raw).slice(0, limit) };
  } catch (e) {
    console.error("[market] company-news", String((e as Error).message));
    return { ok: false, configured: true, items: [], error: String((e as Error).message) };
  }
}

function parseEarnings(list: Record<string, unknown>[]): Earning[] {
  return list
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
    .filter((e) => e.symbol && /^\d{4}-\d{2}-\d{2}$/.test(e.date));
}

const addDay = (d: string, n: number) => new Date(Date.parse(d + "T00:00:00Z") + n * 86400000).toISOString().slice(0, 10);

// Finnhub trả tối đa ~1500 dòng / lần gọi: khoảng dài thì chia 3 ngày một lần (tối đa 4 lệnh cùng lúc, cache 1 giờ)
export async function getEarnings(from: string, to: string, symbol?: string): Promise<Result<Earning>> {
  if (!marketConfigured()) return { ok: false, configured: false, items: [] };
  try {
    const ranges: [string, string][] = [];
    if (symbol) ranges.push([from, to]);
    else for (let d = from; d <= to; d = addDay(d, 3)) ranges.push([d, addDay(d, 2) < to ? addDay(d, 2) : to]);
    const sym = symbol ? `&symbol=${encodeURIComponent(symbol)}` : "";
    const parts = await mapLimit(ranges, 4, ([a, b]) =>
      call<{ earningsCalendar?: Record<string, unknown>[] }>(`/calendar/earnings?from=${a}&to=${b}${sym}`, 3600),
    );
    const seen = new Set<string>();
    const items = parseEarnings(parts.flatMap((p) => p.earningsCalendar || []))
      .filter((e) => (seen.has(e.symbol + e.date) ? false : (seen.add(e.symbol + e.date), true)))
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
