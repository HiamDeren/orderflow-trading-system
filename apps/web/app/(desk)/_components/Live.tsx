"use client";
// Thành phần chạy theo giờ thực: đồng hồ ET / VN và timeline phiên.
import { useEffect, useState } from "react";
import { SESSION_END, SESSION_START, TZ_VN, etNow, hhmm } from "@/lib/time";

function useNow(initial: number, everyMs = 15000) {
  const [now, setNow] = useState(initial);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}

const pad = (n: number) => String(n).padStart(2, "0");
const dur = (min: number) => `${Math.floor(min / 60)}:${pad(min % 60)}`;

export function Clock({ initial }: { initial: number }) {
  const now = useNow(initial);
  const et = etNow(new Date(now));
  const weekday = et.dow >= 1 && et.dow <= 5;
  let label = "Mở NY AM";
  let value = "—";
  let tone = "var(--accent)";
  if (!weekday) {
    label = "Cuối tuần";
    value = "Nghỉ";
    tone = "var(--dim)";
  } else if (et.minutes < SESSION_START) {
    value = "−" + dur(SESSION_START - et.minutes);
  } else if (et.minutes <= SESSION_END) {
    label = "Còn trong phiên";
    value = dur(SESSION_END - et.minutes);
    tone = "var(--long)";
  } else {
    label = "NY AM";
    value = "Đã đóng";
    tone = "var(--dim)";
  }
  return (
    <div className="card clock" aria-live="off">
      <div>
        <span className="lbl">New York</span>
        <span className="v" suppressHydrationWarning>{pad(et.hh)}:{pad(et.mm)}</span>
      </div>
      <div>
        <span className="lbl">Việt Nam</span>
        <span className="v" suppressHydrationWarning>{hhmm(now, TZ_VN)}</span>
      </div>
      <div>
        <span className="lbl" suppressHydrationWarning>{label}</span>
        <span className="v" style={{ color: tone }} suppressHydrationWarning>{value}</span>
      </div>
    </div>
  );
}

const START = 4 * 60;
const SPAN = 12 * 60;
const pos = (min: number) => `${Math.max(0, Math.min(100, ((min - START) / SPAN) * 100))}%`;

export type TlEvent = { id: string; minutes: number; impact: string; title: string };

export function Timeline({ initial, events, today }: { initial: number; events: TlEvent[]; today: string }) {
  const now = useNow(initial, 30000);
  const et = etNow(new Date(now));
  const showNow = et.date === today && et.minutes >= START && et.minutes <= START + SPAN;
  const ticks = ["04:00", "06:00", "08:00", "09:30", "11:30", "13:00", "14:00", "16:00"];
  return (
    <section className="card" aria-label="Dòng thời gian phiên" style={{ gap: 12 }}>
      <div className="row wrap">
        <span className="lbl">Dòng thời gian phiên · giờ ET</span>
        <span className="small dim">Cửa sổ trade 09:30–11:30 ET · 21:30–23:30 VN</span>
      </div>
      <div className="tl">
        <div className="tl-bar" />
        <div className="tl-pre" style={{ width: pos(SESSION_START) }} />
        <div className="tl-win" style={{ left: pos(SESSION_START), width: `${(120 / SPAN) * 100}%` }} />
        {showNow && <div className="tl-now" style={{ left: pos(et.minutes) }} suppressHydrationWarning />}
        {events.map((e) => (
          <div key={e.id} className={"tl-ev imp-" + e.impact} style={{ left: pos(e.minutes) }} title={e.title} />
        ))}
      </div>
      <div className="tl-ticks">
        {ticks.map((t) => (
          <span key={t} style={t === "09:30" ? { color: "var(--accent)" } : undefined}>{t}</span>
        ))}
      </div>
      <div className="legend">
        <span><span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 2, background: "#232a33" }} />OVN / pre-market</span>
        <span><span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 2, background: "var(--accent-bg)", boxShadow: "inset 0 0 0 1px var(--accent)" }} />NY AM</span>
        <span><span aria-hidden="true" className="dot imp-Cao" />Tin tác động cao</span>
        <span><span aria-hidden="true" className="dot imp-Vừa" />Tin vừa</span>
        <span><span aria-hidden="true" style={{ width: 2, height: 12, background: "var(--text)" }} />Bây giờ</span>
      </div>
    </section>
  );
}
