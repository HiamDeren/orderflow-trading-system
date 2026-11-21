// /api/members (chỉ chủ sở hữu) · quản lý khách của dashboard (D48), bảng access.members
//   GET                          → danh sách pending / guest / blocked
//   POST { action, discord_id, note? }
//     approve  : pending / blocked → guest
//     add      : thêm thẳng Discord ID làm khách (không cần chờ người đó xin)
//     block    : gỡ quyền + không nhận yêu cầu mới từ ID này; xoá user Supabase của khách (phiên cũ hết làm mới được)
//     remove   : xoá dòng (người đó đăng nhập lại sẽ thành yêu cầu mới); cũng xoá user Supabase nếu có
// Lỗi: { ok:false, error, code } (lib/api.ts).
import { crossOrigin, errText, fail, json, readJson, requireOwnerApi } from "@/lib/api";
import { deleteUser } from "@/lib/auth";
import { ownerDiscordId } from "@/lib/env";
import { addGuest, DISCORD_ID_RE, listMembers, removeMember, setStatus } from "@/lib/members";
import { MemberPost } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const owner = await requireOwnerApi();
  if (owner instanceof Response) return owner;
  const r = await listMembers();
  if (!r.ok) return r.missing ? fail(503, "config", "missing") : fail(502, "upstream", r.error);
  return json({ members: r.rows });
}

export async function POST(req: Request) {
  const owner = await requireOwnerApi();
  if (owner instanceof Response) return owner;
  const bad = crossOrigin(req);
  if (bad) return bad;
  const body = await readJson(req, MemberPost, { maxBytes: 16 * 1024, invalid: () => "body phải là JSON", notJson: "body phải là JSON" });
  if (!body.ok) return body.response;
  const b = body.data;
  const id = String(b.discord_id || "").trim();
  if (!DISCORD_ID_RE.test(id)) return fail(400, "bad_request", "Discord ID phải là 5–25 chữ số");
  if (id === ownerDiscordId()) return fail(400, "bad_request", "Đây là ID chủ sở hữu");
  const note = b.note ? String(b.note).slice(0, 200) : null;
  try {
    switch (b.action) {
      case "approve":
        return json({ member: await setStatus(id, "guest") });
      case "add":
        return json({ member: await addGuest(id, note) });
      case "block": {
        const m = await setStatus(id, "blocked");
        if (m?.user_id) await dropUser(m.user_id);
        return json({ member: m });
      }
      case "remove": {
        const m = await removeMember(id);
        if (m?.user_id) await dropUser(m.user_id);
        return json({ ok: true });
      }
      default:
        return fail(400, "bad_request", "action không hợp lệ");
    }
  } catch (e) {
    console.error("[api/members]", b.action, errText(e));
    return fail(502, "upstream", errText(e));
  }
}

// Xoá user Supabase của khách (refresh token mất hiệu lực). Lỗi thì bỏ qua: server vẫn chặn theo database.
async function dropUser(userId: string) {
  try {
    await deleteUser(userId);
  } catch (e) {
    console.warn("[api/members] xoá user khách lỗi", String((e as Error).message).slice(0, 120));
  }
}
