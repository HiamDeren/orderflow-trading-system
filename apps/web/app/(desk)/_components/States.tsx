import { getT } from "@/lib/prefs-server";

export async function NotConfigured({ what }: { what: string }) {
  const { t } = await getT();
  return (
    <section className="card" style={{ maxWidth: 680 }}>
      <span className="lbl">{what} · {t("chưa cấu hình")}</span>
      <h2 className="h2">{t("Cần API key Finnhub")}</h2>
      <p className="muted" style={{ fontSize: 14 }}>
        {t("Tạo key miễn phí tại finnhub.io/register, rồi thêm biến FINNHUB_API_KEY (loại Secret, Production + Preview) trên Vercel và Redeploy.")}
      </p>
      <a className="btn ghost" href="https://finnhub.io/register" target="_blank" rel="noreferrer" style={{ alignSelf: "flex-start" }}>finnhub.io/register</a>
    </section>
  );
}
