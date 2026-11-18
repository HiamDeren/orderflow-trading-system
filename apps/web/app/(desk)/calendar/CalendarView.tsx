"use client";
import { useMemo, useState } from "react";
import type { EconEvent } from "@/lib/econ";
import { CURRENCIES, IMPACTS, IMPACT_LABEL, IMPACT_RANK, matches, prefsCookie, type EconPrefs, type Impact } from "@/lib/econ-prefs";
import { DOW, MON_HEAD } from "@/lib/i18n";
import { addDays, dowOf, isWeekday as i5, monthRange, viDayMonth } from "@/lib/time";
import EventRow, { TzHead } from "../_components/EventRow";
import { useUi } from "../_components/Ui";

export default function CalendarView({ events, today, initialDay, initialPrefs }: { events: EconEvent[]; today: string; initialDay: string; initialPrefs: EconPrefs }) {
  const { t, lang } = useUi();
  const [day, setDay] = useState(initialDay);
  const [prefs, setPrefsState] = useState<EconPrefs>(initialPrefs);
  const [mode, setMode] = useState<"day" | "week">("day");
  const month = day.slice(0, 7);

  const setPrefs = (p: EconPrefs) => {
    setPrefsState(p);
    document.cookie = prefsCookie(p); // Dashboard đọc cùng bộ lọc
  };
  const toggle = <T extends string>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const byDay = useMemo(() => {
    const m = new Map<string, EconEvent[]>();
    for (const e of events) {
      if (!matches(prefs, e)) continue;
      const list = m.get(e.dateLocal) || [];
      list.push(e);
      m.set(e.dateLocal, list);
    }
    return m;
  }, [events, prefs]);
  const hasData = useMemo(() => new Set(events.map((e) => e.dateLocal)), [events]);
  const countByCur = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of events) if (prefs.imp.includes(e.impact)) m.set(e.country, (m.get(e.country) || 0) + 1);
    return m;
  }, [events, prefs.imp]);

  const { start, days } = monthRange(month);
  const lead = (dowOf(start) + 6) % 7; // tuần bắt đầu Thứ 2
  const cells = [...Array.from({ length: lead }, () => null), ...Array.from({ length: days }, (_, i) => addDays(start, i))];
  const list = byDay.get(day) || [];
  const [y, mo] = month.split("-");
  // Tuần của ngày đang chọn (Thứ 2 → Chủ nhật); cuối tuần chỉ hiện khi có tin
  const wkStart = addDays(day, -((dowOf(day) + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => addDays(wkStart, i)).filter((d) => i5(d) || (byDay.get(d) || []).length);
  const weekSet = new Set(Array.from({ length: 7 }, (_, i) => addDays(wkStart, i)));
  const weekCount = week.reduce((n, d) => n + (byDay.get(d) || []).length, 0);
  const empty = prefs.cur.length && prefs.imp.length ? t("Không có tin khớp bộ lọc trong ngày này.") : t("Chưa chọn currency hoặc mức tác động nào.");

  return (
    <>
      <section className="card" aria-label={t("Bộ lọc lịch")} style={{ flexDirection: "row", flexWrap: "wrap", gap: 28 }}>
        <fieldset className="filter">
          <legend>
            <span className="lbl">{t("Mức tác động")}</span>
            <button className="link" onClick={() => setPrefs({ ...prefs, imp: [...IMPACTS] })}>{t("tất cả")}</button>
            <button className="link" onClick={() => setPrefs({ ...prefs, imp: [] })}>{t("bỏ hết")}</button>
          </legend>
          <div className="hstack" style={{ gap: 14 }}>
            {IMPACTS.map((i) => (
              <label key={i} className="check">
                <input type="checkbox" checked={prefs.imp.includes(i)} onChange={() => setPrefs({ ...prefs, imp: toggle(prefs.imp, i) })} />
                <span className={"imp-sq imp-" + i} aria-hidden="true" />
                {t(IMPACT_LABEL[i])}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="filter" style={{ flex: "1 1 420px" }}>
          <legend>
            <span className="lbl">Currencies</span>
            <button className="link" onClick={() => setPrefs({ ...prefs, cur: [...CURRENCIES] })}>{t("tất cả")}</button>
            <button className="link" onClick={() => setPrefs({ ...prefs, cur: [] })}>{t("bỏ hết")}</button>
          </legend>
          <div className="hstack" style={{ gap: 6 }}>
            {CURRENCIES.map((c) => {
              const on = prefs.cur.includes(c);
              return (
                <button key={c} className={"chip mono" + (on ? " on" : "")} aria-pressed={on} onClick={() => setPrefs({ ...prefs, cur: toggle(prefs.cur, c) })}>
                  {c}
                  <span className="dim" style={{ fontSize: 11 }}>{countByCur.get(c) || 0}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </section>

      <div className="cal-split fit">
          <section className="card" aria-label={t("Lịch kinh tế")}>
            <div className="row">
              <span style={{ fontSize: 16, fontWeight: 600 }}>{t("Tháng {m} · {y}", { m: Number(mo), y })}</span>
              <div className="seg seg-xs" role="group" aria-label={t("Kiểu xem")}>
                <button aria-pressed={mode === "day"} onClick={() => setMode("day")}>{t("Ngày")}</button>
                <button aria-pressed={mode === "week"} onClick={() => setMode("week")}>{t("Tuần")}</button>
              </div>
            </div>
            <div className="cal-head" aria-hidden="true">
              {MON_HEAD[lang].map((d) => <span key={d}>{d}</span>)}
            </div>
            <div className="cal-grid">
              {cells.map((d, i) => {
                if (!d) return <span key={"x" + i} />;
                const evs = byDay.get(d) || [];
                const top = evs.reduce<Impact | null>((a, e) => (!a || IMPACT_RANK[e.impact] > IMPACT_RANK[a] ? e.impact : a), null);
                const dd = d.slice(8).replace(/^0/, "");
                if (!hasData.has(d)) return <span key={d} className="cal-day off">{dd}</span>;
                const sel = mode === "day" ? d === day : weekSet.has(d);
                const cls = "cal-day" + (sel ? " sel" : "") + (d === today ? " today" : "");
                return (
                  <button key={d} className={cls} onClick={() => setDay(d)} aria-pressed={sel} aria-label={`${DOW[lang][dowOf(d)]} ${viDayMonth(d)}, ${evs.length}`}>
                    {dd}
                    <span className={"dot" + (top ? " imp-" + top : "")} style={top ? undefined : { background: "transparent" }} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
            {hasData.has(today) && day !== today && <button className="btn" onClick={() => setDay(today)}>{t("Về hôm nay")}</button>}
          </section>

          {mode === "day" ? (
            <section className="card cal-list" style={{ gap: 8 }} aria-label={t("Danh sách tin")}>
              <div className="row cal-list-head">
                <span style={{ fontSize: 15, fontWeight: 600 }}>
                  {DOW[lang][dowOf(day)]} · {viDayMonth(day)}{day === today ? ` · ${t("hôm nay")}` : ""}
                  <span className="dim" style={{ fontWeight: 400, fontSize: 13 }}> · {t("{n} tin", { n: list.length })}</span>
                </span>
                <span className="mono small dim"><TzHead /> · {t("Thực tế / Dự báo / Trước")}</span>
              </div>
              {list.length ? list.map((e) => <EventRow key={e.id} e={e} />) : <p className="small dim" style={{ padding: "16px 12px" }}>{empty}</p>}
            </section>
          ) : (
            <section className="card cal-list" style={{ gap: 8 }} aria-label={t("Danh sách tin")}>
              <div className="row cal-list-head">
                <span style={{ fontSize: 15, fontWeight: 600 }}>
                  {t("Tuần {a} – {b}", { a: viDayMonth(wkStart), b: viDayMonth(addDays(wkStart, 6)) })}
                  <span className="dim" style={{ fontWeight: 400, fontSize: 13 }}> · {t("{n} tin", { n: weekCount })}</span>
                </span>
                <span className="mono small dim"><TzHead /> · {t("Thực tế / Dự báo / Trước")}</span>
              </div>
              {week.map((d) => {
                const evs = byDay.get(d) || [];
                return (
                  <section key={d} className={"wk-day" + (d === today ? " today" : "")} aria-label={`${DOW[lang][dowOf(d)]} ${viDayMonth(d)}`}>
                    <button className="wk-day-head" onClick={() => { setDay(d); setMode("day"); }} title={t("Xem riêng ngày này")}>
                      <span>{DOW[lang][dowOf(d)]} · {viDayMonth(d)}{d === today ? ` · ${t("hôm nay")}` : ""}</span>
                      <span className="dim small">{t("{n} tin", { n: evs.length })}</span>
                    </button>
                    {evs.length ? evs.map((e) => <EventRow key={e.id} e={e} />) : <p className="small faint" style={{ padding: "6px 12px" }}>{hasData.has(d) ? t("Không có tin khớp bộ lọc.") : t("Ngoài tuần dữ liệu.")}</p>}
                  </section>
                );
              })}
            </section>
          )}
      </div>
    </>
  );
}
