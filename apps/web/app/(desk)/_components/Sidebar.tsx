"use client";
// Khung dashboard: sidebar ghim / thu gọn (desktop), ngăn kéo + thanh trên (mobile), nội dung cuộn riêng.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Owner, Viewer } from "@/lib/auth";
import Icon from "./Icon";
import LangSwitch from "./LangSwitch";
import Palette from "./Palette";
import Topbar, { type NextEvent } from "./Topbar";
import TzPicker from "./TzPicker";
import { useUi } from "./Ui";

type Item = { label: string; href: string; icon: string; soon?: boolean; exact?: boolean; also?: string[] };
const GROUPS: { name: string; items: Item[] }[] = [
  {
    name: "Thị trường",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
      { label: "Calendar", href: "/calendar", icon: "calendar" },
      { label: "News", href: "/news", icon: "news" },
      { label: "Earnings", href: "/earnings", icon: "earnings" },
      { label: "Markets", href: "/markets", icon: "stock", also: ["/stock"] },
    ],
  },
  {
    name: "Giao dịch",
    items: [
      { label: "Trade Plan", href: "/trade-plan", icon: "plan" },
      { label: "Journal", href: "/journal", icon: "journal", exact: true },
      { label: "PnL", href: "/journal/pnl", icon: "pnl" },
    ],
  },
  { name: "Học", items: [{ label: "Knowledge", href: "/knowledge", icon: "knowledge" }] },
  { name: "Sắp có", items: [{ label: "Options", href: "", icon: "options", soon: true }] },
];

// Thanh tab dưới đáy trên mobile
const TABS: Item[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Calendar", href: "/calendar", icon: "calendar" },
  { label: "Markets", href: "/markets", icon: "stock", also: ["/stock"] },
  { label: "Journal", href: "/journal", icon: "journal" },
];
// Khách không thấy nhóm Giao dịch (Trade Plan / Journal / PnL)
const GUEST_GROUPS = GROUPS.filter((g) => g.name !== "Giao dịch");
const GUEST_TABS: Item[] = [...TABS.slice(0, 3), { label: "News", href: "/news", icon: "news" }];

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

export { LangSwitch };

export default function Shell({ owner, events, children }: { owner: Viewer; events: NextEvent[]; children: React.ReactNode }) {
  const guest = owner.role === "guest";
  const groups = guest ? GUEST_GROUPS : GROUPS;
  const tabs = guest ? GUEST_TABS : TABS;
  const path = usePathname();
  const { side, setSide, t } = useUi();
  const [drawer, setDrawer] = useState(false);
  const [pal, setPal] = useState(false);
  useEffect(() => setDrawer(false), [path]);
  // Ctrl / Cmd + K mở tìm nhanh
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPal((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

  const hit = (h: string, exact?: boolean) => path === h || (!exact && path.startsWith(h + "/"));
  const active = (it: Item) => !!it.href && (hit(it.href, it.exact) || !!it.also?.some((h) => hit(h)));
  const current = groups.flatMap((g) => g.items).find(active);

  return (
    <div className={"shell" + (side === "collapsed" ? " is-collapsed" : "") + (drawer ? " drawer-open" : "")}>
      <header className="mtop">
        <button className="icon-btn" aria-label={t("Mở menu")} aria-expanded={drawer} onClick={() => setDrawer(true)}>
          <Icon name="menu" />
        </button>
        <span className="mtop-title">{current ? t(current.label) : "ZenDojo"}</span>
        <button className="icon-btn" aria-label={t("Tìm nhanh")} onClick={() => setPal(true)}>
          <Icon name="search" size={18} />
        </button>
        <TzPicker />
      </header>
      <div className="scrim" onClick={() => setDrawer(false)} aria-hidden="true" />

      <nav className="side" aria-label={t("Menu chính")}>
        <div className="side-in">
          <div className="side-head">
            <Link className="brand" href="/dashboard">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="brand-mark brand-logo" src="/assets/img/zendojo/icon-192.png" alt="" aria-hidden="true" />
              <span className="nl brand-text">
                <span style={{ fontWeight: 700, fontSize: 15 }}>ZenDojo</span>
                <span className="small dim">Derenツ</span>
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
            {groups.map((g) => (
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
                <span className="small dim">{guest ? t("Khách") : "Profile"}</span>
              </span>
            </Link>
            <div className="nl side-tools">
              <LangSwitch />
              <TzPicker />
              <form action="/auth/logout" method="post">
                <button className="icon-btn" aria-label={t("Đăng xuất")} title={t("Đăng xuất")}>
                  <Icon name="logout" size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <div className="content">
        <Topbar events={events} onSearch={() => setPal(true)} guest={guest} />
        <main className="main">{children}</main>
      </div>

      <nav className="mtabs" aria-label={t("Điều hướng nhanh")}>
        {tabs.map((it) => (
          <Link key={it.href} href={it.href} className={active(it) ? "on" : ""} aria-current={active(it) ? "page" : undefined}>
            <Icon name={it.icon} size={20} />
            <span>{t(it.label)}</span>
          </Link>
        ))}
        <button onClick={() => setDrawer(true)} aria-label={t("Mở menu")}>
          <Icon name="menu" size={20} />
          <span>{t("Thêm")}</span>
        </button>
      </nav>
      <Palette open={pal} onClose={() => setPal(false)} guest={guest} />
    </div>
  );
}
