# PawProof UI

shadcn/ui `new-york-v4`의 Select, Popover, Input, Calendar 소스(2026-09-11 열람)를 기존 CSS 토큰·아이콘에 맞게 조정했다. 동작은 Radix headless primitives와 React DayPicker가 담당한다. MIT 고지는 LICENSE에 보존한다.

- 원본: https://ui.shadcn.com/r/styles/new-york-v4/select.json (popover/input/calendar도 동일 경로).
- `controls.css`: 컴포넌트 상태·크기·포털·포커스·달력 스타일. `globals.css`의 브랜드 토큰을 사용한다.
- `select.tsx`: 조합 가능한 Select / Trigger / Value / Content / Item. 포털과 목록 키보드 탐색은 Radix에 위임.
- `popover.tsx`: 포털 위치·충돌·닫기·포커스 복귀. 명시적인 접근성 이름을 사용처에서 제공.
- `calendar.tsx`, `date-picker.tsx`: 한국어·서울 시간 달력과 YYYY-MM-DD 입출력.
- `time-picker.tsx`: 24시간, 1분 단위, 확인 후 값 적용. 취소 시 기존 값 유지.
- `input.tsx`: HTML 입력 의미와 ref/aria/disabled를 유지하는 공통 입력.

Tailwind 클래스나 CLI 자동 덮어쓰기를 사용하지 않는다. shadcn 원본 업데이트 시 이 프로젝트의 CSS와 키보드 회귀 검사를 함께 대조한다. 업무 판정·API 요청·전역 상태는 이 폴더에 넣지 않는다.
