"use client";
// Dòng thời gian tin trong ngày (giờ ET), chạy theo giờ thực.
import Link from "next/link";
import { useEffect, useState } from "react";
import { tzShort } from "@/lib/prefs";
import { etNow, fmtTime } from "@/lib/time";
import { useUi } from "./Ui";

function useNow(initial: number, everyMs = 15000) {
  const [now, setNow] = useState(initial);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}

const START = 4 * 60;
const SPAN = 12 * 60;
const pos = (min: number) => `${Math.max(0, Math.min(100, ((min - START) / SPAN) * 100))}%`;

export type TlEvent = { id: string; minutes: number; impact: string; title: string; country: string; et: string; local: string; href: string };

// Dòng thời gian 04:00–16:00 ET của ngày ET hiện tại. Chấm = tin trong khung (theo bộ lọc Calendar), rê chuột xem tên tin.
export function Timeline({ initial, events, today }: { initial: number; events: TlEvent[]; today: string }) {
  const { t, tz } = useUi();
  const now = useNow(initial, 30000);
  const et = etNow(new Date(now));
  const showNow = et.date === today && et.minutes >= START && et.minutes <= START + SPAN;
  const ticks = ["04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00"];
  const inRange = events.filter((e) => e.minutes >= START && e.minutes <= START + SPAN);
  const outside = events.length - inRange.length;
  // Giờ theo múi giờ hiển thị của các mốc ET (lệch UTC của ET lấy lúc 12:00 UTC ngày đó)
  const base = Date.parse(`${today}T00:00:00Z`);
  const off = 12 * 60 - etNow(new Date(base + 12 * 3600000)).minutes;
  const local = (hm: string) => {
    const [h, m] = hm.split(":").map(Number);
    return fmtTime(base + (h * 60 + m + off) * 60000, tz, false);
  };
  return (
    <section className="card" aria-label={t("Dòng thời gian tin · giờ ET")} style={{ gap: 10 }}>
      <div className="row wrap">
        <span className="lbl">{t("Dòng thời gian tin · giờ ET")}</span>
        <span className="small dim">
          {inRange.length ? t("{n} tin trong khung", { n: inRange.length }) : t("Không có tin trong khung 04:00–16:00 ET")}
          {outside > 0 ? ` · ${t("{n} tin ngoài khung", { n: outside })}` : ""}
        </span>
      </div>
      <div className="tl">
        <div className="tl-bar" />
        {showNow && <div className="tl-now" style={{ left: pos(et.minutes) }} suppressHydrationWarning />}
        {inRange.map((e) => (
          <Link
            key={e.id}
            href={e.href}
            className={"tl-ev imp-" + e.impact + (e.minutes > START + SPAN * 0.8 ? " right" : e.minutes < START + SPAN * 0.2 ? " left" : "")}
            style={{ left: pos(e.minutes), zIndex: e.impact === "High" ? 3 : e.impact === "Medium" ? 2 : 1 }}
            aria-label={`${e.et} ET · ${e.title}`}
          >
            <span className="tl-tip" role="tooltip">
              <b className="mono">
                {e.et} ET{e.local ? ` · ${e.local} ${tzShort(tz)}` : ""}
              </b>
              <span>
                {e.country} · {e.title}
              </span>
            </span>
          </Link>
        ))}
      </div>
      <div className="tl-ticks">
        {ticks.map((x) => (
          <span key={x} style={{ left: pos(Number(x.slice(0, 2)) * 60 + Number(x.slice(3))) }}>
            {x}
            {tz !== "America/New_York" && <small suppressHydrationWarning>{local(x)}</small>}
          </span>
        ))}
      </div>
    </section>
  );
}
