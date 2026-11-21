"use client";
import Link from "next/link";
import { useState } from "react";
import { useUi } from "../../_components/Ui";

export type PnlDay = { date: string | null; net: number; r: number; n: number; has: boolean; result: string | null };
export type PnlWeek = { days: PnlDay[]; net: number; r: number; n: number; traded: number };

const money = (v: number) => (v > 0 ? "+$" : v < 0 ? "−$" : "$") + Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 2 });
const rr = (v: number) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(1) + "R";
const col = (v: number) => (v > 0 ? "var(--long)" : v < 0 ? "var(--short)" : "var(--muted)");

export default function PnlView({ weeks, today }: { weeks: PnlWeek[]; today: string }) {
  const { t, lang } = useUi();
  const [unit, setUnit] = useState<"usd" | "r">("usd");
  const f = (net: number, r: number) => (unit === "usd" ? money(net) : rr(r));
  const val = (net: number, r: number) => (unit === "usd" ? net : r);

  const days = weeks.flatMap((w) => w.days).filter((d) => d.date && d.n > 0);
  const net = days.reduce((a, d) => a + d.net, 0);
  const r = days.reduce((a, d) => a + d.r, 0);
  const green = days.filter((d) => val(d.net, d.r) > 0).length;
  const red = days.filter((d) => val(d.net, d.r) < 0).length;
  const best = days.reduce<PnlDay | null>((a, d) => (!a || val(d.net, d.r) > val(a.net, a.r) ? d : a), null);
  const worst = days.reduce<PnlDay | null>((a, d) => (!a || val(d.net, d.r) < val(a.net, a.r) ? d : a), null);
  const dm = (d: string | null) => (d ? `${d.slice(8)}/${d.slice(5, 7)}` : "");

  return (
    <>
      <div className="row wrap">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, flex: "1 1 600px" }}>
          <Tile k={t("Net PnL tháng")} v={f(net, r)} c={col(val(net, r))} sub={t("{n} ngày có lệnh", { n: days.length })} />
          <Tile
            k={t("Ngày xanh / đỏ")}
            v={`${green} / ${red}`}
            sub={days.length ? t("Win rate ngày {p}%", { p: Math.round((green / days.length) * 100) }) : "—"}
          />
          <Tile k={t("Ngày tốt nhất")} v={best ? f(best.net, best.r) : "—"} c={best ? col(val(best.net, best.r)) : undefined} sub={dm(best?.date ?? null)} />
          <Tile
            k={t("Ngày tệ nhất")}
            v={worst ? f(worst.net, worst.r) : "—"}
            c={worst ? col(val(worst.net, worst.r)) : undefined}
            sub={dm(worst?.date ?? null)}
          />
        </div>
        <div className="seg" role="group" aria-label={t("Đơn vị")}>
          <button type="button" aria-pressed={unit === "usd"} onClick={() => setUnit("usd")}>
            $
          </button>
          <button type="button" aria-pressed={unit === "r"} onClick={() => setUnit("r")}>
            R
          </button>
        </div>
      </div>

      <section className="card" aria-label="PnL Calendar" style={{ gap: 8 }}>
        <div className="table-box">
          <div style={{ minWidth: 720, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="pnl-head">
              {(lang === "en" ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Week"] : ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Tuần"]).map((d) => (
                <span key={d} className="lbl" style={{ padding: "0 4px" }}>
                  {d}
                </span>
              ))}
            </div>
            {weeks.map((w, wi) => (
              <div className="pnl-week" key={w.days.find((d) => d.date)?.date ?? wi}>
                {w.days.map((d, i) => {
                  // biome-ignore lint/suspicious/noArrayIndexKey: ô trống đầu / cuối tháng, chỉ có vị trí
                  if (!d.date) return <span key={`b${i}`} className="pnl-cell blank" />;
                  const v = val(d.net, d.r);
                  const future = d.date > today;
                  const cls = "pnl-cell " + (d.n ? (v > 0 ? "win" : v < 0 ? "loss" : "") : "empty") + (d.date === today ? " today" : "");
                  const label = `${dm(d.date)}: ${d.n ? f(d.net, d.r) : d.has ? t("không trade") : t("chưa có journal")}`;
                  return future ? (
                    <span key={d.date} className="pnl-cell empty" role="group" aria-label={label}>
                      <span className="mono small" style={{ color: "var(--ghost)" }}>
                        {d.date.slice(8)}
                      </span>
                    </span>
                  ) : (
                    <Link key={d.date} href={`/journal?date=${d.date}`} className={cls} aria-label={label}>
                      <span className="mono small" style={{ color: d.date === today ? "var(--accent)" : "var(--muted)" }}>
                        {d.date.slice(8)}
                      </span>
                      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span className="v" style={{ color: d.n ? col(v) : "var(--dim)", fontSize: d.n ? undefined : 13 }}>
                          {d.n ? f(d.net, d.r) : d.has ? d.result || "No trade" : d.date === today ? t("Hôm nay") : ""}
                        </span>
                        <span className="small dim">{d.n ? t("{n} lệnh", { n: d.n }) : ""}</span>
                      </span>
                    </Link>
                  );
                })}
                <div className="pnl-sum">
                  <span className="lbl">{t("Tuần {n}", { n: wi + 1 })}</span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span className="mono" style={{ fontSize: 17, fontWeight: 600, color: w.traded ? col(val(w.net, w.r)) : "var(--faint)" }}>
                      {w.traded ? f(w.net, w.r) : "—"}
                    </span>
                    <span className="small dim">{w.traded ? t("{n} lệnh · {d} ngày", { n: w.n, d: w.traded }) : ""}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function Tile({ k, v, sub, c }: { k: string; v: string; sub: string; c?: string }) {
  return (
    <div className="card tight" style={{ padding: "14px 16px" }}>
      <span className="lbl">{k}</span>
      <span className="mono" style={{ fontSize: 22, fontWeight: 600, color: c }}>
        {v}
      </span>
      <span className="small dim">{sub}</span>
    </div>
  );
}
