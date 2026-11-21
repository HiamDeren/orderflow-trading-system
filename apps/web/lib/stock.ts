// Thông tin cổ phiếu Mỹ cho trang /stock/[symbol] (D44). Nguồn Finnhub gói free, chỉ gọi phía server, không lưu database.
//   /stock/profile2   tên, sàn, ngành, logo, vốn hoá (triệu USD), số cổ phiếu (triệu), IPO, website
//   /quote            giá hiện tại c, thay đổi d / dp, cao h, thấp l, mở o, đóng trước pc
//   /stock/metric     chỉ số cơ bản (P/E, biên lợi nhuận, ROE, 52 tuần...) + chuỗi theo năm / quý
//   /stock/earnings   EPS thực tế / dự báo 4 quý gần nhất
//   /stock/recommendation  khuyến nghị analyst theo tháng
//   /stock/peers      mã cùng ngành
//   /search           tìm mã
import { call, type Earning, getEarnings, mapLimit, marketConfigured } from "@/lib/market";
import { num } from "@/lib/num";

export const SYMBOL_RE = /^[A-Z][A-Z0-9.\-]{0,9}$/;

export type Profile = {
  name: string;
  ticker: string;
  exchange: string;
  industry: string;
  logo: string;
  country: string;
  currency: string;
  marketCap: number | null; // USD
  shares: number | null; // số cổ phiếu
  ipo: string;
  web: string;
};
export type Quote = { c: number; d: number | null; dp: number | null; h: number | null; l: number | null; o: number | null; pc: number | null; t: number };
export type Point = { period: string; v: number };
export type Surprise = { period: string; quarter: number; year: number; actual: number | null; estimate: number | null; surprisePct: number | null };
export type Reco = { period: string; strongBuy: number; buy: number; hold: number; sell: number; strongSell: number };
export type Stock = {
  symbol: string;
  profile: Profile | null;
  quote: Quote | null;
  metric: Record<string, number>;
  annualEps: Point[];
  quarterlyEps: Point[];
  annualNetMargin: Point[];
  surprises: Surprise[];
  reco: Reco | null;
  peers: string[];
  nextEarning: Earning | null;
  errors: string[];
};

const n = num;

function series(v: unknown, take: number): Point[] {
  return (Array.isArray(v) ? (v as Record<string, unknown>[]) : [])
    .map((p) => ({ period: String(p.period || ""), v: n(p.v) }))
    .filter((p): p is Point => !!p.period && p.v !== null)
    .sort((a, b) => (a.period < b.period ? -1 : 1))
    .slice(-take);
}

export async function getStock(symbol: string): Promise<Stock> {
  const errors: string[] = [];
  const grab = async <T>(label: string, p: Promise<T>): Promise<T | null> => {
    try {
      return await p;
    } catch (e) {
      errors.push(`${label}: ${(e as Error).message}`);
      return null;
    }
  };
  const s = encodeURIComponent(symbol);
  const today = new Date().toISOString().slice(0, 10);
  const later = new Date(Date.now() + 120 * 86400000).toISOString().slice(0, 10);
  const [pf, q, m, er, rc, pe, next] = await Promise.all([
    grab("profile", call<Record<string, unknown>>(`/stock/profile2?symbol=${s}`, 86400)),
    grab("quote", call<Record<string, unknown>>(`/quote?symbol=${s}`, 60)),
    grab(
      "metric",
      call<{ metric?: Record<string, unknown>; series?: { annual?: Record<string, unknown>; quarterly?: Record<string, unknown> } }>(
        `/stock/metric?symbol=${s}&metric=all`,
        21600,
      ),
    ),
    grab("earnings", call<unknown>(`/stock/earnings?symbol=${s}`, 21600)),
    grab("recommendation", call<unknown>(`/stock/recommendation?symbol=${s}`, 21600)),
    grab("peers", call<unknown>(`/stock/peers?symbol=${s}`, 86400)),
    getEarnings(today, later, symbol),
  ]);

  const profile: Profile | null =
    pf && pf.ticker
      ? {
          name: String(pf.name || symbol),
          ticker: String(pf.ticker),
          exchange: String(pf.exchange || ""),
          industry: String(pf.finnhubIndustry || ""),
          logo: String(pf.logo || ""),
          country: String(pf.country || ""),
          currency: String(pf.currency || "USD"),
          marketCap: n(pf.marketCapitalization) !== null ? n(pf.marketCapitalization)! * 1e6 : null,
          shares: n(pf.shareOutstanding) !== null ? n(pf.shareOutstanding)! * 1e6 : null,
          ipo: String(pf.ipo || ""),
          web: /^https?:\/\//.test(String(pf.weburl || "")) ? String(pf.weburl) : "",
        }
      : null;

  const quote: Quote | null =
    q && n(q.c) ? { c: n(q.c)!, d: n(q.d), dp: n(q.dp), h: n(q.h), l: n(q.l), o: n(q.o), pc: n(q.pc), t: (n(q.t) || 0) * 1000 } : null;

  const metric: Record<string, number> = {};
  for (const [k, v] of Object.entries(m?.metric || {})) if (n(v) !== null) metric[k] = n(v)!;

  const surprises: Surprise[] = (Array.isArray(er) ? (er as Record<string, unknown>[]) : [])
    .map((x) => ({
      period: String(x.period || ""),
      quarter: n(x.quarter) || 0,
      year: n(x.year) || 0,
      actual: n(x.actual),
      estimate: n(x.estimate),
      surprisePct: n(x.surprisePercent),
    }))
    .filter((x) => x.period)
    .sort((a, b) => (a.period < b.period ? -1 : 1));

  const recos = (Array.isArray(rc) ? (rc as Record<string, unknown>[]) : []).sort((a, b) => (String(a.period) < String(b.period) ? 1 : -1));
  const r0 = recos[0];
  const reco: Reco | null = r0
    ? {
        period: String(r0.period),
        strongBuy: n(r0.strongBuy) || 0,
        buy: n(r0.buy) || 0,
        hold: n(r0.hold) || 0,
        sell: n(r0.sell) || 0,
        strongSell: n(r0.strongSell) || 0,
      }
    : null;

  const peers = (Array.isArray(pe) ? (pe as unknown[]) : [])
    .map(String)
    .filter((p) => p !== symbol && SYMBOL_RE.test(p))
    .slice(0, 12);
  const nextEarning = next.ok ? next.items.find((e) => e.symbol === symbol && e.date >= today) || null : null;

  return {
    symbol,
    profile,
    quote,
    metric,
    annualEps: series(m?.series?.annual?.eps, 10),
    quarterlyEps: series(m?.series?.quarterly?.eps, 8),
    annualNetMargin: series(m?.series?.annual?.netMargin, 10),
    surprises,
    reco,
    peers,
    nextEarning,
    errors,
  };
}

