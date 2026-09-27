import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage, PolicySection } from "../../components/policy-page";

export const metadata: Metadata = {
  title: { absolute: "PawProof 개인정보처리방침" },
  description:
    "PawProof가 반려견 동반여행 코스 검증과 문의 응답을 위해 어떤 정보를 처리하고 어떻게 보관하는지 안내합니다.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="PAWPROOF · PRIVACY"
      title="개인정보처리방침"
      lead="여행을 돕는 데 필요한 정보만 다루고, 무엇을 어디에 쓰는지 알기 쉽게 안내할게요."
    >
      <p className="policy-updated">시행일: 2026년 9월 27일</p>
      <PolicySection title="1. 운영자와 문의처">
        <p>
          서비스명은 PawProof이며, 개인정보 관련 문의와 삭제 요청은{" "}
          <a href="mailto:ohsong656565@gmail.com">ohsong656565@gmail.com</a>
          으로 보내주세요. 서비스 운영자는 문의를 확인하고 필요한 범위에서
          본인 확인 후 처리 결과를 안내합니다.
        </p>
      </PolicySection>
      <PolicySection title="2. 처리하는 정보와 목적">
        <ul>
          <li>
            문의하기: 이메일 주소, 문의 유형, 문의 내용. 문의에 답변하고 장소
            정보와 서비스를 개선하기 위해 이메일로 전달합니다.
          </li>
          <li>
            회원 계정: Firebase Authentication의 로그인 식별자, 이메일 주소,
            이메일 인증 상태. 로그인과 계정 접근을 제공하기 위해 사용합니다.
          </li>
          <li>
            저장 기능: 반려견 프로필, 여행 제목·일정·방문지 표시 정보와 검사
            요약. 다른 기기에서 여행 노트를 불러오고 자동 저장하기 위해
            Firestore에 저장합니다.
          </li>
          <li>
            서비스 이용 분석: Umami가 활성화된 운영 환경에서는 페이지 방문과
            제품 흐름 이벤트를 분석합니다. 검색어, 장소명·주소, 이메일,
            반려견 이름·견종·체중, 계정 ID는 분석 이벤트에 넣지 않습니다.
          </li>
        </ul>
      </PolicySection>
      <PolicySection title="3. 여행 검사 중 외부 전송">
        <p>
          실제 모드에서 장소 검색·상세 정보·이동시간을 제공하기 위해 한국관광공사
          및 카카오 관련 API를 호출합니다. 규정 추출이 필요한 경우 장소 원문과
          검사에 필요한 구조화된 정보가 OpenRouter를 통해 처리될 수 있습니다.
          가상 체험은 자체 예시 데이터로 동작합니다.
        </p>
        <p>
          공급자의 원문·인용문·사진을 PawProof 계정에 저장하지 않습니다. 외부
          공급자의 처리와 보관은 각 공급자의 정책과 운영 상태에 따르므로 실제
          방문 전에는 업체의 최신 안내를 다시 확인해 주세요.
        </p>
      </PolicySection>
      <PolicySection title="4. 보관 위치와 기간">
        <p>
          계정 프로필과 여행 노트는 Firebase Authentication 및 Firestore에
          저장됩니다. 문의 내용은 Resend를 통해 운영자 이메일로 전달되어 답변,
          스팸 대응과 서비스 개선에 필요한 기간 동안 이메일 시스템에 남을 수
          있습니다. 정확한 보관 기간은 계정 사용 여부와 문의 처리 상황에 따라
          달라집니다.
        </p>
        <p>
          사용자는 프로필의 <strong>계정과 저장 정보 삭제</strong>에서 계정과
          PawProof 저장 데이터를 직접 삭제할 수 있습니다. 삭제가 되지 않거나
          문의 메일도 지워 달라는 요청은 위 문의처로 보내주세요.
        </p>
      </PolicySection>
      <PolicySection title="5. 처리 위탁·보안·이용자 권리">
        <p>
          서비스 제공을 위해 Vercel(웹 실행), Firebase(인증·저장), Resend(문의
          메일), Cloudflare Turnstile(자동화 요청 방어), OpenRouter·한국관광공사·
          카카오(검사 기능), Umami(선택적 이용 분석)를 사용합니다. 서비스는
          입력 크기 제한, 서버 전용 자격증명, 인증 토큰 검증과 자동화 요청 방어를
          적용하지만 인터넷 서비스의 위험을 완전히 제거할 수는 없습니다.
        </p>
        <p>
          이용자는 자신의 개인정보에 대해 열람·정정·삭제를 요청할 수 있습니다.
          요청 시 계정 이메일 등 최소한의 본인 확인 정보를 함께 알려주세요.
          개인정보 보호와 관련해 이 방침의 내용이 바뀌면 이 페이지의 시행일을
          갱신합니다.
        </p>
      </PolicySection>
      <p className="policy-next">
        서비스 이용 기준은 <Link href="/terms">이용약관</Link>에서 확인할 수
        있습니다.
      </p>
    </PolicyPage>
  );
}
