// /api/journal (chỉ chủ sở hữu đã đăng nhập Discord)
//   GET ?date=YYYY-MM-DD  → ngày journal + các lệnh (null nếu chưa có)
//   GET ?month=YYYY-MM    → các ngày trong tháng kèm lệnh
//   PUT  { day: {...}, trades: [...] } → lưu ngày (upsert theo ngày + symbol) và thay toàn bộ lệnh của ngày đó
// Lỗi: { ok:false, error, code } (lib/api.ts).
import { crossOrigin, errText, fail, json, readJson, requireOwnerApi } from "@/lib/api";
import { getDay, getMonth, saveDay, type Trade } from "@/lib/journal";
import { JournalPut, journalPutError } from "@/lib/schemas";
import { DATE_RE, MONTH_RE } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 1024 * 1024;

export async function GET(req: Request) {
  const owner = await requireOwnerApi();
  if (owner instanceof Response) return owner;
  const q = new URL(req.url).searchParams;
  const date = q.get("date");
  const month = q.get("month");
  try {
    if (date) {
      if (!DATE_RE.test(date)) return fail(400, "bad_request", "date phải dạng yyyy-MM-dd");
      return json({ day: await getDay(date) });
    }
    if (month) {
      if (!MONTH_RE.test(month)) return fail(400, "bad_request", "month phải dạng yyyy-MM");
      return json({ month, days: await getMonth(month) });
    }
    return fail(400, "bad_request", "cần ?date hoặc ?month");
  } catch (e) {
    console.error("[api/journal] GET", errText(e));
    return fail(502, "upstream", errText(e));
  }
}

export async function PUT(req: Request) {
  const owner = await requireOwnerApi();
  if (owner instanceof Response) return owner;
  const bad = crossOrigin(req);
  if (bad) return bad;
  const body = await readJson(req, JournalPut, { maxBytes: MAX_BODY, invalid: journalPutError });
  if (!body.ok) return body.response;
  try {
    const saved = await saveDay(body.data.day, (body.data.trades || []) as Partial<Trade>[]);
    return json({ ok: true, day: saved });
  } catch (e) {
    console.error("[api/journal] PUT", errText(e));
    return fail(502, "upstream", errText(e));
  }
}
