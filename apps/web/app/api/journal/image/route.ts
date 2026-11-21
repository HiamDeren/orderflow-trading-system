// /api/journal/image (chỉ chủ sở hữu đã đăng nhập Discord)
//   GET    ?date=YYYY-MM-DD        → { images: [...] } của ngày
//   GET    ?id=<uuid>              → file ảnh (WebP), cùng origin
//   POST   multipart: file, date, caption?, trade_seq?  → nén WebP rồi lưu bucket trading + bảng journal_images
//   PATCH  { id, caption?, trade_seq? }
//   DELETE ?id=<uuid>
// Lỗi: { ok:false, error, code } (lib/api.ts).
import { crossOrigin, errText, fail, json, readJson, requireOwnerApi, tooLarge } from "@/lib/api";
import { storage } from "@/lib/db";
import { addImage, deleteImage, getImage, listImages, MAX_UPLOAD, updateImage } from "@/lib/journal-images";
import { JournalImagePatch } from "@/lib/schemas";
import { DATE_RE } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TYPES = ["image/png", "image/jpeg", "image/webp"];
const FORM_OVERHEAD = 64 * 1024; // phần multipart ngoài file (date, caption, boundary)

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
const badId = () => fail(400, "bad_request", "id không hợp lệ");
const noImage = () => fail(404, "not_found", "Không có ảnh");

export async function GET(req: Request) {
  const owner = await requireOwnerApi();
  if (owner instanceof Response) return owner;
  const q = new URL(req.url).searchParams;
  const id = q.get("id");
  const date = q.get("date");
  try {
    if (id) {
      if (!UUID.test(id)) return badId();
      const img = await getImage(id);
      if (!img) return noImage();
      const r = await storage.get(img.path);
      if (!r.ok) return fail(502, "upstream", `storage ${r.status}`);
      return new Response(r.body, {
        headers: {
          "Content-Type": r.headers.get("content-type") || "image/webp",
          "Cache-Control": "private, max-age=86400, immutable",
          "Content-Disposition": `inline; filename="journal_${img.trade_date}_${id.slice(0, 8)}.webp"`,
        },
      });
    }
    if (date) {
      if (!DATE_RE.test(date)) return fail(400, "bad_request", "date phải dạng yyyy-MM-dd");
      return json({ images: await listImages(date) });
    }
    return fail(400, "bad_request", "cần date hoặc id");
  } catch (e) {
    return fail(502, "upstream", errText(e));
  }
}

export async function POST(req: Request) {
  const owner = await requireOwnerApi();
  if (owner instanceof Response) return owner;
  const bad = crossOrigin(req) || tooLarge(req, MAX_UPLOAD + FORM_OVERHEAD);
  if (bad) return bad.status === 413 ? fail(413, "payload_too_large", "Ảnh quá lớn") : bad;
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail(400, "invalid_body", "Cần multipart/form-data");
  }
  const date = String(form.get("date") || "");
  const file = form.get("file");
  if (!DATE_RE.test(date)) return fail(400, "bad_request", "date phải dạng yyyy-MM-dd");
  if (!(file instanceof File)) return fail(400, "bad_request", "Thiếu file");
  if (!TYPES.includes(file.type)) return fail(415, "unsupported_type", "Chỉ nhận PNG, JPEG, WebP");
  if (file.size > MAX_UPLOAD) return fail(413, "payload_too_large", "Ảnh quá lớn");
  try {
    const img = await addImage(date, Buffer.from(await file.arrayBuffer()), cap(form.get("caption")), seq(form.get("trade_seq")));
    return json({ image: img }, 201);
  } catch (e) {
    return fail(500, "internal", errText(e));
  }
}

export async function PATCH(req: Request) {
  const owner = await requireOwnerApi();
  if (owner instanceof Response) return owner;
  const bad = crossOrigin(req);
  if (bad) return bad;
  const body = await readJson(req, JournalImagePatch, { maxBytes: 16 * 1024, invalid: () => "id không hợp lệ" });
  if (!body.ok) return body.response;
  const b = body.data;
  if (!UUID.test(b.id)) return badId();
  const patch: { caption?: string | null; trade_seq?: number | null } = {};
  if ("caption" in b) patch.caption = cap(b.caption);
  if ("trade_seq" in b) patch.trade_seq = seq(b.trade_seq);
  try {
    const rows = await updateImage(b.id, patch);
    return rows[0] ? json({ image: rows[0] }) : noImage();
  } catch (e) {
    return fail(500, "internal", errText(e));
  }
}

export async function DELETE(req: Request) {
  const owner = await requireOwnerApi();
  if (owner instanceof Response) return owner;
  const bad = crossOrigin(req);
  if (bad) return bad;
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!UUID.test(id)) return badId();
  try {
    return (await deleteImage(id)) ? json({ ok: true }) : noImage();
  } catch (e) {
    return fail(500, "internal", errText(e));
  }
}
