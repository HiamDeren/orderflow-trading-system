// Trang 404 của ZenDojo (D49). Không cần đăng nhập; link về Dashboard (chưa đăng nhập thì proxy đưa về /login).
import Link from "next/link";
import { getT } from "@/lib/prefs-server";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <main className="nf">
      <div className="nf-card card" style={{ padding: 28 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="empty-art" src="/assets/img/zendojo/empty.webp" alt="" aria-hidden="true" />
        <span className="lbl">404</span>
        <h1 className="h1" style={{ margin: 0 }}>{t("Lạc khỏi võ đường")}</h1>
        <p className="muted" style={{ margin: 0 }}>{t("Trang này không có trong ZenDojo. Hít một hơi, quay lại Dashboard.")}</p>
        <Link className="btn primary" href="/dashboard">{t("Về Dashboard")}</Link>
      </div>
    </main>
  );
}
