import type { Metadata } from "next";
import { cookies } from "next/headers";
import { PREFS_COOKIE, parsePrefs } from "@/lib/econ-prefs";
import { ECON_SOURCE_PAGE, getEconWeek, localize } from "@/lib/econ";
import { tzShort } from "@/lib/prefs";
import { getT } from "@/lib/prefs-server";
import { DATE_RE, fmtTime, nowIn } from "@/lib/time";
import CalendarView from "./CalendarView";

export const metadata: Metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const { day } = await searchParams;
  const { t, ui } = await getT();
  const today = nowIn(ui.tz).date;
  const econ = await getEconWeek();
  const events = localize(econ.events, ui.tz);
  const prefs = parsePrefs((await cookies()).get(PREFS_COOKIE)?.value);
  const dates = [...new Set(events.map((e) => e.dateLocal))];
  const initialDay = day && DATE_RE.test(day) && dates.includes(day) ? day : dates.includes(today) ? today : dates[0] || today;
  const fetched = econ.fetchedAt ? Date.parse(econ.fetchedAt) : NaN;

  return (
    <>
      <header className="page-head">
        <div>
          <span className="lbl">{t("Tổng quan")}</span>
          <h1 className="h1">Calendar</h1>
        </div>
        <span className="hstack small muted" style={{ gap: 8 }}>
          <span className={"dot " + (econ.ok ? "ok" : "err")} aria-hidden="true" />
          {econ.ok
            ? Number.isFinite(fetched)
              ? <>{t("Nguồn cập nhật lúc")} <span className="mono">{fmtTime(fetched, ui.tz, true)} {tzShort(ui.tz)}</span></>
              : t("Nguồn đã tải")
            : t("Nguồn lỗi")}
          <span className="dim">· ForexFactory</span>
        </span>
      </header>
      {econ.ok ? (
        <CalendarView events={events} today={today} initialDay={initialDay} initialPrefs={prefs} />
      ) : (
        <section className="card" style={{ maxWidth: 640 }}>
          <span className="lbl">{t("Calendar · API lỗi")}</span>
          <h2 className="h2">{t("Chưa có lịch tin tuần này")}</h2>
          <p className="muted" style={{ fontSize: 14 }}>{t("Nguồn đang không phản hồi ({e}). Trước khi vào phiên, kiểm tra tin trực tiếp trên trang nguồn.", { e: econ.error || "" })}</p>
          <div className="hstack">
            <a className="btn" href="/calendar">{t("Thử lại")}</a>
            <a className="btn ghost" href={ECON_SOURCE_PAGE} target="_blank" rel="noreferrer">{t("Mở trang nguồn")}</a>
          </div>
        </section>
      )}
    </>
  );
}
