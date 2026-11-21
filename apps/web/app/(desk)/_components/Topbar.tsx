"use client";
// Thanh trên mọi trang (desktop): giờ NY / theo múi giờ chọn, tin mạnh kế tiếp + đếm ngược, tìm nhanh (Ctrl K), múi giờ, VI / EN.
import Link from "next/link";
import { useEffect, useState } from "react";
import { tzShort } from "@/lib/prefs";
import { fmtTime } from "@/lib/time";
import Icon from "./Icon";
import LangSwitch from "./LangSwitch";
import TzPicker from "./TzPicker";
import { useUi } from "./Ui";

export type NextEvent = { ts: number; title: string; country: string; dateLocal: string };

function useNow(every = 15000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), every);
    return () => clearInterval(id);
  }, [every]);
  return now;
}

const pad = (n: number) => String(n).padStart(2, "0");
export function countdown(ms: number) {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m >= 24 * 60) return `${Math.floor(m / 1440)}d ${pad(Math.floor((m % 1440) / 60))}h`;
  return `${Math.floor(m / 60)}:${pad(m % 60)}`;
}

export default function Topbar({ events, onSearch, guest = false }: { events: NextEvent[]; onSearch: () => void; guest?: boolean }) {
  const { t, tz } = useUi();
  const now = useNow();
  const next = now === null ? null : events.find((e) => e.ts > now - 60000) || null;
  const showLocal = tz !== "America/New_York";
  return (
    <header className="topbar">
      <div className="tb-clocks mono" suppressHydrationWarning>
        <span>
          <b>NY</b>
          {now === null ? "--:--" : fmtTime(now, "America/New_York", false)}
        </span>
        {showLocal && (
          <span>
            <b>{tzShort(tz)}</b>
            {now === null ? "--:--" : fmtTime(now, tz, false)}
          </span>
        )}
      </div>
      {next && now !== null ? (
        <Link
          className="tb-next"
          href={`/calendar?day=${next.dateLocal}`}
          title={`${fmtTime(next.ts, tz, true)} ${tzShort(tz)} · ${next.country} · ${next.title}`}
        >
          <span className="tb-dot" aria-hidden="true" />
          <span className="tb-next-t">
            {t("Tin mạnh kế tiếp")}: <b>{next.title}</b>
          </span>
          <span className="mono tb-cd">{next.ts <= now ? t("đang ra") : countdown(next.ts - now)}</span>
        </Link>
      ) : (
        <span className="small dim">{t("Không còn tin mạnh trong tuần")}</span>
      )}
      <div className="tb-right">
        <button className="tb-search" onClick={onSearch} aria-label={t("Tìm nhanh")}>
          <Icon name="search" size={15} />
          <span>{guest ? t("Mã cổ phiếu, tên trang…") : t("Mã, trang, ngày journal…")}</span>
          <kbd className="mono">Ctrl K</kbd>
        </button>
        <TzPicker />
        <LangSwitch />
      </div>
    </header>
  );
}
