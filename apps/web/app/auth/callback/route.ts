// GET /auth/callback?code=... → đổi code lấy phiên, chỉ giữ lại nếu là tài khoản Discord của chủ sở hữu.
import { NextResponse, type NextRequest } from "next/server";
import { OWNER_FLAG, deleteUser, isOwnerUser, markOwner } from "@/lib/auth";
import { ownerDiscordId } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function safeNext(v: string | null) {
  return v && v.startsWith("/") && !v.startsWith("//") ? v : "/dashboard";
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get("code");
  const next = safeNext(req.nextUrl.searchParams.get("next"));
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

  if (!isOwnerUser(user)) {
    await sb.auth.signOut();
    if (user.app_metadata?.[OWNER_FLAG] !== true) {
      try {
        await deleteUser(user.id);
      } catch (e) {
        console.error("[auth/callback] xoá user lạ lỗi", String((e as Error).message));
      }
    }
    console.warn("[auth/callback] từ chối tài khoản không phải chủ sở hữu");
    return NextResponse.redirect(`${origin}/login?e=denied`);
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
