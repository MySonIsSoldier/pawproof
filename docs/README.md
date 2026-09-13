# PawProof 기획 문서

기준일: 2026-09-10\
문서 상태: 승인된 제품 기획·개발 기준과 초기 구현 현황

PawProof(포프루프)는 반려견의 조건과 여행 일정을 장소별 동반 규정에 대조하고, 문제가 있는 방문지의 해결 방법을 제시하는 여행 코스 사전검증 웹앱이다.

> 가고 싶은 곳을 담으면, 우리 강아지와 방문할 때 걸리는 조건을 찾아주고, 원래 여행을 최대한 유지하면서 해결 방법을 제시한다.

디자인 기준: [DESIGN.md](../DESIGN.md). 이번 제품 구현 범위: [실행 계획](delivery/BUILD_PLAN.md). API 설정은 [연결 계약](engineering/API_INTEGRATION.md), 반복 검증은 [검사 안내](engineering/TESTING.md)를 따른다.

## 문서 안내

에이전트 작업 규칙은 루트의 [AGENTS.md](../AGENTS.md)에 간략히 정리한다. 상세 기획·설계·운영 기준은 이 `docs/` 문서 묶음에서 관리한다.

| 문서 | 다루는 내용 |
|---|---|
| [공모전 개요](competition/COMPETITION.md) | 지정과제, 심사 기준, 일정, 제출 항목, API 활용·출처 규정 |
| [제품 기획](product/PRODUCT_PLAN.md) | 사용자, 가치 제안, 핵심 경험, 화면 흐름, 차별성, 사업 확장 |
| [판정·일정 복구 기준](product/RULES_AND_RECOVERY.md) | 네 가지 상태, 규정 해석, 불확실성, 대체 장소, 코스 재검증 |
| [데이터 전략](data/DATA_STRATEGY.md) | 데이터별 역할, 과거 API 검증 기록, 지역 선정, 저장·운영 원칙 |
| [인천 데이터 보강](data/INCHEON_COVERAGE.md) | 확보 출처·지역 검색·장소 병합·충돌·갱신 기준 |
| [사용자 앱 조사 안내](data/INCHEON_APP_RESEARCH_GUIDE.md) | 첫 4개 가게·앱별 조사 순서·캡처 항목·자료 전달 양식 |
| [인천 업체 확인 목록](data/INCHEON_CONFIRMATION_QUEUE.md) | 30곳의 누락 항목·자료 내 연락처·남은 확인 질문 |
| [인천 보강 실측](delivery/INCHEON_VALIDATION_2026-09-11.md) | 실제 브라우저·표본 지표·보강 한계·검사 결과 |
| [기술 스택 선택](engineering/STACK_DECISION.md) | Vercel·Workers·OCI, Firebase·Supabase·D1 비교와 우선안 |
| [애플리케이션 아키텍처](engineering/ARCHITECTURE.md) | 단일 앱의 계층·인터페이스·데이터 흐름·저장 경계 |
| [개발 환경과 경로 처리](engineering/DEVELOPMENT_ENVIRONMENT.md) | code-server 프록시, 환경변수, URL 유틸, 빌드·검증 계약 |
| [코드 작성과 검증 원칙](engineering/CODE_STANDARDS.md) | 단일 책임, 타입·실패 처리, 테스트, 협업 |
| [Firebase 인증·계정 저장](engineering/FIREBASE_AUTH_AND_STORAGE.md) | 공통 SDK·인증·사용자별 노트·환경변수·에뮬레이터 |
| [PWA 설치·오프라인·업데이트](engineering/PWA.md) | 설치 UX, 워커·캐시 경계, 개발 프록시, 검증 범위 |
| [코드 품질 점검](engineering/CODE_QUALITY_REVIEW.md) | 작업 알림·실패 경계의 발견 사항, 수정, 검증 범위 |
| [UI 디자인 시스템·상태 책임](engineering/UI_DESIGN_SYSTEM.md) | shadcn/Radix 컴포넌트, 토큰, Zustand·TanStack Query, 공통 훅 |
| [무료 호스팅·비용·운영](operations/HOSTING_AND_COST.md) | 사용량 예산, DNS, 배포 관리, 대안 전환, 심사 기간 운영 |
| [Vercel 첫 배포 안내](operations/VERCEL_DEPLOYMENT.md) | GitHub 연결·Node/pnpm·운영 환경변수·Firebase 도메인·배포 후 점검 |
| [구현·검증·제출 계획](delivery/DELIVERY_PLAN.md) | 제출 버전 범위, 역할 분담, 개발 일정, 품질 평가, 시연 |
| [현재 구현·검증 기록](delivery/IMPLEMENTATION_STATUS.md) | 실제 구현한 파일·실행한 검사·아직 검증하지 않은 연결 |
| [최근 작업 로그](delivery/WORK_LOG.md) | 운영 배포·PWA 로그인 수정·검증 결과·남은 실기기 확인 |
| [실 API 검증 실행](engineering/LIVE_VALIDATION.md) | 비용·호출 상한이 있는 공급자/브라우저 검사, 비밀 없는 집계 기록 |
| [2026-09-11 실사용 검증](delivery/LIVE_VALIDATION_2026-09-11.md) | 실제 장소 결과·수정한 오류·처리 시간·비용·미완료 범위 |
| [의사결정 및 대화 히스토리](history/DECISION_HISTORY.md) | 아이디어 발전 과정, 확정한 선택, 수정한 가정, 미결 사항 |
| [근거 및 참고자료](research/SOURCES.md) | 사용자 제공 자료, 이전 검토에서 확인한 외부 자료, 미확인 자료 |

