// GET /auth/login → chuyển sang Discord (OAuth qua Supabase Auth, PKCE).
import { NextResponse, type NextRequest } from "next/server";
import { authConfigured } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function safeNext(v: string | null) {
  return v && v.startsWith("/") && !v.startsWith("//") ? v : "/dashboard";
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  if (!authConfigured()) return NextResponse.redirect(`${origin}/login?e=config`);
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: "discord",
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data?.url) {
    console.error("[auth/login]", error?.message);
    return NextResponse.redirect(`${origin}/login?e=oauth`);
  }
  return NextResponse.redirect(data.url);
}
