// Proxy (Next.js 16, tên mới của middleware): làm mới phiên Supabase và chặn trang dashboard khi chưa đăng nhập.
// Chỉ chạy ở các đường dẫn trong matcher; trang học tĩnh và /api/plan (ATAS gửi bằng token) không đi qua đây.
// "/" luôn chuyển hướng: đã đăng nhập → /dashboard, chưa → /login.
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const DESK = ["/dashboard", "/calendar", "/news", "/earnings", "/trade-plan", "/journal", "/knowledge", "/profile"];
const OWNER_FLAG = "desk_owner";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isDesk = DESK.some((p) => path === p || path.startsWith(p + "/"));
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!url || !key) {
    if (isDesk || path === "/") return NextResponse.redirect(new URL("/login?e=config", request.url));
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const sb = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list, headers) {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
        for (const [k, v] of Object.entries(headers || {})) response.headers.set(k, String(v));
      },
    },
  });

  const { data } = await sb.auth.getClaims();
  const claims = data?.claims as { app_metadata?: Record<string, unknown> } | undefined;
  const owner = claims?.app_metadata?.[OWNER_FLAG] === true;

  const withCookies = (res: NextResponse) => {
    for (const c of response.cookies.getAll()) res.cookies.set(c);
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  };

  if (isDesk && !owner) {
    const to = new URL("/login", request.url);
    to.searchParams.set("next", path + request.nextUrl.search);
    return withCookies(NextResponse.redirect(to));
  }
  if (path === "/") return withCookies(NextResponse.redirect(new URL(owner ? "/dashboard" : "/login", request.url)));
  if (path === "/login" && owner) return withCookies(NextResponse.redirect(new URL("/dashboard", request.url)));
  return response;
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/calendar/:path*",
    "/news/:path*",
    "/earnings/:path*",
    "/trade-plan/:path*",
    "/journal/:path*",
    "/knowledge/:path*",
    "/profile/:path*",
    "/api/journal/:path*",
  ],
};
