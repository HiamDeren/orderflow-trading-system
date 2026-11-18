// /api/journal (chỉ chủ sở hữu đã đăng nhập Discord)
//   GET ?date=YYYY-MM-DD  → ngày journal + các lệnh (null nếu chưa có)
//   GET ?month=YYYY-MM    → các ngày trong tháng kèm lệnh
//   PUT  { day: {...}, trades: [...] } → lưu ngày (upsert theo ngày + symbol) và thay toàn bộ lệnh của ngày đó
import { getOwner } from "@/lib/auth";
import { errText } from "@/lib/db";
import { getDay, getMonth, saveDay, type Trade } from "@/lib/journal";
import { DATE_RE, MONTH_RE } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(req: Request) {
  if (!(await getOwner())) return json({ error: "unauthorized" }, 401);
  const q = new URL(req.url).searchParams;
  const date = q.get("date");
  const month = q.get("month");
  try {
    if (date) {
      if (!DATE_RE.test(date)) return json({ error: "date phải dạng yyyy-MM-dd" }, 400);
      return json({ day: await getDay(date) });
    }
    if (month) {
      if (!MONTH_RE.test(month)) return json({ error: "month phải dạng yyyy-MM" }, 400);
      return json({ month, days: await getMonth(month) });
    }
    return json({ error: "cần ?date hoặc ?month" }, 400);
  } catch (e) {
    console.error("[api/journal] GET", errText(e));
    return json({ error: errText(e) }, 502);
  }
}

export async function PUT(req: Request) {
  if (!(await getOwner())) return json({ error: "unauthorized" }, 401);
  let body: { day?: Record<string, unknown>; trades?: Partial<Trade>[] } | null = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  const day = body?.day;
  if (!day || !DATE_RE.test(String(day.trade_date || ""))) return json({ error: "Thiếu day.trade_date (yyyy-MM-dd)" }, 400);
  try {
    const saved = await saveDay(day, Array.isArray(body?.trades) ? body!.trades! : []);
    return json({ ok: true, day: saved });
  } catch (e) {
    console.error("[api/journal] PUT", errText(e));
    return json({ error: errText(e) }, 502);
  }
}
