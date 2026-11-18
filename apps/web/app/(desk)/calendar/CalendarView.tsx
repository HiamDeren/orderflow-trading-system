"use client";
import { useMemo, useState } from "react";
import type { EconEvent, Impact } from "@/lib/econ";
import { DOW_VI, addDays, dowOf, monthRange, viDayMonth } from "@/lib/time";
import EventRow from "../_components/EventRow";

const RANK: Record<Impact, number> = { Cao: 3, Vừa: 2, Thấp: 1, Nghỉ: 0 };

export default function CalendarView({ events, today, initialDay }: { events: EconEvent[]; today: string; initialDay: string }) {
  const [day, setDay] = useState(initialDay);
  const [highOnly, setHighOnly] = useState(false);
  const month = day.slice(0, 7);

  const byDay = useMemo(() => {
    const m = new Map<string, EconEvent[]>();
    for (const e of events) {
      if (highOnly && e.impact !== "Cao") continue;
      const list = m.get(e.dateEt) || [];
      list.push(e);
      m.set(e.dateEt, list);
    }
    return m;
  }, [events, highOnly]);
  const hasData = useMemo(() => new Set(events.map((e) => e.dateEt)), [events]);

  const { start, days } = monthRange(month);
  const lead = (dowOf(start) + 6) % 7; // tuần bắt đầu Thứ 2
  const cells = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: days }, (_, i) => addDays(start, i)),
  ];
  const list = byDay.get(day) || [];
  const [y, mo] = month.split("-");

  return (
    <section className="card" aria-label="Lịch kinh tế" style={{ gap: 16 }}>
      <div className="row wrap">
        <span className="lbl">Lịch kinh tế · USD · tuần hiện tại</span>
        <label className="check">
          <input type="checkbox" checked={highOnly} onChange={(e) => setHighOnly(e.target.checked)} /> Chỉ tin tác động cao
        </label>
      </div>
      <div className="split" style={{ gap: 24 }}>
        <div style={{ flex: "1 1 360px", maxWidth: 480, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="row">
            <span style={{ fontSize: 16, fontWeight: 600 }}>Tháng {Number(mo)} · {y}</span>
          </div>
          <div className="cal-head" aria-hidden="true">
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="cal-grid">
            {cells.map((d, i) => {
              if (!d) return <span key={"x" + i} />;
              const evs = byDay.get(d) || [];
              const top = evs.reduce<Impact | null>((a, e) => (!a || RANK[e.impact] > RANK[a] ? e.impact : a), null);
              const dd = d.slice(8).replace(/^0/, "");
              if (!hasData.has(d))
                return <span key={d} className="cal-day off">{dd}</span>;
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
            <span><span className="dot imp-Cao" aria-hidden="true" />Cao</span>
            <span><span className="dot imp-Vừa" aria-hidden="true" />Vừa</span>
            <span><span className="dot imp-Thấp" aria-hidden="true" />Thấp</span>
          </div>
          {hasData.has(today) && day !== today && (
            <button className="btn" onClick={() => setDay(today)}>Về hôm nay</button>
          )}
          <p className="small faint">Chấm màu là tin mạnh nhất trong ngày. Chỉ có tuần hiện tại: lịch gọi API trực tiếp, không lưu lại, nên tuần đã qua để xám.</p>
        </div>

        <div style={{ flex: "1.5 1 420px", minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="row" style={{ paddingBottom: 8, borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>
              {DOW_VI[dowOf(day)]} · {viDayMonth(day)}{day === today ? " · hôm nay" : ""}
            </span>
            <span className="mono small dim">ET · VN · Thực tế / Dự báo / Trước</span>
          </div>
          {list.length ? (
            list.map((e) => <EventRow key={e.id} e={e} />)
          ) : (
            <p className="small dim" style={{ padding: "16px 12px" }}>
              {highOnly ? "Không có tin tác động cao trong ngày này." : "Không có tin USD trong ngày này."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
