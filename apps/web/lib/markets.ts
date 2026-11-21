// Dữ liệu trang Markets (D46). Không lưu database.
//   Cổ phiếu / ETF: Finnhub /quote (lib/stock.ts getQuotes), cache 2–5 phút.
//   Crypto: CoinGecko Demo API (COINGECKO_API_KEY, header x-cg-demo-api-key), cache 10 phút.
import { getQuotes, type MiniQuote } from "@/lib/stock";

export const INDEX_ETF = [
  { sym: "QQQ", name: "Nasdaq 100" },
  { sym: "SPY", name: "S&P 500" },
  { sym: "DIA", name: "Dow Jones" },
  { sym: "IWM", name: "Russell 2000" },
  { sym: "GLD", name: "Vàng" },
  { sym: "TLT", name: "Trái phiếu 20 năm" },
];

// 11 sector S&P 500 qua ETF SPDR. w/h = cỡ ô heatmap (lớn hơn cho sector tỷ trọng lớn)
// biome-ignore format: bảng dữ liệu, giữ một dòng / sector
export const SECTORS: { key: string; name: string; etf: string; w: number; h: number; stocks: [string, string][] }[] = [
  { key: "tech", name: "Công nghệ", etf: "XLK", w: 2, h: 2, stocks: [["NVDA", "NVIDIA"], ["MSFT", "Microsoft"], ["AAPL", "Apple"], ["AVGO", "Broadcom"], ["ORCL", "Oracle"], ["AMD", "AMD"], ["CRM", "Salesforce"], ["ADBE", "Adobe"]] },
  { key: "fin", name: "Tài chính", etf: "XLF", w: 2, h: 1, stocks: [["JPM", "JPMorgan"], ["V", "Visa"], ["MA", "Mastercard"], ["BAC", "Bank of America"], ["WFC", "Wells Fargo"], ["GS", "Goldman Sachs"]] },
  { key: "health", name: "Y tế", etf: "XLV", w: 2, h: 1, stocks: [["LLY", "Eli Lilly"], ["UNH", "UnitedHealth"], ["JNJ", "Johnson & Johnson"], ["ABBV", "AbbVie"], ["MRK", "Merck"], ["ISRG", "Intuitive Surgical"]] },
  { key: "disc", name: "Tiêu dùng không thiết yếu", etf: "XLY", w: 2, h: 1, stocks: [["AMZN", "Amazon"], ["TSLA", "Tesla"], ["HD", "Home Depot"], ["MCD", "McDonald's"], ["BKNG", "Booking"], ["LOW", "Lowe's"]] },
  { key: "comm", name: "Truyền thông", etf: "XLC", w: 2, h: 1, stocks: [["GOOGL", "Alphabet"], ["META", "Meta"], ["NFLX", "Netflix"], ["TMUS", "T-Mobile"], ["DIS", "Disney"]] },
  { key: "ind", name: "Công nghiệp", etf: "XLI", w: 1, h: 1, stocks: [["GE", "GE Aerospace"], ["CAT", "Caterpillar"], ["RTX", "RTX"], ["UBER", "Uber"], ["HON", "Honeywell"]] },
  { key: "stap", name: "Tiêu dùng thiết yếu", etf: "XLP", w: 1, h: 1, stocks: [["WMT", "Walmart"], ["COST", "Costco"], ["PG", "Procter & Gamble"], ["KO", "Coca-Cola"], ["PEP", "PepsiCo"]] },
  { key: "energy", name: "Năng lượng", etf: "XLE", w: 1, h: 1, stocks: [["XOM", "Exxon Mobil"], ["CVX", "Chevron"], ["COP", "ConocoPhillips"], ["SLB", "SLB"]] },
  { key: "util", name: "Tiện ích", etf: "XLU", w: 1, h: 1, stocks: [["NEE", "NextEra"], ["SO", "Southern Co"], ["DUK", "Duke Energy"]] },
  { key: "re", name: "Bất động sản", etf: "XLRE", w: 1, h: 1, stocks: [["PLD", "Prologis"], ["AMT", "American Tower"], ["EQIX", "Equinix"]] },
  { key: "mat", name: "Vật liệu", etf: "XLB", w: 1, h: 1, stocks: [["LIN", "Linde"], ["SHW", "Sherwin-Williams"], ["FCX", "Freeport-McMoRan"]] },
];

// Bản đồ NQ top: cỡ ô theo nhóm vốn hoá (3 bậc), không phải tỷ trọng chính xác
// biome-ignore format: bảng dữ liệu
export const NQ_MAP: [string, number, number][] = [
  ["NVDA", 3, 2], ["MSFT", 3, 2], ["AAPL", 2, 2], ["AMZN", 2, 1], ["META", 2, 1], ["AVGO", 2, 1], ["GOOGL", 2, 1],
  ["TSLA", 1, 1], ["COST", 1, 1], ["NFLX", 1, 1], ["AMD", 1, 1], ["PLTR", 1, 1], ["CSCO", 1, 1], ["INTU", 1, 1], ["QCOM", 1, 1], ["ADBE", 1, 1],
];

