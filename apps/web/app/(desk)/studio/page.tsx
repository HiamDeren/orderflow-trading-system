import type { Metadata } from "next";
import { DATE_RE, etNow } from "@/lib/time";
import StudioView from "./StudioView";

export const metadata: Metadata = { title: "Plan Studio" };
export const dynamic = "force-dynamic";

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  const today = etNow().date;
  return (
    <>
      <header className="page-head">
        <div>
          <span className="lbl">Giao dịch</span>
          <h1 className="h1">Plan Studio</h1>
        </div>
        <span className="small muted">Web và ATAS X dùng chung /api/plan: Database → ảnh WebP → Storage → Discord</span>
      </header>
      <StudioView today={today} initialDate={date && DATE_RE.test(date) ? date : null} />
    </>
  );
}