제품 이해: 공모전 개요 → 제품 기획 → 판정·일정 복구 기준 → 데이터 전략.

개발 착수: 기술 스택 선택 → 아키텍처 → 개발 환경 → 코드 원칙 → 호스팅·비용 → 구현·제출 계획.

## 폴더 위계

```text
docs/
  README.md
  competition/   # 대회 기준·제출 요건
  product/       # 사용자 경험·판정·일정 복구
  data/          # 데이터 확보·검증·보관
  engineering/   # 스택·아키텍처·개발 환경·코드 원칙
  operations/    # 호스팅·비용·도메인·운영
  delivery/      # 일정·역할·평가·제출 실행
  history/       # 결정과 변경 이유
  research/      # 근거의 출처와 확인 상태
```

## 현재 합의한 방향

- 서비스명은 **PawProof**로 유지한다.
- 지정과제는 **6번: 모호한 반려동물 출입 조건 및 규정 인지 오류로 현장 입장 거부 및 헛걸음 유발 문제**를 기준으로 기획한다. 실제 접수 선택값은 제출 전에 대조한다.
- 첫 제품은 **반려견 동반 자가용 당일 여행, 방문지 3~5개**에 집중한다.
- **LLM 규정 추출 → 결정론적 규칙 판정 → 근거 확인 → 해결안 선택 → 전체 일정 재검증**을 하나의 사용 흐름으로 완성한다.
- 판정은 **이용 가능·준비 필요·확인 필요·이용 불가**로 통일한다.
- 최종 결과에는 **코스, 준비사항, 남은 확인사항**이 함께 있어야 한다.
- 인천을 첫 집중 검수 지역으로 운영한다. 현재 검색 43곳·시 자료 연결 9곳이며, 규정 완전성이나 유효 대체 확보 완료를 뜻하지 않는다. [인천 보강](data/INCHEON_COVERAGE.md)을 따른다.
- 제출 형태는 **모바일 우선 웹(PWA)**이다. 핵심 기능은 비로그인으로 체험할 수 있도록 한다.

## 채택한 개발 방향

