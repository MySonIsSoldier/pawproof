# 검증 실행 안내

2026-09-11 · 제품 기능 검증은 실제 외부 서비스 호출과 분리한다.

## 한 번에 실행

```bash
pnpm verify
```

단위 테스트, ESLint, TypeScript, Playwright 직접 개발/프록시 개발/운영 빌드를 순서대로 실행한다. 두 개발 서버를 같은 .next/dev에 동시에 실행하지 않는다. Linux/code-server에서 이 프로젝트가 관리하는 preview PID만 명령·작업 경로를 확인한 뒤 중지하고, 종료 시 복원한다. 임의 사용자 서버나 IDE 본체를 종료하지 않는다.

모든 E2E 서버에는 LIVE_SERVICES_ENABLED=false를 주입하므로 유료 API나 실제 KTO를 호출하지 않는다. 모델·KTO·Kakao 단위 검사는 함수 인자로 전달한 합성 HTTP 응답을 사용한다. 실제 서비스 연결 검사와 구분한다.

실제 공급자 호출과 브라우저 흐름은 [실 API 검증 실행](LIVE_VALIDATION.md)의 별도 스크립트로 수행한다. 자동 반복/CI에 연결하지 않으며, 원문·키 대신 상태·시간·제공된 비용만 집계한다. [2026-09-11 결과](../delivery/LIVE_VALIDATION_2026-09-11.md)를 회귀 테스트 결과와 구분한다.

