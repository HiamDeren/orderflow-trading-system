"use client";
// Quản lý khách (D48): duyệt yêu cầu, thêm bằng Discord ID, gỡ / chặn. Chỉ hiện cho chủ sở hữu.
import { useCallback, useEffect, useState } from "react";
import type { Member } from "@/lib/members";
import { useUi } from "../_components/Ui";

type State = { kind: "loading" } | { kind: "missing" } | { kind: "error"; msg: string } | { kind: "ok"; rows: Member[] };

export default function MembersPanel() {
  const { t, tz } = useUi();
  const [st, setSt] = useState<State>({ kind: "loading" });
  const [busy, setBusy] = useState<string | null>(null);
  const [id, setId] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/members", { cache: "no-store" });
      const j = await r.json();
      if (r.status === 503 && j.error === "missing") return setSt({ kind: "missing" });
      if (!r.ok) return setSt({ kind: "error", msg: j.error || String(r.status) });
      setSt({ kind: "ok", rows: j.members });
    } catch (e) {
      setSt({ kind: "error", msg: String((e as Error).message) });
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const act = async (action: string, discord_id: string, extra?: Record<string, string>) => {
    setBusy(discord_id + action);
    setMsg(null);
    try {
      const r = await fetch("/api/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, discord_id, ...extra }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setMsg(j.error || String(r.status));
      else if (action === "add") {
        setId("");
        setNote("");
      }
      await load();
    } finally {
      setBusy(null);
    }
  };

  const when = (s: string | null) =>
    s ? new Date(s).toLocaleString("en-GB", { timeZone: tz, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

  const rows = st.kind === "ok" ? st.rows : [];
  const groups: { key: Member["status"]; title: string; empty: string }[] = [
    { key: "pending", title: t("Chờ duyệt"), empty: t("Không có yêu cầu mới.") },
    { key: "guest", title: t("Khách"), empty: t("Chưa có khách.") },
    { key: "blocked", title: t("Đã chặn"), empty: "" },
  ];

  return (
    <section className="card members" aria-label={t("Khách truy cập")}>
      <div className="row">
        <span className="lbl">{t("Khách truy cập")}</span>
        <button className="btn sm" onClick={load}>{t("Làm mới")}</button>
      </div>
      <p className="small muted">
        {t("Người lạ bấm đăng nhập Discord sẽ vào hàng chờ. Duyệt xong, họ đăng nhập lại để vào. Khách chỉ xem phần thị trường và Knowledge.")}
      </p>

      {st.kind === "loading" && <p className="small dim">{t("Đang tải…")}</p>}
      {st.kind === "missing" && <p className="small short">{t("Bảng desk_members chưa có trên Supabase (chưa áp migration).")}</p>}
      {st.kind === "error" && <p className="small short">{st.msg}</p>}

      {st.kind === "ok" &&
        groups.map((g) => {
          const list = rows.filter((m) => m.status === g.key);
          if (!list.length && !g.empty) return null;
          return (
            <div key={g.key} className="stack" style={{ gap: 6 }}>
              <span className="small dim" style={{ fontWeight: 600 }}>{g.title} · {list.length}</span>
              {!list.length && <span className="small dim">{g.empty}</span>}
              {list.map((m) => (
                <div key={m.discord_id} className="mem-row">
                  {m.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="mem-av" src={m.avatar} alt="" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="mem-av">{(m.name || "?").slice(0, 2).toUpperCase()}</span>
                  )}
                  <span className="stack" style={{ gap: 2, minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.name || m.handle || m.discord_id}
                      {m.handle && m.name && <span className="small dim" style={{ fontWeight: 400 }}> @{m.handle}</span>}
                    </span>
                    <span className="mono small dim">
                      {m.discord_id}
                      {m.status === "guest" ? ` · ${t("vào gần nhất")} ${when(m.last_login_at)}` : ` · ${when(m.updated_at)}`}
                      {m.note ? ` · ${m.note}` : ""}
                    </span>
                  </span>
                  <span className="hstack" style={{ gap: 6 }}>
                    {m.status !== "guest" && (
                      <button className="btn primary sm" disabled={!!busy} onClick={() => act("approve", m.discord_id)}>{t("Duyệt")}</button>
                    )}
                    {m.status !== "blocked" && (
                      <button className="btn sm" disabled={!!busy} onClick={() => act("block", m.discord_id)}>{m.status === "guest" ? t("Gỡ quyền") : t("Từ chối")}</button>
                    )}
                    {m.status === "blocked" && (
                      <button className="btn sm" disabled={!!busy} onClick={() => act("remove", m.discord_id)}>{t("Xoá")}</button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          );
        })}

      {st.kind === "ok" && (
        <form
          className="mem-add"
          onSubmit={(e) => {
            e.preventDefault();
            act("add", id.trim(), note.trim() ? { note: note.trim() } : undefined);
          }}
        >
          <input className="input mono" inputMode="numeric" placeholder={t("Discord User ID")} aria-label={t("Discord User ID")} value={id} onChange={(e) => setId(e.target.value.replace(/\D/g, ""))} />
          <input className="input" placeholder={t("Ghi chú (tuỳ chọn)")} aria-label={t("Ghi chú")} value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
          <button className="btn" disabled={!!busy || id.length < 5}>{t("Thêm khách")}</button>
        </form>
      )}
      {msg && <p className="small short" role="status">{msg}</p>}
    </section>
  );
}
