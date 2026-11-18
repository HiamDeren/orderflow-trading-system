import type { Metadata } from "next";
import Link from "next/link";
import { errText } from "@/lib/db";
import { dayNet, getDaysBetween, type DayWithTrades } from "@/lib/journal";
import { MONTH_RE, addDays, dowOf, etNow, monthRange, shiftMonth } from "@/lib/time";
import PnlView, { type PnlDay, type PnlWeek } from "./PnlView";

export const metadata: Metadata = { title: "PnL Calendar" };
export const dynamic = "force-dynamic";

export default async function PnlPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const q = await searchParams;
  const today = etNow().date;
  const month = q.month && MONTH_RE.test(q.month) ? q.month : today.slice(0, 7);
  const { start, days } = monthRange(month);
  const end = addDays(start, days - 1);
  // Lưới theo tuần (Thứ 2 → Chủ nhật), chỉ vẽ Thứ 2–6; lệnh cuối tuần cộng vào tổng tuần.
  const gridStart = addDays(start, -((dowOf(start) + 6) % 7));
  const gridEnd = addDays(end, (7 - dowOf(end)) % 7);

  let error = "";
  let rows: DayWithTrades[] = [];
  try {
    rows = await getDaysBetween(gridStart, addDays(gridEnd, 1));
  } catch (e) {
    error = errText(e);
  }
  const byDate = new Map(rows.map((d) => [d.trade_date, d]));

  const weeks: PnlWeek[] = [];
  for (let w = gridStart; w <= gridEnd; w = addDays(w, 7)) {
    const week: PnlWeek = { days: [], net: 0, r: 0, n: 0, traded: 0 };
    for (let i = 0; i < 7; i++) {
      const d = addDays(w, i);
      const j = d >= start && d <= end ? byDate.get(d) : undefined;
      const s = j ? dayNet(j) : { net: 0, r: 0, n: 0 };
      if (s.n) {
        week.net += s.net;
        week.r += s.r;
        week.n += s.n;
        week.traded += 1;
      }
      if (i < 5) {
        const inMonth = d >= start && d <= end;
        const cell: PnlDay = inMonth
          ? { date: d, net: s.net, r: s.r, n: s.n, has: !!j, result: j?.result ?? null }
          : { date: null, net: 0, r: 0, n: 0, has: false, result: null };
        week.days.push(cell);
      }
    }
    weeks.push(week);
  }

  const [y, m] = month.split("-");
  return (
    <>
      <header className="page-head">
        <div>
          <span className="lbl">Giao dịch</span>
          <h1 className="h1">PnL Calendar</h1>
        </div>
        <div className="hstack" style={{ gap: 6 }}>
          <Link className="btn icon" aria-label="Tháng trước" href={`/pnl?month=${shiftMonth(month, -1)}`}>‹</Link>
          <span style={{ fontSize: 14, fontWeight: 600, minWidth: 120, textAlign: "center" }}>Tháng {Number(m)} · {y}</span>
          {month < today.slice(0, 7) ? (
            <Link className="btn icon" aria-label="Tháng sau" href={`/pnl?month=${shiftMonth(month, 1)}`}>›</Link>
          ) : (
            <span className="btn icon" aria-disabled="true" style={{ opacity: 0.4 }}>›</span>
          )}
        </div>
      </header>
      {error ? (
        <div className="notice">Không đọc được journal: {error}</div>
      ) : (
        <PnlView weeks={weeks} today={today} />
      )}
    </>
  );
}
