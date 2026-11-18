import type { Metadata } from "next";
import Link from "next/link";
import { NQ_WATCH, getEarnings } from "@/lib/market";
import { getT } from "@/lib/prefs-server";
import { DATE_RE, addDays, etNow, mondayOf, viDayMonth } from "@/lib/time";
import Icon from "../_components/Icon";
import { NotConfigured } from "../_components/States";
import EarningsView from "./EarningsView";

export const metadata: Metadata = { title: "Earnings" };
export const dynamic = "force-dynamic";

export default async function EarningsPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const { week } = await searchParams;
  const today = etNow().date;
  const mon = mondayOf(week && DATE_RE.test(week) ? week : today);
  const fri = addDays(mon, 4);
  const days = [0, 1, 2, 3, 4].map((i) => addDays(mon, i));
  const { t } = await getT();
  const res = await getEarnings(mon, fri);
  return (
    <>
      <header className="page-head">
        <div>
          <span className="lbl">{t("Tổng quan")}</span>
          <h1 className="h1">Earnings</h1>
        </div>
        <div className="hstack" style={{ gap: 6 }}>
          <Link className="btn icon" aria-label={t("Tuần trước")} href={`/earnings?week=${addDays(mon, -7)}`}>‹</Link>
          <span style={{ fontSize: 14, fontWeight: 600, minWidth: 130, textAlign: "center" }}>{viDayMonth(mon)} – {viDayMonth(fri)}</span>
          <Link className="btn icon" aria-label={t("Tuần sau")} href={`/earnings?week=${addDays(mon, 7)}`}>›</Link>
          {mondayOf(today) !== mon && <Link className="btn sm" href="/earnings">{t("Tuần này")}</Link>}
        </div>
      </header>
      {!res.configured ? (
        <NotConfigured what="Earnings" />
      ) : !res.ok ? (
        <div className="notice">{t("Không tải được earnings")}: {res.error}</div>
      ) : (
        <EarningsView days={days} items={res.items} watch={NQ_WATCH} today={today} />
      )}
      <span className="small faint hstack" style={{ gap: 6 }}>
        <Icon name="earnings" size={14} /> {t("Nguồn: Finnhub. NQ top là các mã nặng trong Nasdaq-100 (lib/market.ts).")}
      </span>
    </>
  );
}
