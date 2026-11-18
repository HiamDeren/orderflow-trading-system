import type { Metadata } from "next";
import { ECON_SOURCE_PAGE, getEconWeek } from "@/lib/econ";
import { DATE_RE, etNow } from "@/lib/time";
import CalendarView from "./CalendarView";

export const metadata: Metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const { day } = await searchParams;
  const today = etNow().date;
  const econ = await getEconWeek();
  const dates = [...new Set(econ.events.map((e) => e.dateEt))];
  const initialDay = day && DATE_RE.test(day) && dates.includes(day) ? day : dates.includes(today) ? today : dates[0] || today;
  const fetched = econ.fetchedAt ? new Date(econ.fetchedAt) : null;

  return (
    <>
      <header className="page-head">
        <div>
          <span className="lbl">Tổng quan</span>
          <h1 className="h1">Calendar</h1>
        </div>
        <span className="hstack small muted" style={{ gap: 8 }}>
          <span className={"dot " + (econ.ok ? "ok" : "err")} aria-hidden="true" />
          {econ.ok
            ? fetched
              ? <>Nguồn cập nhật lúc <span className="mono">{fetched.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })} VN</span></>
              : "Nguồn đã tải"
            : "Nguồn lỗi"}
        </span>
      </header>
      {econ.ok ? (
        <CalendarView events={econ.events} today={today} initialDay={initialDay} />
      ) : (
        <section className="card" style={{ maxWidth: 640 }}>
          <span className="lbl">Calendar · API lỗi</span>
          <h2 className="h2">Chưa có lịch tin tuần này</h2>
          <p className="muted" style={{ fontSize: 14 }}>Nguồn đang không phản hồi ({econ.error}). Trước khi vào phiên, kiểm tra tin trực tiếp trên trang nguồn.</p>
          <div className="hstack">
            <a className="btn" href="/calendar">Thử lại</a>
            <a className="btn ghost" href={ECON_SOURCE_PAGE} target="_blank" rel="noreferrer">Mở trang nguồn</a>
          </div>
        </section>
      )}
    </>
  );
}
