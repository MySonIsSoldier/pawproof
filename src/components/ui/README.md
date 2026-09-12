# PawProof UI

shadcn/ui `new-york-v4`의 Select, Popover, Input, Calendar 소스(2026-09-11 열람)를 기존 CSS 토큰·아이콘에 맞게 조정했다. 동작은 Radix headless primitives와 React DayPicker가 담당한다. MIT 고지는 LICENSE에 보존한다.

- 원본: https://ui.shadcn.com/r/styles/new-york-v4/select.json (popover/input/calendar도 동일 경로).
- `controls.css`: 컴포넌트 상태·크기·포털·포커스·달력 스타일. `globals.css`의 브랜드 토큰을 사용한다.
- `select.tsx`: 조합 가능한 Select / Trigger / Value / Content / Item. 포털과 목록 키보드 탐색은 Radix에 위임.
- `popover.tsx`: 포털 위치·충돌·닫기·포커스 복귀. 명시적인 접근성 이름을 사용처에서 제공.
- `calendar.tsx`, `date-picker.tsx`: 한국어·서울 시간 달력과 YYYY-MM-DD 입출력.
- `time-picker.tsx`: 24시간, 1분 단위, 확인 후 값 적용. 취소 시 기존 값 유지.
- `input.tsx`: HTML 입력 의미와 ref/aria/disabled를 유지하는 공통 입력.
- `button.tsx`, `checkbox.tsx`, `dialog.tsx`: shadcn 기반 버튼 변형·asChild와 Radix 체크/모달. 원본 button/checkbox/dialog도 동일 registry 경로에서 확인했다.

토큰 소유권·상태 관리·개발용 갤러리는 [UI 디자인 시스템](../../../docs/engineering/UI_DESIGN_SYSTEM.md)에 정리한다.

Tailwind 클래스나 CLI 자동 덮어쓰기를 사용하지 않는다. shadcn 원본 업데이트 시 이 프로젝트의 CSS와 키보드 회귀 검사를 함께 대조한다. 업무 판정·API 요청·전역 상태는 이 폴더에 넣지 않는다.

- `sonner.tsx`: [shadcn Sonner 원본](https://ui.shadcn.com/r/styles/new-york-v4/sonner.json)을 라이트 테마·기존 Icon·브랜드 CSS에 맞게 조정. 타이머·키보드 접근·닫기는 Sonner 2.0.8을 사용한다. 기능에서 직접 호출하지 않고 `components/notifications/with-notifications.tsx`의 HOC와 훅으로 연결한다.

- `accordion.tsx` (2026-09-12): [shadcn Accordion 원본](https://ui.shadcn.com/r/styles/new-york-v4/accordion.json)의 Header/Trigger/Content 조합을 Radix Accordion 1.2.20·자체 Icon·CSS 토큰으로 조정. `Disclosure`는 한 항목을 독립적으로 여닫는 조합이다.
- Dialog는 [shadcn Dialog 원본](https://ui.shadcn.com/r/styles/new-york-v4/dialog.json)의 불투명 표면·페이드·95% 확대 패턴을 공통 CSS로 적용한다. [Radix 애니메이션](https://www.radix-ui.com/primitives/docs/guides/animation)에 따라 닫힘 애니메이션 동안 콘텐츠 수명을 유지한다. Accordion은 `--radix-accordion-content-height`를 사용한다. 별도 모션 라이브러리나 Tailwind는 추가하지 않는다.
