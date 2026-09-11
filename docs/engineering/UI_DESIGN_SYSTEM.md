# UI 디자인 시스템과 프론트엔드 책임

2026-09-11 · 시각 기준은 [DESIGN.md](../../DESIGN.md), 계층 기준은 [ARCHITECTURE.md](ARCHITECTURE.md)를 따른다.

## 구현 방식

shadcn/ui의 Radix 구현 소스를 기반으로 컴포넌트를 직접 소유한다. 공식 Portal·Trigger·Content·Item 조합을 유지하고 Tailwind 클래스는 PawProof CSS 토큰으로 치환했다. Radix는 포커스·키보드·포인터·선택·열림 상태를, React DayPicker는 달력 탐색을 담당한다. 기본 HTML 입력의 의미와 유효성은 보존한다.

`src/components/ui/README.md`와 LICENSE에 원본 출처·조정 범위를 기록한다. CLI 기본 테마를 그대로 덮어쓰지 않는다. 새 컴포넌트도 같은 경계를 따른다.

| 컴포넌트 | 책임·사용 기준 |
|---|---|
| Button | primary / outline / ghost / link / icon / plain. asChild로 링크 의미 유지. 버튼 기본 type은 button, 제출만 submit 명시 |
| Input | ref·aria·disabled·입력 이벤트 전달. 업무 값 검증은 호출 화면/계약에서 담당 |
| Select | Radix 단일 선택, 체크 표시, 목록 스크롤, 방향키·Home/End·Escape·포커스 복귀 |
| Checkbox | Radix checked/indeterminate 계약. 일반 체크와 준비물 칩에 사용 |
| Popover | 화면 경계 충돌 처리, 포털, 닫기·포커스 복귀 |
| Calendar / DatePicker | 한국어·서울 시간 달력. 문자열 YYYY-MM-DD 입출력, 월 이동·키보드 날짜 선택 |
| TimePicker | 24시간·1분 단위. 편집 초안과 적용 값 분리, 취소 시 기존 값 유지 |
| Dialog | Radix 모달·배경·제목·설명. 근거 모달은 열었던 버튼으로 포커스 복귀 |

색상·포커스·반경 토큰은 globals.css, 공통 버튼/입력/선택/모달 스타일은 components/ui/controls.css, 업무 화면 레이아웃은 planner.css가 소유한다. 컴포넌트에서 API·스토어·판정을 호출하지 않는다. 상태별 판정 배지는 업무 의미가 있으므로 verification 기능에 둔다.

`/dev/design-system`에서 실제 컴포넌트의 기본·선택·비활성·포커스 상태를 확인한다. 개발 모드에서만 제공하고 운영에서는 404다. code-server URL은 경로 유틸 계약의 접두사를 따른다.

## 상태와 훅

- **Zustand**: PlannerProvider마다 독립적인 vanilla store를 생성한다. 모듈 전역 스토어가 없으며, 서버가 만든 날짜·초기 입력을 클라이언트에도 같은 props로 전달한다.
- 스토어는 편집 입력, 선택한 장소 색인, 사용자가 채택한 검사 스냅샷, 교체 전 스냅샷을 담당한다. 스냅샷은 편집·되돌리기를 원자적으로 처리하기 위한 화면 상태이며 공급자 조회 캐시가 아니다. 장소는 ID로 병합해 같은 장소를 계속 중복 적재하지 않는다.
- **TanStack Query**: usePlaceSearch는 제출한 검색의 query, useTripOperations는 검사·대체 mutation을 담당한다. 요청 로딩/오류 처리를 화면 JSX에서 분리한다.
- 자동 재시도·재연결/재포커스/재마운트 조회를 끈다. 검색은 제출 시, 검사·대체는 버튼 선택 시 실행한다. 비활성 query/mutation의 gcTime은 0이고 디스크 persistence는 없다. 활성 화면과 되돌리기에 필요한 결과는 메모리에 존재한다.
- 요청마다 입력 revision을 캡처하고, 응답 도착 시 현재 revision과 다르면 채택하지 않는다. 중복 검사 요청을 즉시 잠그고 화면 이탈 시 AbortSignal을 전달한다. 취소는 이미 외부에서 실행된 호출의 비용 취소를 보장하지 않는다.
- useTripPersistence는 명시적 저장/불러오기와 사용자 피드백을, trip-storage는 버전·스키마 검증을 담당한다. 자동 저장/자동 hydration 복원은 하지 않는다. 기존 pawproof.trip.v1 형식을 유지하고 규정 원문을 저장하지 않는다.
- usePlanner는 편집·요청·저장 동작을 조립하고 Planner는 화면을 구성한다. 검사 요약·대체 후보는 별도 표현 컴포넌트로 분리했다. API·날짜 처리를 위한 HOC는 추가하지 않는다.

## 점검에서 수정한 사항

1. Planner에 혼재한 localStorage, fetch, 다수 상태 갱신과 JSX를 store·hooks·panels로 분리했다.
2. 도메인의 현재 시각 기본값을 없애고 시각을 인자로 주입한다. 초기 렌더 날짜를 서버와 클라이언트가 각각 계산하던 경로를 제거했다.
3. UI에서 demo 공급자 어댑터를 import하던 의존성을 순수 demo fixture로 교체했다.
4. 오래된 후보/응답을 최신 입력에 적용하지 않는다. 교체 후 추가 편집이 발생하면 되돌리기를 무효화해 새로운 편집을 지우지 않는다.
5. common UI·domain·application의 금지 의존성을 ESLint에서 검사한다.

관련 범위를 코드와 테스트로 점검한 결과이며 전체 저장소에 대한 형식적 아키텍처 증명이나 성능 실측은 아니다. 검증 결과는 [구현 기록](../delivery/IMPLEMENTATION_STATUS.md)에 기록한다.

## 공식 참고

- [shadcn Radix Select](https://ui.shadcn.com/docs/components/radix/select), [Date Picker](https://ui.shadcn.com/docs/components/radix/date-picker)
- [Zustand Next.js 가이드](https://zustand.docs.pmnd.rs/learn/guides/nextjs.html)
- [TanStack Query 기본 동작](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
