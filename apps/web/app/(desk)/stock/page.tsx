import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NQ_WATCH, getEarnings } from "@/lib/market";
import { getT } from "@/lib/prefs-server";
import { SYMBOL_RE, searchSymbols, type SearchHit } from "@/lib/stock";
import { addDays, etNow, mondayOf, viDayMonth } from "@/lib/time";
import Icon from "../_components/Icon";
import { NotConfigured } from "../_components/States";

export const metadata: Metadata = { title: "Stocks" };
export const dynamic = "force-dynamic";

export default async function StocksPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { t } = await getT();
  const q = ((await searchParams).q || "").trim();
  if (!process.env.FINNHUB_API_KEY) return <NotConfigured what="Stocks" />;
  // Gõ đúng mã thì vào thẳng trang mã
  if (q && SYMBOL_RE.test(q.toUpperCase()) && q === q.toUpperCase()) redirect(`/stock/${q}`);
  let hits: SearchHit[] = [];
  let err = "";
  if (q) {
    try {
      hits = await searchSymbols(q);
    } catch (e) {
      err = String((e as Error).message);
    }
  }
  const today = etNow().date;
  const mon = mondayOf(today);
  const earn = await getEarnings(mon, addDays(mon, 11));
  const upcoming = earn.items.filter((e) => NQ_WATCH.includes(e.symbol) && e.date >= today).slice(0, 12);

  return (
    <>
      <header className="page-head">
        <div>
          <span className="lbl">{t("Thị trường")}</span>
          <h1 className="h1">Stocks</h1>
        </div>
        <form className="search" action="/stock" role="search">
          <Icon name="search" size={16} />
          <input name="q" defaultValue={q} placeholder={t("Mã hoặc tên công ty, ví dụ NVDA")} aria-label={t("Tìm cổ phiếu")} autoComplete="off" />
        </form>
      </header>

      {q && (
        <section className="card tight" aria-label={t("Kết quả tìm")}>
          <span className="lbl">{t("Kết quả cho “{q}”", { q })} · {hits.length}</span>
          {err && <div className="notice small">{err}</div>}
          {hits.length ? (
            <div className="hits">
              {hits.map((h) => (
                <Link key={h.symbol} href={`/stock/${encodeURIComponent(h.symbol)}`} className="hit">
                  <b className="mono">{h.symbol}</b>
                  <span className="dim">{h.description}</span>
                  <span className="small faint">{h.type}</span>
                </Link>
              ))}
            </div>
          ) : (
            !err && <p className="small dim">{t("Không có mã nào khớp.")}</p>
          )}
        </section>
      )}

      <div className="stock-home">
        <section className="card" aria-label={t("Earnings sắp tới · NQ top")}>
          <span className="lbl">{t("Earnings sắp tới · NQ top")}</span>
          {upcoming.length ? (
            <div className="hits">
              {upcoming.map((e) => (
                <Link key={e.symbol + e.date} href={`/stock/${e.symbol}`} className="hit">
                  <b className="mono">{e.symbol}</b>
                  <span className="dim">{viDayMonth(e.date)}</span>
                  <span className="small faint">{e.hour === "amc" ? t("Sau đóng cửa") : e.hour === "bmo" ? t("Trước mở cửa") : e.hour === "dmh" ? t("Trong phiên") : ""}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="small dim">{t("Không có mã NQ top báo cáo trong 2 tuần tới.")}</p>
          )}
        </section>
        <section className="card" aria-label={t("NQ top")}>
          <span className="lbl">{t("Mã nặng trong Nasdaq-100")}</span>
          <div className="chips">
            {NQ_WATCH.map((s) => <Link key={s} className="chip mono" href={`/stock/${s}`}>{s}</Link>)}
          </div>
        </section>
      </div>
    </>
  );
}
