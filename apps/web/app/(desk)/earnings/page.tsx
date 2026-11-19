import type { Metadata } from "next";
import Link from "next/link";
import { NQ_WATCH, getEarnings } from "@/lib/market";
import { getT } from "@/lib/prefs-server";
import { DATE_RE, MONTH_RE, addDays, etNow, monthRange, shiftMonth } from "@/lib/time";
import { NotConfigured } from "../_components/States";
import EarningsView from "./EarningsView";

export const metadata: Metadata = { title: "Earnings" };
export const dynamic = "force-dynamic";

export default async function EarningsPage({ searchParams }: { searchParams: Promise<{ month?: string; day?: string; week?: string }> }) {
  const sp = await searchParams;
  const today = etNow().date;
  // ?week= cũ vẫn dùng được: lấy tháng của ngày đó
  const pick = sp.day && DATE_RE.test(sp.day) ? sp.day : sp.week && DATE_RE.test(sp.week) ? sp.week : "";
  const month = sp.month && MONTH_RE.test(sp.month) ? sp.month : pick ? pick.slice(0, 7) : today.slice(0, 7);
  const { start, days } = monthRange(month);
  const end = addDays(start, days - 1);
  const { t } = await getT();
  const res = await getEarnings(start, end);
  const [y, mo] = month.split("-");
  const initialDay = pick && pick.startsWith(month) ? pick : today.startsWith(month) ? today : "";
  return (
    <>
      <header className="page-head">
        <div>
          <span className="lbl">{t("Thị trường")}</span>
          <h1 className="h1">Earnings</h1>
        </div>
        <div className="hstack" style={{ gap: 6 }}>
          <Link className="btn icon" aria-label={t("Tháng trước")} href={`/earnings?month=${shiftMonth(month, -1)}`}>‹</Link>
          <span style={{ fontSize: 14, fontWeight: 600, minWidth: 120, textAlign: "center" }}>{t("Tháng {m} · {y}", { m: Number(mo), y })}</span>
          <Link className="btn icon" aria-label={t("Tháng sau")} href={`/earnings?month=${shiftMonth(month, 1)}`}>›</Link>
          {today.slice(0, 7) !== month && <Link className="btn sm" href="/earnings">{t("Tháng này")}</Link>}
        </div>
      </header>
      {!res.configured ? (
        <NotConfigured what="Earnings" />
      ) : !res.ok ? (
        <div className="notice">{t("Không tải được earnings")}: {res.error}</div>
      ) : (
        <EarningsView key={month} month={month} items={res.items} watch={NQ_WATCH} today={today} initialDay={initialDay} />
      )}
    </>
  );
}
