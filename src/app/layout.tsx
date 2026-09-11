import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import localFont from "next/font/local";
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
        {children}
      </body>
    </html>
  );
}
