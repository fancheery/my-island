import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthGate } from "@/components/AuthGate";
import { SWRegister } from "@/components/SWRegister";

export const metadata: Metadata = {
  title: "我的岛",
  description: "一个只属于你的岛。",
  applicationName: "我的岛",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "我的岛",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#F6F5F1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

const themeInit = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    var d = t === 'light' || t === 'dark'
      ? t
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', d);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-dvh flex flex-col bg-paper text-ink font-sans">
        <AuthGate>{children}</AuthGate>
        <SWRegister />
      </body>
    </html>
  );
}
