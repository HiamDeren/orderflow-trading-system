// GET /api/plan/image?date=YYYY-MM-DD → ảnh plan (WebP) của ngày đó, cùng origin với dashboard.
// Dùng cho <img> và nút "Copy ảnh" (canvas cần ảnh cùng origin). Chỉ chủ sở hữu đã đăng nhập.
import { errText, fail, requireOwnerApi } from "@/lib/api";
import { db } from "@/lib/db";
import { secretKey, supabaseUrl } from "@/lib/env";
import { TRADING_BUCKET } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const owner = await requireOwnerApi();
  if (owner instanceof Response) return owner;
  const date = new URL(req.url).searchParams.get("date") || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail(400, "bad_request", "date phải dạng yyyy-MM-dd");
  try {
    const rows = await db.select<{ image_path: string | null }>("trade_plans", `select=image_path&trade_date=eq.${date}&order=updated_at.desc&limit=1`);
    const path = rows[0]?.image_path;
    if (!path) return fail(404, "not_found", "Chưa có ảnh");
    // Ảnh plan nằm ở PLAN_BUCKET (mặc định "trading"), giống /api/plan ghi vào
    const key = secretKey();
    const bucket = process.env.PLAN_BUCKET || TRADING_BUCKET;
    const r = await fetch(`${supabaseUrl()}/storage/v1/object/authenticated/${bucket}/${path}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return fail(502, "upstream", `storage ${r.status}`);
    return new Response(r.body, {
      headers: {
        "Content-Type": r.headers.get("content-type") || "image/webp",
        "Cache-Control": "private, max-age=300",
        "Content-Disposition": `inline; filename="plan_${date}.webp"`,
      },
    });
  } catch (e) {
    return fail(502, "upstream", errText(e));
  }
}
