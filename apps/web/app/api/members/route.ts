// /api/members (chỉ chủ sở hữu) · quản lý khách của dashboard (D48), bảng access.members
//   GET                          → danh sách pending / guest / blocked
//   POST { action, discord_id, note? }
//     approve  : pending / blocked → guest
//     add      : thêm thẳng Discord ID làm khách (không cần chờ người đó xin)
//     block    : gỡ quyền + không nhận yêu cầu mới từ ID này; xoá user Supabase của khách (phiên cũ hết làm mới được)
//     remove   : xoá dòng (người đó đăng nhập lại sẽ thành yêu cầu mới); cũng xoá user Supabase nếu có
import { deleteUser, getOwner } from "@/lib/auth";
import { errText } from "@/lib/db";
import { ownerDiscordId } from "@/lib/env";
import { DISCORD_ID_RE, addGuest, listMembers, removeMember, setStatus } from "@/lib/members";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  if (!(await getOwner())) return json({ error: "unauthorized" }, 401);
  const r = await listMembers();
  if (!r.ok) return json({ error: r.missing ? "missing" : r.error }, r.missing ? 503 : 502);
  return json({ members: r.rows });
}

export async function POST(req: Request) {
  const owner = await getOwner();
  if (!owner) return json({ error: "unauthorized" }, 401);
  let body: { action?: string; discord_id?: string; note?: string } | null = null;
  try {
    body = await req.json();
  } catch {
    return json({ error: "body phải là JSON" }, 400);
  }
  const id = String(body?.discord_id || "").trim();
  if (!DISCORD_ID_RE.test(id)) return json({ error: "Discord ID phải là 5–25 chữ số" }, 400);
  if (id === ownerDiscordId()) return json({ error: "Đây là ID chủ sở hữu" }, 400);
  const note = body?.note ? String(body.note).slice(0, 200) : null;
  try {
    switch (body?.action) {
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
        return json({ error: "action không hợp lệ" }, 400);
    }
  } catch (e) {
    console.error("[api/members]", body?.action, errText(e));
    return json({ error: errText(e) }, 502);
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
