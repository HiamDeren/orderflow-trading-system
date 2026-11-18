// GET /api/plan/image?date=YYYY-MM-DD → ảnh plan (WebP) của ngày đó, cùng origin với dashboard.
// Dùng cho <img> và nút "Copy ảnh" (canvas cần ảnh cùng origin). Chỉ chủ sở hữu đã đăng nhập.
import { getOwner } from "@/lib/auth";
import { secretKey, supabaseUrl } from "@/lib/env";
import { db } from "@/lib/db";
import { TRADING_BUCKET } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await getOwner())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const date = new URL(req.url).searchParams.get("date") || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return Response.json({ error: "date phải dạng yyyy-MM-dd" }, { status: 400 });
  try {
    const rows = await db.select<{ image_path: string | null }>("trade_plans", `select=image_path&trade_date=eq.${date}&order=updated_at.desc&limit=1`);
    const path = rows[0]?.image_path;
    if (!path) return Response.json({ error: "Chưa có ảnh" }, { status: 404 });
    const key = secretKey();
    const bucket = process.env.PLAN_BUCKET || TRADING_BUCKET;
    const r = await fetch(`${supabaseUrl()}/storage/v1/object/authenticated/${bucket}/${path}`, {
      headers: { apikey: key, Authorization: "Bearer " + key },
      cache: "no-store",
    });
    if (!r.ok) return Response.json({ error: `storage ${r.status}` }, { status: 502 });
    return new Response(r.body, {
      headers: {
        "Content-Type": r.headers.get("content-type") || "image/webp",
        "Cache-Control": "private, max-age=300",
        "Content-Disposition": `inline; filename="plan_${date}.webp"`,
      },
    });
  } catch (e) {
    return Response.json({ error: String((e as Error).message) }, { status: 502 });
  }
}
