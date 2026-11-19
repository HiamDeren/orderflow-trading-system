// Khách của dashboard lưu ở access.members (schema riêng cho quyền truy cập, D48). Chỉ server dùng (secret key).
// pending: người lạ đã thử đăng nhập, chờ chủ sở hữu duyệt · guest: được xem phần thị trường · blocked: gỡ / từ chối.
import { DbError, dbSchema } from "@/lib/db";

const db = dbSchema("access");

export type MemberStatus = "pending" | "guest" | "blocked";
export type Member = {
  discord_id: string;
  status: MemberStatus;
  user_id: string | null;
  name: string | null;
  handle: string | null;
  avatar: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  last_login_at: string | null;
};

const T = "members";
const MAX_PENDING = 50; // chặn spam: quá số này thì không ghi thêm yêu cầu mới
export const DISCORD_ID_RE = /^\d{5,25}$/;

// Bảng chưa tạo (chưa áp migration) hoặc schema access chưa expose (PGRST106) → coi như chưa có khách, không làm sập trang.
function missing(e: unknown) {
  return e instanceof DbError && (e.status === 404 || e.status === 406 || /PGRST205|PGRST106|42P01|3F000/.test(e.message));
}

export async function getMember(discordId: string): Promise<Member | null> {
  if (!DISCORD_ID_RE.test(discordId)) return null;
  try {
    const rows = await db.select<Member>(T, `discord_id=eq.${discordId}&limit=1`);
    return rows[0] ?? null;
  } catch (e) {
    if (missing(e)) return null;
    throw e;
  }
}

export async function listMembers(): Promise<{ ok: true; rows: Member[] } | { ok: false; missing: boolean; error: string }> {
  try {
    return { ok: true, rows: await db.select<Member>(T, "order=status.asc,updated_at.desc&limit=200") };
  } catch (e) {
    return { ok: false, missing: missing(e), error: (e as Error).message };
  }
}

// Cache ngắn trong instance để không gọi database ở mỗi lần chuyển trang.
// Gỡ khách trên instance khác có độ trễ tối đa TTL; user khách cũng bị xoá nên không làm mới phiên được.
const TTL = 30_000;
// Đặt trên globalThis: Next.js tách module cho route API và trang, Map riêng thì gỡ quyền ở API không xoá được cache của trang.
const G = globalThis as unknown as { __deskGuestCache?: Map<string, { ok: boolean; at: number }> };
const cache = (G.__deskGuestCache ??= new Map());

export async function isGuest(discordId: string): Promise<boolean> {
  const hit = cache.get(discordId);
  if (hit && Date.now() - hit.at < TTL) return hit.ok;
  let ok = false;
  try {
    ok = (await getMember(discordId))?.status === "guest";
  } catch {
    ok = hit?.ok ?? false; // database lỗi tạm: giữ kết quả cũ nếu có, không thì chặn
  }
  cache.set(discordId, { ok, at: Date.now() });
  return ok;
}

export function forget(discordId: string) {
  cache.delete(discordId);
}

type Profile = { name: string | null; handle: string | null; avatar: string | null };

// Người lạ đăng nhập: ghi / cập nhật yêu cầu (không đổi dòng đã blocked).
export async function recordRequest(discordId: string, p: Profile): Promise<"pending" | "blocked" | "full"> {
  const cur = await getMember(discordId);
  if (cur?.status === "blocked") return "blocked";
  if (cur) {
    await db.update(T, `discord_id=eq.${discordId}`, clip(p));
    return "pending";
  }
  const pend = await db.select<{ discord_id: string }>(T, `status=eq.pending&select=discord_id&limit=${MAX_PENDING}`);
  if (pend.length >= MAX_PENDING) return "full";
  await db.insert(T, [{ discord_id: discordId, status: "pending", ...clip(p) }]);
  return "pending";
}

export async function touchGuest(discordId: string, userId: string, p: Profile) {
  await db.update(T, `discord_id=eq.${discordId}`, { ...clip(p), user_id: userId, last_login_at: new Date().toISOString() });
  cache.set(discordId, { ok: true, at: Date.now() });
}

export async function setStatus(discordId: string, status: MemberStatus) {
  forget(discordId);
  const rows = await db.update<Member>(T, `discord_id=eq.${discordId}`, { status });
  return rows[0] ?? null;
}

export async function addGuest(discordId: string, note: string | null) {
  forget(discordId);
  const rows = await db.upsert<Member>(T, [{ discord_id: discordId, status: "guest", note }], "discord_id");
  return rows[0] ?? null;
}

export async function removeMember(discordId: string) {
  forget(discordId);
  const rows = await db.select<Member>(T, `discord_id=eq.${discordId}&limit=1`);
  await db.remove(T, `discord_id=eq.${discordId}`);
  return rows[0] ?? null;
}

function clip(p: Profile) {
  const s = (v: string | null, n: number) => (v ? v.slice(0, n) : null);
  return { name: s(p.name, 100), handle: s(p.handle, 100), avatar: p.avatar && p.avatar.startsWith("https://") ? s(p.avatar, 500) : null };
}
