import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage, PolicySection } from "../../components/policy-page";

export const metadata: Metadata = {
  title: { absolute: "PawProof 이용약관" },
  description:
    "PawProof 반려견 동반여행 코스 검증 서비스의 이용 기준과 정보 사용 시 주의사항을 안내합니다.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="PAWPROOF · TERMS"
      title="이용약관"
      lead="PawProof를 안전하고 오해 없이 사용하는 데 필요한 약속을 정리했습니다."
    >
      <p className="policy-updated">시행일: 2026년 9월 27일</p>
      <PolicySection title="1. 서비스의 성격">
        <p>
          PawProof는 반려견의 조건과 여행 일정, 장소 안내를 비교해 확인사항과
          준비사항을 정리하는 보조 서비스입니다. 장소의 입장, 예약, 운영시간,
          안전 또는 법적 이용 가능성을 보장하거나 예약을 대신하지 않습니다.
        </p>
        <p>
          실제 모드의 정보도 조회 시점의 공개 원문과 추출 결과를 바탕으로
          합니다. 규정이 없거나 해석할 수 없는 경우에는 확인 필요로 남길 수
          있습니다. 출발 전 업체에 최신 조건을 직접 확인해 주세요.
        </p>
      </PolicySection>
      <PolicySection title="2. 회원과 저장 기능">
        <p>
          비회원은 가상 체험과 일부 여행 기능을 사용할 수 있으며, 새로고침 시
          비회원 작성 내용이 사라질 수 있습니다. 회원은 본인 계정으로 반려견
          프로필과 여행 노트를 저장할 수 있고, 저장 정보의 정확성과 계정 보안에
          책임이 있습니다.
        </p>
        <p>
          계정 삭제를 요청하면 Firebase 로그인 계정과 PawProof에 저장된 프로필·
          여행 노트를 삭제합니다. 외부 공급자나 운영자 이메일에 이미 전달된
          사본은 해당 시스템의 삭제 절차가 별도로 필요할 수 있습니다.
        </p>
      </PolicySection>
      <PolicySection title="3. 이용자의 준수사항">
        <ul>
          <li>타인의 개인정보·인증정보를 입력하거나 계정을 공유하지 않습니다.</li>
          <li>자동화된 대량 호출, 우회, 공격, 서비스 비용을 유발하는 사용을 하지 않습니다.</li>
          <li>서비스 결과를 근거로 타인·업체의 권리를 침해하거나 허위 정보를 유포하지 않습니다.</li>
          <li>문의 양식에 비밀번호, 결제정보, 주민등록번호 등 민감한 정보를 입력하지 않습니다.</li>
        </ul>
        <p>
          안정적인 운영을 위해 요청 빈도와 입력 크기를 제한할 수 있으며, 남용이
          의심되는 요청은 일시적으로 거절할 수 있습니다.
        </p>
      </PolicySection>
      <PolicySection title="4. 외부 서비스와 콘텐츠">
        <p>
          지도·관광 데이터·이동시간·AI 규정 추출·문의 메일은 외부 서비스에
          의존합니다. 외부 서비스의 장애, 변경, 지연, 정책 또는 결과에 대해
          PawProof가 항상 통제할 수 없으며, 외부 사이트로 이동한 뒤의 이용은
          해당 사이트 약관을 따릅니다.
        </p>
      </PolicySection>
      <PolicySection title="5. 약관의 변경과 문의">
        <p>
          기능, 외부 연동, 법적·운영상 기준이 바뀌면 이 페이지의 시행일과 내용을
          갱신할 수 있습니다. 변경 후 서비스를 계속 사용하면 갱신된 기준에
          동의한 것으로 봅니다. 약관과 서비스 이용에 대한 문의는{" "}
          <a href="mailto:ohsong656565@gmail.com">ohsong656565@gmail.com</a>
          으로 보내주세요.
        </p>
      </PolicySection>
      <p className="policy-next">
        정보 처리 방식은 <Link href="/privacy">개인정보처리방침</Link>에서
        확인할 수 있습니다.
      </p>
    </PolicyPage>
  );
}
