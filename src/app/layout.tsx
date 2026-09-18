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
    default: "PawProof | 반려견 동반여행 코스 사전검증",
    template: "%s | PawProof",
  },
  description:
    "반려견의 견종·체중·마릿수와 장소별 동반 규정을 확인하고, 준비사항·문의 문구·대체 코스까지 안내하는 여행 노트",
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
    title: "PawProof | 반려견 동반여행 코스 사전검증",
    description:
      "우리 강아지와 갈 곳을 찾고, 장소별 동반 조건과 준비사항을 출발 전에 확인하세요.",
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
    title: "PawProof | 반려견 동반여행 코스 사전검증",
    description:
      "장소별 동반 조건부터 준비사항과 대체 코스까지 출발 전에 확인하는 여행 노트",
    images: ["/media/travel-companion.jpg"],
  },
  appleWebApp: { capable: true, title: "PawProof", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: publicAssetPath("/favicon.ico"), sizes: "48x48" },
      { url: publicAssetPath("/pwa/icon-192.png"), sizes: "192x192", type: "image/png" },
      { url: publicAssetPath("/pwa/icon-512.png"), sizes: "512x512", type: "image/png" },
    ],
    shortcut: [publicAssetPath("/favicon.ico")],
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
