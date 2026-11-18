import type { Metadata } from "next";
import Link from "next/link";
import { errText } from "@/lib/db";
import { DOW, DOW_SHORT } from "@/lib/i18n";
import { TEXT_FIELDS, dayNet, getDay, getMonth, getRecentDays, statsOf, type DayWithTrades, type Stats } from "@/lib/journal";
import { biasTone, getPlan, type PlanRow } from "@/lib/plans";
import { getT } from "@/lib/prefs-server";
import { DATE_RE, addDays, dowOf, etNow, isWeekday, monthRange, viDayMonth } from "@/lib/time";
import { listImages, type JournalImage } from "@/lib/journal-images";
import JournalEditor from "./JournalEditor";
import JournalImages from "./JournalImages";
import JournalTabs from "./JournalTabs";

export const metadata: Metadata = { title: "Journal" };
export const dynamic = "force-dynamic";

const BIAS = { long: "Long", short: "Short", flat: "Trung tính" } as const;

function lastWeekday(d: string) {
  let x = d;
  while (!isWeekday(x)) x = addDays(x, -1);
  return x;
}

const rFmt = (r: number) => (r > 0 ? "+" : r < 0 ? "−" : "") + Math.abs(r).toFixed(1) + "R";

export default async function JournalPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const q = await searchParams;
  const { t, ui } = await getT();
  const today = etNow().date;
  const date = q.date && DATE_RE.test(q.date) ? q.date : lastWeekday(today);
  const month = date.slice(0, 7);

  let error = "";
  let day: DayWithTrades | null = null;
  let monthDays: DayWithTrades[] = [];
  let stats: Stats | null = null;
  let plan: PlanRow | null = null;
  let images: JournalImage[] = [];
  let imgError = "";
  try {
    const [d, m, recent, p] = await Promise.all([getDay(date), getMonth(month), getRecentDays(20), getPlan(date).catch(() => null)]);
    day = d;
    monthDays = m;
    stats = statsOf(recent);
    plan = p;
  } catch (e) {
    error = errText(e);
  }
  if (!error) {
    try {
      images = await listImages(date);
    } catch (e) {
      // Bảng journal_images chưa có (chưa áp migration) → phần còn lại của Journal vẫn chạy
      imgError = /journal_images|PGRST205|42P01/.test(errText(e)) ? "chưa áp migration journal_images" : errText(e);
    }
  }

  const { start, days } = monthRange(month);
  const byDate = new Map(monthDays.map((d) => [d.trade_date, d]));
  const list: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(start, i);
    if (d > today) continue;
    if (isWeekday(d) || byDate.has(d)) list.push(d);
  }
  const tone = biasTone(plan?.summary?.bias);

  return (
    <>
      <header className="page-head">
        <div>
          <span className="lbl">{t("Giao dịch")}</span>
          <h1 className="h1">Journal</h1>
        </div>
        <div className="hstack">
          <JournalTabs />
          <Link className="btn primary" href={`/journal?date=${lastWeekday(today)}`}>{t("Recap hôm nay")}</Link>
        </div>
      </header>

      {error && <div className="notice">{t("Không đọc được journal")}: {error}</div>}

      <div className="journal-grid">
        <nav className="card tight journal-days" aria-label={t("Danh sách ngày")} style={{ padding: 10 }}>
          <div className="row" style={{ padding: "8px 10px" }}>
            <span className="lbl">{t("Tháng {m} · {y}", { m: Number(month.slice(5)), y: month.slice(0, 4) })}</span>
            <Link className="small" href={`/journal?date=${lastWeekday(addDays(start, -1))}`}>‹ {t("tháng trước")}</Link>
          </div>
          {list.map((d) => {
            const j = byDate.get(d);
            const n = j ? dayNet(j) : null;
            const rc = j?.result === "Win" ? "var(--long)" : j?.result === "Loss" ? "var(--short)" : "var(--muted)";
            return (
              <Link key={d} href={`/journal?date=${d}`} className={"day-link" + (d === date ? " on" : "")} aria-current={d === date ? "page" : undefined}>
                <span className="row">
                  <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{viDayMonth(d)} <span className="dim" style={{ fontWeight: 400 }}>{DOW_SHORT[ui.lang][dowOf(d)]}</span></span>
                  <span className="small" style={{ fontWeight: 600, color: rc }}>{j?.result ? t(j.result) : j ? "—" : ""}</span>
                </span>
                <span className="row">
                  <span className="small dim">{j ? (j.day_type ? t(j.day_type) : t("Chưa chọn day type")) : t("Chưa recap")}</span>
                  <span className="mono small dim">{n && n.n ? rFmt(n.r) : ""}</span>
                </span>
              </Link>
            );
          })}
          {!list.length && <p className="small dim" style={{ padding: 10 }}>{t("Chưa có ngày nào trong tháng.")}</p>}
        </nav>

        <article aria-label={`Journal ${date}`} style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          {(() => {
            const head = (
              <div className="hstack journal-title" style={{ gap: 12, flexWrap: "wrap" }}>
                <h2 className="h2">{DOW[ui.lang][dowOf(date)]} · {viDayMonth(date)}/{date.slice(0, 4)}</h2>
                {plan ? (
                  <Link href={`/trade-plan?date=${date}`} className="hstack small" style={{ fontWeight: 600, gap: 8 }}>
                    <span className={"pill " + (tone === "flat" ? "" : tone)}>Plan · {t(BIAS[tone])}</span>
                    {plan.summary?.location}
                  </Link>
                ) : (
                  <span className="small dim">{t("Ngày này chưa có plan")}</span>
                )}
              </div>
            );
            return error ? (
              <div className="card journal-head">{head}</div>
            ) : (
              <JournalEditor key={date + (day?.updated_at || "")} date={date} initial={day} textFields={TEXT_FIELDS} head={head}>
                <JournalImages key={"img" + date} date={date} initial={images} tradeCount={day?.journal_trades?.length || 0} error={imgError || undefined} />
              </JournalEditor>
            );
          })()}
        </article>

        <aside className="card" aria-label={t("Thống kê")}>
          <span className="lbl">{t("Thống kê · {n} ngày gần nhất", { n: stats?.days || 0 })}</span>
          {stats && stats.days ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                <Tile k="Win rate" v={stats.winRate == null ? "—" : stats.winRate + "%"} />
                <Tile k={t("R TB / lệnh")} v={stats.avgR == null ? "—" : rFmt(stats.avgR)} />
                <Tile k={t("Theo plan")} v={stats.followed == null ? "—" : stats.followed + "%"} />
                <Tile k={t("Bias đúng")} v={stats.biasOk == null ? "—" : stats.biasOk + "%"} />
              </div>
              {stats.byType.length > 0 && (
                <div className="bars">
                  <span className="lbl">{t("R theo day type")}</span>
                  {stats.byType.map((b) => {
                    const max = Math.max(...stats!.byType.map((x) => Math.abs(x.r)), 0.1);
                    const c = b.r >= 0 ? "var(--long)" : "var(--short)";
                    return (
                      <div key={b.name} className="stack" style={{ gap: 5 }}>
                        <div className="row small"><span style={{ color: "var(--text-2)" }}>{t(b.name)} <span className="dim">· {b.n}</span></span><span className="mono" style={{ color: c }}>{rFmt(b.r)}</span></div>
                        <div className="bar-track"><div className="bar-fill" style={{ width: `${(Math.abs(b.r) / max) * 100}%`, background: c }} /></div>
                      </div>
                    );
                  })}
                </div>
              )}
              {stats.mistakes.length > 0 && (
                <div className="stack" style={{ gap: 8 }}>
                  <span className="lbl">{t("Lỗi lặp lại")}</span>
                  <div className="hstack" style={{ gap: 6 }}>
                    {stats.mistakes.map((m) => <span key={m.name} className="pill">{m.name} · {m.n}</span>)}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="small dim">{t("Chưa đủ dữ liệu. Thống kê hiện khi có journal.")}</p>
          )}
        </aside>
      </div>
    </>
  );
}

function Tile({ k, v }: { k: string; v: string }) {
  return (
    <div className="tile">
      <span className="lbl">{k}</span>
      <span className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{v}</span>
    </div>
  );
}
