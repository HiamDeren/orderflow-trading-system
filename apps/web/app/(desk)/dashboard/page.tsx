import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { getViewer } from "@/lib/auth";
import { errText } from "@/lib/db";
import { ECON_SOURCE_PAGE, getEconWeek, localize, topImpact, type EconEvent } from "@/lib/econ";
import { IMPACT_RANK, PREFS_COOKIE, matches, parsePrefs } from "@/lib/econ-prefs";
import { DOW, DOW_SHORT } from "@/lib/i18n";
import { NQ_WATCH, getEarnings, getNews, marketConfigured } from "@/lib/market";
import { planImageSrc } from "@/lib/plan-url";
import { fmtPx, getPlan, planView, type PlanView } from "@/lib/plans";
import { dayNet, getRecentDays } from "@/lib/journal";
import { getT } from "@/lib/prefs-server";
import { getQuotes } from "@/lib/stock";
import { PLAN_SEND, addDays, dowOf, etNow, isWeekday, mondayOf, nowIn, viDate, viDayMonth } from "@/lib/time";
import CopyImage from "../_components/CopyImage";
import { EventLine } from "../_components/EventRow";
import { Timeline } from "../_components/Live";
import { NewsRow } from "../_components/MarketBits";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

type T = (s: string, v?: Record<string, string | number>) => string;
const BIAS_LABEL = { long: "Long", short: "Short", flat: "Trung tính" } as const;
const MAX_LINES = 6;
const WATCH = ["NVDA", "MSFT", "AAPL", "AMZN", "META", "AVGO", "GOOGL", "TSLA"];

async function safe<V>(p: Promise<V>): Promise<{ ok: true; v: V } | { ok: false; error: string }> {
  try {
    return { ok: true, v: await p };
  } catch (e) {
    return { ok: false, error: errText(e) };
  }
}

