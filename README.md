# PawProof

> 가고 싶은 곳은 그대로, 우리 강아지와 갈 수 있는 하루로.

PawProof는 반려견과 함께 갈 장소를 지도에서 찾고, 방문지별 동반 조건과 이동 일정을 출발 전에 확인하는 웹앱입니다. 장소를 코스에 담으면 반려견 정보·이용 구역·방문 시간·준비물을 함께 대조해 `이용 가능`, `준비 필요`, `확인 필요`, `이용 불가`로 보여줍니다.

<p>
  <a href="https://pawproof.kr/">서비스 열기</a> ·
  <a href="https://pawproof.kr/plan">실제 장소 찾기</a> ·
  <a href="https://pawproof.kr/plan?mode=demo">가상 체험하기</a>
</p>

운영 주소: **[pawproof.kr](https://pawproof.kr/)** · [Vercel 운영 주소](https://pawproof-rose.vercel.app/)

## PawProof에서 할 수 있는 일

1. 지도에서 지역과 장소를 검색합니다. 첫 탐색은 서울 명동에서 시작하고, 원하는 주소를 다시 검색할 수 있습니다.
2. 함께 갈 반려견의 이름·견종·체중과 방문 날짜를 입력합니다. 등록한 반려견은 목록에서 바로 추가하거나 뺄 수 있습니다.
3. 장소를 선택하면 해당 장소의 공식 동반 안내를 조회합니다. 조회 중에는 로딩 상태를 표시하고, 원문 출처와 확인 시점을 함께 보여줍니다.
4. 장소를 1~5곳 코스에 담고 이용 구역·체류시간·방문 순서를 정합니다.
5. 코스를 검사하면 방문지별 판정, 확인할 조건, 차량·도보 이동시간, 준비사항과 문의 문구를 확인합니다.

실제 장소 모드에서 조건이 맞지 않는 방문지는 자동 추천 결과를 기다리는 대신 지도로 돌아가 다른 장소를 직접 확인하고 코스에 추가할 수 있습니다. 가상 체험 모드에서는 예시 코스와 대체 장소 비교 흐름을 체험할 수 있습니다.

## 결과를 읽는 방법

- **반려견 출입 가능**: 선택한 이용 구역에 반려견 동반이 가능하다는 공식 안내를 확인했다는 뜻입니다.
- **이용 가능**: 현재 입력한 조건과 확인된 규정을 대조했을 때 별도 문제가 없습니다.
- **준비 필요**: 목줄·이동장·유모차·입마개·예약 등 출발 전에 준비할 항목이 있습니다.
- **확인 필요**: 체중·마릿수·실내외 구역·예방접종·운영시간 등 원문에 없거나 모호한 조건이 남아 있습니다.
- **이용 불가**: 입력한 조건이나 방문 시간이 명시된 제한에 맞지 않습니다.

`반려견 출입 가능`은 장소의 모든 세부 조건이 해결됐다는 의미가 아닙니다. 초록색 출입 가능 안내와 함께 표시되는 `확인 필요` 항목은 방문 전에 업체에 다시 확인해 주세요.

## 데이터와 판정

PawProof는 다음 자료를 조합합니다.

| 출처 | 서비스에서 사용하는 부분 |
| --- | --- |
| 한국관광공사 반려동물 동반여행정보 OpenAPI (`KorPetTourService2`) | 장소 검색, 상세 정보, 운영 정보, 동반 안내 |
| 식품안전나라·식품의약품안전처 공식 동반출입 음식점 목록 | 음식점 장소 후보와 동반 영업장 등재 근거 |
| Kakao Maps·Local·Mobility | 지도·주소 검색, 자동차·도보 이동시간 |
| OpenRouter | 확인할 내용을 실제 업체에 문의할 수 있는 자연스러운 문장으로 정리 |

공식 출처에 정보가 없거나 서로 충돌하면 이용 가능으로 추정하지 않고 `확인 필요`로 남깁니다. 최종 판정은 규정 데이터와 결정론적 규칙으로 수행하며, 생성형 AI가 출입 가능 여부를 단독으로 결정하지 않습니다.

## 개발 환경

- Node.js `24.x` (24.13 이상)
- pnpm `12.3.4`
- Next.js App Router, React, TypeScript
- Vercel, Firebase Authentication/Firestore, Kakao 지도

### 시작하기

```bash
pnpm install --frozen-lockfile
pnpm dev
```

일반 로컬 주소는 [http://localhost:3000](http://localhost:3000)입니다. 실제 장소 모드는 `/plan`, 가상 체험은 `/plan?mode=demo`에서 열 수 있습니다.

code-server 프록시에서 실행할 때는 다음 명령을 사용합니다.

```bash
pnpm dev:code-server
```

로컬 환경에서 외부 API와 계정 기능을 연결하려면 `.env.example`을 기준으로 비추적 `.env.local`을 작성하고 [API 연결 안내](docs/engineering/API_INTEGRATION.md)를 따릅니다. API 키와 Firebase 자격증명은 소스·README·로그에 넣지 않습니다. 키 없이도 빌드와 가상 체험은 실행할 수 있습니다.

### 검증 명령

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

브라우저 흐름까지 확인하려면 다음을 사용합니다.

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

전체 개발 검증 절차와 프록시·운영 프로필은 [`pnpm verify` 안내](docs/engineering/TESTING.md)와 [구현·검증 기록](docs/delivery/IMPLEMENTATION_STATUS.md)에 정리되어 있습니다.

## 저장소 안내

```text
src/domain/          반려견 조건·규정 판정·일정 계산 같은 순수 도메인 로직
src/application/     코스 검사·대체·계정 저장 사용 사례와 외부 기능 계약
src/infrastructure/ KTO·Kakao·OpenRouter·Firebase 어댑터
src/features/       지도 탐색·여행 노트·프로필·검사 결과 UI
src/components/     공통 UI와 레이아웃
docs/                제품 기획·데이터 전략·운영·공모전 제출 문서
tests/               단위·계약 테스트
```

판정 로직은 외부 API나 UI와 분리되어 있고, 외부 응답은 런타임 스키마 검증을 거칩니다. 장소를 선택했을 때만 상세 규정을 조회해 불필요한 요청을 줄이며, 실제 모드의 비회원 코스는 현재 브라우저 메모리에서만 유지됩니다. 로그인하면 여행 노트와 등록 반려견을 계정에 저장할 수 있습니다.

## 현재 범위와 한계

- 기본 시연 지역은 서울 명동입니다. 다른 지역은 지도 검색으로 직접 이동할 수 있습니다.
- 장소 목록은 후보 데이터이며, 모든 장소의 최신 세부 규정이 완전하게 확인됐다는 뜻은 아닙니다.
- `반려견 출입 가능`이 표시되어도 실내·테라스·체중·마릿수·예약·예방접종 조건은 업체에 재확인해야 할 수 있습니다.
- 이동시간은 코스 검사 후 조회합니다. 경로 API가 응답하지 않으면 도보 시간을 임의로 추정하지 않습니다.
- PWA 설치는 지원하지만 앱 스토어 앱으로 제출하는 서비스가 아니라 웹 서비스로 운영합니다.

## 문서

- [제품·데이터·기술 문서 입구](docs/README.md)
- [공모전 제출용 기능설명서 초안](docs/delivery/SUBMISSION_FUNCTION_MANUAL_DRAFT.md)
- [서울 명동 데이터 보강](docs/data/SEOUL_MYEONGDONG_COVERAGE_2026-09-18.md)
- [데이터 전략](docs/data/DATA_STRATEGY.md)
- [UI·상태 설계](docs/engineering/UI_DESIGN_SYSTEM.md)
- [배포 안내](docs/operations/VERCEL_DEPLOYMENT.md)
- [Umami 분석 설정](docs/operations/UMAMI_ANALYTICS.md)

PawProof는 2026 관광데이터 활용 공모전 웹·앱 구현 부문을 위해 개발하고 있습니다. 서비스 사용 중 장소의 최신 출입 조건은 반드시 해당 업체의 공식 안내를 함께 확인해 주세요.
