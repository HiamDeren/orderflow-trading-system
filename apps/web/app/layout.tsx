// Layout gốc cho các trang Next.js (dashboard Deren Desk). Trang học tĩnh trong public/ không đi qua layout này.
import type { Metadata, Viewport } from "next";
import { getUi } from "@/lib/prefs-server";
import "./desk.css";

export const metadata: Metadata = {
  title: { default: "Deren Desk", template: "%s · Deren Desk" },
  description: "Dashboard trading cá nhân: plan, lịch tin, journal, PnL.",
  robots: { index: false, follow: false },
  icons: { icon: "/assets/img/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#0f1115", colorScheme: "dark" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang } = await getUi();
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
