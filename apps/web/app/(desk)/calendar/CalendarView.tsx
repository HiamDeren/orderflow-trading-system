"use client";
import { useMemo, useState } from "react";
import type { EconEvent } from "@/lib/econ";
import { CURRENCIES, IMPACTS, IMPACT_LABEL, IMPACT_RANK, matches, prefsCookie, type EconPrefs, type Impact } from "@/lib/econ-prefs";
import { DOW_VI, addDays, dowOf, monthRange, viDayMonth } from "@/lib/time";
import EventRow from "../_components/EventRow";

export default function CalendarView({ events, today, initialDay, initialPrefs }: { events: EconEvent[]; today: string; initialDay: string; initialPrefs: EconPrefs }) {
  const [day, setDay] = useState(initialDay);
  const [prefs, setPrefsState] = useState<EconPrefs>(initialPrefs);
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
      const list = m.get(e.dateEt) || [];
      list.push(e);
      m.set(e.dateEt, list);
    }
    return m;
  }, [events, prefs]);
  const hasData = useMemo(() => new Set(events.map((e) => e.dateEt)), [events]);
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

  return (
    <>
      <section className="card" aria-label="Bộ lọc lịch" style={{ flexDirection: "row", flexWrap: "wrap", gap: 28 }}>
        <fieldset className="filter">
          <legend>
            <span className="lbl">Mức tác động</span>
            <button className="link" onClick={() => setPrefs({ ...prefs, imp: [...IMPACTS] })}>tất cả</button>
            <button className="link" onClick={() => setPrefs({ ...prefs, imp: [] })}>bỏ hết</button>
          </legend>
          <div className="hstack" style={{ gap: 14 }}>
            {IMPACTS.map((i) => (
              <label key={i} className="check">
                <input type="checkbox" checked={prefs.imp.includes(i)} onChange={() => setPrefs({ ...prefs, imp: toggle(prefs.imp, i) })} />
                <span className={"imp-sq imp-" + i} aria-hidden="true" />
                {IMPACT_LABEL[i]}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="filter" style={{ flex: "1 1 420px" }}>
          <legend>
            <span className="lbl">Currencies</span>
            <button className="link" onClick={() => setPrefs({ ...prefs, cur: [...CURRENCIES] })}>tất cả</button>
            <button className="link" onClick={() => setPrefs({ ...prefs, cur: [] })}>bỏ hết</button>
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

      <section className="card" aria-label="Lịch kinh tế" style={{ gap: 16 }}>
        <div className="split" style={{ gap: 24 }}>
          <div style={{ flex: "1 1 360px", maxWidth: 480, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Tháng {Number(mo)} · {y}</span>
            <div className="cal-head" aria-hidden="true">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => <span key={d}>{d}</span>)}
            </div>
            <div className="cal-grid">
              {cells.map((d, i) => {
                if (!d) return <span key={"x" + i} />;
                const evs = byDay.get(d) || [];
                const top = evs.reduce<Impact | null>((a, e) => (!a || IMPACT_RANK[e.impact] > IMPACT_RANK[a] ? e.impact : a), null);
                const dd = d.slice(8).replace(/^0/, "");
                if (!hasData.has(d)) return <span key={d} className="cal-day off">{dd}</span>;
                const cls = "cal-day" + (d === day ? " sel" : "") + (d === today ? " today" : "");
                return (
                  <button key={d} className={cls} onClick={() => setDay(d)} aria-pressed={d === day} aria-label={`${DOW_VI[dowOf(d)]} ${viDayMonth(d)}, ${evs.length} tin`}>
                    {dd}
                    <span className={"dot" + (top ? " imp-" + top : "")} style={top ? undefined : { background: "transparent" }} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
            <div className="legend">
              {IMPACTS.map((i) => <span key={i}><span className={"dot imp-" + i} aria-hidden="true" />{IMPACT_LABEL[i]}</span>)}
            </div>
            {hasData.has(today) && day !== today && <button className="btn" onClick={() => setDay(today)}>Về hôm nay</button>}
            <p className="small faint">Chấm màu là tin mạnh nhất trong ngày (theo bộ lọc). Chỉ có tuần hiện tại: lịch gọi API trực tiếp, không lưu lại, nên tuần đã qua để xám. Bộ lọc dùng chung với Dashboard.</p>
          </div>

          <div style={{ flex: "1.5 1 420px", minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="row" style={{ paddingBottom: 8, borderBottom: "1px solid var(--line)" }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>
                {DOW_VI[dowOf(day)]} · {viDayMonth(day)}{day === today ? " · hôm nay" : ""}
                <span className="dim" style={{ fontWeight: 400, fontSize: 13 }}> · {list.length} tin</span>
              </span>
              <span className="mono small dim">ET · VN · Thực tế / Dự báo / Trước</span>
            </div>
            {list.length ? (
              list.map((e) => <EventRow key={e.id} e={e} />)
            ) : (
              <p className="small dim" style={{ padding: "16px 12px" }}>
                {prefs.cur.length && prefs.imp.length ? "Không có tin khớp bộ lọc trong ngày này." : "Chưa chọn currency hoặc mức tác động nào."}
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
