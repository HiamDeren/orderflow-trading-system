// /api/journal/image (chỉ chủ sở hữu đã đăng nhập Discord)
//   GET    ?date=YYYY-MM-DD        → { images: [...] } của ngày
//   GET    ?id=<uuid>              → file ảnh (WebP), cùng origin
//   POST   multipart: file, date, caption?, trade_seq?  → nén WebP rồi lưu bucket trading + bảng journal_images
//   PATCH  { id, caption?, trade_seq? }
//   DELETE ?id=<uuid>
import { getOwner } from "@/lib/auth";
import { errText, storage } from "@/lib/db";
import { MAX_UPLOAD, addImage, deleteImage, getImage, listImages, updateImage } from "@/lib/journal-images";
import { DATE_RE } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TYPES = ["image/png", "image/jpeg", "image/webp"];

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
const cap = (v: unknown) => {
  const s = String(v ?? "")
    .trim()
    .slice(0, 300);
  return s || null;
};
const seq = (v: unknown) => {
  const n = Number(v);
  return v === null || v === undefined || v === "" || !Number.isInteger(n) || n < 1 || n > 50 ? null : n;
};

export async function GET(req: Request) {
  if (!(await getOwner())) return json({ error: "unauthorized" }, 401);
  const q = new URL(req.url).searchParams;
  const id = q.get("id");
  const date = q.get("date");
  try {
    if (id) {
      if (!UUID.test(id)) return json({ error: "id không hợp lệ" }, 400);
      const img = await getImage(id);
      if (!img) return json({ error: "Không có ảnh" }, 404);
      const r = await storage.get(img.path);
      if (!r.ok) return json({ error: `storage ${r.status}` }, 502);
      return new Response(r.body, {
        headers: {
          "Content-Type": r.headers.get("content-type") || "image/webp",
          "Cache-Control": "private, max-age=86400, immutable",
          "Content-Disposition": `inline; filename="journal_${img.trade_date}_${id.slice(0, 8)}.webp"`,
        },
      });
    }
    if (date) {
      if (!DATE_RE.test(date)) return json({ error: "date phải dạng yyyy-MM-dd" }, 400);
      return json({ images: await listImages(date) });
    }
    return json({ error: "cần date hoặc id" }, 400);
  } catch (e) {
    return json({ error: errText(e) }, 502);
  }
}

export async function POST(req: Request) {
  if (!(await getOwner())) return json({ error: "unauthorized" }, 401);
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ error: "Cần multipart/form-data" }, 400);
  }
  const date = String(form.get("date") || "");
  const file = form.get("file");
  if (!DATE_RE.test(date)) return json({ error: "date phải dạng yyyy-MM-dd" }, 400);
  if (!(file instanceof File)) return json({ error: "Thiếu file" }, 400);
  if (!TYPES.includes(file.type)) return json({ error: "Chỉ nhận PNG, JPEG, WebP" }, 415);
  if (file.size > MAX_UPLOAD) return json({ error: "Ảnh quá lớn" }, 413);
  try {
    const img = await addImage(date, Buffer.from(await file.arrayBuffer()), cap(form.get("caption")), seq(form.get("trade_seq")));
    return json({ image: img }, 201);
  } catch (e) {
    return json({ error: errText(e) }, 500);
  }
}

export async function PATCH(req: Request) {
  if (!(await getOwner())) return json({ error: "unauthorized" }, 401);
  const b = (await req.json().catch(() => null)) as { id?: string; caption?: unknown; trade_seq?: unknown } | null;
  if (!b?.id || !UUID.test(b.id)) return json({ error: "id không hợp lệ" }, 400);
  const patch: { caption?: string | null; trade_seq?: number | null } = {};
  if ("caption" in b) patch.caption = cap(b.caption);
  if ("trade_seq" in b) patch.trade_seq = seq(b.trade_seq);
  try {
    const rows = await updateImage(b.id, patch);
    return rows[0] ? json({ image: rows[0] }) : json({ error: "Không có ảnh" }, 404);
  } catch (e) {
    return json({ error: errText(e) }, 500);
  }
}

export async function DELETE(req: Request) {
  if (!(await getOwner())) return json({ error: "unauthorized" }, 401);
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!UUID.test(id)) return json({ error: "id không hợp lệ" }, 400);
  try {
    return (await deleteImage(id)) ? json({ ok: true }) : json({ error: "Không có ảnh" }, 404);
  } catch (e) {
    return json({ error: errText(e) }, 500);
  }
}
