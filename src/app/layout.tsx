import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import localFont from "next/font/local";
import { publicAssetPath } from "../config/public";
import { AuthProvider } from "../features/auth/auth-provider";
import { AuthDialog } from "../features/auth/auth-dialog";
import { PwaProvider } from "../features/pwa/pwa-provider";
const pretendard = localFont({
  src: "../assets/fonts/PretendardVariable.woff2",
  display: "swap",
  variable: "--font-pretendard",
  weight: "100 900",
  preload: false,
});

export const metadata: Metadata = {
  title: { default: "PawProof", template: "%s | PawProof" },
  description: "반려견과 함께하는 여행 코스의 방문 조건을 확인하는 PawProof",
  applicationName: "PawProof",
  appleWebApp: { capable: true, title: "PawProof", statusBarStyle: "default" },
  icons: {
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
        <a className="skip-link" href="#main">
          본문으로 바로가기
        </a>
        <AuthProvider>
          <PwaProvider>{children}</PwaProvider>
          <AuthDialog />
        </AuthProvider>
      </body>
    </html>
  );
}
