# 최근 작업 로그

상세 구현 이력은 [구현 기록](IMPLEMENTATION_STATUS.md), 결정 근거는 [결정 이력](../history/DECISION_HISTORY.md)에 둔다. 다음 작업자는 이 문서와 루트 AGENTS.md부터 확인한다.

## 2026-09-13 · Vercel 배포와 PWA Google 로그인

- 사용자 확인: `https://pawproof-rose.vercel.app/` 첫 배포 및 환경변수 설정 완료. 이후 검증된 변경의 `main` 푸시·Vercel 자동 배포를 에이전트가 진행하도록 승인했다.
- 배포 준비: 운영 `.env.example` 기본값·직접 입력 10개를 정리했다(`80238be`). Firebase 개발 도구의 선택적 re2 빌드 정책 누락을 수정하고 새 설치·운영 빌드를 검증했다(`204f985`).
- 제보: iPhone Safari에서 설치한 PWA의 Google 로그인 창에 키보드가 뜨지 않음. 수정 전 운영 브라우저 검사에서 OAuth 창을 열 때 앱 모달의 포커스/스크롤 잠금이 남는 것을 확인했다. 이것만으로 OS 키보드 문제의 단일 원인이 확정된 것은 아니다.
- 조치: Google 로그인 훅으로 흐름을 분리하고 팝업 전에 모달을 완전히 제거한다. Auth SDK를 준비 단계에서 로드해 클릭 중 동적 import를 없앴다. 성공 시 `/plan`·토스트, 취소/차단 시 모달 복귀를 유지한다. iOS가 창 닫기를 감지하지 못할 때를 위한 대기 종료 버튼과 재시도 경합 방지를 추가했다.
- 문서: AGENTS.md의 현재 상태·코드 품질·비밀 관리·검증·푸시/자동 배포 규칙을 갱신했다. [Firebase 계약](../engineering/FIREBASE_AUTH_AND_STORAGE.md)과 [반복 검사](../engineering/TESTING.md)에 동작과 실행법을 기록했다.

검증: 관련 Playwright 26개(기존 Firebase 18개 + Google 팝업 6개 + iOS 신호 경로 2개), 단위 91개, lint·typecheck·운영 빌드 통과. iOS 신호 검사의 최초 시간 초과는 앵커로 열린 창을 일반 popup 이벤트로 기다린 검사 오류였으며 context의 새 page 이벤트로 수정해 통과했다. 운영 점검 스크립트는 실제 Google 창을 열고 닫기만 하며 사용자 자격증명을 입력하지 않는다. 개발 미리보기는 검사 후 재시작했다.

남은 확인: 수정 배포의 새 버전으로 iPhone PWA를 다시 열고 Google 이메일·비밀번호 입력 시 OS 키보드가 표시되는지 확인한다. Chromium의 standalone/iPhone 신호와 Auth 에뮬레이터 검사는 실제 iPhone WebKit·키보드 검증이 아니다. 환경변수·Firebase authDomain은 이번 수정에서 변경하지 않는다.