export type SearchHit = { symbol: string; description: string; type: string };

export async function searchSymbols(q: string): Promise<SearchHit[]> {
  if (!marketConfigured() || !q.trim()) return [];
  const raw = await call<{ result?: Record<string, unknown>[] }>(`/search?q=${encodeURIComponent(q.trim().slice(0, 40))}&exchange=US`, 3600);
  return (raw.result || [])
    .map((r) => ({ symbol: String(r.symbol || "").toUpperCase(), description: String(r.description || ""), type: String(r.type || "") }))
    .filter((r) => SYMBOL_RE.test(r.symbol))
    .slice(0, 20);
}

// Mã TradingView cho iframe biểu đồ
export function tvSymbol(symbol: string, exchange: string) {
  const ex = exchange.toUpperCase();
  const pre = ex.includes("NASDAQ")
    ? "NASDAQ"
    : ex.includes("NEW YORK") || ex.includes("NYSE")
      ? "NYSE"
      : ex.includes("AMEX") || ex.includes("ARCA")
        ? "AMEX"
        : "";
  return (pre ? pre + ":" : "") + symbol.replace(".", "_");
}

export function fmtBig(v: number | null | undefined) {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  const a = Math.abs(v);
  if (a >= 1e12) return (v / 1e12).toFixed(2) + "T";
  if (a >= 1e9) return (v / 1e9).toFixed(2) + "B";
  if (a >= 1e6) return (v / 1e6).toFixed(1) + "M";
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export type MiniQuote = { symbol: string; c: number; dp: number | null };

const QUOTE_CONCURRENCY = 8;

// Giá nhiều mã một lúc (watchlist, Markets). Mỗi mã 1 lệnh /quote (tối đa 8 lệnh cùng lúc), cache 2 phút; mã lỗi thì bỏ qua.
export async function getQuotes(symbols: string[], revalidate = 120): Promise<MiniQuote[]> {
  if (!marketConfigured()) return [];
  const errors: string[] = [];
  const out = await mapLimit(symbols, QUOTE_CONCURRENCY, async (symbol) => {
    try {
      const q = await call<Record<string, unknown>>(`/quote?symbol=${encodeURIComponent(symbol)}`, revalidate, 0);
      const c = n(q.c);
      return c ? { symbol, c, dp: n(q.dp) } : null;
    } catch (e) {
      errors.push(`${symbol}: ${(e as Error).message}`);
      return null;
    }
  });
  if (errors.length) console.warn(`[stock] getQuotes thiếu ${errors.length}/${symbols.length} mã`, errors.slice(0, 3).join(" · "));
  return out.filter((x): x is MiniQuote => !!x);
}
