import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { SiteFooter } from "../../components/site-footer";
export default function About() {
  return (
    <>
      <SiteHeader compact />
      <main className="about-page wrap">
        <p className="eyebrow">HELLO, PAWPROOF</p>
        <h1>PawProof 소개</h1>
        <p className="lead">함께 떠난 여행을, 끝까지 함께할 수 있도록.</p>
        <h2>동반 조건을 먼저 살펴보는 여행 노트</h2>
        <p>
          PawProof는 반려견의 견종·체중·마릿수와 여행 일정을 장소 규정에
          대조하고, 조건이 맞지 않는 방문지의 대안을 찾는 웹앱입니다. 확인되지
          않은 정보는 확인 필요로 남기고, 결론을 뒷받침하는 원문을 함께
          보여드립니다.
        </p>
        <h2>실제 정보와 가상 체험</h2>
        <p>
          실제 모드는 한국관광공사 반려동물 동반여행 OpenAPI의 원문을 조회하고
          AI로 규정을 추출한 뒤 규칙 엔진으로 판정합니다. 실제 연결이 준비되지
          않았거나 실패하면 그 사실을 알려드립니다. 가상 체험의 모든
          장소·규정·이동시간은 자체 작성 예시이며 실제 여행에 사용하면 안
          됩니다.
        </p>
        <h2>출처와 확인 시점</h2>
        <p>
          공사 데이터는 ‘출처: ⓒ한국관광공사’로 표시합니다. API 조회 시각과
          콘텐츠 수정일은 규정을 업체가 확인한 시각과 다릅니다. 실제 입장과
          예약을 보장하지 않으며, 최종 이용 조건은 업체의 최신 안내를 확인해
          주세요.
        </p>
        <h2>내 정보와 저장</h2>
        <p>
          회원가입이나 현재 GPS 위치 없이 사용할 수 있습니다. 선택한
          프로필·코스는 기본적으로 현재 검사에 사용합니다. ‘이 기기에 저장’을
          선택하면 코스와 장소·검사 요약을 해당 브라우저에 보관합니다.
          로그인하고 이메일 인증을 마치면 작성 중인 여행 노트가 계정에 자동
          저장되어 다른 기기에서도 불러올 수 있습니다. 저장 당시 결과는 과거
          기록이며 최신 조건은 다시 검사해 주세요. 공급자 규정 원문과 인용문은
          저장하지 않습니다.
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
