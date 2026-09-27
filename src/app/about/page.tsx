import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "../../components/site-header";
import { SiteFooter } from "../../components/site-footer";
export const metadata: Metadata = {
  title: { absolute: "PawProof 소개 | 반려견과 함께하는 좋은 여행" },
  description:
    "PawProof가 반려견과 함께 가고 싶은 곳을 살펴보고, 더 편안한 동반여행을 준비하는 방법을 소개합니다.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "PawProof 소개 | 반려견과 함께하는 좋은 여행",
    description:
      "우리 강아지와 가고 싶은 곳을 미리 살펴보고, 함께할 순간을 더 편안하게 준비하는 PawProof를 소개합니다.",
    url: "/about",
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
    title: "PawProof 소개 | 반려견과 함께하는 좋은 여행",
    description:
      "반려견과 함께 가고 싶은 곳을 미리 살펴보고 우리만의 여행을 준비해요.",
    images: ["/media/travel-companion.jpg"],
  },
};
export default function About() {
  return (
    <>
      <SiteHeader compact />
      <main className="about-page wrap">
        <p className="eyebrow">A GOOD DAY, TOGETHER</p>
        <h1>반려견과 함께라서 더 좋은 여행</h1>
        <p className="lead">
          가고 싶은 곳과 우리 강아지의 하루를 함께 생각하는 여행 노트,
          PawProof입니다.
        </p>
        <h2>함께 갈 수 있는 곳을 찾는 여행 노트</h2>
        <p>
          PawProof는 반려견과 떠나고 싶은 여행 코스를 미리 살펴보고, 우리
          강아지의 조건에 맞는지 차근차근 확인하는 서비스입니다. 함께할 수
          있는 곳은 더 안심하고 담고, 아직 모르는 조건은 확인할 수 있도록
          남겨둡니다.
        </p>
        <h2>떠나기 전, 마음 놓을 수 있도록</h2>
        <p>
          실제 여행에서는 공개된 관광 안내와 장소 정보를 바탕으로 동반 조건과
          준비사항을 살펴봅니다. 정보가 부족하거나 최신 여부를 확인하기
          어려운 내용은 괜찮다고 넘기지 않고 직접 확인할 수 있도록 알려드려요.
          가상 체험은 서비스 흐름을 살펴보기 위한 예시입니다.
        </p>
        <h2>확인하는 순간까지가 여행의 시작</h2>
        <p>
          장소마다 안내가 달라질 수 있으니 출처와 확인 시점을 함께 보여드립니다.
          PawProof의 결과가 실제 입장이나 예약을 대신하지는 않아요. 출발 전
          업체의 최신 안내까지 확인하면, 우리 여행을 더 든든하게 준비할 수
          있습니다.
        </p>
        <h2>우리의 여행을 더 오래 기억하도록</h2>
        <p>
          회원가입이나 현재 GPS 위치 없이 사용할 수 있습니다. 선택한
          프로필·코스는 현재 화면에서만 사용하며 비회원의 여행 노트는 저장하지
          않습니다. 새로고침하면 작성 내용과 검사 결과가 사라집니다. 로그인하고
          이메일 인증을 마치면 작성 중인 여행 노트가 계정에 자동 저장되어 다른
          기기에서도 불러올 수 있습니다. 저장 당시 결과는 과거 기록이며 최신
          조건은 다시 검사해 주세요. 공급자 규정 원문과 인용문은 저장하지
          않습니다.
        </p>
        <h2>사진과 글꼴</h2>
        <p>
          한국어 글꼴은{" "}
          <a
            href="https://github.com/orioncactus/pretendard"
            target="_blank"
            rel="noreferrer"
          >
            Pretendard
          </a>
          , 첫 화면 사진은{" "}
          <a href="https://unsplash.com" target="_blank" rel="noreferrer">
            Unsplash
          </a>
          에서 제공한 이미지입니다. 사진은 서비스 분위기를 위한 이미지이며 특정
          장소의 방문 가능 근거가 아닙니다.
        </p>
        <Link href="/" className="button">
          처음으로
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
