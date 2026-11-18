// Supabase client phía server (Server Component, Route Handler) dùng publishable key + cookie phiên đăng nhập.
// Chỉ dùng cho Auth. Đọc ghi bảng trading.* đi qua lib/db.ts (secret key, sau khi đã kiểm chủ sở hữu).
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publishableKey, supabaseUrl } from "@/lib/env";

export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(supabaseUrl(), publishableKey(), {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(list) {
        // Server Component không ghi được cookie: bỏ qua, proxy.ts đã làm mới phiên.
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          /* bỏ qua */
        }
      },
    },
  });
}
