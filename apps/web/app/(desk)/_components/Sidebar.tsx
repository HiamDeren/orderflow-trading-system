"use client";
// Khung dashboard: sidebar ghim / thu gọn (desktop), ngăn kéo + thanh trên (mobile), nội dung cuộn riêng.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Owner } from "@/lib/auth";
import Icon from "./Icon";
import { useUi } from "./Ui";

type Item = { label: string; href: string; icon: string; soon?: boolean; match?: string[] };
const GROUPS: { name: string; items: Item[] }[] = [
  {
    name: "Tổng quan",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
      { label: "Calendar", href: "/calendar", icon: "calendar" },
      { label: "News", href: "/news", icon: "news" },
      { label: "Earnings", href: "/earnings", icon: "earnings" },
    ],
  },
  {
    name: "Giao dịch",
    items: [
      { label: "Trade Plan", href: "/trade-plan", icon: "plan" },
      { label: "Journal", href: "/journal", icon: "journal" },
    ],
  },
  { name: "Kiến thức", items: [{ label: "Knowledge", href: "/knowledge", icon: "knowledge" }] },
  { name: "Sắp có", items: [{ label: "Options", href: "", icon: "options", soon: true }] },
];

export function Avatar({ owner, large }: { owner: Owner; large?: boolean }) {
  const cls = "avatar" + (large ? " lg" : "");
  if (owner.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={cls} src={owner.avatar} alt="Avatar Discord" referrerPolicy="no-referrer" />;
  }
  return (
    <span className={cls} role="img" aria-label="Avatar Discord">
      {owner.name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function LangSwitch() {
  const { lang, setLang, t } = useUi();
  return (
    <div className="seg seg-xs" role="group" aria-label={t("Ngôn ngữ")}>
      <button aria-pressed={lang === "vi"} onClick={() => setLang("vi")}>VI</button>
      <button aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
    </div>
  );
}

export default function Shell({ owner, children }: { owner: Owner; children: React.ReactNode }) {
  const path = usePathname();
  const { side, setSide, t } = useUi();
  const [drawer, setDrawer] = useState(false);
  useEffect(() => setDrawer(false), [path]);
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

  const active = (it: Item) => !!it.href && (path === it.href || path.startsWith(it.href + "/"));
  const current = GROUPS.flatMap((g) => g.items).find(active);

  return (
    <div className={"shell" + (side === "collapsed" ? " is-collapsed" : "") + (drawer ? " drawer-open" : "")}>
      <header className="mtop">
        <button className="icon-btn" aria-label={t("Mở menu")} aria-expanded={drawer} onClick={() => setDrawer(true)}>
          <Icon name="menu" />
        </button>
        <span className="mtop-title">{current ? t(current.label) : "Deren Desk"}</span>
        <LangSwitch />
      </header>
      <div className="scrim" onClick={() => setDrawer(false)} aria-hidden="true" />

      <nav className="side" aria-label={t("Menu chính")}>
        <div className="side-in">
          <div className="side-head">
            <Link className="brand" href="/dashboard">
              <span className="brand-mark" aria-hidden="true">D</span>
              <span className="nl brand-text">
                <span style={{ fontWeight: 700, fontSize: 15 }}>Deren Desk</span>
                <span className="small dim">NQ · NY AM</span>
              </span>
            </Link>
            <button
              className="icon-btn pin"
              aria-label={side === "pinned" ? t("Thu gọn sidebar") : t("Ghim sidebar")}
              title={side === "pinned" ? t("Thu gọn sidebar") : t("Ghim sidebar")}
              onClick={() => setSide(side === "pinned" ? "collapsed" : "pinned")}
            >
              <Icon name={side === "pinned" ? "unpin" : "pin"} size={18} />
            </button>
            <button className="icon-btn close" aria-label={t("Đóng menu")} onClick={() => setDrawer(false)}>
              <Icon name="close" />
            </button>
          </div>

          <div className="side-scroll">
            {GROUPS.map((g) => (
              <div className="nav-group" key={g.name}>
                <span className="lbl nl">{t(g.name)}</span>
                {g.items.map((it) =>
                  it.soon ? (
                    <span className="navlink soon" key={it.label} aria-disabled="true" title={t(it.label)}>
                      <Icon name={it.icon} />
                      <span className="nl">{t(it.label)}</span>
                      <span className="navtag nl">soon</span>
                    </span>
                  ) : (
                    <Link
                      key={it.label}
                      href={it.href}
                      className={"navlink" + (active(it) ? " on" : "")}
                      aria-current={active(it) ? "page" : undefined}
                      title={t(it.label)}
                    >
                      <Icon name={it.icon} />
                      <span className="nl">{t(it.label)}</span>
                    </Link>
                  ),
                )}
              </div>
            ))}
          </div>

          <div className="side-foot">
            <Link className="me" href="/profile" title="Profile">
              <Avatar owner={owner} />
              <span className="nl me-text">
                <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{owner.name}</span>
                <span className="small dim">Profile</span>
              </span>
            </Link>
            <div className="nl side-tools">
              <LangSwitch />
              <form action="/auth/logout" method="post">
                <button className="icon-btn" aria-label={t("Đăng xuất")} title={t("Đăng xuất")}>
                  <Icon name="logout" size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="main">{children}</main>
    </div>
  );
}
