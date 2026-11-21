"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DayWithTrades, Trade } from "@/lib/journal";
import { BIAS_CHECK, DAY_TYPES, FOLLOWED, OPEN_TYPES, RESULTS, SETUPS, SIDES } from "@/lib/settings";
import { useUi } from "../_components/Ui";

type TextField = readonly [string, string, string];
type SessionField = readonly [string, string, readonly (readonly [string, string])[]];
type Row = {
  entry_time: string;
  side: string;
  qty: string;
  setup: string;
  level: string;
  trigger: string;
  r: string;
  pnl: string;
  fee: string;
  followed_plan: string;
  mistakes: string;
};

const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const toRow = (t: Trade): Row => ({
  entry_time: s(t.entry_time).slice(0, 5),
  side: t.side || "Long",
  qty: s(t.qty || 1),
  setup: s(t.setup),
  level: s(t.level),
  trigger: s(t.trigger),
  r: s(t.r),
  pnl: s(t.pnl),
  fee: s(t.fee),
  followed_plan: s(t.followed_plan),
  mistakes: (t.mistakes || []).join(", "),
});
const empty = (): Row => ({
  entry_time: "",
  side: "Long",
  qty: "1",
  setup: "",
  level: "",
  trigger: "",
  r: "",
  pnl: "",
  fee: "",
  followed_plan: "",
  mistakes: "",
});
const money = (v: number) => (v > 0 ? "+$" : v < 0 ? "−$" : "$") + Math.abs(v).toFixed(2).replace(/\.00$/, "");

