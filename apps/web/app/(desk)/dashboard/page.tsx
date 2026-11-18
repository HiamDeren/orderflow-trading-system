import type { Metadata } from "next";
import Link from "next/link";
import { errText } from "@/lib/db";
import { ECON_SOURCE_PAGE, getEconWeek, topImpact, type EconEvent } from "@/lib/econ";
import { getDay } from "@/lib/journal";
import { fmtPx, getLatestPlanBefore, getPlan, planView, type PlanView } from "@/lib/plans";
import { DOW_SHORT, DOW_VI, PLAN_SEND, addDays, dowOf, etNow, isWeekday, viDate, viDayMonth } from "@/lib/time";
import EventRow from "../_components/EventRow";
import { Clock, Timeline } from "../_components/Live";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const BIAS_LABEL = { long: "Long", short: "Short", flat: "Trung tính" } as const;

async function safe<T>(p: Promise<T>): Promise<{ ok: true; v: T } | { ok: false; error: string }> {
  try {
    return { ok: true, v: await p };
  } catch (e) {
    return { ok: false, error: errText(e) };
  }
}

function weekDates(today: string) {
  const w = dowOf(today);
  const monday = addDays(today, w === 0 ? 1 : w === 6 ? 2 : 1 - w);
  return [0, 1, 2, 3, 4].map((i) => addDays(monday, i));
}

