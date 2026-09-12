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
| Toaster | shadcn 기반 Sonner. 숲색 토큰, 짧은 작업 결과, 키보드 닫기·화면 이탈 정리 |
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

## 작업 알림과 HOC

`withNotifications(Screen)`은 화면을 알림 context와 shadcn 기반 Sonner 호스트로 감싸는 공통 고차 컴포넌트다. 모듈 최상위에서 한 번 적용하고 props(React 19 ref prop 포함)를 그대로 전달한다. Planner와 개발용 디자인 시스템에서 재사용한다. 컴포넌트의 정적 메서드 복제나 서버 컴포넌트 래핑은 지원 범위가 아니다.

- 기능은 `ActionNotification { kind, title }`을 발행한다. Sonner 호출·표시 시간·화면별 ID·해제는 공통 경계가 담당한다. 도메인·사용 사례·기능에서 Sonner를 직접 import하지 않는다.
- 스토어의 `feedback`은 새 객체로 발행하는 일회성 이벤트다. `usePlannerNotifications`는 이후 변경만 구독한다. 동일한 저장을 반복해도 알림이 갱신되며 입력 타이핑, 재렌더, 마운트 시 이전 안내를 다시 알리지 않는다.
- 코스 검사·대체·되돌리기·저장·불러오기·삭제·장소 추가/제거/이동·검색·문의 문구 복사 결과를 안내한다. 성공은 실제 완료 후에만 발행한다. 준비표 인쇄는 브라우저 다이얼로그에 위임하며 인쇄 완료를 추정하지 않는다.
- 알림은 최신 작업 하나만 표시한다. 성공/안내 4초, 오류 6초이며 닫기·스와이프·Alt+T 접근을 지원한다. 화면 이탈 시 해당 ID만 닫고, 늦게 끝난 작업은 새 토스트를 생성하지 않는다.
- 토스트는 짧은 확인 메시지다. 판정 근거·상세 오류·준비사항은 기존 화면에 계속 남긴다. 오류 토스트는 해당 화면 안내를 가리키고 긴 오류 문구를 중복 표시하지 않는다.
- 요청 중 표시는 기존 버튼 busy 상태를 사용한다. 중복 로딩 토스트를 만들지 않는다. 취소된 검사/대체는 성공·실패 피드백을 발행하지 않는다.
- 검색은 제출된 query의 완료 상태에서 안내한다. 자동 재조회는 기존 QueryClient 정책대로 비활성화한다. 검색어/범주 변경으로 취소한 이전 검색의 알림을 다시 발행하지 않는다.
- 알림은 저장·API 계약에 포함하지 않는다. 규정/여행 정보가 Sonner에 영구 저장되지 않으며 브라우저 입력 저장 형식도 그대로 유지한다.

공식 원본은 [shadcn Sonner registry](https://ui.shadcn.com/r/styles/new-york-v4/sonner.json), 동작은 [Sonner](https://github.com/emilkowalski/sonner)를 따른다. 이 프로젝트는 라이트 테마·기존 아이콘·CSS 토큰을 사용하므로 next-themes와 lucide를 추가하지 않는다.

## PWA 공통 UI

헤더 설치 버튼과 설치/업데이트 모달은 공통 Button·Dialog/Trigger를 사용한다. 설치 상태·워커 수명은 별도 훅이 담당하며 상세 계약은 [PWA](PWA.md)에 있다. 오프라인/업데이트는 지속 상태 띠로 표시하고, 작업 완료 토스트와 구분한다. 자동 업데이트로 편집 중 입력을 지우지 않는다.

## 표면과 펼침 모션 (2026-09-12)

Dialog의 불투명 흰색 배경·잉크색·테두리·반경·그림자·화면 여백·최대 높이는 컴포넌트가 직접 가져오는 `dialog.module.css`가 소유한다. 마스크와 콘텐츠의 스타일을 고유 클래스 이름으로 분리하고 배경은 전역 색상 변수에 의존하지 않는다. 화면은 `--dialog-width`, `--dialog-max-height`, `--dialog-padding`으로 크기만 조정해 import 순서에 따른 덮어쓰기를 피한다. 설치/업데이트/근거 모달에 같은 표면을 적용한다. `data-state`에 연결한 200ms 진입·160ms 종료를 사용하며 근거 모달의 부모 해제는 Radix의 종료 후 포커스 복귀 단계에서 수행한다.

Accordion/Item/Trigger/Content는 shadcn 기반 Radix 컴포넌트이며, FAQ는 여러 항목을 독립적으로 여닫는다. 원문과 문의 문구는 Disclosure 조합을 재사용한다. 높이 변수에 연결한 240ms 펼침·200ms 접힘과 화살표 회전을 제공한다. 문의 문구는 접힌 상태에서도 인쇄할 수 있도록 별도의 인쇄 텍스트를 제공한다. reduced-motion에서는 모든 전환을 제거하며 기능·키보드 조작은 유지한다.

홈의 `HeroPhotos`는 펼침 상태만 관리하는 클라이언트 경계이며 사진·장식은 서버 컴포넌트에서 전달한다. 두 `.hero-card`는 크기·아치 반경을 공유한다. 마우스 진입/이탈, 탭 토글, Enter/Space, Escape를 지원하며 `aria-pressed`로 상태를 제공한다. 모션 감소 설정은 전환만 제거하며 입력 장치의 기본 hover 지원 여부로 기능을 제한하지 않는다.