export async function getOverview() {
  const syms = [...INDEX_ETF.map((x) => x.sym), ...SECTORS.map((s) => s.etf), ...NQ_MAP.map((x) => x[0])];
  const q = await getQuotes([...new Set(syms)], 180);
  const by = new Map<string, MiniQuote>(q.map((x) => [x.symbol, x]));
  return { by, count: q.length };
}

// ---------------- Crypto (CoinGecko) ----------------
const CG = process.env.COINGECKO_BASE_URL || "https://api.coingecko.com/api/v3";
export const cryptoConfigured = () => !!process.env.COINGECKO_API_KEY;

async function cg<T>(path: string, revalidate = 600): Promise<T> {
  const r = await fetch(`${CG}${path}`, {
    headers: { accept: "application/json", "x-cg-demo-api-key": process.env.COINGECKO_API_KEY || "" },
    next: { revalidate },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`CoinGecko HTTP ${r.status}`);
  return (await r.json()) as T;
}

export const CRYPTO_CATS: { id: string; label: string }[] = [
  { id: "", label: "Tất cả" },
  { id: "layer-1", label: "Layer 1" },
  { id: "artificial-intelligence", label: "AI" },
  { id: "meme-token", label: "Meme" },
  { id: "decentralized-finance-defi", label: "DeFi" },
  { id: "real-world-assets-rwa", label: "RWA" },
];

export type Coin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  cap: number | null;
  vol: number | null;
  rank: number | null;
  h1: number | null;
  h24: number | null;
  d7: number | null;
  spark: number[];
};

const num = (v: unknown) => (v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v));

export async function getCrypto(cat: string) {
  const catQ = CRYPTO_CATS.some((c) => c.id === cat && c.id) ? `&category=${cat}` : "";
  const [markets, global, cats, trend] = await Promise.allSettled([
    cg<Record<string, unknown>[]>(
      `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=30&page=1&sparkline=true&price_change_percentage=1h,24h,7d${catQ}`,
    ),
    cg<{ data?: Record<string, unknown> }>(`/global`),
    cg<Record<string, unknown>[]>(`/coins/categories`, 1800),
    cg<{ coins?: { item?: Record<string, unknown> }[] }>(`/search/trending`),
  ]);
  const coins: Coin[] =
    markets.status === "fulfilled" && Array.isArray(markets.value)
      ? markets.value.map((c) => {
          const sp = ((c.sparkline_in_7d as { price?: number[] } | undefined)?.price || []).filter((x) => Number.isFinite(x));
          const step = Math.max(1, Math.floor(sp.length / 40));
          return {
            id: String(c.id),
            symbol: String(c.symbol || "").toUpperCase(),
            name: String(c.name || ""),
            image: /^https:\/\//.test(String(c.image || "")) ? String(c.image) : "",
            price: Number(c.current_price) || 0,
            cap: num(c.market_cap),
            vol: num(c.total_volume),
            rank: num(c.market_cap_rank),
            h1: num(c.price_change_percentage_1h_in_currency),
            h24: num(c.price_change_percentage_24h_in_currency ?? c.price_change_percentage_24h),
            d7: num(c.price_change_percentage_7d_in_currency),
            spark: sp.filter((_, i) => i % step === 0),
          };
        })
      : [];
  const g = global.status === "fulfilled" ? global.value.data || {} : {};
  const capUsd = num((g.total_market_cap as Record<string, number> | undefined)?.usd);
  const volUsd = num((g.total_volume as Record<string, number> | undefined)?.usd);
  const dom = (g.market_cap_percentage as Record<string, number> | undefined) || {};
  const catChange = new Map<string, number | null>(
    cats.status === "fulfilled" && Array.isArray(cats.value) ? cats.value.map((c) => [String(c.id), num(c.market_cap_change_24h)]) : [],
  );
  const trending =
    trend.status === "fulfilled"
      ? (trend.value.coins || [])
          .map((c) => String(c.item?.symbol || "").toUpperCase())
          .filter(Boolean)
          .slice(0, 7)
      : [];
  const error = markets.status === "rejected" ? String(markets.reason?.message || markets.reason) : null;
  return {
    coins,
    global: { cap: capUsd, vol: volUsd, capCh: num(g.market_cap_change_percentage_24h_usd), btc: num(dom.btc), eth: num(dom.eth) },
    catChange,
    trending,
    error,
  };
}

export function sparkPath(v: number[], w: number, h: number) {
  if (v.length < 2) return "";
  const lo = Math.min(...v);
  const hi = Math.max(...v);
  const sp = hi - lo || 1;
  return v.map((x, i) => `${i ? "L" : "M"}${((i / (v.length - 1)) * w).toFixed(1)} ${(h - 2 - ((x - lo) / sp) * (h - 4)).toFixed(1)}`).join("");
}

export function fmtUsd(v: number | null, big = false) {
  if (v === null) return "—";
  if (big) {
    const a = Math.abs(v);
    if (a >= 1e12) return "$" + (v / 1e12).toFixed(2) + "T";
    if (a >= 1e9) return "$" + (v / 1e9).toFixed(1) + "B";
    if (a >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M";
  }
  const d = Math.abs(v) >= 1000 ? 0 : Math.abs(v) >= 1 ? 2 : Math.abs(v) >= 0.01 ? 4 : 8;
  return "$" + v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}
