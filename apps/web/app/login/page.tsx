import type { Metadata } from "next";
import { getT } from "@/lib/prefs-server";
import LangToggle from "./LangToggle";

export const metadata: Metadata = { title: "Đăng nhập" };

const MESSAGES: Record<string, { text: string; ok?: boolean }> = {
  denied: { text: "Tài khoản Discord này không có quyền vào. Phiên vừa tạo đã bị huỷ." },
  pending: { text: "Đã gửi yêu cầu vào dashboard. Khi chủ sở hữu duyệt, bấm đăng nhập lại.", ok: true },
  config: { text: "Server chưa cấu hình đăng nhập (Supabase Auth / OWNER_DISCORD_ID). Xem docs/dashboard-setup.md." },
  exchange: { text: "Discord chưa xác nhận được phiên đăng nhập. Thử lại." },
  code: { text: "Thiếu mã xác nhận từ Discord. Thử lại." },
  oauth: { text: "Không mở được trang đăng nhập Discord. Kiểm tra provider Discord trên Supabase." },
  mark: { text: "Không ghi được quyền chủ sở hữu. Kiểm tra secret key Supabase trên Vercel." },
  out: { text: "Đã đăng xuất.", ok: true },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ e?: string; next?: string }> }) {
  const { e, next } = await searchParams;
  const { t, ui } = await getT();
  const msg = e ? MESSAGES[e] : null;
  const href = "/auth/login" + (next && next.startsWith("/") ? `?next=${encodeURIComponent(next)}` : "");
  return (
    <div className="login">
      <div className="login-inner">
        <section style={{ flex: "1.2 1 380px", display: "flex", flexDirection: "column", gap: 22 }}>
          <div className="row">
            <div className="hstack" style={{ gap: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="brand-mark brand-logo" src="/assets/img/zendojo/logo.svg" alt="" aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 11 }} />
              <span className="stack" style={{ gap: 2 }}>
                <span style={{ fontWeight: 700, fontSize: 20 }}>ZenDojo</span>
                <span className="small dim">{t("Võ đường trading của Derenツ")}</span>
              </span>
            </div>
            <LangToggle lang={ui.lang} />
          </div>
          <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.15, fontWeight: 700, letterSpacing: "-.02em", maxWidth: 520 }}>
            {t("Level từ TPO.")}
            <br />
            {t("Trigger từ orderflow.")}
            <br />
            <span className="dim">{t("Recap mỗi ngày.")}</span>
          </h1>
          <div className="facts" style={{ maxWidth: 460 }}>
            <div><span className="muted">{t("Thị trường")}</span><span className="mono">NQ futures</span></div>
            <div><span className="muted">{t("Khung plan")}</span><span className="mono">Composite × pRTH × OVN</span></div>
            <div><span className="muted">{t("Giới hạn")}</span><span className="mono">{t("2–3 lệnh / ngày")}</span></div>
          </div>
        </section>

        <section className="login-card" aria-label={t("Đăng nhập")}>
          <div className="stack" style={{ gap: 6 }}>
            <span className="lbl">{t("Đăng nhập")}</span>
            <h2 className="h2" style={{ fontSize: 22 }}>{t("Vào dashboard")}</h2>
            <p className="muted" style={{ fontSize: 14 }}>
              {t("Web app cá nhân: chỉ tài khoản Discord của chủ sở hữu và khách được mời mới vào được. Không có mật khẩu, không đăng ký.")}
            </p>
          </div>
          {msg && <div className={"notice" + (msg.ok ? " ok" : "")} role="status">{t(msg.text)}</div>}
          <a className="btn light" href={href} style={{ minHeight: 48, fontSize: 15 }}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14161A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
            </svg>
            {t("Tiếp tục với Discord")}
          </a>
          <p className="muted small" style={{ padding: 14, borderRadius: 10, background: "var(--side)" }}>
            {t("Sau khi Discord xác nhận, server so Discord ID với danh sách đã cấu hình. Không có trong danh sách là bị từ chối và đăng xuất ngay, không tạo tài khoản.")}
          </p>
          <span className="small dim">{t("Avatar và tên hiển thị lấy từ Discord.")}</span>
        </section>
      </div>
    </div>
  );
}
