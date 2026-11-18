"use client";
// Thành phần nhỏ dùng chung cho News / Earnings (cần ngôn ngữ + múi giờ của người dùng).
import type { Earning, NewsItem } from "@/lib/market";
import { fmtMoney } from "@/lib/market";
import { tzShort } from "@/lib/prefs";
import { fmtTime } from "@/lib/time";
import Icon from "./Icon";
import { useUi } from "./Ui";

export function ago(ts: number, now: number, t: (s: string, v?: Record<string, string | number>) => string) {
  const m = Math.max(0, Math.round((now - ts) / 60000));
  if (m < 60) return t("{n} phút trước", { n: m });
  const h = Math.round(m / 60);
  if (h < 24) return t("{n} giờ trước", { n: h });
  return t("{n} ngày trước", { n: Math.round(h / 24) });
}

export function NewsRow({ n, now, compact }: { n: NewsItem; now: number; compact?: boolean }) {
  const { t, tz } = useUi();
  return (
    <a className={"news" + (compact ? " compact" : "")} href={n.url} target="_blank" rel="noreferrer noopener">
      <span className="news-meta">
        <span className="mono">{fmtTime(n.ts, tz, !compact)} {compact ? "" : tzShort(tz)}</span>
        <span>· {n.source}</span>
        <span className="dim">· {ago(n.ts, now, t)}</span>
      </span>
      <span className="news-h">{n.headline}</span>
      {!compact && n.summary && <span className="news-s">{n.summary}</span>}
      {!compact && (
        <span className="news-go small"><Icon name="external" size={14} /> {t("Mở bài gốc")}</span>
      )}
    </a>
  );
}

export function hourLabel(h: Earning["hour"], t: (s: string) => string) {
  return h === "bmo" ? t("Trước mở cửa") : h === "amc" ? t("Sau đóng cửa") : h === "dmh" ? t("Trong phiên") : "—";
}

export function EarningRow({ e }: { e: Earning }) {
  const { t } = useUi();
  const beat = e.epsActual !== null && e.epsEstimate !== null ? (e.epsActual >= e.epsEstimate ? "long" : "short") : "";
  return (
    <div className="ern">
      <span className="mono ern-s">{e.symbol}</span>
      <span className={"pill ern-h" + (e.hour === "amc" ? " accent" : "")}>{hourLabel(e.hour, t)}</span>
      <span className="ern-n mono small">
        <span className="dim">EPS</span> <span className={beat}>{e.epsActual ?? "—"}</span> / {e.epsEstimate ?? "—"}
      </span>
      <span className="ern-n mono small">
        <span className="dim">Rev</span> {fmtMoney(e.revenueActual)} / {fmtMoney(e.revenueEstimate)}
      </span>
    </div>
  );
}
