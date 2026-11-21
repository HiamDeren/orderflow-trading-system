// GET /api/stock/summary?symbol=NVDA → tóm tắt mã cho ngăn bên phải ở Earnings (chủ sở hữu + khách đã duyệt, D48).
import { fail, requireViewerApi } from "@/lib/api";
import { marketConfigured } from "@/lib/market";
import { getStock, SYMBOL_RE } from "@/lib/stock";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const viewer = await requireViewerApi();
  if (viewer instanceof Response) return viewer;
  if (!marketConfigured()) return fail(503, "config", "Chưa có FINNHUB_API_KEY");
  const symbol = (new URL(req.url).searchParams.get("symbol") || "").toUpperCase();
  if (!SYMBOL_RE.test(symbol)) return fail(400, "bad_request", "symbol không hợp lệ");
  const s = await getStock(symbol);
  const m = s.metric;
  const pick = (...k: string[]) => k.map((x) => m[x]).find((v) => v !== undefined) ?? null;
  return Response.json(
    {
      symbol,
      name: s.profile?.name || symbol,
      industry: s.profile?.industry || "",
      logo: s.profile?.logo || "",
      cap: s.profile?.marketCap ?? null,
      quote: s.quote ? { c: s.quote.c, d: s.quote.d, dp: s.quote.dp } : null,
      pe: pick("peTTM", "peBasicExclExtraTTM"),
      margin: pick("netProfitMarginTTM"),
      eps: pick("epsTTM", "epsBasicExclExtraItemsTTM"),
      surprises: s.surprises.slice(-4),
      reco: s.reco,
      next: s.nextEarning,
    },
    { headers: { "Cache-Control": "private, max-age=120" } },
  );
}
