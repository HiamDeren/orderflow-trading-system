// GET /auth/callback?code=... → đổi code lấy phiên, chỉ giữ lại chủ sở hữu hoặc khách đã duyệt (access.members).
// Người lạ: ghi yêu cầu 'pending' để chủ sở hữu duyệt ở Profile, rồi đăng xuất + xoá user vừa tạo.
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { GUEST_FLAG, OWNER_FLAG, deleteUser, discordIdsOf, isOwnerUser, markGuest, markOwner, profileOfUser } from "@/lib/auth";
import { DISCORD_ID_RE, getMember, recordRequest, touchGuest } from "@/lib/members";
import { ownerDiscordId } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function safeNext(v: string | null) {
  return v && v.startsWith("/") && !v.startsWith("//") ? v : "/dashboard";
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get("code");
  const jar = await cookies();
  const next = safeNext(jar.get("desk_next")?.value ?? null);
  jar.delete({ name: "desk_next", path: "/auth" });
  if (!code) return NextResponse.redirect(`${origin}/login?e=code`);

  const sb = await supabaseServer();
  const ex = await sb.auth.exchangeCodeForSession(code);
  if (ex.error) {
    console.error("[auth/callback] exchange", ex.error.message);
    return NextResponse.redirect(`${origin}/login?e=exchange`);
  }
  const { data, error } = await sb.auth.getUser();
  const user = data?.user;
  if (error || !user) return NextResponse.redirect(`${origin}/login?e=exchange`);

  if (!ownerDiscordId()) {
    // Thiếu cấu hình: không cho vào, nhưng cũng không xoá ai.
    await sb.auth.signOut();
    console.error("[auth/callback] thiếu OWNER_DISCORD_ID");
    return NextResponse.redirect(`${origin}/login?e=config`);
  }

  const owner = isOwnerUser(user);
  const discordId = owner ? null : discordIdsOf(user).find((id) => DISCORD_ID_RE.test(id)) ?? null;
  let member = null;
  if (discordId) {
    try {
      member = await getMember(discordId);
    } catch (e) {
      console.error("[auth/callback] đọc access.members lỗi", String((e as Error).message));
    }
  }
  const guestId = member?.status === "guest" ? discordId : null;
  if (guestId) {
    if (user.app_metadata?.[GUEST_FLAG] !== guestId) {
      try {
        await markGuest(user, guestId);
        await sb.auth.refreshSession(); // JWT mới có app_metadata.desk_guest
      } catch (e) {
        console.error("[auth/callback] đánh dấu khách lỗi", String((e as Error).message));
        await sb.auth.signOut();
        return NextResponse.redirect(`${origin}/login?e=mark`);
      }
    }
    try {
      await touchGuest(guestId, user.id, profileOfUser(user));
    } catch (e) {
      console.error("[auth/callback] ghi lần đăng nhập khách lỗi", String((e as Error).message));
    }
    console.info("[auth/callback] khách đăng nhập");
    return NextResponse.redirect(`${origin}${next.startsWith("/journal") || next.startsWith("/trade-plan") ? "/dashboard" : next}`);
  }

  if (!owner) {
    // Ghi / cập nhật yêu cầu vào hàng chờ trước khi xoá user (blocked thì giữ nguyên)
    let req: "pending" | "blocked" | "full" | null = null;
    if (discordId) {
      try {
        req = await recordRequest(discordId, profileOfUser(user));
      } catch (e) {
        console.error("[auth/callback] ghi yêu cầu lỗi", String((e as Error).message));
      }
    }
    await sb.auth.signOut();
    if (user.app_metadata?.[OWNER_FLAG] !== true) {
      try {
        await deleteUser(user.id);
      } catch (e) {
        console.error("[auth/callback] xoá user lạ lỗi", String((e as Error).message));
      }
    }
    console.warn("[auth/callback] từ chối tài khoản chưa được duyệt", req ?? "");
    return NextResponse.redirect(`${origin}/login?e=${req === "pending" ? "pending" : "denied"}`);
  }

  if (user.app_metadata?.[OWNER_FLAG] !== true) {
    try {
      await markOwner(user);
      await sb.auth.refreshSession(); // JWT mới có app_metadata.desk_owner
    } catch (e) {
      console.error("[auth/callback] đánh dấu chủ sở hữu lỗi", String((e as Error).message));
      await sb.auth.signOut();
      return NextResponse.redirect(`${origin}/login?e=mark`);
    }
  }
  return NextResponse.redirect(`${origin}${next}`);
}
