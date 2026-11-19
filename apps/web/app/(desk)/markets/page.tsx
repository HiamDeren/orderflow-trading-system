import type { Metadata } from "next";
import Link from "next/link";
import { marketConfigured } from "@/lib/market";
import { CRYPTO_CATS, INDEX_ETF, NQ_MAP, SECTORS, cryptoConfigured, fmtUsd, getCrypto, getOverview, sparkPath } from "@/lib/markets";
import { getT } from "@/lib/prefs-server";
import { getQuotes } from "@/lib/stock";
import { NotConfigured } from "../_components/States";

export const metadata: Metadata = { title: "Markets" };
export const dynamic = "force-dynamic";

const TABS = [
  { id: "over", label: "Tổng quan" },
  { id: "stocks", label: "Cổ phiếu" },
  { id: "crypto", label: "Crypto" },
] as const;

const pct = (v: number | null) => (v === null ? "—" : (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(2) + "%");
const tone = (v: number | null) => (v === null ? "dim" : v >= 0 ? "long" : "short");
// Màu ô heatmap: 2 cực xanh / cam, đậm dần theo |%|, gần 0 là xám
function heat(v: number | null) {
  if (v === null || Math.abs(v) < 0.1) return "h0";
  const a = Math.abs(v);
  const k = a >= 2 ? 3 : a >= 1 ? 2 : 1;
  return (v > 0 ? "hp" : "hn") + k;
}

export default async function MarketsPage({ searchParams }: { searchParams: Promise<{ tab?: string; sector?: string; cat?: string }> }) {
  const sp = await searchParams;
  const tab = TABS.some((x) => x.id === sp.tab) ? sp.tab! : "over";
  const { t } = await getT();
  const href = (o: Record<string, string>) => "/markets?" + new URLSearchParams({ tab, ...o }).toString();

  return (
    <>
      <header className="page-head">
        <div>
          <span className="lbl">{t("Thị trường")}</span>
          <h1 className="h1">Markets</h1>
        </div>
        <nav className="seg" aria-label={t("Loại tài sản")}>
          {TABS.map((x) => (
            <Link key={x.id} href={`/markets?tab=${x.id}`} className={"seg-link" + (x.id === tab ? " on" : "")} aria-current={x.id === tab ? "page" : undefined}>
              {t(x.label)}
            </Link>
          ))}
        </nav>
      </header>
      {tab === "crypto" ? <Crypto cat={sp.cat || ""} t={t} href={href} /> : !marketConfigured() ? <NotConfigured what="Markets" /> : tab === "stocks" ? <Stocks sector={sp.sector || "tech"} t={t} href={href} /> : <Overview t={t} />}
    </>
  );
}

type T = (s: string, v?: Record<string, string | number>) => string;

async function Overview({ t }: { t: T }) {
  const { by } = await getOverview();
  const nq = NQ_MAP.map(([s, w, h]) => ({ s, w, h, q: by.get(s) })).filter((x) => x.q);
  const movers = [...nq].sort((a, b) => (b.q!.dp ?? 0) - (a.q!.dp ?? 0));
  return (
    <>
      <div className="mk-strip">
        {INDEX_ETF.map((x) => {
          const q = by.get(x.sym);
          return (
            <Link key={x.sym} href={`/stock/${x.sym}`} className="mk-tile">
              <span className="row small dim"><span>{t(x.name)}</span><span className="mono">{x.sym}</span></span>
              <span className="mono mk-px">{q ? q.c.toFixed(2) : "—"}</span>
              <span className={"mono small " + tone(q?.dp ?? null)}>{pct(q?.dp ?? null)}</span>
            </Link>
          );
        })}
      </div>

      <div className="mk-two">
        <section className="card" aria-label={t("Sector hôm nay")}>
          <div className="row"><span className="lbl">{t("11 sector S&P 500 · qua ETF · % hôm nay")}</span></div>
          <div className="heat heat-6">
            {SECTORS.map((s) => {
              const q = by.get(s.etf);
              return (
                <Link key={s.key} href={`/markets?tab=stocks&sector=${s.key}`} className={"heat-c " + heat(q?.dp ?? null)} style={{ gridColumn: `span ${s.w}`, gridRow: `span ${s.h}` }}>
                  <span className="heat-n">{t(s.name)}</span>
                  <span className="row"><span className="mono small">{s.etf}</span><b className="mono">{pct(q?.dp ?? null)}</b></span>
                </Link>
              );
            })}
          </div>
        </section>
        <section className="card" aria-label={t("Tăng / giảm mạnh · NQ top")} style={{ gap: 4 }}>
          <span className="lbl" style={{ paddingBottom: 6 }}>{t("NQ top · tăng mạnh")}</span>
          {movers.slice(0, 4).map((m) => <Mover key={m.s} s={m.s} c={m.q!.c} dp={m.q!.dp} />)}
          <span className="lbl" style={{ padding: "12px 0 6px" }}>{t("NQ top · giảm mạnh")}</span>
          {movers.slice(-4).reverse().map((m) => <Mover key={m.s} s={m.s} c={m.q!.c} dp={m.q!.dp} />)}
        </section>
      </div>

      <section className="card" aria-label={t("Bản đồ NQ top")}>
        <div className="row"><span className="lbl">{t("NQ top · ô to theo nhóm vốn hoá")}</span><Link className="small" href="/earnings" style={{ fontWeight: 600 }}>Earnings</Link></div>
        <div className="heat heat-8">
          {nq.map((x) => (
            <Link key={x.s} href={`/stock/${x.s}`} className={"heat-c center " + heat(x.q!.dp)} style={{ gridColumn: `span ${x.w}`, gridRow: `span ${x.h}` }}>
              <b className="mono" style={{ fontSize: x.w * x.h >= 4 ? 18 : 13 }}>{x.s}</b>
              <span className="mono small">{pct(x.q!.dp)}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function Mover({ s, c, dp }: { s: string; c: number; dp: number | null }) {
  return (
    <Link href={`/stock/${s}`} className="watch-row" style={{ gridTemplateColumns: "64px minmax(0,1fr) 72px" }}>
      <span className="mono" style={{ fontWeight: 600 }}>{s}</span>
      <span className="mono">{c.toFixed(2)}</span>
      <span className={"mono small " + tone(dp)}>{pct(dp)}</span>
    </Link>
  );
}

async function Stocks({ sector, t, href }: { sector: string; t: T; href: (o: Record<string, string>) => string }) {
  const sec = SECTORS.find((s) => s.key === sector) || SECTORS[0];
  const [etfs, rows] = await Promise.all([getQuotes(SECTORS.map((s) => s.etf), 180), getQuotes(sec.stocks.map((x) => x[0]), 180)]);
  const etf = new Map(etfs.map((q) => [q.symbol, q]));
  const by = new Map(rows.map((q) => [q.symbol, q]));
  return (
    <section className="card" aria-label={t("Cổ phiếu theo sector")} style={{ padding: 0, gap: 0 }}>
      <div className="chips mk-chips">
        {SECTORS.map((s) => {
          const q = etf.get(s.etf);
          const on = s.key === sec.key;
          return (
            <Link key={s.key} href={href({ sector: s.key })} className={"chip" + (on ? " on" : "")} aria-current={on ? "true" : undefined}>
              {t(s.name)} <span className={"mono " + tone(q?.dp ?? null)}>{pct(q?.dp ?? null)}</span>
            </Link>
          );
        })}
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>{t("Mã")}</th><th>{t("Công ty")}</th><th className="r">{t("Giá")}</th><th className="r">{t("Hôm nay")}</th></tr>
          </thead>
          <tbody>
            {sec.stocks.map(([s, name]) => {
              const q = by.get(s);
              return (
                <tr key={s}>
                  <td><Link className="mono" href={`/stock/${s}`} style={{ fontWeight: 700, color: "var(--text)" }}>{s}</Link></td>
                  <td className="muted">{name}</td>
                  <td className="r mono">{q ? q.c.toFixed(2) : "—"}</td>
                  <td className={"r mono " + tone(q?.dp ?? null)}>{pct(q?.dp ?? null)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

async function Crypto({ cat, t, href }: { cat: string; t: T; href: (o: Record<string, string>) => string }) {
  if (!cryptoConfigured()) return <NotConfigured what="Crypto (COINGECKO_API_KEY)" />;
  const d = await getCrypto(cat);
  const g = d.global;
  const stats: [string, string, number | null][] = [
    [t("Vốn hoá crypto"), fmtUsd(g.cap, true), g.capCh],
    [t("Volume 24h"), fmtUsd(g.vol, true), null],
    ["BTC dominance", g.btc === null ? "—" : g.btc.toFixed(1) + "%", null],
    ["ETH dominance", g.eth === null ? "—" : g.eth.toFixed(1) + "%", null],
  ];
  return (
    <>
      <div className="mk-strip">
        {stats.map(([k, v, ch]) => (
          <div key={k} className="mk-tile">
            <span className="small dim">{k}</span>
            <span className="mono mk-px">{v}</span>
            {ch !== null ? <span className={"mono small " + tone(ch)}>{pct(ch)} 24h</span> : <span className="small">&nbsp;</span>}
          </div>
        ))}
      </div>
      {d.trending.length > 0 && (
        <div className="hstack small" style={{ gap: 8 }}>
          <span className="lbl">{t("Đang được tìm nhiều")}</span>
          {d.trending.map((s) => <span key={s} className="chip mono">{s}</span>)}
        </div>
      )}
      <section className="card" aria-label={t("Bảng coin")} style={{ padding: 0, gap: 0 }}>
        <div className="chips mk-chips">
          {CRYPTO_CATS.map((c) => {
            const on = c.id === cat || (!c.id && !CRYPTO_CATS.some((x) => x.id && x.id === cat));
            const ch = c.id ? d.catChange.get(c.id) ?? null : null;
            return (
              <Link key={c.id || "all"} href={href({ cat: c.id })} className={"chip" + (on ? " on" : "")} aria-current={on ? "true" : undefined}>
                {t(c.label)} {c.id && <span className={"mono " + tone(ch)}>{pct(ch)}</span>}
              </Link>
            );
          })}
        </div>
        {d.error ? (
          <div className="notice" style={{ margin: 16 }}>{t("Không tải được dữ liệu crypto")}: {d.error}</div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th>#</th><th>Coin</th><th className="r">{t("Giá")}</th><th className="r">1h</th><th className="r">24h</th><th className="r">{t("7 ngày")}</th><th className="r">{t("Vốn hoá")}</th><th className="r">Volume 24h</th><th className="r">{t("7 ngày qua")}</th></tr>
              </thead>
              <tbody>
                {d.coins.map((c) => (
                  <tr key={c.id}>
                    <td className="mono dim">{c.rank ?? "—"}</td>
                    <td>
                      <span className="hstack" style={{ gap: 8, flexWrap: "nowrap" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {c.image && <img src={c.image} alt="" width={20} height={20} style={{ borderRadius: "50%" }} referrerPolicy="no-referrer" />}
                        <b style={{ fontWeight: 600 }}>{c.name}</b> <span className="mono small dim">{c.symbol}</span>
                      </span>
                    </td>
                    <td className="r mono">{fmtUsd(c.price)}</td>
                    <td className={"r mono " + tone(c.h1)}>{pct(c.h1)}</td>
                    <td className={"r mono " + tone(c.h24)}>{pct(c.h24)}</td>
                    <td className={"r mono " + tone(c.d7)}>{pct(c.d7)}</td>
                    <td className="r mono">{fmtUsd(c.cap, true)}</td>
                    <td className="r mono">{fmtUsd(c.vol, true)}</td>
                    <td className="r">
                      <svg width="100" height="28" viewBox="0 0 100 28" aria-hidden="true"><path d={sparkPath(c.spark, 100, 28)} fill="none" className={"spark " + tone(c.d7)} /></svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
