// Khung dashboard: chủ sở hữu + khách (D48). proxy.ts đã chặn trước, ở đây kiểm lại lần nữa.
import { cookies } from "next/headers";
import { requireViewer } from "@/lib/auth";
import { getEconWeek, localize } from "@/lib/econ";
import { PREFS_COOKIE, matches, parsePrefs } from "@/lib/econ-prefs";
import { getUi } from "@/lib/prefs-server";
import Shell from "./_components/Sidebar";
import type { NextEvent } from "./_components/Topbar";
import { UiProvider } from "./_components/Ui";

export const dynamic = "force-dynamic";

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  // Kiểm đăng nhập, đọc cookie và lấy lịch tin chạy song song (lịch đã cache 15 phút; chưa đăng nhập thì requireViewer redirect)
  const [owner, ui, store, econ] = await Promise.all([requireViewer(), getUi(), cookies(), getEconWeek()]);
  // Tin tác động cao của tuần (theo bộ lọc currency của Calendar) cho thanh trên
  const prefs = parsePrefs(store.get(PREFS_COOKIE)?.value);
  const events: NextEvent[] = localize(econ.events, ui.tz)
    .filter((e) => e.impact === "High" && !e.allDay && Number.isFinite(e.ts) && matches({ ...prefs, imp: ["High"] }, e))
    .sort((a, b) => a.ts - b.ts)
    .map((e) => ({ ts: e.ts, title: e.title, country: e.country, dateLocal: e.dateLocal }));
  return (
    <UiProvider prefs={ui}>
      <Shell owner={owner} events={events}>
        {children}
      </Shell>
    </UiProvider>
  );
}
