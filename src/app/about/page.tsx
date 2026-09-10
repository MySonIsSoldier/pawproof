import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "서비스 소개" };

export default function AboutPage() {
  return (
    <main>
      <h1>PawProof 소개</h1>
      <p>반려견의 조건과 여행 일정을 장소별 동반 규정에 대조하는 서비스를 준비하고 있습니다.</p>
      <p>이용 조건과 근거를 확인하고, 준비사항이나 대체 장소를 찾아 출발 전 불확실성을 줄이는 것이 목표입니다.</p>
      <Link href="/">처음으로</Link>
    </main>
  );
}
