"use client";
import { useState } from "react";
import { DOW } from "@/lib/i18n";
import type { Earning } from "@/lib/market";
import { dowOf, viDayMonth } from "@/lib/time";
import { EarningRow } from "../_components/MarketBits";
import { useUi } from "../_components/Ui";

export default function EarningsView({ days, items, watch, today }: { days: string[]; items: Earning[]; watch: string[]; today: string }) {
  const { t, lang } = useUi();
  const [onlyNq, setOnlyNq] = useState(true);
  const list = onlyNq ? items.filter((e) => watch.includes(e.symbol)) : items;
  return (
    <>
      <div className="row wrap">
        <div className="seg" role="group" aria-label={t("Phạm vi")}>
          <button aria-pressed={onlyNq} onClick={() => setOnlyNq(true)}>{t("NQ top ({n})", { n: items.filter((e) => watch.includes(e.symbol)).length })}</button>
          <button aria-pressed={!onlyNq} onClick={() => setOnlyNq(false)}>{t("Tất cả ({n})", { n: items.length })}</button>
        </div>
        <span className="small dim">{t("EPS và Rev: thực tế / dự báo")}</span>
      </div>
      <div className="ern-days">
        {days.map((d) => {
          const rows = list.filter((e) => e.date === d);
          const shown = onlyNq ? rows : rows.slice(0, 120);
          return (
            <section key={d} className={"card tight" + (d === today ? " today-card" : "")} aria-label={d}>
              <div className="row">
                <span style={{ fontWeight: 600 }}>{DOW[lang][dowOf(d)]} · {viDayMonth(d)}{d === today ? ` · ${t("hôm nay")}` : ""}</span>
                <span className="small dim">{rows.length}</span>
              </div>
              {shown.length ? shown.map((e) => <EarningRow key={e.symbol + e.date} e={e} />) : <span className="small dim">{t("Không có")}</span>}
              {!onlyNq && rows.length > shown.length && <span className="small dim">+{rows.length - shown.length}</span>}
            </section>
          );
        })}
      </div>
    </>
  );
}
