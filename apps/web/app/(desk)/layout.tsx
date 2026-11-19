// Khung dashboard: chỉ chủ sở hữu (Discord) vào được. proxy.ts đã chặn trước, ở đây kiểm lại lần nữa.
import { cookies } from "next/headers";
import { requireOwner } from "@/lib/auth";
import { getEconWeek, localize } from "@/lib/econ";
import { PREFS_COOKIE, matches, parsePrefs } from "@/lib/econ-prefs";
import { getUi } from "@/lib/prefs-server";
import Shell from "./_components/Sidebar";
import type { NextEvent } from "./_components/Topbar";
import { UiProvider } from "./_components/Ui";

export const dynamic = "force-dynamic";

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  const owner = await requireOwner();
  const ui = await getUi();
  // Tin tác động cao của tuần (theo bộ lọc currency của Calendar) cho thanh trên; lịch đã cache 15 phút
  const prefs = parsePrefs((await cookies()).get(PREFS_COOKIE)?.value);
  const econ = await getEconWeek();
  const events: NextEvent[] = localize(econ.events, ui.tz)
    .filter((e) => e.impact === "High" && !e.allDay && Number.isFinite(e.ts) && matches({ ...prefs, imp: ["High"] }, e))
    .sort((a, b) => a.ts - b.ts)
    .map((e) => ({ ts: e.ts, title: e.title, country: e.country, dateLocal: e.dateLocal }));
  return (
    <UiProvider prefs={ui}>
      <Shell owner={owner} events={events}>{children}</Shell>
    </UiProvider>
  );
}
