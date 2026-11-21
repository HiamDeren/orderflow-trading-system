import type { Metadata } from "next";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/prefs-server";
import { DATE_RE, etNow, monthRange } from "@/lib/time";
import PlanView, { type PlanItem } from "./PlanView";

export const metadata: Metadata = { title: "Trade Plan" };
export const dynamic = "force-dynamic";

export default async function TradePlanPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  // Kiểm chủ sở hữu trước khi đọc database (layout cũng kiểm, nhưng layout và page render song song; cache() nên không tốn thêm)
  await requireOwner("/trade-plan");
  const { date } = await searchParams;
  const { t } = await getT();
  const today = etNow().date;
  const initialDate = date && DATE_RE.test(date) ? date : null;
  // Nạp sẵn lịch sử plan của tháng đang xem (cùng truy vấn với GET /api/plan?month=). Lỗi → null, client tự gọi API như cũ.
  const { start, next } = monthRange((initialDate || today).slice(0, 7));
  const initialPlans = await db
    .select<PlanItem>(
      "trade_plans",
      `select=trade_date,symbol,summary,image_path,updated_at&trade_date=gte.${start}&trade_date=lt.${next}&order=trade_date.asc`,
    )
    .catch(() => null);
  return (
    <>
      <header className="page-head">
        <div>
          <span className="lbl">{t("Giao dịch")}</span>
          <h1 className="h1">Trade Plan</h1>
        </div>
        <span className="small muted">{t("Web và ATAS X dùng chung /api/plan: Database → ảnh WebP → Storage → Discord")}</span>
      </header>
      <PlanView today={today} initialDate={initialDate} initialPlans={initialPlans} />
    </>
  );
}
