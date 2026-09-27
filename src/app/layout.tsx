import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import localFont from "next/font/local";
import { publicAssetPath } from "../config/public";
import { QueryProvider } from "../components/providers/query-provider";
import { AuthProvider } from "../features/auth/auth-provider";
import { AuthDialog } from "../features/auth/auth-dialog";
import { PwaProvider } from "../features/pwa/pwa-provider";
import { UmamiScript } from "../components/analytics/umami-script";
import { SiteJsonLd } from "../components/seo/site-json-ld";
import { siteOrigin } from "../config/site";
const pretendard = localFont({
  src: "../assets/fonts/PretendardVariable.woff2",
  display: "swap",
  variable: "--font-pretendard",
  weight: "100 900",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: "PawProof | 반려견과 함께하는 좋은 여행",
    template: "%s | PawProof",
  },
  description:
    "가고 싶은 곳에 우리 강아지와 함께 갈 수 있도록, 반려견 동반여행 코스와 장소별 조건을 미리 살펴보세요.",
  applicationName: "PawProof",
  keywords: [
    "반려견 동반 여행",
    "강아지 여행",
    "반려견 여행 코스",
    "반려동물 동반 장소",
    "반려견 출입 규정",
    "여행 코스 검증",
  ],
  authors: [{ name: "PawProof" }],
  creator: "PawProof",
  publisher: "PawProof",
  category: "travel",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: "PawProof",
    title: "PawProof | 반려견과 함께하는 좋은 여행",
    description:
      "우리 강아지와 가고 싶은 곳을 담고, 동반 조건과 준비사항을 미리 살펴보며 더 편안한 여행을 준비해요.",
    images: [
      {
        url: "/media/travel-companion.jpg",
        width: 900,
        height: 600,
        alt: "반려견과 함께 떠나는 PawProof 여행",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PawProof | 반려견과 함께하는 좋은 여행",
    description:
      "반려견과 함께 가고 싶은 곳을 미리 살펴보고, 우리만의 여행을 준비하는 PawProof입니다.",
    images: ["/media/travel-companion.jpg"],
  },
  appleWebApp: { capable: true, title: "PawProof", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: publicAssetPath("/favicon.ico"), sizes: "any", type: "image/x-icon" },
      { url: publicAssetPath("/favicon-16x16.png"), sizes: "16x16", type: "image/png" },
      { url: publicAssetPath("/favicon-32x32.png"), sizes: "32x32", type: "image/png" },
      { url: publicAssetPath("/pwa/icon-192.png"), sizes: "192x192", type: "image/png" },
      { url: publicAssetPath("/pwa/icon-512.png"), sizes: "512x512", type: "image/png" },
    ],
    shortcut: [publicAssetPath("/favicon-32x32.png")],
    apple: [
      { url: publicAssetPath("/pwa/apple-touch-icon.png"), sizes: "180x180" },
    ],
  },
};
export const viewport: Viewport = {
  themeColor: "#2f6b50",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ko"
      data-scroll-behavior="smooth"
      className={pretendard.variable}
    >
      <body>
        <SiteJsonLd />
        <UmamiScript />
        <a className="skip-link" href="#main">
          본문으로 바로가기
        </a>
        <QueryProvider>
          <AuthProvider>
            <PwaProvider>{children}</PwaProvider>
            <AuthDialog />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
