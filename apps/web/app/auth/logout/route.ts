// POST /auth/logout[?scope=global] → đăng xuất thiết bị này, hoặc mọi thiết bị.
import { NextResponse, type NextRequest } from "next/server";
import { authConfigured } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const origin = req.nextUrl.origin;
  if (authConfigured()) {
    const scope = req.nextUrl.searchParams.get("scope") === "global" ? "global" : "local";
    const sb = await supabaseServer();
    await sb.auth.signOut({ scope });
  }
  return NextResponse.redirect(`${origin}/login?e=out`, 303);
}