export default async function DashboardPage() {
  const nowMs = Date.now();
  const et = etNow(new Date(nowMs));
  const today = et.date;

  const [planRes, econ, prevRes] = await Promise.all([
    safe(getPlan(today).then((r) => (r ? planView(r) : null))),
    getEconWeek(),
    safe(getLatestPlanBefore(today)),
  ]);
  const prevPlan = prevRes.ok ? prevRes.v : null;
  const prevJournal = prevPlan ? await safe(getDay(prevPlan.trade_date)) : null;
  const needRecap = !!prevPlan && !!prevJournal?.ok && !prevJournal.v;

  const todayEvents = econ.events.filter((e) => e.dateEt === today);
  const week = weekDates(today).map((d) => {
    const list = econ.events.filter((e) => e.dateEt === d);
    return { d, list, top: topImpact(list) };
  });
  const tl = todayEvents
    .filter((e) => !e.allDay && e.impact !== "Thấp")
    .map((e) => {
      const [h, m] = e.timeEt.split(":").map(Number);
      return { id: e.id, minutes: h * 60 + m, impact: e.impact, title: `${e.timeEt} · ${e.title}` };
    });

  return (
    <>
      <header className="page-head">
        <div>
          <span className="lbl">{DOW_VI[et.dow]} · {viDate(today)}</span>
          <h1 className="h1">Dashboard</h1>
        </div>
        <div className="hstack">
          <Clock initial={nowMs} />
          <Link className="btn primary" href="/studio">Mở Plan Studio</Link>
        </div>
      </header>

      <Timeline initial={nowMs} events={tl} today={today} />

      <div className="split">
        <div style={{ flex: "2 1 560px", minWidth: 0 }}>
          {planRes.ok ? (
            planRes.v ? (
              <PlanCard p={planRes.v} />
            ) : (
              <NoPlan weekday={isWeekday(today)} late={et.minutes >= PLAN_SEND + 5} />
            )
          ) : (
            <section className="card warn">
              <span className="lbl short">Plan hôm nay · lỗi đọc database</span>
              <p className="small" style={{ color: "#d9cfc9" }}>{planRes.error}</p>
              <Link className="btn sm" href="/studio" style={{ alignSelf: "flex-start" }}>Mở Plan Studio</Link>
            </section>
          )}
        </div>

        <section className="card" aria-label="Tin hôm nay" style={{ flex: "1 1 340px" }}>
          <div className="row">
            <span className="lbl">Tin USD hôm nay</span>
            <Link href="/calendar" className="small" style={{ fontWeight: 600 }}>Mở Calendar</Link>
          </div>
          {!econ.ok ? (
            <div className="stack" style={{ gap: 10 }}>
              <div className="notice">Không tải được lịch tin ({econ.error}).</div>
              <a className="btn sm ghost" href={ECON_SOURCE_PAGE} target="_blank" rel="noreferrer" style={{ alignSelf: "flex-start" }}>Mở trang nguồn</a>
            </div>
          ) : todayEvents.length ? (
            <div className="stack" style={{ gap: 8 }}>
              {todayEvents.map((e: EconEvent) => <EventRow key={e.id} e={e} showNums={false} />)}
            </div>
          ) : (
            <p className="small dim">{isWeekday(today) ? "Không có tin USD hôm nay." : "Cuối tuần, không có tin."}</p>
          )}
          <div className="stack" style={{ gap: 8, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
            <span className="lbl">Tuần này</span>
            <div className="week-strip">
              {week.map((w) => (
                <Link key={w.d} href={`/calendar?day=${w.d}`} className={w.d === today ? "today" : ""} aria-label={`${DOW_VI[dowOf(w.d)]} ${viDayMonth(w.d)}, ${w.list.length} tin`}>
                  <span className="small dim">{DOW_SHORT[dowOf(w.d)]}</span>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{w.d.slice(8)}</span>
                  <span className={"dot" + (w.top ? " imp-" + w.top : "")} style={w.top ? undefined : { background: "transparent" }} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="grid-auto">
        <section className="card" aria-label="Journal">
          <span className="lbl">Journal</span>
          {needRecap && prevPlan ? (
            <>
              <h3 className="h3">{viDayMonth(prevPlan.trade_date)} chưa recap</h3>
              <p className="small muted">Ghi day type, kết quả và bài học trong lúc còn nhớ rõ. Plan của ngày đó đã gắn sẵn vào trang journal.</p>
              <Link className="btn" href={`/journal?date=${prevPlan.trade_date}`} style={{ alignSelf: "flex-start" }}>Recap {viDayMonth(prevPlan.trade_date)}</Link>
            </>
          ) : (
            <>
              <h3 className="h3">Journal đã cập nhật</h3>
              <p className="small muted">Sau phiên, mở journal hôm nay để ghi lệnh và bài học.</p>
              <Link className="btn" href={`/journal?date=${today}`} style={{ alignSelf: "flex-start" }}>Journal hôm nay</Link>
            </>
          )}
        </section>
        <section className="card dashed" aria-label="Options sắp có" style={{ justifyContent: "center" }}>
          <span className="lbl">Options · sắp có</span>
          <p className="small dim">Chỗ cho GEX / DEX / OI khi có API. Widget sẽ nằm ở đây.</p>
        </section>
      </div>
    </>
  );
}

function PlanCard({ p }: { p: PlanView }) {
  const s = p.summary;
  const tone = p.bias;
  return (
    <section className="card" aria-label="Plan hôm nay" style={{ gap: 16 }}>
      <div className="row wrap">
        <div className="stack" style={{ gap: 4 }}>
          <span className="lbl">Plan hôm nay · Composite × pRTH × OVN</span>
          <h2 className="h2">{p.symbol} · {s?.setup || "Plan"}</h2>
        </div>
        <div className="hstack" style={{ gap: 8 }}>
          <span className={"pill " + (tone === "flat" ? "" : tone)}>Bias {BIAS_LABEL[tone]}{s?.conf ? ` · ${s.conf}` : ""}</span>
          {s?.location && <span className="pill">{s.location}</span>}
          {s?.price != null && <span className="pill mono">9:29 · {fmtPx(s.price)}</span>}
        </div>
      </div>
      <div className="split" style={{ gap: 18 }}>
        <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: 2 }} aria-label="Các level">
          {p.levels.length ? (
            p.levels.map((l, i) => (
              <div key={i} className={"lvl " + l.kind}>
                <span>{l.name}</span>
                <span className="mono">{fmtPx(l.px)}</span>
              </div>
            ))
          ) : (
            <p className="small dim">Không đọc được level từ payload.</p>
          )}
        </div>
        <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <a href={p.imageUrl} target="_blank" rel="noreferrer"><img className="plan-img" src={p.imageUrl} alt={`Ảnh plan ${p.trade_date}`} /></a>
          ) : (
            <div className="placeholder" style={{ height: 180 }}>Chưa có ảnh plan</div>
          )}
          <div className="stack" style={{ gap: 8, fontSize: 13, color: "var(--text-2)" }}>
            {s?.target != null && (
              <div className="hstack" style={{ alignItems: "baseline", flexWrap: "nowrap" }}>
                <span className="long" style={{ fontWeight: 600, minWidth: 64 }}>Target</span>
                <span>{fmtPx(s.target)}{s.distance != null ? ` · cách giá 9:29 ${fmtPx(s.distance)} điểm` : ""}</span>
              </div>
            )}
            {s?.flip && (
              <div className="hstack" style={{ alignItems: "baseline", flexWrap: "nowrap" }}>
                <span className="short" style={{ fontWeight: 600, minWidth: 64 }}>Đổi bias</span>
                <span>{s.flip}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="row wrap" style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
        <div className="hstack small muted" style={{ gap: 16 }}>
          <span>Cập nhật <span className="mono" style={{ color: "var(--text)" }}>{new Date(p.updated_at).toLocaleTimeString("vi-VN", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit" })} ET</span></span>
          <span className="hstack" style={{ gap: 6 }}><span className="dot ok" aria-hidden="true" />Database</span>
          <span className="hstack" style={{ gap: 6 }}><span className={"dot " + (p.image_path ? "ok" : "err")} aria-hidden="true" />Storage</span>
        </div>
        <Link href={`/studio?date=${p.trade_date}`} className="small" style={{ fontWeight: 600 }}>Xem chi tiết plan</Link>
      </div>
    </section>
  );
}

function NoPlan({ weekday, late }: { weekday: boolean; late: boolean }) {
  if (!weekday)
    return (
      <section className="card">
        <span className="lbl">Plan hôm nay</span>
        <h2 className="h2">Cuối tuần, không có phiên</h2>
        <p className="muted small">Dùng thời gian này để recap tuần trong Journal hoặc xem PnL Calendar.</p>
        <div className="hstack"><Link className="btn" href="/journal">Mở Journal</Link><Link className="btn" href="/pnl">PnL Calendar</Link></div>
      </section>
    );
  if (late)
    return (
      <section className="card warn" aria-label="Chưa nhận plan">
        <span className="lbl short">Quá giờ mà chưa nhận plan</span>
        <h2 className="h2">Chưa nhận plan từ ATAS</h2>
        <ul className="small" style={{ margin: 0, paddingLeft: 18, color: "#d9cfc9", lineHeight: 1.6 }}>
          <li>ATAS đang mở chart NQ M30 và indicator Plan Sender đang bật?</li>
          <li>Tuỳ chọn gửi web trong indicator có bật, đúng API URL?</li>
          <li>Xem log indicator: cần thấy <span className="mono">HTTP 200</span></li>
        </ul>
        <Link className="btn danger" href="/studio" style={{ alignSelf: "flex-start" }}>Gửi tay bằng JSON</Link>
      </section>
    );
  return (
    <section className="card" aria-label="Chưa có plan">
      <span className="lbl">Plan hôm nay</span>
      <h2 className="h2">Chưa có plan hôm nay</h2>
      <p className="muted" style={{ fontSize: 14 }}>
        ATAS X thường gửi lúc <span className="mono" style={{ color: "var(--text)" }}>09:29 ET</span>. Có thể gửi tay trước nếu đã có JSON.
      </p>
      <div className="hstack"><Link className="btn primary" href="/studio">Mở Plan Studio</Link></div>
    </section>
  );
}
