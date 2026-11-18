"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUi } from "../_components/Ui";

// Tab con của Journal: Nhật ký | PnL Calendar
export default function JournalTabs() {
  const path = usePathname();
  const { t } = useUi();
  const tabs = [
    { href: "/journal", label: t("Nhật ký") },
    { href: "/journal/pnl", label: "PnL Calendar" },
  ];
  return (
    <nav className="seg" aria-label="Journal">
      {tabs.map((x) => (
        <Link key={x.href} href={x.href} className={"seg-link" + (path === x.href ? " on" : "")} aria-current={path === x.href ? "page" : undefined}>
          {x.label}
        </Link>
      ))}
    </nav>
  );
}
