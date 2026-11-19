"use client";
// Tìm nhanh (Ctrl / Cmd + K): đi tới trang, mở mã cổ phiếu, mở journal theo ngày.
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { etNow } from "@/lib/time";
import Icon from "./Icon";
import { useUi } from "./Ui";

type Cmd = { id: string; label: string; hint: string; icon: string; href: string };

export const PAGES: { label: string; href: string; icon: string; keys: string }[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard", keys: "dashboard tong quan home" },
  { label: "Calendar", href: "/calendar", icon: "calendar", keys: "calendar lich tin kinh te economic" },
  { label: "News", href: "/news", icon: "news", keys: "news tin tuc" },
  { label: "Earnings", href: "/earnings", icon: "earnings", keys: "earnings bao cao ket qua" },
  { label: "Markets", href: "/markets", icon: "stock", keys: "markets thi truong sector crypto coin co phieu" },
  { label: "Trade Plan", href: "/trade-plan", icon: "plan", keys: "trade plan ke hoach" },
  { label: "Journal", href: "/journal", icon: "journal", keys: "journal nhat ky recap" },
  { label: "PnL Calendar", href: "/journal/pnl", icon: "pnl", keys: "pnl lai lo calendar" },
  { label: "Knowledge", href: "/knowledge", icon: "knowledge", keys: "knowledge kien thuc hoc tpo orderflow" },
  { label: "Profile", href: "/profile", icon: "user", keys: "profile cai dat settings mui gio" },
];

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").toLowerCase();

// "19/11", "19/11/2026", "2026-11-19" → yyyy-mm-dd
function parseDate(q: string): string | null {
  const iso = q.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return q;
  const m = q.match(/^(\d{1,2})[/.](\d{1,2})(?:[/.](\d{4}))?$/);
  if (!m) return null;
  const y = m[3] || etNow().date.slice(0, 4);
  const d = Number(m[1]);
  const mo = Number(m[2]);
  if (d < 1 || d > 31 || mo < 1 || mo > 12) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function Palette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useUi();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setI(0);
      setTimeout(() => input.current?.focus(), 0);
    }
  }, [open]);

  const cmds = useMemo<Cmd[]>(() => {
    const s = q.trim();
    const f = fold(s);
    const out: Cmd[] = [];
    const date = parseDate(s);
    if (date) out.push({ id: "d", label: t("Journal ngày {d}", { d: date.split("-").reverse().join("/") }), hint: "Journal", icon: "journal", href: `/journal?date=${date}` });
    const sym = s.toUpperCase();
    if (/^[A-Z][A-Z0-9.\-]{0,9}$/.test(sym) && !date) out.push({ id: "s", label: t("Mở mã {s}", { s: sym }), hint: "Stock", icon: "stock", href: `/stock/${encodeURIComponent(sym)}` });
    for (const p of PAGES) if (!f || fold(t(p.label)).includes(f) || p.keys.includes(f)) out.push({ id: p.href, label: t(p.label), hint: t("Trang"), icon: p.icon, href: p.href });
    if (s && !date) out.push({ id: "q", label: t("Tìm cổ phiếu “{q}”", { q: s }), hint: "Stocks", icon: "search", href: `/stock?q=${encodeURIComponent(s)}` });
    return out.slice(0, 9);
  }, [q, t]);

  if (!open) return null;
  const go = (c?: Cmd) => {
    if (!c) return;
    onClose();
    router.push(c.href);
  };

  return (
    <div className="pal-scrim" onMouseDown={onClose}>
      <div className="pal" role="dialog" aria-modal="true" aria-label={t("Tìm nhanh")} onMouseDown={(e) => e.stopPropagation()}>
        <label className="pal-in">
          <Icon name="search" size={18} />
          <input
            ref={input}
            value={q}
            placeholder={t("Gõ mã (NVDA), tên trang hoặc ngày (19/11)…")}
            aria-label={t("Tìm nhanh")}
            onChange={(e) => {
              setQ(e.target.value);
              setI(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setI((x) => Math.min(cmds.length - 1, x + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setI((x) => Math.max(0, x - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                go(cmds[i]);
              } else if (e.key === "Escape") onClose();
            }}
          />
          <kbd className="mono">Esc</kbd>
        </label>
        <ul className="pal-list" role="listbox" aria-label={t("Kết quả")}>
          {cmds.map((c, k) => (
            <li key={c.id} role="option" aria-selected={k === i}>
              <button className={k === i ? "on" : ""} onMouseEnter={() => setI(k)} onClick={() => go(c)}>
                <Icon name={c.icon} size={16} />
                <span>{c.label}</span>
                <span className="small dim">{c.hint}</span>
              </button>
            </li>
          ))}
          {!cmds.length && <li className="small dim" style={{ padding: 14 }}>{t("Không có kết quả")}</li>}
        </ul>
      </div>
    </div>
  );
}
