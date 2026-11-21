// Đăng nhập: chủ sở hữu (OWNER_DISCORD_ID) + khách được duyệt trong bảng access.members (D48).
//
// Cách kiểm:
//  1. /auth/callback đổi code lấy phiên, đọc identity Discord (auth.identities, người dùng không sửa được),
//     so với OWNER_DISCORD_ID. Đúng → server đặt app_metadata.desk_owner = true (chỉ secret key ghi được) rồi làm mới phiên.
//     Sai → đăng xuất + xoá user vừa tạo.
//  2. Mọi trang / API của dashboard đọc JWT (getClaims, có kiểm chữ ký) và chỉ cho qua khi app_metadata.desk_owner = true.
//  Khách: người lạ đăng nhập → callback ghi yêu cầu 'pending' vào access.members rồi từ chối; chủ sở hữu duyệt ở Profile.
//  Khách đã duyệt: callback đặt app_metadata.desk_guest = <Discord ID>; mỗi request server kiểm ID đó còn status 'guest'
//  (lib/members.ts, cache 30 giây). Khách chỉ xem phần thị trường; getOwner() / requireOwner() vẫn chỉ trả về chủ sở hữu
//  nên mọi API journal / plan giữ nguyên mức chặn.
//  Không dùng user_metadata để phân quyền (người dùng tự sửa được); user_metadata chỉ để hiện tên, avatar.
import { redirect } from "next/navigation";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { authConfigured, ownerDiscordId, secretKey, supabaseUrl } from "@/lib/env";
import { isGuest } from "@/lib/members";
import { supabaseServer } from "@/lib/supabase/server";

export const OWNER_FLAG = "desk_owner";
export const GUEST_FLAG = "desk_guest";

export type Owner = {
  id: string;
  name: string;
  handle: string | null;
  avatar: string | null;
  discordId: string | null;
};

type Claims = {
  sub?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

function str(v: unknown) {
  return typeof v === "string" && v ? v : null;
}

export type Role = "owner" | "guest";
export type Viewer = Owner & { role: Role };

async function roleFromClaims(c: Claims | null | undefined): Promise<Role | null> {
  if (!c?.sub) return null;
  if (c.app_metadata?.[OWNER_FLAG] === true) return "owner";
  const g = c.app_metadata?.[GUEST_FLAG];
  return typeof g === "string" && (await isGuest(g)) ? "guest" : null;
}

export function ownerFromClaims(c: Claims | null | undefined): Owner | null {
  if (!c?.sub || c.app_metadata?.[OWNER_FLAG] !== true) return null;
  return profileOf(c, "Deren");
}

// Tên / avatar Discord của user vừa đăng nhập (chỉ để hiển thị, không dùng phân quyền).
export function profileOfUser(user: User) {
  const p = profileOf({ sub: user.id, user_metadata: user.user_metadata }, "");
  return { name: p.name || null, handle: p.handle, avatar: p.avatar };
}

function profileOf(c: Claims, fallback: string): Owner {
  const um = c.user_metadata || {};
  const custom = (um.custom_claims || {}) as Record<string, unknown>;
  return {
    id: c.sub || "",
    name: str(custom.global_name) || str(um.full_name) || str(um.name) || fallback,
    handle: str(um.name) || str(um.user_name),
    avatar: str(um.avatar_url) || str(um.picture),
    discordId: str(um.provider_id) || str(um.sub),
  };
}

// cache(): layout desk + layout journal / trade-plan + page cùng gọi trong một request → chỉ đọc JWT một lần.
const claims = cache(async (): Promise<Claims | null> => {
  if (!authConfigured()) return null;
  try {
    const sb = await supabaseServer();
    const { data, error } = await sb.auth.getClaims();
    if (error || !data?.claims) return null;
    return data.claims as Claims;
  } catch {
    return null;
  }
});

// Chỉ chủ sở hữu (journal, plan, ảnh...). Khách nhận null.
export async function getOwner(): Promise<Owner | null> {
  return ownerFromClaims(await claims());
}

// Chủ sở hữu hoặc khách (trang thị trường).
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const c = await claims();
  const role = await roleFromClaims(c);
  if (!c || !role) return null;
  return { ...profileOf(c, role === "owner" ? "Deren" : "Guest"), role };
});

export async function requireViewer(next = "/dashboard"): Promise<Viewer> {
  const v = await getViewer();
  if (!v) redirect(`/login?next=${encodeURIComponent(next)}`);
  return v;
}

// Trang chỉ chủ sở hữu: khách quay về Dashboard, chưa đăng nhập về /login.
export async function requireOwner(next = "/dashboard"): Promise<Owner> {
  const v = await requireViewer(next);
  if (v.role !== "owner") redirect("/dashboard");
  return v;
}

// Discord ID lấy từ auth.identities (dữ liệu do Discord trả về, không phải user_metadata).
export function discordIdsOf(user: User): string[] {
  const ids = new Set<string>();
  for (const it of user.identities || []) {
    if (it.provider !== "discord") continue;
    const d = (it.identity_data || {}) as Record<string, unknown>;
    for (const v of [it.id, d.provider_id, d.sub]) if (typeof v === "string" && v) ids.add(v);
  }
  return [...ids];
}

export function isOwnerUser(user: User) {
  const owner = ownerDiscordId();
  return !!owner && discordIdsOf(user).includes(owner);
}

// Gọi Admin API của Supabase Auth bằng secret key (chỉ chạy ở server).
async function adminUsers(method: "PUT" | "DELETE", userId: string, body?: unknown) {
  const key = secretKey();
  const url = supabaseUrl();
  if (!key || !url) throw new Error("thiếu SUPABASE_URL / secret key");
  const r = await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method,
    headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`auth admin ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

export function markOwner(user: User) {
  return adminUsers("PUT", user.id, { app_metadata: { ...(user.app_metadata || {}), [OWNER_FLAG]: true } });
}

export function markGuest(user: User, discordId: string) {
  const am = { ...(user.app_metadata || {}) };
  delete am[OWNER_FLAG];
  return adminUsers("PUT", user.id, { app_metadata: { ...am, [GUEST_FLAG]: discordId } });
}

export function deleteUser(userId: string) {
  return adminUsers("DELETE", userId);
}
