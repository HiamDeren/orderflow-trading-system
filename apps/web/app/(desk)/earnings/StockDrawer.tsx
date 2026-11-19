"use client";
// Ngăn thông tin mã ở Earnings: bấm chip mã → xem nhanh giá, ngày báo cáo, EPS 4 quý, P/E mà không rời trang.
import Link from "next/link";
import { useEffect, useState } from "react";
import { viDayMonth } from "@/lib/time";
import { useUi } from "../_components/Ui";

type Sum = {
  symbol: string;
  name: string;
  industry: string;
  logo: string;
  cap: number | null;
  quote: { c: number; d: number | null; dp: number | null } | null;
  pe: number | null;
  margin: number | null;
  eps: number | null;
  surprises: { period: string; quarter: number; year: number; actual: number | null; estimate: number | null; surprisePct: number | null }[];
  reco: { strongBuy: number; buy: number; hold: number; sell: number; strongSell: number } | null;
  next: { date: string; hour: string; epsEstimate: number | null; revenueEstimate: number | null } | null;
};

const big = (v: number | null) => (v === null ? "—" : v >= 1e12 ? (v / 1e12).toFixed(2) + "T" : v >= 1e9 ? (v / 1e9).toFixed(1) + "B" : v >= 1e6 ? (v / 1e6).toFixed(1) + "M" : String(v));

export default function StockDrawer({ symbol, onClose }: { symbol: string; onClose: () => void }) {
  const { t } = useUi();
  const [d, setD] = useState<Sum | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    let live = true;
    setD(null);
    setErr("");
    fetch(`/api/stock/summary?symbol=${encodeURIComponent(symbol)}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
        if (live) setD(j);
      })
      .catch((e) => live && setErr(String(e.message || e)));
    return () => {
      live = false;
    };
  }, [symbol]);

  const hour = (h: string) => (h === "bmo" ? t("Trước mở cửa") : h === "amc" ? t("Sau đóng cửa") : h === "dmh" ? t("Trong ngày") : t("Chưa rõ giờ"));
  const q = d?.surprises.filter((x) => x.actual !== null) || [];
  const max = Math.max(0.01, ...q.flatMap((x) => [Math.abs(x.actual || 0), Math.abs(x.estimate || 0)]));
  const recoN = d?.reco ? d.reco.strongBuy + d.reco.buy : null;

  return (
    <div className="drawer stack" style={{ gap: 14 }}>
      <div className="row">
        <button className="btn sm" onClick={onClose}>‹ {t("Danh sách ngày")}</button>
        <Link className="btn sm primary" href={`/stock/${symbol}`}>{t("Mở trang {s}", { s: symbol })}</Link>
      </div>
      {err ? (
        <div className="notice small">{err}</div>
      ) : !d ? (
        <p className="small dim">{t("Đang tải {s}…", { s: symbol })}</p>
      ) : (
        <>
          <div className="hstack" style={{ gap: 12, flexWrap: "nowrap" }}>
            {d.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="stock-logo" src={d.logo} alt="" width={44} height={44} referrerPolicy="no-referrer" style={{ width: 44, height: 44 }} />
            ) : (
              <span className="stock-logo ph mono" style={{ width: 44, height: 44 }}>{symbol.slice(0, 2)}</span>
            )}
            <div className="stack" style={{ gap: 2, flex: 1, minWidth: 0 }}>
              <b style={{ fontSize: 16 }}>{d.name}</b>
              <span className="small dim"><span className="mono">{symbol}</span>{d.industry ? ` · ${d.industry}` : ""}</span>
            </div>
            {d.quote && (
              <div className="stack" style={{ gap: 0, alignItems: "flex-end" }}>
                <b className="mono" style={{ fontSize: 18 }}>{d.quote.c.toFixed(2)}</b>
                <span className={"mono small " + ((d.quote.dp ?? 0) >= 0 ? "long" : "short")}>{d.quote.dp === null ? "—" : ((d.quote.dp >= 0 ? "+" : "") + d.quote.dp.toFixed(2) + "%")}</span>
              </div>
            )}
          </div>
          {d.next && (
            <div className="notice info stack" style={{ gap: 4 }}>
              <span className="lbl accent">{t("Báo cáo")}</span>
              <b>{viDayMonth(d.next.date)} · {hour(d.next.hour)}</b>
              <span className="mono small">EPS {t("dự báo")} {d.next.epsEstimate ?? "—"} · Rev {t("dự báo")} {big(d.next.revenueEstimate)}</span>
            </div>
          )}
          {q.length > 0 && (
            <div className="stack" style={{ gap: 6 }}>
              <span className="lbl">{t("EPS 4 quý · thực tế vs dự báo")}</span>
              <div className="dq" role="img" aria-label={q.map((x) => `Q${x.quarter} ${x.year}: ${x.actual} / ${x.estimate}`).join(", ")}>
                {q.map((x) => (
                  <div key={x.period} className="dq-c">
                    <span className="dq-bar" style={{ height: `${(Math.abs(x.actual || 0) / max) * 88}%` }} />
                    {x.estimate !== null && <span className="dq-est" style={{ bottom: `${(Math.abs(x.estimate) / max) * 88}%` }} />}
                  </div>
                ))}
              </div>
              <div className="dq-l mono">
                {q.map((x) => (
                  <span key={x.period}>
                    Q{x.quarter} {String(x.year).slice(2)}
                    <br />
                    <span className={(x.surprisePct ?? 0) >= 0 ? "long" : "short"}>{x.surprisePct === null ? "—" : ((x.surprisePct >= 0 ? "+" : "") + x.surprisePct.toFixed(1) + "%")}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="dq-kv">
            <div><span className="small dim">P/E</span><b className="mono">{d.pe?.toFixed(1) ?? "—"}</b></div>
            <div><span className="small dim">{t("Biên LN ròng")}</span><b className="mono">{d.margin === null ? "—" : d.margin.toFixed(1) + "%"}</b></div>
            <div><span className="small dim">{t("Vốn hoá")}</span><b className="mono">{big(d.cap)}</b></div>
            <div><span className="small dim">EPS (TTM)</span><b className="mono">{d.eps?.toFixed(2) ?? "—"}</b></div>
            <div><span className="small dim">{t("Analyst mua")}</span><b className="mono">{recoN ?? "—"}</b></div>
          </div>
        </>
      )}
    </div>
  );
}