## 설치 환경

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
```

OCI에서 기존 /tmp/ms-playwright와 /tmp/pawproof-browser-libs가 있으면 verify 실행기가 브라우저·공유 라이브러리 경로를 자동 지정한다. 다른 환경에는 Playwright Chromium 시스템 의존성이 필요하다. 임시 경로가 삭제되면 브라우저/시스템 의존성을 다시 준비한다.

/app/code-server/bin/code-server가 있으면 127.0.0.1:8444에 임시 프록시를 실행해 /absproxy/3101을 실제 경유한다. 테스트 전용 루프백 프록시만 인증 없이 실행하며 외부 IDE의 인증 설정은 바꾸지 않는다. 바이너리가 없으면 Next basePath 직접 검증으로 대체되었다는 메시지를 출력한다.

## 검사 범위

- 정책 10kg 이하/미만, 개체와 일행, AND/OR, 구역, 누락, 일정·고정 방문 보존, 실패 처리.
- 원문 근거가 없는 LLM 결과 거부, KTO JSON 및 비정상 HTML/XML 응답·빈 목록, 초/분 변환, 입력 바디 크기와 키 포함 오류 제거.
- 데스크톱 1440×1000, 모바일 390×844, 한국어/Asia-Seoul 시간 설정.
- 홈·폰트·사진·FAQ·CTA, 방문지/반려견 편집, 검색/빈 결과, 네 상태와 원문 dialog.
- 프로필 수정 뒤 이전 결과 표시, 대체 후보·적용·되돌리기, 준비물·문의 문구·기기 저장/삭제.
- 인쇄 시 여행 날짜/반려견 정보와 결과 유지, 모바일 고정 검사 버튼 숨김.
- 실제 모드 준비 부족, 잘못된 입력 거부, 공급자 장애 후 재시도.
- CSS/JS/MIME/새로고침/API, 개발 WebSocket·HMR 상태 유지, 운영에서 dev/check 404.
- shadcn/Radix 선택·날짜·시각·모달, 1분 단위와 연도 경계, 기존 체류시간 복원, 초록 포커스, 비활성 상태, 디자인 시스템 갤러리의 운영 404.
- Zustand 스토어 간 격리·입력 revision·늦은 응답 거부·교체/되돌리기·저장 스키마. 요청 중복/자동 재시도 방지와 모드 초기화.

Radix Select의 Home/End 키는 항목 포커스를 비동기로 옮긴다. 키보드 검사에서는 다음 Enter를 보내기 전에 대상 option의 `toBeFocused()`를 검증한다. 임의 sleep이나 실패 자동 재시도로 테스트 타이밍을 덮지 않는다.

HMR 검사는 개발 컴포넌트의 제목을 잠시 바꾸고 finally에서 복원한다. 테스트 중 해당 파일을 직접 수정하거나 여러 테스트 모드를 동시에 실행하지 않는다.

## 결과 파일

- playwright-report/direct/index.html
- playwright-report/proxy/index.html
- playwright-report/production/index.html
- test-results/<mode>/ 아래 홈/결과 스크린샷과 실패 trace

리포트와 임시 프록시 로그는 Git에 올리지 않는다. 성공 시에도 홈과 결과 화면 스크린샷을 남긴다. 실제 외부 HTTPS 로그인 경유, Vercel 배포, 실키 연결·정확도·비용은 이 검사 결과에 포함되지 않는다.

## 일부만 재검사

```bash
pnpm test
pnpm test:e2e --project=mobile --grep 'complete trip'
E2E_MODE=proxy pnpm test:e2e
pnpm exec playwright show-report playwright-report/production
```

pnpm test:e2e를 직접 실행할 때는 해당 환경의 브라우저 경로를 설정한다. pnpm verify는 이 OCI 환경의 임시 경로를 자동으로 찾아준다.

## 브라우저 확장 프로그램의 hydration 경고 진단

`<html>`에 `data-hwp-extension="rhwp"`, `data-hwp-extension-version="0.8.6"`만 추가됐다는 경고는 RHWP의 DOM 변경을 먼저 확인한다. 확장 프로그램을 끄거나 IDE 사이트 접근을 제한하고 새로고침한다. [Next.js 공식 설명](https://nextjs.org/docs/messages/react-hydration-error)에도 확장 프로그램의 HTML 변경이 원인으로 안내되어 있다. 이를 숨기기 위해 루트에 `suppressHydrationWarning`을 추가하지 않는다.

실행 중인 개발 서버에서 다음 스크립트를 재사용할 수 있다. 운영 빌드는 경고 표현이 다르므로 이 진단의 대상이 아니다.

```bash
PLAYWRIGHT_BROWSERS_PATH=/tmp/ms-playwright \
LD_LIBRARY_PATH=/tmp/pawproof-browser-libs/usr/lib/aarch64-linux-gnu \
node scripts/playwright/generated/hwp-extension-hydration-diagnosis-0cec3a7842.js http://localhost:3000/absproxy/3000/
```

2026-09-11 검사에서 홈과 가상 코스 각각 정상 브라우저는 hydration 경고 0건, 같은 두 속성을 document-start에 주입한 브라우저는 경고 1건을 확인했다. 네 경우 모두 페이지 예외 0건, 클라이언트 이동/반려견 추가 동작 정상이다. 실제 RHWP 패키지를 설치한 검사가 아니라 사용자가 보고한 속성 변경을 재현한 것이다. 서버 응답에는 해당 속성이 없었다. 외부 IDE 인증 세션은 이 로컬 검사 범위에 포함되지 않는다.

`tests/e2e/notifications.spec.ts`는 반복 저장·키보드 닫기·기기 저장 경계·인쇄 숨김·초기 렌더/타이핑 시 무알림·입력 및 HTML 프록시 오류·재시도 성공·클립보드 거부·클라이언트 화면 이동 후 알림 정리를 검사한다. 기존 `pnpm verify`의 직접 개발/로컬 code-server 프록시/운영 및 데스크톱/모바일 조합에 자동 포함한다. `controls.spec.ts`는 개발 갤러리의 성공/안내/오류 알림도 검증한다.

PWA 검사는 [PWA 계약](PWA.md)을 따른다. pnpm verify의 Playwright 서버는 PWA_ENABLED=true로 워커까지 검사한다. pwa.spec.ts가 설치 메타데이터·offline·실제 업데이트·탭/캐시 격리를 검증하며 실제 OS 설치와 설치 이벤트 시뮬레이션은 구분한다.
