import type { Metadata } from "next";

import { AppProviders } from "@/app/providers";
import { SiteFooter } from "@/components/site-footer";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "IROORI",
    template: "%s · IROORI",
  },
  description: "기록으로 소원을 키우는 조용한 디지털 숲",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AppProviders>
          {children}
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
