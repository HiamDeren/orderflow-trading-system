// GET /api/stock/summary?symbol=NVDA → tóm tắt mã cho ngăn bên phải ở Earnings (chỉ chủ sở hữu).
import { getOwner } from "@/lib/auth";
import { marketConfigured } from "@/lib/market";
import { SYMBOL_RE, getStock } from "@/lib/stock";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await getOwner())) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!marketConfigured()) return Response.json({ error: "Chưa có FINNHUB_API_KEY" }, { status: 503 });
  const symbol = (new URL(req.url).searchParams.get("symbol") || "").toUpperCase();
  if (!SYMBOL_RE.test(symbol)) return Response.json({ error: "symbol không hợp lệ" }, { status: 400 });
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