- **Next.js + TypeScript + pnpm + Vercel Hobby + Firestore Standard/Spark**를 채택했다. GitHub Organization 저장소는 사용자가 공개 상태라고 확인했다.
- 현재 개발 작업자는 **사용자 1명**이다. **`main`에서 계속 작업하고 기능 완료마다 관련 검증 후 작은 단위로 커밋**한다. 자세한 기준은 [코드·커밋 규칙](engineering/CODE_STANDARDS.md)을 따른다.
- 공개 저장소 배포 가능 여부와 Hobby의 개인·비상업 용도 조건을 구분한다. 실제 연결과 적용 조건을 확인한 뒤 운영 구성을 확정한다.
- Cloudflare는 DNS를 유지하고, **Workers + OpenNext + D1**은 어댑터·무료 CPU 한도를 검증할 대안으로 둔다.
- code-server에서는 **`/absproxy/3000` + `basePath`**, 배포에서는 빈 `basePath`를 사용하도록 설계한다. 두 프로필은 별도로 빌드한다.
- 원문·파생 규정의 영구 저장은 데이터 정책 확인 후 결정한다. 자체 작성 데이터 저장과 구분한다.
- 새 도메인 구매와 배포·DB 연결 준비는 사용자가 담당한다. 제공된 ref/ 레퍼런스 기반 디자인은 [DESIGN.md](../DESIGN.md)에 정리했다.
- LLM은 OpenRouter 서버 API 어댑터를 구현했다. 초기 모델·키 설정·비용 한도 권고는 [API 연결](engineering/API_INTEGRATION.md)에 있고 실호출·브라우저 표본 검증을 수행했으며 전국 정확도 평가는 남아 있다.

기본 방향은 사용자 채택이 완료되었으며 실제 코드·유틸 작성이나 배포 완료와 구분한다. 공식 근거와 대안 선택 조건은 [스택 결정](engineering/STACK_DECISION.md)에 있다.

## 사실과 계획을 구분하는 방법

| 구분 | 의미 |
|---|---|
| 사용자 제공 공지 | 사용자가 붙여 준 공모전 안내. 원본 페이지·양식과 최종 대조 필요 |
| 이전 검토에서 확인 | 2026-09-10 기획 답변 작성 중 열람한 공개 자료. 이번 문서화 작업에서 재조회한 것은 아님 |
| 이번 기술 검토에서 확인 | 2026-09-10 공식 가격·제약·프레임워크 문서를 조회. 계정 연결·실행 성능 검증과 구분 |
| 과거 검증 기록 | 이전 ChatGPT 대화가 보고한 API·데이터 분석. 현재 작업 공간에 원응답·결과 파일 없음 |
| 승인 기획 | 사용자가 승인한 제품 방향. 기능 구현 완료나 성과 달성을 의미하지 않음 |
| 제안 목표 | 일정, 장소 수, 평가 규모 등 실행을 위한 목표. 실제 확보·측정 결과와 구분 |
| 미확정 | 공식 자료, 데이터, 팀 가용시간 등 추가 확인이 필요한 사항 |

## 문서 관리 원칙

1. 제품 범위의 기준은 `product/PRODUCT_PLAN.md`, 판정 동작의 기준은 `product/RULES_AND_RECOVERY.md`에 둔다.
2. 공모전 준수사항은 `competition/COMPETITION.md`, 데이터 확보·검증 상태는 `data/DATA_STRATEGY.md`에서 관리한다.
3. 변경한 결정은 `history/DECISION_HISTORY.md`에 이유와 날짜를 남기고 관련 기준 문서를 함께 수정한다.
4. 계획을 구현 완료나 검증 실적으로 표기하지 않는다. 측정한 결과에는 표본·방법·시점을 남긴다.
5. API 인증키, 비밀번호 등 실제 운영 자격증명은 문서·소스·로그에 기록하지 않는다. 공모전이 공개 지정한 테스트 계정 형식은 별도 제출 지침으로 취급한다.
6. 원본 대화에는 인증키가 포함되어 있으므로 전문을 복사하지 않는다. 이 문서들은 자격증명을 제외한 요약이다.
7. 기술 선택은 `engineering/STACK_DECISION.md`, 경로 설정은 `engineering/DEVELOPMENT_ENVIRONMENT.md`, 비용·배포 운영은 `operations/HOSTING_AND_COST.md`를 기준으로 관리한다.
8. Next.js 기반 구현을 시작했다. 상세 기능·외부 연결·배포 결과는 각각 구현·검증한 범위를 구분해 기록한다.
