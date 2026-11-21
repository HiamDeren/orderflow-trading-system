"use client";
// Lỗi bất ngờ khi render một trang dashboard: giữ sidebar / thanh trên (layout nằm ngoài boundary này),
// hiện thông báo tiếng Việt + nút thử lại thay cho trang lỗi mặc định của Next.js.
// Không hiện message lỗi (có thể chứa chi tiết server); chỉ hiện digest để đối chiếu Vercel Runtime Logs.
import Link from "next/link";
import { useEffect } from "react";
import { useUi } from "./_components/Ui";

export default function DeskError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useUi();
  useEffect(() => {
    console.error("[desk] lỗi render", error.digest || error.message);
  }, [error]);
  return (
    <section className="card warn" role="alert" style={{ maxWidth: 560, gap: 12 }}>
      <span className="lbl short">{t("Trang gặp lỗi")}</span>
      <p className="muted" style={{ margin: 0 }}>
        {t("Phần này không tải được. Dữ liệu đã lưu không bị ảnh hưởng.")}
      </p>
      {error.digest && (
        <p className="small dim mono" style={{ margin: 0 }}>
          {t("Mã lỗi")}: {error.digest}
        </p>
      )}
      <div className="hstack" style={{ gap: 8 }}>
        <button type="button" className="btn primary" onClick={reset}>
          {t("Thử lại")}
        </button>
        <Link className="btn" href="/dashboard">
          {t("Về Dashboard")}
        </Link>
      </div>
    </section>
  );
}
