# 근거 및 참고자료

정리일: 2026-09-10

제품·공모전 자료 U1~U4와 S1~S8은 이전 기획 답변의 확인 상태를 유지한다. 이후 개발 기획 요청에 따라 **2026-09-10에 공식 가격·호스팅·개발 환경 문서를 추가 조회**했다. 추가 출처는 아래 T1~T5와 각 개발·운영 문서의 해당 주장 옆에 연결했다. 실제 API 재호출·계정 연결·배포 검증은 수행하지 않았다.

## 사용자 제공 자료

| ID | 자료 | 범위와 상태 |
|---|---|---|
| U1 | 최초 요청의 공모전 공식 안내 복사본 | 일정, 심사, 제출 항목, FAQ, 문의처. 원본 페이지 URL과 첨부 링크 없음 |
| U2 | 제출 아이디어 | 규정 구조화, 프로필·일정 대조, 네 상태, 대체 장소 |
| U3 | 붙여 준 이전 ChatGPT 대화 | 팀 구성, 이름 결정, 데이터 후보, 과거 API 검증 수치, 개요 수정 과정 |
| U4 | 2026-09-10 기획 제안에 대한 승인 | 현재 제품 방향과 문서화 요청의 근거 |
| U5 | 개발 기획·문서 위계 정리 요청 및 후속 답변 | 무료 호스팅, Next.js 선호, code-server 환경, 공개 GitHub Org, Cloudflare 대안, 도메인·디자인 결정 주체 |
| U6 | 기본 스택 채택·작업 규칙 요청 | 사용자 혼자 `main`에서 개발, 기능별 작은 커밋, 클린 코드·클린 아키텍처, 간략한 루트 AGENTS.md |
| U7 | 초기 구현 착수 요청 | OpenRouter 보유 크레딧 활용, 사용자 담당 배포·DB 준비, KTO 사용 요청, 추후 디자인 제공 |

