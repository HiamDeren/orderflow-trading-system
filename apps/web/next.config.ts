import type { NextConfig } from "next";

// Trang cũ (HTML tĩnh) nằm trong public/. Giữ URL sạch như cleanUrls của Vercel trước đây:
// /levels → public/levels.html, /levels.en → public/levels.en.html, /levels.html → 308 về /levels.
// "/" là cửa vào dashboard (proxy.ts: đã đăng nhập → /dashboard, chưa → /login); trang chủ học cũ chuyển sang /learn.
const PAGES = "index|tools|levels|plan|quiz";

// Nguồn ngoài đang dùng: Google Fonts (trang học tĩnh), TradingView (iframe chart /stock/[mã]),
// ảnh logo Finnhub / CoinGecko / avatar Discord (https:), Supabase (Auth redirect, signed URL ảnh plan).
// 'unsafe-inline' cho script: Next.js chèn script inline khi render; trang học tĩnh cũng có script inline.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co",
  "frame-src 'self' https://s.tradingview.com https://*.tradingview.com",
  "frame-ancestors 'self'",
  "form-action 'self' https://*.supabase.co https://discord.com",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  trailingSlash: false,
  poweredByHeader: false,
  // Font cho ảnh plan đọc bằng fs lúc chạy: phải gói vào function /api/plan.
  outputFileTracingIncludes: { "/api/plan": ["./fonts/**"] },
  serverExternalPackages: ["@resvg/resvg-js", "sharp"],
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/learn", destination: "/index.html" },
        { source: "/learn.en", destination: "/index.en.html" },
        { source: `/:page(${PAGES})`, destination: "/:page.html" },
        { source: `/:page(${PAGES}).en`, destination: "/:page.en.html" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    return [
      { source: "/index", destination: "/learn", permanent: false },
      { source: "/index.html", destination: "/learn", permanent: false },
      { source: "/index.en.html", destination: "/learn.en", permanent: false },
      { source: `/:page(tools|levels|plan|quiz).html`, destination: "/:page", permanent: true },
      { source: `/:page(tools|levels|plan|quiz).en.html`, destination: "/:page.en", permanent: true },
      { source: "/studio", destination: "/trade-plan", permanent: false },
      { source: "/pnl", destination: "/journal/pnl", permanent: false },
      { source: "/testing", destination: "/plan", permanent: false },
      { source: "/testing.en", destination: "/plan.en", permanent: false },
      { source: "/overlap", destination: "/plan", permanent: false },
      { source: "/overlap.en", destination: "/plan.en", permanent: false },
    ];
  },
  async headers() {
    return [
      { source: "/assets/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=3600, must-revalidate" }] },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Chống clickjacking. SAMEORIGIN (không phải DENY): /knowledge nhúng trang học cùng origin bằng iframe (D45).
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          // CSP chạy chế độ báo cáo trước (vi phạm chỉ hiện trong console). Xem 1 tuần trên Preview / production rồi mới bật thật.
          { key: "Content-Security-Policy-Report-Only", value: CSP },
        ],
      },
    ];
  },
};

export default nextConfig;
