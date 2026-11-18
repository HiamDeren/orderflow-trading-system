import type { NextConfig } from "next";

// Trang cũ (HTML tĩnh) nằm trong public/. Giữ URL sạch như cleanUrls của Vercel trước đây:
// /levels → public/levels.html, /levels.en → public/levels.en.html, /levels.html → 308 về /levels.
// "/" là cửa vào dashboard (proxy.ts: đã đăng nhập → /dashboard, chưa → /login); trang chủ học cũ chuyển sang /learn.
const PAGES = "index|tools|levels|plan|quiz";

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
        ],
      },
    ];
  },
};

export default nextConfig;
