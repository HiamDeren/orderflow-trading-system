"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { DOW, MON_HEAD } from "@/lib/i18n";
import { planImageSrc as imgSrc } from "@/lib/plan-url";
import { addDays, dowOf, monthRange, shiftMonth, viDayMonth } from "@/lib/time";
import CopyImage from "../_components/CopyImage";
import { useUi } from "../_components/Ui";

type Summary = { bias?: string; conf?: string; location?: string; setup?: string; target?: number | null; price?: number; flip?: string };
export type PlanItem = { trade_date: string; symbol: string; summary: Summary | null; image_path: string | null; updated_at: string };
type PlanDetail = PlanItem & { plan_text?: string | null };
type Step = { name: string; state: "ok" | "err" | "skip" | "wait"; note: string };

const tone = (b?: string) => (b === "Lên" ? "long" : b === "Xuống" ? "short" : "flat");
const BIAS = { long: "Long", short: "Short", flat: "Trung tính" } as const;
const DOTC = { long: "var(--long)", short: "var(--short)", flat: "var(--muted)" } as const;
const etTime = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit" }) + " ET";

export default function PlanView({ today, initialDate, initialPlans }: { today: string; initialDate: string | null; initialPlans: PlanItem[] | null }) {
  const { t, lang } = useUi();
  const [src, setSrc] = useState<"atas" | "json">("json");
  const [text, setText] = useState("");
  const [notify, setNotify] = useState(true);
  const [sending, setSending] = useState(false);
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [status, setStatus] = useState("");

  const [month, setMonth] = useState((initialDate || today).slice(0, 7));
  const [plans, setPlans] = useState<PlanItem[] | null>(initialPlans);
  // Danh sách tháng đầu tiên server đã nạp sẵn (page.tsx) → bỏ lần fetch đầu khi mở trang
  const preloaded = useRef<string | null>(initialPlans ? month : null);
  const [listErr, setListErr] = useState("");
  const [sel, setSel] = useState<string | null>(initialDate);
  const [detail, setDetail] = useState<PlanDetail | null>(null);
  const [detailErr, setDetailErr] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadMonth = useCallback(async (m: string) => {
    setListErr("");
    setPlans(null);
    try {
      const r = await fetch(`/api/plan?month=${m}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error === "unauthorized" ? "Phiên đăng nhập hết hạn, đăng nhập lại." : j.detail || j.error || `HTTP ${r.status}`);
      setPlans(j.plans || []);
    } catch (e) {
      setListErr(String((e as Error).message));
      setPlans([]);
    }
  }, []);

  const loadDetail = useCallback(async (d: string) => {
    setSel(d);
    setDetail(null);
    setDetailErr("");
    setLoadingDetail(true);
    try {
      const r = await fetch(`/api/plan?date=${d}`, { cache: "no-store" });
      const j = await r.json();
      if (r.status === 404) throw new Error("404");
      if (!r.ok) throw new Error(j.detail || j.error || `HTTP ${r.status}`);
      setDetail(j);
    } catch (e) {
      setDetailErr(String((e as Error).message));
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (preloaded.current === month) {
      preloaded.current = null;
      return;
    }
    loadMonth(month);
  }, [month, loadMonth]);
  useEffect(() => {
    if (initialDate) loadDetail(initialDate);
  }, [initialDate, loadDetail]);
  useEffect(() => {
    if (!sel && plans && plans.length) loadDetail(plans[plans.length - 1].trade_date);
  }, [plans, sel, loadDetail]);

  async function send() {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(text);
      if (!payload || typeof payload !== "object") throw new Error("JSON object");
    } catch (e) {
      setSteps([{ name: t("Đọc JSON"), state: "err", note: t("JSON không hợp lệ") + ": " + String((e as Error).message) }]);
      setStatus("");
      return;
    }
    payload.notify = notify;
    setSending(true);
    setSteps([{ name: t("Đang gửi…"), state: "wait", note: "" }]);
    try {
      const r = await fetch("/api/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json().catch(() => ({}));
      setStatus(`HTTP ${r.status}${j.date ? ` · plan ${j.date} · ${j.symbol}` : ""}`);
      const out: Step[] = [];
      if (r.status === 401) out.push({ name: t("Xác thực"), state: "err", note: t("Phiên đăng nhập hết hạn, đăng nhập lại.") });
      else if (r.status === 400) out.push({ name: t("Đọc JSON"), state: "err", note: j.error || "400" });
      else if (r.status === 500 && !j.date) out.push({ name: "Server", state: "err", note: j.error || "500" });
      else {
        out.push({ name: t("Đọc JSON, xác thực"), state: "ok", note: "ok" });
        out.push(
          r.status === 502
            ? { name: "Database · trade_plans", state: "err", note: `${j.status ?? ""} ${String(j.detail || "").slice(0, 120)}` }
            : { name: "Database · trade_plans", state: "ok", note: "upsert · ok" },
        );
        const img = j.image || {};
        out.push(
          img.path && !img.error
            ? { name: t("Ảnh WebP + Storage"), state: "ok", note: `${Math.round((img.bytes || 0) / 1024)} KB` }
            : { name: t("Ảnh WebP + Storage"), state: "err", note: img.error || t("không có ảnh") },
        );
        const dc = j.discord;
        out.push(
          dc?.sent
            ? { name: "Discord", state: "ok", note: t("đã gửi") }
            : dc?.error
              ? { name: "Discord", state: "err", note: dc.error }
              : { name: "Discord", state: "skip", note: notify ? t("không có webhook") : t("không gửi (đã tắt)") },
        );
        if (j.date) {
          const m = String(j.date).slice(0, 7);
          if (m !== month) setMonth(m);
          else loadMonth(m);
          loadDetail(j.date);
        }
      }
      setSteps(out);
    } catch (e) {
      setSteps([{ name: t("Mạng"), state: "err", note: String((e as Error).message) }]);
    } finally {
      setSending(false);
    }
  }

  const { start, days } = monthRange(month);
  const lead = (dowOf(start) + 6) % 7;
  const byDate = new Map((plans || []).map((p) => [p.trade_date, p]));
  const latest = plans && plans.length ? plans[plans.length - 1] : null;
  const [y, mo] = month.split("-");
  const tt = detail ? tone(detail.summary?.bias) : "flat";
  const img = detail?.image_path ? imgSrc(detail.trade_date, detail.updated_at) : null;

  return (
    <>
      <div className="plan-split">
        <section className="card" aria-label={t("Gửi plan")}>
          <div className="row wrap">
            <span className="lbl">{t("Gửi plan")}</span>
            <div className="seg" role="tablist" aria-label={t("Nguồn plan")}>
              <button type="button" role="tab" aria-selected={src === "atas"} onClick={() => setSrc("atas")}>
                ATAS X
              </button>
              <button type="button" role="tab" aria-selected={src === "json"} onClick={() => setSrc("json")}>
                {t("Dán JSON")}
              </button>
            </div>
          </div>
          {src === "json" ? (
            <div className="stack">
              <label className="field">
                {t("JSON từ indicator Plan Sender (copy clipboard)")}
                <textarea
                  className="code"
                  spellCheck={false}
                  style={{ minHeight: 220 }}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={'{ "v": 1, "date": "2026-11-18", "symbol": "NQ", "price": …, "prth": { … }, "ovn": { … } }'}
                />
              </label>
              <div className="row wrap">
                <label className="check">
                  <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> {t("Gửi kèm Discord")}
                </label>
                <button type="button" className="btn primary" onClick={send} disabled={sending || !text.trim()}>
                  {sending ? t("Đang gửi…") : t("Gửi plan")}
                </button>
              </div>
            </div>
          ) : (
            <div className="stack small" style={{ color: "var(--text-2)", lineHeight: 1.55 }}>
              <p>
                {t(
                  "Indicator Plan Sender trong ATAS X gọi thẳng POST /api/plan bằng token. Không cần mở web, kết quả hiện ở lịch sử bên dưới và trên Discord.",
                )}
              </p>
              <div className="row tile" style={{ flexDirection: "row" }}>
                <span>{t("Lần nhận gần nhất (tháng này)")}</span>
                <span className="mono">{latest ? `${viDayMonth(latest.trade_date)} · ${etTime(latest.updated_at)}` : "—"}</span>
              </div>
              <div className="row tile" style={{ flexDirection: "row" }}>
                <span>{t("Lịch gửi gợi ý")}</span>
                <span className="mono">09:29 ET · 21:29 VN</span>
              </div>
              <div className="row tile" style={{ flexDirection: "row" }}>
                <span>Token API</span>
                <span className="mono dim">Vercel · PLAN_TOKEN</span>
              </div>
            </div>
          )}
          {steps && (
            <div className="stack" style={{ gap: 2, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
              <span className="lbl" style={{ paddingBottom: 8 }}>
                {t("Kết quả")}{" "}
                {status && (
                  <span className="mono" style={{ textTransform: "none", letterSpacing: 0 }}>
                    · {status}
                  </span>
                )}
              </span>
              {steps.map((s, i) => (
                <div key={s.name} className="row" style={{ minHeight: 34, alignItems: "flex-start", paddingTop: 6 }}>
                  <span className="hstack" style={{ gap: 10, flexWrap: "nowrap" }}>
                    <span
                      className={"dot " + (s.state === "ok" ? "ok" : s.state === "err" ? "err" : s.state === "wait" ? "wait" : "")}
                      aria-hidden="true"
                      style={{ marginTop: 2 }}
                    />
                    <span style={{ fontSize: 13 }}>{s.name}</span>
                  </span>
                  <span
                    className="mono small"
                    style={{
                      color: s.state === "ok" ? "var(--long)" : s.state === "err" ? "var(--short)" : "var(--dim)",
                      textAlign: "right",
                      maxWidth: "60%",
                      wordBreak: "break-word",
                    }}
                  >
                    {s.note}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card" aria-label={t("Plan đang xem")}>
          {!sel ? (
            <div className="placeholder" style={{ minHeight: 300 }}>
              {t("Chọn một ngày trong lịch sử để xem plan.")}
            </div>
          ) : loadingDetail ? (
            <div className="placeholder" style={{ minHeight: 300 }}>
              {t("Đang tải plan {d}…", { d: viDayMonth(sel) })}
            </div>
          ) : detailErr || !detail ? (
            <div className="placeholder" style={{ minHeight: 300 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{t("Không có plan ngày {d}", { d: viDayMonth(sel) })}</span>
              <span>
                {DOW[lang][dowOf(sel)]}
                {detailErr && detailErr !== "404" ? ` · ${detailErr}` : ""}
              </span>
            </div>
          ) : (
            <>
              <div className="row wrap">
                <h2 className="h2">
                  Plan {viDayMonth(detail.trade_date)} · {detail.symbol}
                </h2>
                <div className="hstack" style={{ gap: 8 }}>
                  <span className={"pill " + (tt === "flat" ? "" : tt)}>
                    Bias {t(BIAS[tt])}
                    {detail.summary?.conf ? ` · ${detail.summary.conf}` : ""}
                  </span>
                  {detail.summary?.location && <span className="pill">{detail.summary.location}</span>}
                  <span className="pill mono">{etTime(detail.updated_at)}</span>
                </div>
              </div>
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="plan-img" src={img} alt={`Plan ${detail.trade_date}`} />
              ) : (
                <div className="placeholder" style={{ height: 240 }}>
                  {t("Chưa có ảnh plan")}
                </div>
              )}
              <div className="row wrap">
                <span className="hstack">
                  {img && <CopyImage src={img} small />}
                  {img && (
                    <a className="btn sm" href={img} target="_blank" rel="noreferrer">
                      {t("Mở ảnh")}
                    </a>
                  )}
                </span>
                <Link href={`/journal?date=${detail.trade_date}`} className="small" style={{ fontWeight: 600 }}>
                  {t("Mở journal ngày này")}
                </Link>
              </div>
              {detail.plan_text && (
                <details>
                  <summary className="small" style={{ cursor: "pointer", color: "var(--muted)" }}>
                    {t("Plan dạng chữ")}
                  </summary>
                  <pre className="code" style={{ whiteSpace: "pre-wrap", margin: "10px 0 0", color: "var(--text-2)" }}>
                    {detail.plan_text}
                  </pre>
                </details>
              )}
            </>
          )}
        </section>
      </div>

      <section className="card" aria-label={t("Lịch sử plan")}>
        <div className="row wrap">
          <div className="stack" style={{ gap: 4 }}>
            <span className="lbl">{t("Lịch sử plan")}</span>
            <span className="small muted">{t("Chọn ngày để xem lại plan và ảnh của ngày đó")}</span>
          </div>
          <div className="hstack" style={{ gap: 6 }}>
            <button type="button" className="btn icon" aria-label={t("Tháng trước")} onClick={() => setMonth(shiftMonth(month, -1))}>
              ‹
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, minWidth: 120, textAlign: "center" }}>{t("Tháng {m} · {y}", { m: Number(mo), y })}</span>
            <button
              type="button"
              className="btn icon"
              aria-label={t("Tháng sau")}
              onClick={() => setMonth(shiftMonth(month, 1))}
              disabled={month >= today.slice(0, 7)}
            >
              ›
            </button>
          </div>
        </div>
        {listErr && <div className="notice">{t(listErr)}</div>}
        <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="cal-head" aria-hidden="true">
            {MON_HEAD[lang].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="cal-grid">
            {Array.from({ length: lead }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: ô trống đầu tháng, chỉ có vị trí
              <span key={"x" + i} />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const d = addDays(start, i);
              const p = byDate.get(d);
              const dd = String(i + 1);
              if (!p)
                return (
                  <span key={d} className={"cal-day off" + (d === today ? " today" : "")}>
                    {dd}
                  </span>
                );
              const pt = tone(p.summary?.bias);
              return (
                <button
                  type="button"
                  key={d}
                  className={"cal-day" + (d === sel ? " sel" : "") + (d === today ? " today" : "")}
                  onClick={() => loadDetail(d)}
                  aria-pressed={d === sel}
                  aria-label={`Plan ${viDayMonth(d)}, bias ${t(BIAS[pt])}`}
                >
                  {dd}
                  <span className="dot" style={{ background: DOTC[pt] }} aria-hidden="true" />
                </button>
              );
            })}
          </div>
          <div className="legend" style={{ paddingTop: 6 }}>
            <span>
              <span className="dot" style={{ background: DOTC.long }} aria-hidden="true" />
              Long
            </span>
            <span>
              <span className="dot" style={{ background: DOTC.short }} aria-hidden="true" />
              Short
            </span>
            <span>
              <span className="dot" style={{ background: DOTC.flat }} aria-hidden="true" />
              {t("Trung tính")}
            </span>
            {plans === null && <span className="dim">{t("Đang tải…")}</span>}
            {plans && !plans.length && !listErr && <span className="dim">{t("Tháng này chưa có plan.")}</span>}
          </div>
        </div>
      </section>
    </>
  );
}
