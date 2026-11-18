import type { Metadata } from "next";
import { getT } from "@/lib/prefs-server";
import { DATE_RE, etNow } from "@/lib/time";
import PlanView from "./PlanView";

export const metadata: Metadata = { title: "Trade Plan" };
export const dynamic = "force-dynamic";

export default async function TradePlanPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  const { t } = await getT();
  const today = etNow().date;
  return (
    <>
      <header className="page-head">
        <div>
          <span className="lbl">{t("Giao dịch")}</span>
          <h1 className="h1">Trade Plan</h1>
        </div>
        <span className="small muted">{t("Web và ATAS X dùng chung /api/plan: Database → ảnh WebP → Storage → Discord")}</span>
      </header>
      <PlanView today={today} initialDate={date && DATE_RE.test(date) ? date : null} />
    </>
  );
}
