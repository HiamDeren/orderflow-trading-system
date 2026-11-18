import type { Metadata } from "next";
import { requireOwner } from "@/lib/auth";
import { dbReady } from "@/lib/db";
import { getEconWeek } from "@/lib/econ";
import { SETTINGS } from "@/lib/settings";
import { supabaseServer } from "@/lib/supabase/server";
import { Avatar } from "../_components/Sidebar";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const owner = await requireOwner("/profile");
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
    { k: "ATAS X · Plan Sender", sub: "POST /api/plan bằng token", ok: !!env.PLAN_TOKEN, v: env.PLAN_TOKEN ? "Token đã đặt" : "Thiếu PLAN_TOKEN" },
    { k: "Discord webhook", sub: "Kênh nhận plan", ok: !!(env.DISCORD_WEBHOOK_TRADE_PLAN || env.DISCORD_WEBHOOK_URL), v: env.DISCORD_WEBHOOK_TRADE_PLAN || env.DISCORD_WEBHOOK_URL ? "Đã cấu hình" : "Chưa có" },
    { k: "Supabase", sub: "Database + Storage · schema trading", ok: dbReady(), v: dbReady() ? "Đã cấu hình" : "Thiếu key" },
    { k: "Lịch kinh tế", sub: "API bên ngoài · cache 15 phút", ok: econ.ok, v: econ.ok ? "Kết nối" : "Lỗi nguồn" },
  ];
  const trade = [
    ["Mã chính", SETTINGS.symbol],
    ["Phiên trade", SETTINGS.session],
    ["Giới hạn lệnh / ngày", String(SETTINGS.maxTradesPerDay)],
    ["Giờ gửi plan", SETTINGS.planSend],
    ["Giờ hiển thị", SETTINGS.displayTz],
    ["Ngôn ngữ", SETTINGS.language],
  ];
  return (
    <>
      <header className="page-head">
        <div>
          <span className="lbl">Tài khoản</span>
          <h1 className="h1">Profile</h1>
        </div>
      </header>
      <section className="card" aria-label="Tài khoản Discord" style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 22, padding: 22 }}>
        <Avatar owner={owner} large />
        <div className="stack" style={{ flex: "1 1 260px", gap: 6 }}>
          <div className="hstack">
            <span style={{ fontSize: 22, fontWeight: 700 }}>{owner.name}</span>
            <span className="pill accent">Chủ sở hữu</span>
          </div>
          <span className="mono small muted">{owner.handle ? `@${owner.handle}` : ""}{owner.discordId ? ` · ID ${owner.discordId}` : ""}</span>
          <span className="small dim">Avatar, tên và ID lấy từ Discord mỗi lần đăng nhập</span>
        </div>
        <form action="/auth/logout" method="post"><button className="btn">Đăng xuất</button></form>
      </section>

      <div className="grid-auto" style={{ alignItems: "start" }}>
        <section className="card tight" aria-label="Thiết lập giao dịch">
          <span className="lbl" style={{ paddingBottom: 8 }}>Thiết lập giao dịch</span>
          {trade.map(([k, v]) => (
            <div key={k} className="row" style={{ minHeight: 44, borderBottom: "1px solid var(--line-2)", fontSize: 14 }}>
              <span className="muted">{k}</span><span className="mono">{v}</span>
            </div>
          ))}
          <span className="small faint" style={{ paddingTop: 6 }}>Đổi trong apps/web/lib/settings.ts</span>
        </section>

        <section className="card tight" aria-label="Kết nối">
          <span className="lbl" style={{ paddingBottom: 8 }}>Kết nối</span>
          {links.map((l) => (
            <div key={l.k} className="row" style={{ minHeight: 52, borderBottom: "1px solid var(--line-2)" }}>
              <span className="stack" style={{ gap: 2 }}><span style={{ fontSize: 14 }}>{l.k}</span><span className="small dim">{l.sub}</span></span>
              <span className="hstack small" style={{ gap: 6, color: "var(--text-2)" }}><span className={"dot " + (l.ok ? "ok" : "err")} aria-hidden="true" />{l.v}</span>
            </div>
          ))}
        </section>

        <section className="card" aria-label="Bảo mật">
          <span className="lbl">Bảo mật</span>
          <p className="small muted">Chỉ ID Discord của chủ sở hữu được vào. Token, key và webhook nằm trên Vercel, không hiện trên trang này.</p>
          <div className="row" style={{ fontSize: 14, minHeight: 40 }}>
            <span className="muted">Lần đăng nhập gần nhất</span>
            <span className="mono">{lastSignIn ? new Date(lastSignIn).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) + " VN" : "—"}</span>
          </div>
          <form action="/auth/logout?scope=global" method="post"><button className="btn danger">Đăng xuất mọi thiết bị</button></form>
        </section>
      </div>
    </>
  );
}
