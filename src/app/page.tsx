import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <p>PawProof · 포프루프</p>
      <h1>우리 강아지와 함께할 여행을 준비해요.</h1>
      <p>방문 조건을 확인하고, 원래 여행을 최대한 유지하는 방법을 찾습니다.</p>
      <p>현재 서비스를 준비하고 있습니다. 여행 코스 검증 기능은 아직 제공되지 않습니다.</p>
      <Link href="/about">PawProof 소개</Link>
    </main>
  );
}