export default function JournalEditor({
  date,
  initial,
  textFields,
  sessionFields,
  preset,
  head,
  children,
}: {
  date: string;
  initial: DayWithTrades | null;
  textFields: readonly TextField[];
  sessionFields: readonly SessionField[];
  preset?: Record<string, string>;
  head?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const { t, lang } = useUi();
  const [day, setDay] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {
      day_type: s(initial?.day_type),
      result: s(initial?.result),
      open_type: s(initial?.open_type),
      bias_correct: s(initial?.bias_correct),
    };
    const src = initial as Record<string, unknown> | null;
    // Khung trước phiên: chưa ghi gì thì điền sẵn từ plan của ngày
    const fresh = !sessionFields.some(([k]) => src?.[k]);
    for (const [k] of sessionFields) o[k] = s(src?.[k]) || (fresh ? s(preset?.[k]) : "");
    for (const [k] of textFields) o[k] = s(src?.[k]);
    return o;
  });
  const fromPlan = !!preset && !sessionFields.some(([k]) => (initial as Record<string, unknown> | null)?.[k]) && Object.values(preset).some(Boolean);
  const [rows, setRows] = useState<Row[]>(() => (initial?.journal_trades || []).map(toRow));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [field, setField] = useState<string>(textFields[0][0]);
  const [allFields, setAllFields] = useState(false);

  const set = (k: string, v: string) => {
    setDirty(true);
    setDay((d) => ({ ...d, [k]: v }));
  };
  const setRow = (i: number, k: keyof Row, v: string) => {
    setDirty(true);
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  };
  const saveRef = useRef<() => void>(() => {});

  // Ctrl / Cmd + S để lưu; nhắc khi rời trang lúc còn thay đổi chưa lưu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

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
        trades: rows.map((r) => ({
          ...r,
          qty: Number(r.qty) || 1,
          r: r.r === "" ? null : Number(r.r),
          pnl: r.pnl === "" ? null : Number(r.pnl),
          fee: r.fee === "" ? 0 : Number(r.fee),
          mistakes: r.mistakes
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
        })),
      };
      const res = await fetch("/api/journal", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(res.status === 401 ? t("Phiên đăng nhập hết hạn, đăng nhập lại.") : j.error || `HTTP ${res.status}`);
      setMsg({ ok: true, text: t("Đã lưu journal.") });
      setDirty(false);
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: t("Chưa lưu được") + ": " + String((e as Error).message) });
    } finally {
      setSaving(false);
    }
  }

  saveRef.current = () => {
    if (!saving) save();
  };

  const sel = (k: string, label: string, opts: readonly string[]) => (
    <label className="field">
      {t(label)}
      <select value={day[k]} onChange={(e) => set(k, e.target.value)}>
        <option value="">—</option>
        {opts.map((o) => (
          <option key={o} value={o}>
            {t(o)}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="card journal-head">
        <div className="row wrap" style={{ gap: 12 }}>
          {head}
          <div className="hstack journal-save">
            <span role="status" className={msg ? (msg.ok ? "long small" : "short small") : dirty ? "small accent" : "small dim"}>
              {msg && !dirty
                ? msg.text
                : dirty
                  ? t("Có thay đổi chưa lưu")
                  : initial?.updated_at
                    ? t("Lưu lần cuối {d}", {
                        d: new Date(initial.updated_at).toLocaleString(lang === "en" ? "en-GB" : "vi-VN", { dateStyle: "short", timeStyle: "short" }),
                      })
                    : t("Chưa lưu")}
            </span>
            <button className="btn primary" onClick={save} disabled={saving} title="Ctrl + S">
              {saving ? t("Đang lưu…") : t("Lưu journal")}
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          {sel("day_type", "Day type", DAY_TYPES)}
          {sel("result", "Kết quả", RESULTS)}
          {sel("open_type", "Open type", OPEN_TYPES)}
          {sel("bias_correct", "Bias plan đúng?", BIAS_CHECK)}
        </div>
      </div>

      <section className="card" aria-label={t("Log phiên")}>
        <div className="row wrap">
          <span className="lbl">{t("Log phiên · Composite × pRTH × OVN")}</span>
          {fromPlan && <span className="small dim">{t("Khung trước phiên điền sẵn từ plan, kiểm lại rồi lưu.")}</span>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
          {sessionFields.map(([k, label, opts]) => (
            <label className="field" key={k}>
              {t(label)}
              <select value={day[k]} onChange={(e) => set(k, e.target.value)} disabled={k === "open_dir" && day.open_type === "Open auction"}>
                <option value="">—</option>
                {opts.map(([v, n]) => (
                  <option key={v} value={v}>
                    {t(n)}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </section>

      {children}

      <section className="card" aria-label={t("Lệnh trong ngày")} style={{ padding: "18px 8px 10px" }}>
        <div className="row" style={{ padding: "0 10px" }}>
          <span className="lbl">
            {t("Lệnh")} · {rows.length}
          </span>
          <button
            className="btn sm"
            onClick={() => {
              setDirty(true);
              setRows((r) => [...r, empty()]);
            }}
            disabled={rows.length >= 20}
          >
            {t("Thêm lệnh")}
          </button>
        </div>
        {rows.length ? (
          <div className="table-box">
            <table className="t">
              <thead>
                <tr>
                  <th>{t("Giờ ET")}</th>
                  <th>{t("Hướng")}</th>
                  <th>{t("HĐ")}</th>
                  <th>Setup</th>
                  <th>Level</th>
                  <th>Trigger</th>
                  <th>R</th>
                  <th>PnL $</th>
                  <th>{t("Phí")}</th>
                  <th>{t("Theo plan")}</th>
                  <th>{t("Lỗi (tag, cách nhau dấu phẩy)")}</th>
                  <th>
                    <span className="sr-only">{t("Xoá")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        className="input mono"
                        type="time"
                        aria-label={t("Giờ vào")}
                        value={r.entry_time}
                        onChange={(e) => setRow(i, "entry_time", e.target.value)}
                        lang={lang === "en" ? "en-GB" : "vi"}
                      />
                    </td>
                    <td>
                      <select
                        className="input"
                        aria-label={t("Hướng")}
                        value={r.side}
                        onChange={(e) => setRow(i, "side", e.target.value)}
                        style={{ minWidth: 96, color: r.side === "Long" ? "var(--long)" : "var(--short)" }}
                      >
                        {SIDES.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="input mono"
                        inputMode="numeric"
                        aria-label={t("Số hợp đồng")}
                        value={r.qty}
                        onChange={(e) => setRow(i, "qty", e.target.value)}
                        style={{ width: 56 }}
                      />
                    </td>
                    <td>
                      <select
                        className="input"
                        aria-label="Setup"
                        value={r.setup}
                        onChange={(e) => setRow(i, "setup", e.target.value)}
                        style={{ minWidth: 72 }}
                      >
                        <option value="">—</option>
                        {SETUPS.map(([v, n]) => (
                          <option key={v} value={v} title={n}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input className="input" aria-label="Level" value={r.level} onChange={(e) => setRow(i, "level", e.target.value)} placeholder="pRTH VAL" />
                    </td>
                    <td>
                      <input
                        className="input"
                        aria-label="Trigger"
                        value={r.trigger}
                        onChange={(e) => setRow(i, "trigger", e.target.value)}
                        placeholder="Absorption + CVD"
                        style={{ minWidth: 180 }}
                      />
                    </td>
                    <td>
                      <input
                        className="input mono"
                        inputMode="decimal"
                        aria-label="R"
                        value={r.r}
                        onChange={(e) => setRow(i, "r", e.target.value)}
                        style={{ width: 70 }}
                      />
                    </td>
                    <td>
                      <input
                        className="input mono"
                        inputMode="decimal"
                        aria-label="PnL $"
                        value={r.pnl}
                        onChange={(e) => setRow(i, "pnl", e.target.value)}
                        style={{ width: 90 }}
                      />
                    </td>
                    <td>
                      <input
                        className="input mono"
                        inputMode="decimal"
                        aria-label={t("Phí")}
                        value={r.fee}
                        onChange={(e) => setRow(i, "fee", e.target.value)}
                        style={{ width: 70 }}
                      />
                    </td>
                    <td>
                      <select
                        className="input"
                        aria-label={t("Theo plan")}
                        value={r.followed_plan}
                        onChange={(e) => setRow(i, "followed_plan", e.target.value)}
                      >
                        <option value="">—</option>
                        {FOLLOWED.map((o) => (
                          <option key={o} value={o}>
                            {t(o)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="input"
                        aria-label={t("Lỗi")}
                        value={r.mistakes}
                        onChange={(e) => setRow(i, "mistakes", e.target.value)}
                        placeholder={t("Vào trước trigger, Bỏ qua VWAP")}
                        style={{ minWidth: 200 }}
                      />
                    </td>
                    <td>
                      <button
                        className="btn sm"
                        aria-label={t("Xoá lệnh {n}", { n: i + 1 })}
                        onClick={() => {
                          setDirty(true);
                          setRows((rs) => rs.filter((_, j) => j !== i));
                        }}
                      >
                        {t("Xoá")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="small dim" style={{ padding: "8px 10px" }}>
            {t("Chưa có lệnh. Ngày không vào lệnh thì chọn kết quả “No Trade” và vẫn ghi lại vì sao đứng ngoài.")}
          </p>
        )}
        {rows.length > 0 && (
          <div className="hstack small muted" style={{ justifyContent: "flex-end", gap: 20, padding: "8px 10px 2px" }}>
            <span>
              Gross{" "}
              <span className="mono" style={{ color: "var(--text)" }}>
                {money(sum.gross)}
              </span>
            </span>
            <span>
              {t("Phí")}{" "}
              <span className="mono" style={{ color: "var(--text)" }}>
                ${sum.fee.toFixed(2)}
              </span>
            </span>
            <span style={{ fontWeight: 600 }}>
              Net <span className={"mono " + (sum.net >= 0 ? "long" : "short")}>{money(sum.net)}</span> ·{" "}
              <span className={"mono " + (sum.r >= 0 ? "long" : "short")}>
                {sum.r >= 0 ? "+" : "−"}
                {Math.abs(sum.r).toFixed(1)}R
              </span>
            </span>
          </div>
        )}
      </section>

      <section className="card" aria-label={t("Recap chi tiết")}>
        <div className="row wrap">
          <span className="lbl">{t("Recap chi tiết")}</span>
          <div className="seg seg-xs" role="group" aria-label={t("Kiểu xem recap")}>
            <button aria-pressed={!allFields} onClick={() => setAllFields(false)}>
              {t("Theo tab")}
            </button>
            <button aria-pressed={allFields} onClick={() => setAllFields(true)}>
              {t("Tất cả")}
            </button>
          </div>
        </div>
        {allFields ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {textFields.map(([k, label, ph]) => (
              <label className="field" key={k} style={k === "lesson" || k === "next_levels" ? { gridColumn: "1 / -1" } : undefined}>
                {t(label)}
                <textarea value={day[k]} onChange={(e) => set(k, e.target.value)} placeholder={t(ph)} style={k === "lesson" ? { minHeight: 64 } : undefined} />
              </label>
            ))}
          </div>
        ) : (
          <>
            <div className="tabs-line" role="tablist" aria-label={t("Phần recap")}>
              {textFields.map(([k, label]) => (
                <a
                  key={k}
                  href={`#${k}`}
                  role="tab"
                  aria-selected={k === field}
                  className={k === field ? "on" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    setField(k);
                  }}
                >
                  {t(label)}
                  {String(day[k] || "").trim() && (
                    <span className="long" aria-label={t("đã ghi")} style={{ marginLeft: 6 }}>
                      ●
                    </span>
                  )}
                </a>
              ))}
            </div>
            {textFields
              .filter(([k]) => k === field)
              .map(([k, label, ph]) => (
                <label className="field" key={k}>
                  <span className="small dim">{t(ph)}</span>
                  <textarea value={day[k]} onChange={(e) => set(k, e.target.value)} aria-label={t(label)} style={{ minHeight: 200 }} />
                </label>
              ))}
          </>
        )}
      </section>
    </div>
  );
}
