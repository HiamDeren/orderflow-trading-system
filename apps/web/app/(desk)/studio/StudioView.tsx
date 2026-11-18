"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DOW_VI, addDays, dowOf, monthRange, shiftMonth, viDayMonth } from "@/lib/time";

type Summary = { bias?: string; conf?: string; location?: string; setup?: string; target?: number | null; price?: number; flip?: string };
type PlanItem = { trade_date: string; symbol: string; summary: Summary | null; image_path: string | null; updated_at: string };
type PlanDetail = PlanItem & { plan_text?: string | null; image_url?: string };
type Step = { name: string; state: "ok" | "err" | "skip" | "wait"; note: string };

const tone = (b?: string) => (b === "Lên" ? "long" : b === "Xuống" ? "short" : "flat");
const BIAS = { long: "Long", short: "Short", flat: "Trung tính" } as const;
const DOTC = { long: "var(--long)", short: "var(--short)", flat: "var(--muted)" } as const;
const etTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("vi-VN", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit" }) + " ET";

export default function StudioView({ today, initialDate }: { today: string; initialDate: string | null }) {
  const [src, setSrc] = useState<"atas" | "json">("json");
  const [text, setText] = useState("");
  const [notify, setNotify] = useState(true);
  const [sending, setSending] = useState(false);
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [status, setStatus] = useState<string>("");

  const [month, setMonth] = useState((initialDate || today).slice(0, 7));
  const [plans, setPlans] = useState<PlanItem[] | null>(null);
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
      if (r.status === 404) throw new Error("Không có plan ngày này.");
      if (!r.ok) throw new Error(j.detail || j.error || `HTTP ${r.status}`);
      setDetail(j);
    } catch (e) {
      setDetailErr(String((e as Error).message));
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    loadMonth(month);
  }, [month, loadMonth]);

  useEffect(() => {
    if (initialDate) loadDetail(initialDate);
  }, [initialDate, loadDetail]);

  // Mặc định chọn ngày gần nhất có plan trong tháng đang xem
  useEffect(() => {
    if (!sel && plans && plans.length) loadDetail(plans[plans.length - 1].trade_date);
  }, [plans, sel, loadDetail]);

  async function send() {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(text);
      if (!payload || typeof payload !== "object") throw new Error("JSON phải là object");
    } catch (e) {
      setSteps([{ name: "Đọc JSON", state: "err", note: "JSON không hợp lệ: " + String((e as Error).message) }]);
      setStatus("");
      return;
    }
    payload.notify = notify;
    setSending(true);
    setSteps([{ name: "Đang gửi…", state: "wait", note: "" }]);
    try {
      const r = await fetch("/api/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json().catch(() => ({}));
      setStatus(`HTTP ${r.status}${j.date ? ` · plan ${j.date} · ${j.symbol}` : ""}`);
      const out: Step[] = [];
      if (r.status === 401) out.push({ name: "Xác thực", state: "err", note: "Phiên đăng nhập hết hạn, đăng nhập lại." });
      else if (r.status === 400) out.push({ name: "Đọc JSON", state: "err", note: j.error || "Payload thiếu trường" });
      else if (r.status === 500 && !j.date) out.push({ name: "Server", state: "err", note: j.error || "Lỗi server" });
      else {
        out.push({ name: "Đọc JSON, xác thực", state: "ok", note: "ok" });
        out.push(r.status === 502
          ? { name: "Lưu Database · trade_plans", state: "err", note: `lỗi ${j.status ?? ""} ${String(j.detail || "").slice(0, 120)}` }
          : { name: "Lưu Database · trade_plans", state: "ok", note: "upsert · ok" });
        const img = j.image || {};
        out.push(img.path && !img.error
          ? { name: "Ảnh WebP + Storage", state: "ok", note: `${Math.round((img.bytes || 0) / 1024)} KB` }
          : { name: "Ảnh WebP + Storage", state: img.path ? "err" : "err", note: img.error || "không có ảnh" });
        const dc = j.discord;
        out.push(dc?.sent
          ? { name: "Discord", state: "ok", note: "đã gửi" }
          : dc?.error
            ? { name: "Discord", state: "err", note: dc.error }
            : { name: "Discord", state: "skip", note: notify ? "không có webhook" : "không gửi (đã tắt)" });
        if (j.date) {
          const m = String(j.date).slice(0, 7);
          if (m !== month) setMonth(m);
          else loadMonth(m);
          loadDetail(j.date);
        }
      }
      setSteps(out);
    } catch (e) {
      setSteps([{ name: "Mạng", state: "err", note: String((e as Error).message) }]);
    } finally {
      setSending(false);
    }
  }

  const { start, days } = monthRange(month);
  const lead = (dowOf(start) + 6) % 7;
  const byDate = new Map((plans || []).map((p) => [p.trade_date, p]));
  const latest = plans && plans.length ? plans[plans.length - 1] : null;
  const [y, mo] = month.split("-");
  const t = detail ? tone(detail.summary?.bias) : "flat";

  return (
    <>
      <div className="split">
        <section className="card" aria-label="Gửi plan" style={{ flex: "1 1 440px" }}>
          <div className="row wrap">
            <span className="lbl">Gửi plan</span>
            <div className="seg" role="tablist" aria-label="Nguồn plan">
              <button role="tab" aria-selected={src === "atas"} onClick={() => setSrc("atas")}>ATAS X</button>
              <button role="tab" aria-selected={src === "json"} onClick={() => setSrc("json")}>Dán JSON</button>
            </div>
          </div>
          {src === "json" ? (
            <div className="stack">
              <label className="field">
                JSON từ indicator Plan Sender (copy clipboard)
                <textarea className="code" spellCheck={false} style={{ minHeight: 220 }} value={text} onChange={(e) => setText(e.target.value)} placeholder={'{ "v": 1, "date": "2026-11-18", "symbol": "NQ", "price": …, "prth": { … }, "ovn": { … } }'} />
              </label>
              <div className="row wrap">
                <label className="check"><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Gửi kèm Discord</label>
                <button className="btn primary" onClick={send} disabled={sending || !text.trim()}>{sending ? "Đang gửi…" : "Gửi plan"}</button>
              </div>
            </div>
          ) : (
            <div className="stack small" style={{ color: "var(--text-2)", lineHeight: 1.55 }}>
              <p>Indicator Plan Sender trong ATAS X gọi thẳng <span className="mono" style={{ color: "var(--text)" }}>POST /api/plan</span> bằng token. Không cần mở web, kết quả hiện ở lịch sử bên dưới và trên Discord.</p>
              <div className="row tile" style={{ flexDirection: "row" }}><span>Lần nhận gần nhất (tháng này)</span><span className="mono">{latest ? `${viDayMonth(latest.trade_date)} · ${etTime(latest.updated_at)}` : "—"}</span></div>
              <div className="row tile" style={{ flexDirection: "row" }}><span>Lịch gửi gợi ý</span><span className="mono">09:29 ET · 21:29 VN</span></div>
              <div className="row tile" style={{ flexDirection: "row" }}><span>Token API</span><span className="mono dim">đặt trên Vercel · PLAN_TOKEN</span></div>
            </div>
          )}
          {steps && (
            <div className="stack" style={{ gap: 2, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
              <span className="lbl" style={{ paddingBottom: 8 }}>Kết quả {status && <span className="mono" style={{ textTransform: "none", letterSpacing: 0 }}>· {status}</span>}</span>
              {steps.map((s, i) => (
                <div key={i} className="row" style={{ minHeight: 34, alignItems: "flex-start", paddingTop: 6 }}>
                  <span className="hstack" style={{ gap: 10, flexWrap: "nowrap" }}>
                    <span className={"dot " + (s.state === "ok" ? "ok" : s.state === "err" ? "err" : s.state === "wait" ? "wait" : "")} aria-hidden="true" style={{ marginTop: 2 }} />
                    <span style={{ fontSize: 13 }}>{s.name}</span>
                  </span>
                  <span className="mono small" style={{ color: s.state === "ok" ? "var(--long)" : s.state === "err" ? "var(--short)" : "var(--dim)", textAlign: "right", maxWidth: "60%", wordBreak: "break-word" }}>{s.note}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card" aria-label="Plan đang xem" style={{ flex: "1.3 1 480px" }}>
          {!sel ? (
            <div className="placeholder" style={{ minHeight: 300 }}>Chọn một ngày trong lịch sử để xem plan.</div>
          ) : loadingDetail ? (
            <div className="placeholder" style={{ minHeight: 300 }}>Đang tải plan {viDayMonth(sel)}…</div>
          ) : detailErr || !detail ? (
            <div className="placeholder" style={{ minHeight: 300 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Không có plan ngày {viDayMonth(sel)}</span>
              <span>{DOW_VI[dowOf(sel)]}{detailErr && detailErr !== "Không có plan ngày này." ? ` · ${detailErr}` : ""}</span>
            </div>
          ) : (
            <>
              <div className="row wrap">
                <h2 className="h2">Plan {viDayMonth(detail.trade_date)} · {detail.symbol}</h2>
                <div className="hstack" style={{ gap: 8 }}>
                  <span className={"pill " + (t === "flat" ? "" : t)}>Bias {BIAS[t]}{detail.summary?.conf ? ` · ${detail.summary.conf}` : ""}</span>
                  {detail.summary?.location && <span className="pill">{detail.summary.location}</span>}
                  <span className="pill mono">{etTime(detail.updated_at)}</span>
                </div>
              </div>
              {detail.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="plan-img" src={detail.image_url} alt={`Ảnh plan ${detail.trade_date}`} />
              ) : (
                <div className="placeholder" style={{ height: 240 }}>Chưa có ảnh plan</div>
              )}
              {detail.plan_text && (
                <details>
                  <summary className="small" style={{ cursor: "pointer", color: "var(--muted)" }}>Plan dạng chữ</summary>
                  <pre className="code" style={{ whiteSpace: "pre-wrap", margin: "10px 0 0", color: "var(--text-2)" }}>{detail.plan_text}</pre>
                </details>
              )}
              <div className="row wrap small">
                <span className="muted">Ảnh: <span className="mono">{detail.image_path || "—"}</span></span>
                <span className="hstack">
                  {detail.image_url && <a href={detail.image_url} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>Mở ảnh</a>}
                  <Link href={`/journal?date=${detail.trade_date}`} style={{ fontWeight: 600 }}>Mở journal ngày này</Link>
                </span>
              </div>
            </>
          )}
        </section>
      </div>

      <section className="card" aria-label="Lịch sử plan">
        <div className="row wrap">
          <div className="stack" style={{ gap: 4 }}>
            <span className="lbl">Lịch sử plan</span>
            <span className="small muted">Chọn ngày để xem lại plan và ảnh của ngày đó</span>
          </div>
          <div className="hstack" style={{ gap: 6 }}>
            <button className="btn icon" aria-label="Tháng trước" onClick={() => setMonth(shiftMonth(month, -1))}>‹</button>
            <span style={{ fontSize: 14, fontWeight: 600, minWidth: 120, textAlign: "center" }}>Tháng {Number(mo)} · {y}</span>
            <button className="btn icon" aria-label="Tháng sau" onClick={() => setMonth(shiftMonth(month, 1))} disabled={month >= today.slice(0, 7)}>›</button>
          </div>
        </div>
        {listErr && <div className="notice">{listErr}</div>}
        <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="cal-head" aria-hidden="true">{["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => <span key={d}>{d}</span>)}</div>
          <div className="cal-grid">
            {Array.from({ length: lead }, (_, i) => <span key={"x" + i} />)}
            {Array.from({ length: days }, (_, i) => {
              const d = addDays(start, i);
              const p = byDate.get(d);
              const dd = String(i + 1);
              if (!p) return <span key={d} className={"cal-day off" + (d === today ? " today" : "")}>{dd}</span>;
              const tt = tone(p.summary?.bias);
              return (
                <button key={d} className={"cal-day" + (d === sel ? " sel" : "") + (d === today ? " today" : "")} onClick={() => loadDetail(d)} aria-pressed={d === sel} aria-label={`Plan ${viDayMonth(d)}, bias ${BIAS[tt]}`}>
                  {dd}
                  <span className="dot" style={{ background: DOTC[tt] }} aria-hidden="true" />
                </button>
              );
            })}
          </div>
          <div className="legend" style={{ paddingTop: 6 }}>
            <span><span className="dot" style={{ background: DOTC.long }} aria-hidden="true" />Long</span>
            <span><span className="dot" style={{ background: DOTC.short }} aria-hidden="true" />Short</span>
            <span><span className="dot" style={{ background: DOTC.flat }} aria-hidden="true" />Trung tính</span>
            {plans === null && <span className="dim">Đang tải…</span>}
            {plans && !plans.length && !listErr && <span className="dim">Tháng này chưa có plan.</span>}
          </div>
        </div>
      </section>
    </>
  );
}
