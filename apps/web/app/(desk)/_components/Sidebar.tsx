"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Owner } from "@/lib/auth";

const GROUPS: { name: string; items: { label: string; href: string; soon?: boolean }[] }[] = [
  { name: "Tổng quan", items: [{ label: "Dashboard", href: "/dashboard" }, { label: "Calendar", href: "/calendar" }] },
  {
    name: "Giao dịch",
    items: [
      { label: "Plan Studio", href: "/studio" },
      { label: "Journal", href: "/journal" },
      { label: "PnL Calendar", href: "/pnl" },
    ],
  },
  { name: "Kiến thức", items: [{ label: "Knowledge", href: "/knowledge" }] },
  {
    name: "Sắp có",
    items: [
      { label: "News · Earnings", href: "", soon: true },
      { label: "Options", href: "", soon: true },
    ],
  },
];

export function Avatar({ owner, large }: { owner: Owner; large?: boolean }) {
  const cls = "avatar" + (large ? " lg" : "");
  if (owner.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={cls} src={owner.avatar} alt="Avatar Discord" referrerPolicy="no-referrer" />;
  }
  const initials = owner.name.slice(0, 2).toUpperCase();
  return (
    <span className={cls} role="img" aria-label="Avatar Discord">
      {initials}
    </span>
  );
}

export default function Sidebar({ owner }: { owner: Owner }) {
  const path = usePathname();
  return (
    <nav className="side" aria-label="Menu chính">
      <Link className="brand" href="/dashboard">
        <span className="brand-mark" aria-hidden="true">D</span>
        <span style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Deren Desk</span>
          <span className="small dim">NQ · NY AM</span>
        </span>
      </Link>
      {GROUPS.map((g) => (
        <div className="nav-group" key={g.name}>
          <span className="lbl">{g.name}</span>
          {g.items.map((it) =>
            it.soon ? (
              <span className="navlink soon" key={it.label} aria-disabled="true">
                <span>{it.label}</span>
                <span className="navtag">soon</span>
              </span>
            ) : (
              <Link
                key={it.label}
                href={it.href}
                className={"navlink" + (path === it.href || path.startsWith(it.href + "/") ? " on" : "")}
                aria-current={path === it.href ? "page" : undefined}
              >
                <span>{it.label}</span>
              </Link>
            ),
          )}
        </div>
      ))}
      <div className="side-foot">
        <Link className="me" href="/profile">
          <Avatar owner={owner} />
          <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{owner.name}</span>
            <span className="small dim">Profile</span>
          </span>
        </Link>
        <form action="/auth/logout" method="post">
          <button className="btn sm" style={{ background: "none", boxShadow: "none", color: "var(--muted)" }}>
            Thoát
          </button>
        </form>
      </div>
    </nav>
  );
}