export default async function DashboardPage() {
  const nowMs = Date.now();
  const et = etNow(new Date(nowMs));
  const today = et.date;
  const { t, ui } = await getT();
  const localToday = nowIn(ui.tz, new Date(nowMs)).date;
  const mon = mondayOf(today);
  // Khách (D48) không xem plan / journal: không đọc database
  const isOwner = (await getViewer())?.role === "owner";

  const [planRes, econ, news, earn, quotes, recent] = await Promise.all([
    isOwner ? safe(getPlan(today).then((r) => (r ? planView(r) : null))) : safe(Promise.resolve(null)),
    getEconWeek(),
    getNews("general", 6),
    getEarnings(mon, addDays(mon, 4)),
    getQuotes(WATCH),
    isOwner ? safe(getRecentDays(5)) : safe(Promise.resolve([] as Awaited<ReturnType<typeof getRecentDays>>)),
  ]);

  const prefs = parsePrefs((await cookies()).get(PREFS_COOKIE)?.value);
  const events = localize(econ.events, ui.tz).filter((e) => matches(prefs, e));
  const todayEvents = events.filter((e) => e.dateLocal === localToday);
  // Gọn cho dashboard: ưu tiên tin mạnh, rồi theo giờ
  const lines = [...todayEvents]
    .sort((a, b) => IMPACT_RANK[b.impact] - IMPACT_RANK[a.impact] || a.ts - b.ts)
    .slice(0, MAX_LINES)
    .sort((a, b) => a.ts - b.ts);
  const weekDays = [0, 1, 2, 3, 4].map((i) => addDays(mondayOf(localToday), i));
  const week = weekDays.map((d) => {
    const list = events.filter((e) => e.dateLocal === d);
    return { d, n: list.length, top: topImpact(list) };
  });
  const tl = events
    .filter((e) => e.dateEt === today && !e.allDay)
    .map((e) => {
      const [h, m] = e.timeEt.split(":").map(Number);
      return {
        id: e.id,
        minutes: h * 60 + m,
        impact: e.impact,
        title: e.title,
        country: e.country,
        et: e.timeEt,
        local: ui.tz === "America/New_York" ? "" : e.timeLocal,
        href: `/calendar?day=${e.dateLocal}`,
      };
    });
  const nqEarn = earn.items.filter((e) => NQ_WATCH.includes(e.symbol));

  return (
    <>
      <header className="page-head">
        <div>
          <span className="lbl">
            {DOW[ui.lang][et.dow]} · {viDate(today)}
          </span>
          <h1 className="h1">Dashboard</h1>
        </div>
        {isOwner && (
          <Link className="btn primary" href="/trade-plan">
            {t("Mở Trade Plan")}
          </Link>
        )}
      </header>

      <Timeline initial={nowMs} events={tl} today={today} />

      <div className={"dash-grid" + (isOwner ? "" : " solo")}>
        {isOwner && (
          <div className="dash-plan">
            {planRes.ok ? (
              planRes.v ? (
                <PlanCard p={planRes.v} t={t} />
              ) : (
                <NoPlan t={t} weekday={isWeekday(today)} late={et.minutes >= PLAN_SEND + 5} />
              )
            ) : (
              <section className="card warn">
                <span className="lbl short">{t("Plan hôm nay · lỗi đọc database")}</span>
                <p className="small" style={{ color: "#d9cfc9" }}>
                  {planRes.error}
                </p>
              </section>
            )}
          </div>
        )}

        <section className="card dash-cal" aria-label={t("Lịch hôm nay")}>
          <div className="row">
            <span className="lbl">
              {t("Lịch hôm nay")} · {prefs.cur.length === 9 ? t("mọi currency") : prefs.cur.join(", ") || "—"}
            </span>
            <Link href="/calendar" className="small" style={{ fontWeight: 600 }}>
              Calendar
            </Link>
          </div>
          {!econ.ok ? (
            <div className="stack" style={{ gap: 8 }}>
              <div className="notice">{t("Không tải được lịch tin")}</div>
              <a className="small" href={ECON_SOURCE_PAGE} target="_blank" rel="noreferrer">
                {t("Mở trang nguồn")}
              </a>
            </div>
          ) : lines.length ? (
            <div className="evl-list">
              {lines.map((e: EconEvent) => (
                <EventLine key={e.id} e={e} />
              ))}
              {todayEvents.length > lines.length && (
                <Link href={`/calendar?day=${localToday}`} className="small dim" style={{ paddingLeft: 4 }}>
                  {t("+{n} tin khác", { n: todayEvents.length - lines.length })}
                </Link>
              )}
            </div>
          ) : (
            <p className="small dim">{isWeekday(localToday) ? t("Không có tin khớp bộ lọc hôm nay.") : t("Cuối tuần, không có tin.")}</p>
          )}
          <div className="week-strip sm">
            {week.map((w) => (
              <Link
                key={w.d}
                href={`/calendar?day=${w.d}`}
                className={w.d === localToday ? "today" : ""}
                aria-label={`${DOW[ui.lang][dowOf(w.d)]} ${viDayMonth(w.d)}, ${w.n}`}
              >
                <span className="small dim">{DOW_SHORT[ui.lang][dowOf(w.d)]}</span>
                <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>
                  {w.d.slice(8)}
                </span>
                <span className={"dot" + (w.top ? " imp-" + w.top : "")} style={w.top ? undefined : { background: "transparent" }} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="dash-row">
        <section className="card" aria-label={t("Watchlist · NQ top")}>
          <div className="row">
            <span className="lbl">{t("Watchlist · NQ top")}</span>
            <Link href="/markets" className="small" style={{ fontWeight: 600 }}>
              Markets
            </Link>
          </div>
          {!marketConfigured() ? (
            <p className="small dim">{t("Chưa có FINNHUB_API_KEY trên Vercel.")}</p>
          ) : quotes.length ? (
            <div className="watch">
              {quotes.map((q) => {
                const e = nqEarn.find((x) => x.symbol === q.symbol && x.date >= today);
                return (
                  <Link key={q.symbol} href={`/stock/${q.symbol}`} className="watch-row">
                    <span className="mono" style={{ fontWeight: 600 }}>
                      {q.symbol}
                    </span>
                    <span className="small dim watch-note">{e ? t("Earnings {d}", { d: viDayMonth(e.date) }) : ""}</span>
                    <span className="mono">{q.c.toFixed(2)}</span>
                    <span className={"mono small " + (q.dp === null ? "dim" : q.dp >= 0 ? "long" : "short")}>
                      {q.dp === null ? "—" : (q.dp >= 0 ? "+" : "") + q.dp.toFixed(2) + "%"}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="small dim">{t("Chưa lấy được giá.")}</p>
          )}
        </section>

        <section className="card" aria-label={t("Earnings tuần này · NQ top")}>
          <div className="row">
            <span className="lbl">{t("Earnings tuần này · NQ top")}</span>
            <Link href="/earnings" className="small" style={{ fontWeight: 600 }}>
              {t("Lịch")}
            </Link>
          </div>
          {!earn.ok ? (
            <p className="small dim">{earn.configured ? earn.error : t("Chưa có FINNHUB_API_KEY trên Vercel.")}</p>
          ) : (
            <div className="ewk">
              {[0, 1, 2, 3, 4]
                .map((i) => addDays(mon, i))
                .map((d) => (
                  <div key={d} className={"ewk-d" + (d === today ? " today" : "")}>
                    <span className="small dim">
                      {DOW_SHORT[ui.lang][dowOf(d)]} <b className="mono">{d.slice(8)}</b>
                    </span>
                    {nqEarn
                      .filter((e) => e.date === d)
                      .map((e) => (
                        <Link key={e.symbol} href={`/stock/${e.symbol}`} className={"ern-sym mono nq" + (e.hour === "amc" ? " amc" : "")}>
                          {e.symbol}
                        </Link>
                      ))}
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>

      <div className={"dash-row" + (isOwner ? "" : " solo")}>
        <section className="card" aria-label="News">
          <div className="row">
            <span className="lbl">News</span>
            <Link href="/news" className="small" style={{ fontWeight: 600 }}>
              {t("Xem tất cả")}
            </Link>
          </div>
          {!marketConfigured() ? (
            <p className="small dim">{t("Chưa có FINNHUB_API_KEY trên Vercel.")}</p>
          ) : !news.ok ? (
            <p className="small short">{news.error}</p>
          ) : news.items.length ? (
            <div className="news-list">
              {news.items.slice(0, 5).map((n) => (
                <NewsRow key={n.id} n={n} now={nowMs} compact href={`/news?cat=general&id=${encodeURIComponent(n.id)}`} />
              ))}
            </div>
          ) : (
            <p className="small dim">{t("Chưa có tin.")}</p>
          )}
        </section>

        {isOwner && (
          <section className="card" aria-label="Journal">
            <div className="row">
              <span className="lbl">{t("Journal · 5 phiên gần nhất")}</span>
              <Link href="/journal/pnl" className="small" style={{ fontWeight: 600 }}>
                PnL
              </Link>
            </div>
            {recent.ok ? (
              <>
                <div className="jmini">
                  {[...recent.v].reverse().map((d) => {
                    const n = dayNet(d);
                    const cls = d.result === "No Trade" || !n.n ? "flat" : n.net >= 0 ? "win" : "loss";
                    return (
                      <Link key={d.trade_date} href={`/journal?date=${d.trade_date}`} className={"jmini-d " + cls}>
                        <span className="small dim">{viDayMonth(d.trade_date)}</span>
                        <span className="mono">
                          {!n.n ? (d.result === "No Trade" ? "No trade" : "—") : (n.net >= 0 ? "+$" : "−$") + Math.abs(Math.round(n.net))}
                        </span>
                      </Link>
                    );
                  })}
                  {!recent.v.length && <span className="small dim">{t("Chưa có journal.")}</span>}
                </div>
                {recent.v[0]?.trade_date === today ? (
                  <p className="small muted">{t("Hôm nay đã có journal.")}</p>
                ) : (
                  <p className="small muted">{t("Hôm nay chưa recap. Plan của ngày đã tự gắn vào journal.")}</p>
                )}
                <Link className="btn" href="/journal" style={{ alignSelf: "flex-start" }}>
                  {t("Recap hôm nay")}
                </Link>
              </>
            ) : (
              <p className="small short">{recent.error}</p>
            )}
          </section>
        )}
      </div>
    </>
  );
}

function PlanCard({ p, t }: { p: PlanView; t: T }) {
  const s = p.summary;
  const tone = p.bias;
  const img = p.image_path ? planImageSrc(p.trade_date, p.updated_at) : null;
  return (
    <section className="card" aria-label={t("Plan hôm nay")} style={{ gap: 16 }}>
      <div className="row wrap">
        <div className="stack" style={{ gap: 4 }}>
          <span className="lbl">{t("Plan hôm nay · Composite × pRTH × OVN")}</span>
          <h2 className="h2">
            {p.symbol} · {s?.setup || "Plan"}
          </h2>
        </div>
        <div className="hstack" style={{ gap: 8 }}>
          <span className={"pill " + (tone === "flat" ? "" : tone)}>
            Bias {t(BIAS_LABEL[tone])}
            {s?.conf ? ` · ${s.conf}` : ""}
          </span>
          {s?.location && <span className="pill">{s.location}</span>}
          {s?.price != null && <span className="pill mono">9:29 · {fmtPx(s.price)}</span>}
        </div>
      </div>
      <div className="split" style={{ gap: 18 }}>
        <div style={{ flex: "1 1 300px", minWidth: 0 }} aria-label={t("Các level")}>
          {p.levels.length ? <Ladder levels={p.levels} t={t} /> : <p className="small dim">{t("Không đọc được level từ payload.")}</p>}
        </div>
        <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <a href={img} target="_blank" rel="noreferrer">
              <img className="plan-img" src={img} alt={`Plan ${p.trade_date}`} />
            </a>
          ) : (
            <div className="placeholder" style={{ height: 180 }}>
              {t("Chưa có ảnh plan")}
            </div>
          )}
          {img && (
            <div className="hstack">
              <CopyImage src={img} small />
            </div>
          )}
          <div className="stack" style={{ gap: 8, fontSize: 13, color: "var(--text-2)" }}>
            {s?.target != null && (
              <div className="hstack" style={{ alignItems: "baseline", flexWrap: "nowrap" }}>
                <span className="long" style={{ fontWeight: 600, minWidth: 64 }}>
                  Target
                </span>
                <span>
                  {fmtPx(s.target)}
                  {s.distance != null ? ` · ${t("cách giá 9:29 {n} điểm", { n: fmtPx(s.distance) })}` : ""}
                </span>
              </div>
            )}
            {s?.flip && (
              <div className="hstack" style={{ alignItems: "baseline", flexWrap: "nowrap" }}>
                <span className="short" style={{ fontWeight: 600, minWidth: 64 }}>
                  {t("Đổi bias")}
                </span>
                <span>{s.flip}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="row wrap" style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
        <div className="hstack small muted" style={{ gap: 16 }}>
          <span>
            {t("Cập nhật")}{" "}
            <span className="mono" style={{ color: "var(--text)" }}>
              {new Date(p.updated_at).toLocaleTimeString("en-GB", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit" })} ET
            </span>
          </span>
          <span className="hstack" style={{ gap: 6 }}>
            <span className="dot ok" aria-hidden="true" />
            Database
          </span>
          <span className="hstack" style={{ gap: 6 }}>
            <span className={"dot " + (p.image_path ? "ok" : "err")} aria-hidden="true" />
            Storage
          </span>
        </div>
        <Link href={`/trade-plan?date=${p.trade_date}`} className="small" style={{ fontWeight: 600 }}>
          {t("Xem chi tiết plan")}
        </Link>
      </div>
    </section>
  );
}

function NoPlan({ t, weekday, late }: { t: T; weekday: boolean; late: boolean }) {
  if (!weekday)
    return (
      <section className="card">
        <span className="lbl">{t("Plan hôm nay")}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="empty-art" src="/assets/img/zendojo/empty.webp" alt="" aria-hidden="true" />
        <h2 className="h2">{t("Cuối tuần, không có phiên")}</h2>
        <p className="muted small">{t("Dùng thời gian này để recap tuần trong Journal.")}</p>
        <div className="hstack">
          <Link className="btn" href="/journal">
            Journal
          </Link>
        </div>
      </section>
    );
  if (late)
    return (
      <section className="card warn" aria-label={t("Chưa nhận plan")}>
        <span className="lbl short">{t("Quá giờ mà chưa nhận plan")}</span>
        <h2 className="h2">{t("Chưa nhận plan từ ATAS")}</h2>
        <ul className="small" style={{ margin: 0, paddingLeft: 18, color: "#d9cfc9", lineHeight: 1.6 }}>
          <li>{t("ATAS đang mở chart NQ M30 và indicator Plan Sender đang bật?")}</li>
          <li>{t("Tuỳ chọn gửi web trong indicator có bật, đúng API URL?")}</li>
          <li>{t("Xem log indicator: cần thấy HTTP 200")}</li>
        </ul>
        <Link className="btn danger" href="/trade-plan" style={{ alignSelf: "flex-start" }}>
          {t("Gửi tay bằng JSON")}
        </Link>
      </section>
    );
  return (
    <section className="card" aria-label={t("Chưa có plan")}>
      <span className="lbl">{t("Plan hôm nay")}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="empty-art" src="/assets/img/zendojo/empty.webp" alt="" aria-hidden="true" />
      <h2 className="h2">{t("Chưa có plan hôm nay")}</h2>
      <p className="muted" style={{ fontSize: 14 }}>
        {t("ATAS X thường gửi lúc 09:29 ET. Có thể gửi tay trước nếu đã có JSON.")}
      </p>
      <div className="hstack">
        <Link className="btn primary" href="/trade-plan">
          {t("Mở Trade Plan")}
        </Link>
      </div>
    </section>
  );
}

// Thang bậc giá: vạch đặt đúng tỷ lệ giá bên trái, nhãn giãn ra cho khỏi đè nhau và nối về vạch
const LH = 400;
const GAP = 24;
function Ladder({ levels, t }: { levels: PlanView["levels"]; t: T }) {
  const sorted = [...levels].sort((a, b) => b.px - a.px);
  const hi = sorted[0].px;
  const lo = sorted[sorted.length - 1].px;
  const span = hi - lo || 1;
  const real = sorted.map((l) => 12 + ((hi - l.px) / span) * (LH - 24));
  const lab = [...real];
  for (let i = 1; i < lab.length; i++) if (lab[i] - lab[i - 1] < GAP) lab[i] = lab[i - 1] + GAP;
  const over = lab[lab.length - 1] - (LH - 12);
  if (over > 0) {
    for (let i = lab.length - 1; i >= 0; i--) lab[i] -= over;
    for (let i = lab.length - 2; i >= 0; i--) if (lab[i + 1] - lab[i] < GAP) lab[i] = lab[i + 1] - GAP;
  }
  const h = Math.max(LH, lab[lab.length - 1] + 14 - Math.min(0, lab[0] - 12));
  const shift = Math.min(0, lab[0] - 12);
  return (
    <div className="ladder" style={{ height: h }} role="img" aria-label={sorted.map((l) => `${t(l.name)} ${fmtPx(l.px)}`).join(", ")}>
      <svg className="ladder-svg" width="64" height={h} aria-hidden="true">
        <line x1="14" x2="14" y1="6" y2={h - 6} className="ladder-axis" />
        {sorted.map((l, i) => (
          <g key={i} className={"lk-" + l.kind}>
            <line x1="6" x2="22" y1={real[i] - shift} y2={real[i] - shift} />
            <line x1="22" x2="62" y1={real[i] - shift} y2={lab[i] - shift} className="ladder-conn" />
          </g>
        ))}
      </svg>
      {sorted.map((l, i) => (
        <div key={i} className={"lvl ladder-l " + l.kind} style={{ top: lab[i] - shift }}>
          <span>{t(l.name)}</span>
          <span className="mono">{fmtPx(l.px)}</span>
        </div>
      ))}
    </div>
  );
}
