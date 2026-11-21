import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NQ_WATCH, getCompanyNews } from "@/lib/market";
import { getT, getUi } from "@/lib/prefs-server";
import { SYMBOL_RE, fmtBig, getStock, tvSymbol } from "@/lib/stock";
import { fmtTime, viDayMonth } from "@/lib/time";
import Icon from "../../_components/Icon";
import { NotConfigured } from "../../_components/States";
import { BarChart, RecoBar } from "./StockCharts";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }): Promise<Metadata> {
  const { symbol } = await params;
  return { title: decodeURIComponent(symbol).toUpperCase() };
}

const HOUR: Record<string, string> = { bmo: "Trước mở cửa", amc: "Sau đóng cửa", dmh: "Trong phiên", "": "Chưa rõ giờ" };

const TABS = [
  ["over", "Tổng quan"],
  ["fin", "Chỉ số"],
  ["earn", "Earnings"],
  ["news", "Tin"],
] as const;

export default async function StockPage({ params, searchParams }: { params: Promise<{ symbol: string }>; searchParams: Promise<{ tab?: string }> }) {
  const symbol = decodeURIComponent((await params).symbol).toUpperCase();
  const tabQ = (await searchParams).tab;
  const tab = TABS.some(([k]) => k === tabQ) ? tabQ! : "over";
  if (!SYMBOL_RE.test(symbol)) notFound();
  const { t } = await getT();
  const ui = await getUi();
  if (!process.env.FINNHUB_API_KEY) return <NotConfigured what="Stocks" />;

  const [s, news] = await Promise.all([getStock(symbol), getCompanyNews(symbol, 10, 8)]);
  const p = s.profile;
  const q = s.quote;
  const m = s.metric;
  const pick = (...keys: string[]) => keys.map((k) => m[k]).find((v) => v !== undefined) ?? null;
  const num = (v: number | null, d = 2, suf = "") =>
    v === null ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: 0 }) + suf;
  const pct = (v: number | null) => (v === null ? "—" : (v > 0 ? "+" : "") + v.toFixed(2) + "%");
  const tone = (v: number | null) => (v === null ? "" : v > 0 ? "long" : v < 0 ? "short" : "");

  if (!p && !q) {
    return (
      <>
        <header className="page-head">
          <div>
            <span className="lbl">Stocks</span>
            <h1 className="h1">{symbol}</h1>
          </div>
          <Link className="btn" href="/stock">
            ‹ {t("Tìm mã khác")}
          </Link>
        </header>
        <div className="notice">
          {t("Không tìm thấy dữ liệu cho mã này.")}
          {s.errors.length ? ` (${s.errors[0]})` : ""}
        </div>
      </>
    );
  }

  const groups: { title: string; rows: [string, string, string?][] }[] = [
    {
      title: "Tổng quan",
      rows: [
        ["Vốn hoá", fmtBig(p?.marketCap ?? (m.marketCapitalization ? m.marketCapitalization * 1e6 : null))],
        ["Cổ phiếu lưu hành", fmtBig(p?.shares)],
        ["Cao / thấp 52 tuần", `${num(pick("52WeekHigh"))} / ${num(pick("52WeekLow"))}`],
        ["Beta", num(pick("beta"))],
        ["KL TB 10 ngày", num(pick("10DayAverageTradingVolume"), 2, "M")],
        ["Cổ tức (lợi suất)", num(pick("currentDividendYieldTTM", "dividendYieldIndicatedAnnual"), 2, "%")],
      ],
    },
    {
      title: "Định giá",
      rows: [
        ["P/E (TTM)", num(pick("peTTM", "peBasicExclExtraTTM", "peExclExtraTTM"))],
        ["P/E (năm)", num(pick("peNormalizedAnnual", "peAnnual"))],
        ["P/S (TTM)", num(pick("psTTM", "psAnnual"))],
        ["P/B", num(pick("pbQuarterly", "pbAnnual"))],
        ["P/FCF (TTM)", num(pick("pfcfShareTTM", "pfcfShareAnnual"))],
        ["EV / EBITDA", num(pick("evEbitdaTTM", "currentEv/freeCashFlowTTM"))],
      ],
    },
    {
      title: "Lợi nhuận & tăng trưởng",
      rows: [
        ["EPS (TTM)", num(pick("epsTTM", "epsBasicExclExtraItemsTTM", "epsExclExtraItemsTTM"))],
        ["Tăng EPS (YoY)", pct(pick("epsGrowthTTMYoy")), tone(pick("epsGrowthTTMYoy"))],
        ["Tăng doanh thu (YoY)", pct(pick("revenueGrowthTTMYoy")), tone(pick("revenueGrowthTTMYoy"))],
        ["Biên LN gộp", num(pick("grossMarginTTM"), 2, "%")],
        ["Biên LN hoạt động", num(pick("operatingMarginTTM"), 2, "%")],
        ["Biên LN ròng", num(pick("netProfitMarginTTM"), 2, "%")],
        ["ROE (TTM)", num(pick("roeTTM"), 2, "%")],
      ],
    },
    {
      title: "Sức khoẻ tài chính",
      rows: [
        ["Thanh toán hiện hành", num(pick("currentRatioQuarterly", "currentRatioAnnual"))],
        ["Thanh toán nhanh", num(pick("quickRatioQuarterly", "quickRatioAnnual"))],
        ["Nợ / Vốn chủ", num(pick("totalDebt/totalEquityQuarterly", "totalDebt/totalEquityAnnual"))],
        ["ROA (TTM)", num(pick("roaTTM"), 2, "%")],
      ],
    },
  ];

  const tv = tvSymbol(symbol, p?.exchange || "");
  const tvSrc = `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(tv)}&interval=D&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=12161b&theme=dark&style=1&timezone=${encodeURIComponent(ui.tz)}&withdateranges=1&locale=${ui.lang === "en" ? "en" : "vi_VN"}`;
  const ne = s.nextEarning;
  const isNq = NQ_WATCH.includes(symbol);

  return (
    <>
      <header className="page-head stock-head">
        <div className="hstack" style={{ gap: 14, alignItems: "center" }}>
          {p?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.logo} alt="" width={48} height={48} className="stock-logo" referrerPolicy="no-referrer" />
          ) : (
            <span className="stock-logo ph mono">{symbol.slice(0, 2)}</span>
          )}
          <div className="stack" style={{ gap: 2 }}>
            <span className="lbl">
              <Link href="/stock">Stocks</Link> · {p?.exchange?.split(" ")[0] || "US"}
              {p?.industry ? ` · ${p.industry}` : ""}
              {isNq ? " · NQ top" : ""}
            </span>
            <h1 className="h1">
              {p?.name || symbol}{" "}
              <span className="mono dim" style={{ fontSize: 18 }}>
                {symbol}
              </span>
            </h1>
          </div>
        </div>
        {q && (
          <div className="stock-price">
            <span className="mono">
              {num(q.c)}
              <small> {p?.currency || "USD"}</small>
            </span>
            <span className={"mono " + tone(q.d)}>
              {q.d !== null && q.d > 0 ? "+" : ""}
              {num(q.d)} ({pct(q.dp)})
            </span>
            {q.t > 0 && <span className="small dim mono">{fmtTime(q.t, ui.tz, true)}</span>}
          </div>
        )}
      </header>

      {ne && (
        <div className="notice info stock-next">
          <Icon name="earnings" size={16} />
          <span>
            {t("Earnings tiếp theo")}: <b>{viDayMonth(ne.date)}</b> · {t(HOUR[ne.hour])}
            {ne.epsEstimate !== null ? ` · EPS ${t("dự báo")} ${ne.epsEstimate}` : ""}
            {ne.revenueEstimate !== null ? ` · Rev ${t("dự báo")} ${fmtBig(ne.revenueEstimate)}` : ""}
          </span>
          <Link className="btn sm" href={`/earnings?day=${ne.date}`}>
            {t("Xem lịch")}
          </Link>
        </div>
      )}

      <nav className="tabs-line" aria-label={t("Mục của mã")}>
        {TABS.map(([k, l]) => (
          <Link
            key={k}
            href={`/stock/${symbol}${k === "over" ? "" : `?tab=${k}`}`}
            className={k === tab ? "on" : ""}
            aria-current={k === tab ? "page" : undefined}
            scroll={false}
          >
            {t(l)}
          </Link>
        ))}
      </nav>

      {tab === "over" && (
        <div className="stock-top">
          <section className="card stock-chart" aria-label={t("Biểu đồ giá")}>
            <iframe title={`${symbol} chart`} src={tvSrc} loading="lazy" referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups" />
          </section>
          <section className="card" aria-label={t("Hôm nay")}>
            <span className="lbl">{t("Hôm nay")}</span>
            <dl className="kv">
              <div className="kv-row">
                <dt>{t("Mở cửa")}</dt>
                <dd className="mono">{num(q?.o ?? null)}</dd>
              </div>
              <div className="kv-row">
                <dt>{t("Cao / thấp")}</dt>
                <dd className="mono">
                  {num(q?.h ?? null)} / {num(q?.l ?? null)}
                </dd>
              </div>
              <div className="kv-row">
                <dt>{t("Đóng cửa trước")}</dt>
                <dd className="mono">{num(q?.pc ?? null)}</dd>
              </div>
            </dl>
            <span className="lbl" style={{ marginTop: 6 }}>
              {t("Khuyến nghị analyst")}
              {s.reco ? ` · ${s.reco.period.slice(0, 7)}` : ""}
            </span>
            {s.reco ? <RecoBar reco={s.reco} /> : <p className="small dim">{t("Chưa có dữ liệu.")}</p>}
            {s.peers.length > 0 && (
              <>
                <span className="lbl" style={{ marginTop: 6 }}>
                  {t("Cùng ngành")}
                </span>
                <div className="chips">
                  {s.peers.map((x) => (
                    <Link key={x} className="chip mono" href={`/stock/${x}`}>
                      {x}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {tab === "fin" && (
        <div className="stock-stats">
          {groups.map((g) => (
            <section className="card tight" key={g.title} aria-label={t(g.title)}>
              <span className="lbl">{t(g.title)}</span>
              <dl className="kv">
                {g.rows.map(([k, v, c]) => (
                  <div key={k} className="kv-row">
                    <dt>{t(k)}</dt>
                    <dd className={"mono " + (c || "")}>{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      )}

      {tab === "earn" && (
        <div className="stock-charts">
          <section className="card" aria-label={t("EPS 4 quý gần nhất")}>
            <span className="lbl">{t("EPS 4 quý gần nhất · thực tế vs dự báo")}</span>
            <BarChart
              title={t("EPS 4 quý gần nhất")}
              data={s.surprises
                .filter((x) => x.actual !== null)
                .map((x) => ({
                  label: `Q${x.quarter} ${String(x.year).slice(2)}`,
                  v: x.actual!,
                  est: x.estimate,
                  note: x.surprisePct !== null ? `${t("Bất ngờ")} ${pct(x.surprisePct)}` : undefined,
                }))}
            />
          </section>
          <section className="card" aria-label={t("EPS theo năm")}>
            <span className="lbl">{t("EPS theo năm")}</span>
            <BarChart title={t("EPS theo năm")} data={s.annualEps.map((x) => ({ label: x.period.slice(0, 4), v: x.v }))} />
          </section>
          <section className="card" aria-label={t("Biên lợi nhuận ròng theo năm")}>
            <span className="lbl">{t("Biên lợi nhuận ròng theo năm")}</span>
            <BarChart
              title={t("Biên lợi nhuận ròng theo năm")}
              unit="%"
              data={s.annualNetMargin.map((x) => ({ label: x.period.slice(0, 4), v: x.v * (Math.abs(x.v) <= 1.5 ? 100 : 1) }))}
            />
          </section>
        </div>
      )}

      {(tab === "over" || tab === "news") && (
        <div className="stock-bottom">
          <section className="card" aria-label={t("Hồ sơ công ty")}>
            <span className="lbl">{t("Hồ sơ công ty")}</span>
            <dl className="kv">
              <div className="kv-row">
                <dt>{t("Ngành")}</dt>
                <dd>{p?.industry || "—"}</dd>
              </div>
              <div className="kv-row">
                <dt>{t("Sàn")}</dt>
                <dd>{p?.exchange || "—"}</dd>
              </div>
              <div className="kv-row">
                <dt>{t("Quốc gia")}</dt>
                <dd>{p?.country || "—"}</dd>
              </div>
              <div className="kv-row">
                <dt>IPO</dt>
                <dd className="mono">{p?.ipo || "—"}</dd>
              </div>
              {p?.web && (
                <div className="kv-row">
                  <dt>Website</dt>
                  <dd>
                    <a href={p.web} target="_blank" rel="noreferrer noopener">
                      {p.web.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </section>
          <section className="card tight" aria-label={t("Tin về {s}", { s: symbol })}>
            <div className="row">
              <span className="lbl">{t("Tin về {s}", { s: symbol })}</span>
              {news.items.length > 0 && (
                <Link className="small" href={`/news?sym=${symbol}`}>
                  {t("Xem tất cả")} ›
                </Link>
              )}
            </div>
            {news.items.length ? (
              news.items.map((n) => (
                <Link key={n.id} className="news compact" href={`/news?sym=${symbol}&id=${encodeURIComponent(n.id)}`}>
                  <span className="news-meta">
                    <span className="mono">{fmtTime(n.ts, ui.tz, true)}</span>
                    <span>· {n.source}</span>
                  </span>
                  <span className="news-h">{n.headline}</span>
                </Link>
              ))
            ) : (
              <p className="small dim">{t("Chưa có tin trong 10 ngày qua.")}</p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
