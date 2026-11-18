// Đăng nhập một người: chỉ tài khoản Discord có ID = OWNER_DISCORD_ID.
//
// Cách kiểm:
//  1. /auth/callback đổi code lấy phiên, đọc identity Discord (auth.identities, người dùng không sửa được),
//     so với OWNER_DISCORD_ID. Đúng → server đặt app_metadata.desk_owner = true (chỉ secret key ghi được) rồi làm mới phiên.
//     Sai → đăng xuất + xoá user vừa tạo.
//  2. Mọi trang / API của dashboard đọc JWT (getClaims, có kiểm chữ ký) và chỉ cho qua khi app_metadata.desk_owner = true.
//  Không dùng user_metadata để phân quyền (người dùng tự sửa được); user_metadata chỉ để hiện tên, avatar.
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { authConfigured, ownerDiscordId, secretKey, supabaseUrl } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";

export const OWNER_FLAG = "desk_owner";

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

export function ownerFromClaims(c: Claims | null | undefined): Owner | null {
  if (!c?.sub || c.app_metadata?.[OWNER_FLAG] !== true) return null;
  const um = c.user_metadata || {};
  const custom = (um.custom_claims || {}) as Record<string, unknown>;
  return {
    id: c.sub,
    name: str(custom.global_name) || str(um.full_name) || str(um.name) || "Deren",
    handle: str(um.name) || str(um.user_name),
    avatar: str(um.avatar_url) || str(um.picture),
    discordId: str(um.provider_id) || str(um.sub),
  };
}

export async function getOwner(): Promise<Owner | null> {
  if (!authConfigured()) return null;
  try {
    const sb = await supabaseServer();
    const { data, error } = await sb.auth.getClaims();
    if (error || !data?.claims) return null;
    return ownerFromClaims(data.claims as Claims);
  } catch {
    return null;
  }
}

export async function requireOwner(next = "/dashboard"): Promise<Owner> {
  const owner = await getOwner();
  if (!owner) redirect(`/login?next=${encodeURIComponent(next)}`);
  return owner;
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

export function deleteUser(userId: string) {
  return adminUsers("DELETE", userId);
}
