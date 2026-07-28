import type { Metadata } from "next";
import localFont from "next/font/local";

import { AppProviders } from "@/app/providers";
import { SiteFooter } from "@/components/site-footer";

import "./globals.css";

const maruBuri = localFont({
  display: "swap",
  fallback: ["AppleMyungjo", "serif"],
  src: [
    {
      path: "./fonts/MaruBuri-Regular.woff2",
      style: "normal",
      weight: "400",
    },
    {
      path: "./fonts/MaruBuri-SemiBold.woff2",
      style: "normal",
      weight: "600",
    },
    {
      path: "./fonts/MaruBuri-Bold.woff2",
      style: "normal",
      weight: "700",
    },
  ],
  variable: "--font-maru-buri",
});

export const metadata: Metadata = {
  title: {
    default: "이루리",
    template: "%s · 이루리",
  },
  description: "기록으로 소원을 키우는 조용한 디지털 숲",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={maruBuri.variable} lang="ko">
      <body>
        <AppProviders>
          {children}
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
