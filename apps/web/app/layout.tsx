// Layout gốc cho các trang Next.js (dashboard ZenDojo, trước là Deren Desk). Trang học tĩnh trong public/ không đi qua layout này.
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { getUi } from "@/lib/prefs-server";
import "./desk.css";

// Font tự host qua next/font (tải lúc build, không chặn render bằng CSS Google Fonts). Biến CSS dùng trong desk.css (--sans, --mono).
const inter = Inter({ subsets: ["latin", "latin-ext", "vietnamese"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin", "latin-ext", "vietnamese"], variable: "--font-jbmono", display: "swap" });

export const metadata: Metadata = {
  // URL tuyệt đối cho ảnh OG / Twitter (thiếu thì Next.js resolve về localhost ngoài Vercel)
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://zendojo-deren.vercel.app",
  ),
  title: { default: "ZenDojo", template: "%s · ZenDojo" },
  description: "ZenDojo · võ đường trading của Derenツ: plan TPO, lịch tin, thị trường, journal, PnL.",
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: "/assets/img/zendojo/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/img/zendojo/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/assets/img/zendojo/icon-180.png",
  },
  // Ảnh xem trước khi gửi link (Discord, Messenger...); trang login là trang công khai duy nhất
  openGraph: {
    title: "ZenDojo",
    description: "Derenツ · Personal trading dashboard",
    siteName: "ZenDojo",
    images: [{ url: "/assets/img/zendojo/og.png", width: 1200, height: 630, alt: "ZenDojo" }],
  },
  twitter: { card: "summary_large_image", images: ["/assets/img/zendojo/og.png"] },
};

export const viewport: Viewport = { themeColor: "#0f1115", colorScheme: "dark" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang } = await getUi();
  return (
    <html lang={lang} className={`${inter.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
