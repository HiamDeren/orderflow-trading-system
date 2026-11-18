"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { DayWithTrades, Trade } from "@/lib/journal";
import { BIAS_CHECK, DAY_TYPES, FOLLOWED, OPEN_TYPES, RESULTS, SIDES } from "@/lib/settings";

type TextField = readonly [string, string, string];
type Row = { entry_time: string; side: string; qty: string; level: string; trigger: string; r: string; pnl: string; fee: string; followed_plan: string; mistake: string };

const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const toRow = (t: Trade): Row => ({
  entry_time: s(t.entry_time).slice(0, 5), side: t.side || "Long", qty: s(t.qty || 1), level: s(t.level), trigger: s(t.trigger),
  r: s(t.r), pnl: s(t.pnl), fee: s(t.fee), followed_plan: s(t.followed_plan), mistake: s(t.mistake),
});
const empty = (): Row => ({ entry_time: "", side: "Long", qty: "1", level: "", trigger: "", r: "", pnl: "", fee: "", followed_plan: "", mistake: "" });
const money = (v: number) => (v > 0 ? "+$" : v < 0 ? "−$" : "$") + Math.abs(v).toFixed(2).replace(/\.00$/, "");

export default function JournalEditor({ date, initial, textFields }: { date: string; initial: DayWithTrades | null; textFields: readonly TextField[] }) {
  const router = useRouter();
  const [day, setDay] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {
      day_type: s(initial?.day_type), result: s(initial?.result), open_type: s(initial?.open_type), bias_correct: s(initial?.bias_correct),
    };
    for (const [k] of textFields) o[k] = s((initial as Record<string, unknown> | null)?.[k]);
    return o;
  });
  const [rows, setRows] = useState<Row[]>(() => (initial?.journal_trades || []).map(toRow));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (k: string, v: string) => setDay((d) => ({ ...d, [k]: v }));
  const setRow = (i: number, k: keyof Row, v: string) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  const sum = useMemo(() => {
    const gross = rows.reduce((a, r) => a + (Number(r.pnl) || 0), 0);
    const fee = rows.reduce((a, r) => a + (Number(r.fee) || 0), 0);
    const rr = rows.reduce((a, r) => a + (Number(r.r) || 0), 0);
    return { gross, fee, net: gross - fee, r: rr };
  }, [rows]);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const body = {
        day: { trade_date: date, ...Object.fromEntries(Object.entries(day).map(([k, v]) => [k, v || null])) },
        trades: rows.map((r) => ({ ...r, qty: Number(r.qty) || 1, r: r.r === "" ? null : Number(r.r), pnl: r.pnl === "" ? null : Number(r.pnl), fee: r.fee === "" ? 0 : Number(r.fee) })),
      };
      const res = await fetch("/api/journal", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(res.status === 401 ? "Phiên đăng nhập hết hạn, đăng nhập lại." : j.error || `HTTP ${res.status}`);
      setMsg({ ok: true, text: "Đã lưu journal." });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: "Chưa lưu được: " + String((e as Error).message) });
    } finally {
      setSaving(false);
    }
  }

  const sel = (k: string, label: string, opts: readonly string[]) => (
    <label className="field">
      {label}
      <select value={day[k]} onChange={(e) => set(k, e.target.value)}>
        <option value="">—</option>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="card">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          {sel("day_type", "Day type", DAY_TYPES)}
          {sel("result", "Kết quả", RESULTS)}
          {sel("open_type", "Open type", OPEN_TYPES)}
          {sel("bias_correct", "Bias plan đúng?", BIAS_CHECK)}
        </div>
      </div>

      <section className="card" aria-label="Lệnh trong ngày" style={{ padding: "18px 8px 10px" }}>
        <div className="row" style={{ padding: "0 10px" }}>
          <span className="lbl">Lệnh · {rows.length}</span>
          <button className="btn sm" onClick={() => setRows((r) => [...r, empty()])} disabled={rows.length >= 20}>Thêm lệnh</button>
        </div>
        {rows.length ? (
          <div className="table-box">
            <table className="t">
              <thead>
                <tr><th>Giờ ET</th><th>Hướng</th><th>HĐ</th><th>Level</th><th>Trigger</th><th>R</th><th>PnL $</th><th>Phí</th><th>Theo plan</th><th>Ghi chú lỗi</th><th><span className="sr-only">Xoá</span></th></tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td><input className="input mono" type="time" aria-label="Giờ vào" value={r.entry_time} onChange={(e) => setRow(i, "entry_time", e.target.value)} /></td>
                    <td>
                      <select className="input" aria-label="Hướng" value={r.side} onChange={(e) => setRow(i, "side", e.target.value)} style={{ minWidth: 96, color: r.side === "Long" ? "var(--long)" : "var(--short)" }}>
                        {SIDES.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </td>
                    <td><input className="input mono" inputMode="numeric" aria-label="Số hợp đồng" value={r.qty} onChange={(e) => setRow(i, "qty", e.target.value)} style={{ width: 56 }} /></td>
                    <td><input className="input" aria-label="Level" value={r.level} onChange={(e) => setRow(i, "level", e.target.value)} placeholder="pRTH VAL" /></td>
                    <td><input className="input" aria-label="Trigger" value={r.trigger} onChange={(e) => setRow(i, "trigger", e.target.value)} placeholder="Absorption + CVD lệch" style={{ minWidth: 180 }} /></td>
                    <td><input className="input mono" inputMode="decimal" aria-label="R" value={r.r} onChange={(e) => setRow(i, "r", e.target.value)} style={{ width: 70 }} /></td>
                    <td><input className="input mono" inputMode="decimal" aria-label="PnL $" value={r.pnl} onChange={(e) => setRow(i, "pnl", e.target.value)} style={{ width: 90 }} /></td>
                    <td><input className="input mono" inputMode="decimal" aria-label="Phí" value={r.fee} onChange={(e) => setRow(i, "fee", e.target.value)} style={{ width: 70 }} /></td>
                    <td>
                      <select className="input" aria-label="Theo plan" value={r.followed_plan} onChange={(e) => setRow(i, "followed_plan", e.target.value)}>
                        <option value="">—</option>
                        {FOLLOWED.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </td>
                    <td><input className="input" aria-label="Ghi chú lỗi" value={r.mistake} onChange={(e) => setRow(i, "mistake", e.target.value)} placeholder="Vào trước trigger" /></td>
                    <td><button className="btn sm" aria-label={`Xoá lệnh ${i + 1}`} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>Xoá</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="small dim" style={{ padding: "8px 10px" }}>Chưa có lệnh. Ngày không vào lệnh thì chọn kết quả “No Trade” và vẫn ghi lại vì sao đứng ngoài.</p>
        )}
        {rows.length > 0 && (
          <div className="hstack small muted" style={{ justifyContent: "flex-end", gap: 20, padding: "8px 10px 2px" }}>
            <span>Gross <span className="mono" style={{ color: "var(--text)" }}>{money(sum.gross)}</span></span>
            <span>Phí <span className="mono" style={{ color: "var(--text)" }}>${sum.fee.toFixed(2)}</span></span>
            <span style={{ fontWeight: 600 }}>
              Net <span className={"mono " + (sum.net >= 0 ? "long" : "short")}>{money(sum.net)}</span> · <span className={"mono " + (sum.r >= 0 ? "long" : "short")}>{sum.r >= 0 ? "+" : "−"}{Math.abs(sum.r).toFixed(1)}R</span>
            </span>
          </div>
        )}
      </section>

      <section className="card" aria-label="Recap chi tiết">
        <div className="row wrap">
          <span className="lbl">Recap chi tiết</span>
          <span className="small faint">Markdown được</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
          {textFields.map(([k, label, ph]) => (
            <label className="field" key={k} style={k === "lesson" || k === "next_levels" ? { gridColumn: "1 / -1" } : undefined}>
              {label}
              <textarea value={day[k]} onChange={(e) => set(k, e.target.value)} placeholder={ph} style={k === "lesson" ? { minHeight: 64 } : undefined} />
            </label>
          ))}
        </div>
      </section>

      <div className="row wrap" style={{ position: "sticky", bottom: 0, padding: "12px 0", background: "var(--bg)", borderTop: "1px solid var(--line-2)" }}>
        <span role="status" className={msg ? (msg.ok ? "long small" : "short small") : "small dim"}>{msg ? msg.text : initial?.updated_at ? `Lưu lần cuối ${new Date(initial.updated_at).toLocaleString("vi-VN")}` : "Chưa lưu"}</span>
        <button className="btn primary" onClick={save} disabled={saving}>{saving ? "Đang lưu…" : "Lưu journal"}</button>
      </div>
    </div>
  );
}
