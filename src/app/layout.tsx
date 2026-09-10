import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PawProof", template: "%s | PawProof" },
  description: "반려견과 함께하는 여행 코스의 방문 조건을 확인하는 PawProof",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="ko"><body>{children}</body></html>;
}
