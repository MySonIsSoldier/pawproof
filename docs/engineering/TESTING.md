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

인천 시 자료 변경 검사는 `python scripts/audit-incheon-source.py`, 유료 표본 검사는 `node scripts/audit-incheon.ts --live`로 분리한다. [실측](../delivery/INCHEON_VALIDATION_2026-09-11.md)을 참조한다. 일반 E2E의 evidence.spec.ts는 합성 출처로 날짜·연락처·링크·모바일 근거 표시를 검사한다. 실제 인천 검사 스크립트는 유료 호출을 한 번만 수행하며 자동 반복하지 않는다.

## 표면·아코디언·홈 카드 검증 (2026-09-12)

`surface-motion.spec.ts`는 설치 모달의 흰색 불투명 표면·마스크 위 배치·경계·작은 화면 스크롤·진입/종료·포커스 복귀, FAQ 방향키/다중 펼침, reduced-motion을 검사한다. `hero-cards.spec.ts`는 두 이미지 로딩, 동일한 카드 크기·반경, 마우스 벌어짐·원복, 터치 토글, standalone·혼합 입력, 키보드와 reduced-motion 기능 유지, 작은 화면과 데스크톱의 영문 도장·페이지 폭을 검사한다. 기존 전체 검증에 포함된다.

시각 확인용 스크립트 **CREATED**: `scripts/playwright/generated/pawproof-dialog-accordion-motion-and-dog-card-re-62ab37eb7f.js`. 이후 같은 검사는 이 파일을 재사용한다.

```bash
PLAYWRIGHT_BROWSERS_PATH=/tmp/ms-playwright \
LD_LIBRARY_PATH=/tmp/pawproof-browser-libs/usr/lib/aarch64-linux-gnu \
node scripts/playwright/generated/pawproof-dialog-accordion-motion-and-dog-card-re-62ab37eb7f.js
```

실행 중인 기본 미리보기를 사용하며 마지막 인자로 다른 로컬 URL을 전달할 수 있다. 320·360·390·768·1024·1440px에서 홈·설치 모달 및 펼침(데스크톱 호버·모바일 탭) 화면을 `.cache/ui-polish/`에 저장한다. 유료 API는 호출하지 않는다. 자동화된 Chromium 터치 에뮬레이션은 실제 iOS/Android 기기 확인과 구분한다.


## Firebase 인증·DB 통합 검사

`pnpm test:firebase`는 인증/Firestore 에뮬레이터를 demo-pawproof 프로젝트로 시작하고 별도 `playwright.firebase.config.ts`로 데스크톱·모바일을 검사한다. `E2E_MODE=proxy pnpm test:firebase`는 같은 검사를 개발 basePath에서 수행한다. 구성과 Java/브라우저 준비, 실제 인증과의 차이는 [Firebase 기준](FIREBASE_AUTH_AND_STORAGE.md)에 있다. `pnpm verify`는 실제 Firebase 키를 사용하지 않도록 공개 설정과 에뮬레이터 연결을 비활성화하고 기존 회귀를 수행한다. 인증 관련 로그/스크린샷에는 로컬 테스트 사용자만 사용하며 실제 토큰·서비스 계정 키를 포함하지 않는다.

특정 Firebase 브라우저 흐름만 반복할 때는 `pnpm test:firebase --grep "signup redirects"`처럼 Playwright 인자를 전달할 수 있다.


## 계정 UX·자동 저장·검색 발견성 (2026-09-13)

Firebase account-profile.spec.ts와 account.spec.ts는 10자 가입·로그인 후 /plan 이동·전환 후 성공 토스트, 프로필 인증/반려견 등록/재조회/여행에 가져오기, 다른 탭의 계정 전환 시 이전 프로필 초안 폐기, 실제 장소 형식의 합성 후보와 결과를 자동 저장/새 노트/다시 불러오기/새로고침/삭제, 직렬 쓰기 도중 새 입력 보존·실패/재시도·계정 전환, 비밀번호 재설정 접근을 검사한다. Firebase는 로컬 에뮬레이터이고 관광 데이터는 합성 응답이다. security.spec.ts는 프로필 소유권·revision 충돌도 검사한다.

일반 place-discovery.spec.ts는 입력 전 탐색 후보·최근 검색 재사용/삭제 및 v1 기기 노트의 실제 장소명 재조회(합성 응답)를 검사한다. trip-state 단위 검사는 원문/인용/규칙 제외·과거 결과 복원·입력 변경 시 stale 유지·초안과 엄격한 검증 계약 분리를 확인한다. 기존 기기 저장 테스트는 v2 기록 형식에 맞추고 v1 읽기 호환성도 유지한다.

헤더 아바타·로그인 모달 후속 검사는 `account-profile.spec.ts`에 있다. 마지막 헤더 항목의 원형 아바타, 320px 터치 영역, Enter/클릭의 프로필 이동과 모달 부재, 사진 실패 fallback, 문구 없는 1px 구분선과 중앙 보조 버튼 간격을 확인한다. `E2E_MODE=proxy pnpm test:firebase`로 재실행한다. 사진은 로컬 테스트 계정과 합성 이미지 응답으로 검증한다.

## PWA Google 로그인 포커스 (2026-09-13)

`pnpm test:firebase --grep 'Google popup'`은 로컬 Auth 에뮬레이터에서 모달/포커스 가드/스크롤 잠금의 해제 시점, 팝업 이메일 입력·로그인 완료·취소·차단·재시도를 검사한다. iPhone userAgent와 standalone 신호로 Firebase의 별도 앵커 열기 경로도 실행한다. 이는 실제 iPhone WebKit이나 OS 키보드 검사와 다르다.

운영 점검 스크립트 **CREATED**: `scripts/playwright/generated/verify-deployed-pawproof-login-popup-releases-mo-3c2f676ac4.js`. 기존 배포를 열고 Google 팝업을 닫는 읽기 위주 검사이며 사용자 자격증명 입력·계정 생성·관광 API 호출은 하지 않는다. 이후 같은 검사는 이 파일을 재사용한다. `--baseline`은 수정 전 배포의 잠금 유지 상태를 확인할 때만 사용한다.

```bash
PLAYWRIGHT_BROWSERS_PATH=/tmp/ms-playwright \
LD_LIBRARY_PATH=/tmp/pawproof-browser-libs/usr/lib/aarch64-linux-gnu \
node scripts/playwright/generated/verify-deployed-pawproof-login-popup-releases-mo-3c2f676ac4.js https://pawproof-rose.vercel.app/
```


## 브라우저 요청 취소 호환성 (2026-09-13)

`request-signal.test.ts`는 정적 AbortSignal API 의존 없이 취소 전파·이미 취소된 요청·본문 대기 중 시간 제한·성공/실패 후 자원 해제를 검사한다. `place-discovery.spec.ts`의 첫 검색 흐름과 Firebase `account-profile.spec.ts`의 반려견 등록/재조회 흐름은 페이지 로드 전에 `AbortSignal.any`와 `timeout`을 제거한다. 실제 iPhone WebKit 검증을 대신하지 않는다.

운영 클라이언트 회귀 확인 스크립트 **CREATED**: `scripts/playwright/generated/verify-deployed-pawproof-place-search-without-ab-4ae0015793.js`. 공개 HTTPS 주소를 인자로 받고 인천 검색 API를 합성 응답으로 대체한다. 실제 계정·유료 공급자는 호출하지 않는다. 수정 전 재현에는 `--baseline`, 수정 후 확인에는 생략한다.
