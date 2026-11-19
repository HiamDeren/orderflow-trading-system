// Biến môi trường dùng chung (chỉ đọc ở server, trừ hai biến NEXT_PUBLIC_*).
// Secret key Supabase không bao giờ được dùng ở client.

export function supabaseUrl() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/$/, "");
}

// Publishable key (an toàn cho trình duyệt) dùng cho Supabase Auth. Nhận cả tên cũ ANON_KEY.
export function publishableKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
}

export function secretKey() {
  return process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

// Discord user ID duy nhất được vào dashboard.
export function ownerDiscordId() {
  return (process.env.OWNER_DISCORD_ID || "").trim();
}

export function authConfigured() {
  return !!(supabaseUrl() && publishableKey());
}