공유 대화 주소: [관광데이터 공모전 주제 추천](https://chatgpt.com/share/6a672375-e6f0-83ee-b801-7c5b35968599).

공유 링크에서는 본문을 직접 확보하지 못했고, 사용자가 뒤이어 붙여 준 텍스트로 히스토리를 파악했다. 해당 히스토리에 실제 인증키가 포함되어 있어 전문을 문서에 복사하지 않았다.

작업 공간의 `prompt.md`는 최초 요청의 공모전 안내·아이디어를 담은 기존 파일이다. 후속 히스토리와 승인 기획 전체를 포함한 자료로 간주하지 않는다.

## 공모전과 과제

### S1. 2026 웹·앱 구현 부문 지정과제 목록

- [공식 지정과제 PDF](https://portal.koreatech.ac.kr/ctt/bb/bulletin?a=fd&b=14&fs=1&p=36646)
- [한국기술교육대학교 배포 공지](https://www.koreatech.ac.kr/notice/view.es?board_id=14&mid=a10604010000&post_seq=36646)
- 이전 기획 검토에서 PDF 본문 확인.
- 확인 내용: 6번 과제의 해결 문제, 참고 기능, 해시태그, 예시에 따른 개발 의무·가감점 없음.
- 해석: PawProof의 코스 검증·복구는 6번 문제를 해소하는 확장 방향이다.
- 한계: 사용자의 실제 접수 선택값이나 최신 제출 양식을 확인한 자료는 아니다.

## 사용자 수요와 경쟁 서비스

### S2. 한국관광공사 2024 반려동물 동반여행 현황 및 인식조사

- [보고서 PDF 공개 사본](https://popsyoo.com/wp-content/uploads/2024/11/2024-%EB%B0%98%EB%A0%A4%EB%8F%99%EB%AC%BC-%EB%8F%99%EB%B0%98%EC%97%AC%ED%96%89-%ED%98%84%ED%99%A9.pdf)
- 작성기관: 한국관광공사. 링크는 외부 사이트에 공개된 보고서 사본.
- 14쪽: 최근 반려견 동반여행 경험자 1,589명의 여행 기간 중 당일 55.0%.
- 62쪽: 응답자 2,144명의 공사 반려동물 여행정보 서비스 이용 의향 76.0%.
- 해석: 당일 여행 집중과 정보 확인 문제의 수요 근거.
- 한계: PawProof에 대한 구매 의향, 실제 사용률, 시장 점유율을 뜻하지 않는다.

### S3. 반려생활

- [반려생활 공식 서비스](https://www.ban-life.com/)
- 이전 검토에서 확인한 범위: 체중 조건이 표시된 숙소, 반려견 동반 장소·여행 콘텐츠.
- 해석: 체중 조건 표시와 장소 탐색만으로 독창성을 주장하기 어렵다.
- 한계: 모든 기능을 직접 테스트한 것은 아니다. 이전 대화의 ‘약 3만 개 장소’는 이번 기획의 검증된 최신 수치로 사용하지 않는다.

### S4. LOCAPET

- [LOCAPET 공식 App Store 소개](https://apps.apple.com/kr/app/locapet-%EB%A1%9C%EC%B9%B4%ED%8E%AB/id6754546764)
- 공개 소개: 세분화된 탐색, 맞춤 추천, 정책 변경 알림 등.
- 해석: 정책 알림 자체를 PawProof의 고유 기능으로 주장하지 않는다.
- 한계: 소개된 기능의 동작 품질이나 코스 복구 기능 부재까지 검증한 것은 아니다.

## 수상작 참고

### S5. 2025 대상작 투어딩

- [한동대학교 수상팀 소개](https://csee.handong.edu/59/?bmode=view&idx=168793919)
- 이전 검색 결과에서 확인: ‘길짱이들’ 팀의 2025 관광데이터 활용 공모전 대상 수상, 자전거 여행객용 투어딩의 기획·개발·배포, 관광·이동 데이터 결합과 코스·길안내 기능.
- 상태: 대학의 공개 소개 검색 본문을 확인했으나 페이지 직접 열람은 접근 오류가 있었다.
- 해석: 구체적 사용자와 완결된 사용 흐름을 갖추는 방향을 참고한다.
- 한계: 심사 세부 점수·수상 이유·전체 수상작 경향을 확인한 것은 아니다. 수상 사례로 올해 우승을 보장하지 않는다.

## 기술 문서

### S6. Kakao Local

- [공식 Local API 문서](https://developers.kakao.com/docs/ko/local/dev-guide)
- 확인 내용: 장소명·주소·좌표·전화·상세 페이지 URL 등의 응답 항목.
- 적용: 장소 검색·보완 정보에 활용한다. 반려동물 규정·후기 전체 제공을 전제하지 않는다.

### S7. Kakao Mobility

- [자동차 길찾기](https://developers.kakaomobility.com/guide/navi-api/directions)
- [다중 목적지 길찾기](https://developers.kakaomobility.com/guide/navi-api/destinations)
- [미래 운행 정보 길찾기](https://developers.kakaomobility.com/guide/navi-api/future)
- 확인 내용: 소요시간·거리·경로 응답, 목적지별 경로 비교와 미래 시각 기준 경로 문서의 존재.
- 적용: 방문지 교체 시 이동시간 변화와 일정 재계산.
- 한계: 현재 프로젝트의 사용 권한·실응답·쿼터·비용은 아직 확인하지 않았다. 제휴 전용 API를 일반 계정에서 사용할 수 있다고 가정하지 않는다.

### S8. 한국관광콘텐츠랩 및 국문 관광정보 API

- [한국관광콘텐츠랩](https://api.visitkorea.or.kr/)
- [한국관광공사 국문 관광정보 서비스](https://www.data.go.kr/tcs/dss/selectApiDataDetailView.do?publicDataPk=15101578)
- 국문 서비스의 `KorService2`와 사용자가 승인받았다고 제공한 반려동물 전용 `KorPetTourService2`는 구분한다.
- 이 링크를 반려동물 전용 API의 실제 호출 성공 근거로 사용하지 않는다. 해당 과거 기록은 [DATA_STRATEGY.md](../data/DATA_STRATEGY.md)에 별도 표기한다.

## 이번 개발 검토의 공식 자료

조회일: 2026-09-10. 가격표의 무료 제공량은 현재 계정의 실제 사용량·계약 적합성·성능을 검증한 결과가 아니다.

### T1. Vercel

- [Git 연동](https://vercel.com/docs/git): 비공개 Organization 제한, 공개 저장소·PR의 배포 구분.
- [협업 안내](https://vercel.com/docs/deployments/troubleshoot-project-collaboration): 공개 저장소 협업과 계정 연결.
- [Hobby 플랜](https://vercel.com/docs/plans/hobby): 용도 조건과 무료 한도.
- [도메인 연결](https://vercel.com/docs/domains/working-with-domains/add-a-domain): 실제 대시보드의 DNS 지침 사용.
- 적용: [스택 결정](../engineering/STACK_DECISION.md), [운영 계획](../operations/HOSTING_AND_COST.md).

### T2. Firebase와 Supabase

- [Firebase 가격](https://firebase.google.com/pricing), [Firestore 할당량](https://firebase.google.com/docs/firestore/quotas): Standard/Spark 무료량과 무료에 포함되지 않는 기능.
- [Cloud Storage 변경](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024?hl=en): Blaze 요구.
- [Firestore 보안 조건](https://firebase.google.com/docs/firestore/security/rules-conditions): 서버 SDK의 IAM 및 애플리케이션 검증 필요.
- [Supabase 가격](https://supabase.com/pricing): 무료 용량, 비활동 일시정지, 백업 조건.
- 적용: [DB 비교](../engineering/STACK_DECISION.md), [저장 경계](../engineering/ARCHITECTURE.md).

### T3. Cloudflare

- [Workers 가격](https://developers.cloudflare.com/workers/platform/pricing/), [Workers 제한](https://developers.cloudflare.com/workers/platform/limits/).
- [D1 가격](https://developers.cloudflare.com/d1/platform/pricing/), [D1 제한](https://developers.cloudflare.com/d1/platform/limits/).
- [현재 Next.js 안내](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/), [OpenNext 안내](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/), [OpenNext 프로젝트](https://opennext.js.org/cloudflare).
- [GitHub 연동](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/), [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/), [DNS 프록시 상태](https://developers.cloudflare.com/dns/proxy-status/).
- 적용: [Cloudflare 대안의 조건](../engineering/STACK_DECISION.md), [배포·비용 계획](../operations/HOSTING_AND_COST.md). 어댑터 호환성과 CPU는 실측 전이다.

### T4. Next.js

- [basePath](https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath), [assetPrefix](https://nextjs.org/docs/app/api-reference/config/next-config-js/assetPrefix).
- [allowedDevOrigins](https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins), [환경변수](https://nextjs.org/docs/app/guides/environment-variables).
- 적용: [환경변수·경로 유틸 계약](../engineering/DEVELOPMENT_ENVIRONMENT.md). 실제 구성의 HMR·RSC·자산 동작은 구현 후 검증한다.

### T5. code-server

- [공식 접근·프록시 가이드](https://coder.com/docs/code-server/guide).
- 확인 내용: `/proxy` 접두사 제거, `/absproxy` 유지, 상위 경로 설정과 서브도메인 대안.
- 적용: [개발 환경](../engineering/DEVELOPMENT_ENVIRONMENT.md). 현재 Coolify·code-server 배포 설정 자체는 아직 확인하지 않았다.

### T6. 초기 구현의 추가 기술 근거

- [OpenRouter API 시작 안내](https://openrouter.ai/docs/quickstart): 서버 API 연결 경로 참고. 실제 모델 호출은 후속 작업.
- [pnpm 12 설정](https://pnpm.io/settings): 설치 설정을 `pnpm-workspace.yaml`에 관리.
- 현재 설치한 Next.js 패키지의 `node_modules/next/dist/docs/`에서 basePath·개발 출처·환경변수 문서를 확인했다.
- 실제 구현·실행 결과는 [구현 기록](../delivery/IMPLEMENTATION_STATUS.md)에 별도로 기록한다.

## 원본을 확보해야 할 자료

- 공모전 공식 안내 페이지와 최신 수정사항.
- OT 영상·발표자료·OpenAPI 활용 가이드.
- 기능설명서 원본 양식과 제출 절차 매뉴얼.
- 인증키 확인·운영계정 신청 안내 별첨.
- 인천·식품안전나라·문화정보원 데이터의 정확한 원본 링크와 파일.
- 과거 API 원응답·결합 CSV·검증 리포트·검증기.
- 구 API 중단 공지 원문.

이전 대화에서 언급한 제주 보도, 해외 유사 이름 앱 등 원본이 확보되지 않은 내용은 현재 핵심 주장의 검증 근거로 사용하지 않는다.
