"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DOW, DOW_SHORT } from "@/lib/i18n";
import type { Earning } from "@/lib/market";
import { addDays, dowOf, isWeekday, monthRange, viDayMonth } from "@/lib/time";
import { EarningRow, hourLabel } from "../_components/MarketBits";
import { useUi } from "../_components/Ui";
import StockDrawer from "./StockDrawer";

const HOURS: Earning["hour"][] = ["bmo", "dmh", "amc", ""];

// Mã lớn lên trước: NQ top trước, rồi theo doanh thu dự báo
function rank(watch: Set<string>) {
  return (a: Earning, b: Earning) =>
    Number(watch.has(b.symbol)) - Number(watch.has(a.symbol)) || (b.revenueEstimate ?? 0) - (a.revenueEstimate ?? 0) || a.symbol.localeCompare(b.symbol);
}

export default function EarningsView({ month, items, watch, today, initialDay }: { month: string; items: Earning[]; watch: string[]; today: string; initialDay: string }) {
  const { t, lang } = useUi();
  const [onlyNq, setOnlyNq] = useState(true);
  const W = useMemo(() => new Set(watch), [watch]);

  const byDay = useMemo(() => {
    const m = new Map<string, Earning[]>();
    for (const e of items) {
      if (onlyNq && !W.has(e.symbol)) continue;
      const l = m.get(e.date) || [];
      l.push(e);
      m.set(e.date, l);
    }
    for (const l of m.values()) l.sort(rank(W));
    return m;
  }, [items, onlyNq, W]);

  // Lưới Thứ 2 → Thứ 6 (earnings hầu như không có cuối tuần)
  const { start, days } = monthRange(month);
  const end = addDays(start, days - 1);
  // Bắt đầu từ Thứ 2 của tuần có ngày làm việc đầu tiên trong tháng (tháng mở đầu bằng T7 / CN thì không có hàng trống)
  let firstWd = start;
  while (!isWeekday(firstWd)) firstWd = addDays(firstWd, 1);
  const first = addDays(firstWd, -((dowOf(firstWd) + 6) % 7));
  const cells: (string | null)[] = [];
  for (let d = first; d <= end; d = addDays(d, 1)) if (isWeekday(d)) cells.push(d < start ? null : d);

  const firstWithData = cells.find((d) => d && (byDay.get(d) || []).length) || cells.find(Boolean) || start;
  const [day, setDay] = useState(initialDay || firstWithData!);
  const [sym, setSym] = useState<string | null>(null);
  const list = byDay.get(day) || [];
  const nqCount = items.filter((e) => W.has(e.symbol)).length;

  return (
    <>
      <div className="row wrap">
        <div className="seg" role="group" aria-label={t("Phạm vi")}>
          <button aria-pressed={onlyNq} onClick={() => setOnlyNq(true)}>{t("NQ top ({n})", { n: nqCount })}</button>
          <button aria-pressed={!onlyNq} onClick={() => setOnlyNq(false)}>{t("Tất cả ({n})", { n: items.length })}</button>
        </div>
        <span className="small dim">{t("Bấm mã để xem thông tin cổ phiếu")}</span>
      </div>

      <div className="ern-split fit">
        <section className="card ern-cal" aria-label={t("Lịch earnings")}>
          <div className="ern-head" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((w) => <span key={w}>{DOW_SHORT[lang][w]}</span>)}
          </div>
          <div className="ern-grid">
            {cells.map((d, i) => {
              if (!d) return <span key={"x" + i} />;
              const evs = byDay.get(d) || [];
              const cls = "ern-cell" + (d === day ? " sel" : "") + (d === today ? " today" : "") + (evs.length ? "" : " empty");
              const pick = () => setDay(d);
              return (
                <div
                  key={d}
                  className={cls}
                  role="button"
                  tabIndex={0}
                  onClick={pick}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), pick())}
                  aria-pressed={d === day}
                  aria-label={`${DOW[lang][dowOf(d)]} ${viDayMonth(d)}, ${evs.length}`}
                >
                  <span className="ern-cell-top">
                    <span className="mono">{d.slice(8).replace(/^0/, "")}</span>
                    {evs.length > 0 && <span className="ern-count">{evs.length}</span>}
                  </span>
                  <span className="ern-syms">
                    {evs.slice(0, 6).map((e) => (
                      <Link
                        key={e.symbol}
                        href={`/stock/${encodeURIComponent(e.symbol)}`}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          if (ev.metaKey || ev.ctrlKey) return;
                          ev.preventDefault();
                          setDay(d);
                          setSym(e.symbol);
                        }}
                        className={"ern-sym mono" + (W.has(e.symbol) ? " nq" : "") + (e.hour === "amc" ? " amc" : "")}
                        title={`${e.symbol} · ${hourLabel(e.hour, t)}`}
                      >
                        {e.symbol}
                      </Link>
                    ))}
                    {evs.length > 6 && <span className="ern-more">+{evs.length - 6}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className={"card ern-detail" + (day === today ? " today-card" : "")} aria-label={sym || day}>
          {sym ? (
            <StockDrawer symbol={sym} onClose={() => setSym(null)} />
          ) : (
          <>
          <div className="row cal-list-head">
            <span style={{ fontSize: 15, fontWeight: 600 }}>
              {DOW[lang][dowOf(day)]} · {viDayMonth(day)}{day === today ? ` · ${t("hôm nay")}` : ""}
              <span className="dim" style={{ fontWeight: 400, fontSize: 13 }}> · {t("{n} mã", { n: list.length })}</span>
            </span>
            <span className="mono small dim">EPS · Rev</span>
          </div>
          {list.length ? (
            HOURS.map((h) => {
              const rows = list.filter((e) => e.hour === h);
              if (!rows.length) return null;
              return (
                <div key={h || "na"} className="stack" style={{ gap: 2 }}>
                  <span className="lbl">{hourLabel(h, t)} · {rows.length}</span>
                  {rows.slice(0, 150).map((e) => <EarningRow key={e.symbol + e.date} e={e} noHour />)}
                  {rows.length > 150 && <span className="small dim">+{rows.length - 150}</span>}
                </div>
              );
            })
          ) : (
            <span className="small dim">{t("Không có")}</span>
          )}
          </>
          )}
        </section>
      </div>
    </>
  );
}
