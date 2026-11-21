// Layout gốc cho các trang Next.js (dashboard ZenDojo, trước là Deren Desk). Trang học tĩnh trong public/ không đi qua layout này.
import type { Metadata, Viewport } from "next";
import { getUi } from "@/lib/prefs-server";
import "./desk.css";

export const metadata: Metadata = {
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
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
