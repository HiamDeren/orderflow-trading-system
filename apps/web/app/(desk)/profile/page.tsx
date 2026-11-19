import type { Metadata } from "next";
import { requireViewer } from "@/lib/auth";
import { dbReady } from "@/lib/db";
import { getEconWeek } from "@/lib/econ";
import { marketConfigured } from "@/lib/market";
import { tzShort } from "@/lib/prefs";
import { getT } from "@/lib/prefs-server";
import { SETTINGS } from "@/lib/settings";
import { supabaseServer } from "@/lib/supabase/server";
import { Avatar } from "../_components/Sidebar";
import DisplaySettings from "./DisplaySettings";
import MembersPanel from "./MembersPanel";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const owner = await requireViewer("/profile");
  const isOwner = owner.role === "owner";
  const { t, ui } = await getT();
  let lastSignIn: string | null = null;
  try {
    const sb = await supabaseServer();
    const { data } = await sb.auth.getUser();
    lastSignIn = data.user?.last_sign_in_at ?? null;
  } catch {
    lastSignIn = null;
  }
  const econ = await getEconWeek();
  const env = process.env;
  const links = [
    { k: "ATAS X · Plan Sender", sub: t("POST /api/plan bằng token"), ok: !!env.PLAN_TOKEN, v: env.PLAN_TOKEN ? t("Token đã đặt") : t("Thiếu PLAN_TOKEN") },
    { k: "Discord webhook", sub: t("Kênh nhận plan"), ok: !!(env.DISCORD_WEBHOOK_TRADE_PLAN || env.DISCORD_WEBHOOK_URL), v: env.DISCORD_WEBHOOK_TRADE_PLAN || env.DISCORD_WEBHOOK_URL ? t("Đã cấu hình") : t("Chưa có") },
    { k: "Supabase", sub: "Database + Storage · schema trading", ok: dbReady(), v: dbReady() ? t("Đã cấu hình") : t("Thiếu key") },
    { k: t("Lịch kinh tế"), sub: "ForexFactory · cache 15 phút", ok: econ.ok, v: econ.ok ? t("Đã kết nối") : t("Lỗi nguồn") },
    { k: "News · Earnings", sub: "Finnhub · FINNHUB_API_KEY", ok: marketConfigured(), v: marketConfigured() ? t("Đã cấu hình") : t("Chưa có") },
  ];
  const trade = [
    [t("Mã chính"), SETTINGS.symbol],
    [t("Giới hạn lệnh / ngày"), String(SETTINGS.maxTradesPerDay)],
    [t("Giờ gửi plan"), SETTINGS.planSend],
  ];
  return (
    <>
      <header className="page-head">
        <div>
          <span className="lbl">{t("Tài khoản")}</span>
          <h1 className="h1">Profile</h1>
        </div>
      </header>
      <section className="card" aria-label={t("Tài khoản Discord")} style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 22, padding: 22 }}>
        <Avatar owner={owner} large />
        <div className="stack" style={{ flex: "1 1 260px", gap: 6 }}>
          <div className="hstack">
            <span style={{ fontSize: 22, fontWeight: 700 }}>{owner.name}</span>
            <span className={"pill" + (isOwner ? " accent" : "")}>{isOwner ? t("Chủ sở hữu") : t("Khách")}</span>
          </div>
          <span className="mono small muted">{owner.handle ? `@${owner.handle}` : ""}{owner.discordId ? ` · ID ${owner.discordId}` : ""}</span>
          <span className="small dim">{t("Avatar, tên và ID lấy từ Discord mỗi lần đăng nhập")}</span>
        </div>
        <form action="/auth/logout" method="post"><button className="btn">{t("Đăng xuất")}</button></form>
      </section>

      <div className="grid-auto" style={{ alignItems: "start" }}>
        <DisplaySettings />
        {isOwner && (<>
        <section className="card tight" aria-label={t("Thiết lập giao dịch")}>
          <span className="lbl" style={{ paddingBottom: 8 }}>{t("Thiết lập giao dịch")}</span>
          {trade.map(([k, v]) => (
            <div key={k} className="row" style={{ minHeight: 44, borderBottom: "1px solid var(--line-2)", fontSize: 14 }}>
              <span className="muted">{k}</span><span className="mono">{v}</span>
            </div>
          ))}
        </section>

        <section className="card tight" aria-label={t("Kết nối")}>
          <span className="lbl" style={{ paddingBottom: 8 }}>{t("Kết nối")}</span>
          {links.map((l) => (
            <div key={l.k} className="row" style={{ minHeight: 52, borderBottom: "1px solid var(--line-2)" }}>
              <span className="stack" style={{ gap: 2 }}><span style={{ fontSize: 14 }}>{l.k}</span><span className="small dim">{l.sub}</span></span>
              <span className="hstack small" style={{ gap: 6, color: "var(--text-2)" }}><span className={"dot " + (l.ok ? "ok" : "err")} aria-hidden="true" />{l.v}</span>
            </div>
          ))}
        </section>

        </>)}

        <section className="card" aria-label={t("Bảo mật")}>
          <span className="lbl">{t("Bảo mật")}</span>
          <p className="small muted">{isOwner ? t("Chủ sở hữu và khách đã duyệt được vào; khách chỉ xem phần thị trường. Token, key và webhook nằm trên Vercel, không hiện trên trang này.") : t("Tài khoản khách: xem Calendar, News, Earnings, Markets, Knowledge. Trade Plan và Journal chỉ chủ sở hữu.")}</p>
          <div className="row" style={{ fontSize: 14, minHeight: 40 }}>
            <span className="muted">{t("Lần đăng nhập gần nhất")}</span>
            <span className="mono">{lastSignIn ? new Date(lastSignIn).toLocaleString("en-GB", { timeZone: ui.tz, hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) + " " + tzShort(ui.tz) : "—"}</span>
          </div>
          <form action="/auth/logout?scope=global" method="post"><button className="btn danger">{t("Đăng xuất mọi thiết bị")}</button></form>
        </section>
      </div>
      {isOwner && <MembersPanel />}
    </>
  );
}
