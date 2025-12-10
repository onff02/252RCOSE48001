import type { Metadata } from "next";
import { Providers } from "./providers";
import GlobalHeader from "@/components/GlobalHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "이랑 | 너랑 나랑, 생각이 흐르는 길",
  description: "서로의 관점을 이해하고 소통하는 토론 플랫폼, 이랑(Irang)",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* 구글 폰트 추가 (Do Hyeon: 타이틀용 / Gowun Batang: 감성용) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Do+Hyeon&family=Gowun+Batang:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          <GlobalHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}