# PWA 설치·오프라인·업데이트 계약

2026-09-11 · 사용자 지시에 따라 먼저 PWA를 구현한다. 실제 API 키 호출 검증과 Firebase·인증은 이후 별도 단계다. 설치형 웹이며 앱 스토어 등록이나 네이티브 앱 개발 완료를 뜻하지 않는다.

## 사용자 경험

- 헤더 ‘앱 설치’에서 설치·사용 범위를 안내한다. 브라우저가 beforeinstallprompt를 제공하면 명시적 버튼으로 호출하고, 취소/요청/설치 완료를 구분한다.
- 설치 UI가 없는 브라우저에는 수동 안내를 제공한다. iPhone/iPad는 Safari의 공유 → 홈 화면에 추가 경로를 안내한다. 실제 설치 허용과 메뉴 명칭은 브라우저/OS가 결정한다.
- manifest는 한국어, standalone, start_url=/plan, 안정적인 앱 ID와 scope, 192/512 아이콘·maskable·가상 체험 shortcut을 제공한다. Apple touch icon은 180px다. 기존 발바닥 SVG를 원본으로 `pnpm assets:pwa`에서 PNG를 재생성한다.
- 독립 창에서는 설치 버튼을 숨긴다. 노치/하단 안전 영역과 기존 모바일 입력 화면을 유지한다.
- 연결이 끊겨도 이미 열린 편집 입력을 초기화하거나 강제 이동하지 않는다. 상단 띠가 오프라인 상태와 기존 검사 결과의 한계를 설명한다. API 호출은 한국어 안내와 함께 차단하고, 기기 저장은 계속 가능하다.
- 워커가 준비된 이후 오프라인에서 새로 열거나 새로고침하면 전용 안내 화면을 표시한다. 실제 웹앱 전체를 오프라인으로 실행하는 기능은 아니다. 연결 후 기기에 명시적으로 저장한 입력을 불러와 다시 검사한다.
- 네트워크 연결 이벤트는 인터넷/API 정상 응답을 보장하지 않는다. 온라인으로 표시돼도 요청 실패는 기존 API 오류 흐름으로 처리한다. 다시 연결됐다고 자동으로 유료 API를 재호출하지 않는다.

## 파일·책임

| 경로 | 책임 |
|---|---|
| src/app/manifest.ts | 앱 ID·시작 경로·범위·아이콘 메타데이터 |
| src/app/sw.js/route.ts | 워커 JS·MIME·no-store·허용 scope·CSP 응답 |
| src/infrastructure/pwa/worker-source.ts | public 자산 설치, 네트워크 우선 탐색, 캐시 격리·업데이트 활성화 |
| src/app/offline/route.ts, offline-document.ts | 외부 스크립트·폰트 없이 동작하는 한국어 정적 안내 |
| src/features/pwa | 설치 이벤트, 워커 수명, 브라우저 지원, 업데이트/설치 모달 |
| src/hooks/use-online.ts | SSR 초기값을 유지하는 공통 연결 상태 구독 |
| scripts/generate-pwa-icons.mjs | 기존 SVG에서 일반·maskable·Apple 아이콘 생성 |

도메인·판정·여행 저장 계약에는 워커와 설치 상태가 들어가지 않는다. root PwaProvider는 브라우저 이벤트와 안내를 관리하고, 설치/업데이트 모달은 공통 shadcn/Radix Dialog와 Button을 사용한다. 플랫폼 상태는 useSyncExternalStore의 서버 snapshot으로 초기 hydration을 맞춘다.

오프라인 문서에는 Pretendard의 안내용 글자만 추린 WOFF2를 data URL로 포함한다. 한국어 시스템 글꼴이 없는 환경에서도 외부 요청 없이 표시한다. 생성한 `src/assets/fonts/offline-font.json`과 원본 OFL 라이선스를 저장소에 포함하며 Python은 앱 빌드·운영 의존성이 아니다. 안내 문구를 바꿀 때만 다음 도구로 재생성한다.

```bash
python3 -m venv .cache/pwa-font-tools
.cache/pwa-font-tools/bin/pip install 'fonttools[woff]==4.63.0'
.cache/pwa-font-tools/bin/python scripts/generate-offline-font.py
```

서브셋 생성 방식은 [fontTools 공식 문서](https://fonttools.readthedocs.io/en/latest/subset/index.html)를 따른다. 단위 검사에서 안내의 한글이 서브셋에 포함됐는지, 브라우저 검사에서 오프라인 폰트가 로드되는지 확인한다.

## 캐시와 개인 정보 경계

Cache Storage는 **offline 문서와 PNG 아이콘 4개, 총 5개 URL**만 저장한다. 설치 시 MIME·응답 성공·리디렉션 여부를 검사하고 offline 문서 표식도 확인한다. IDE 인증 프록시가 대신 반환한 로그인 HTML을 저장하지 않는다.

- /api, /_next, /auth, /__ 요청과 GET 이외 메서드는 처리하지 않는다.
- RSC 요청·HTML 여행 화면·규정·추출 결과·판정 결과·토큰·사용자 입력을 저장하지 않는다.
- 앱 scope 밖이나 다른 origin의 요청도 처리하지 않는다.
- 일반 페이지 탐색은 현재 네트워크 응답을 그대로 반환하며 통신 실패 시에만 정적 offline 문서를 사용한다. 서버가 반환한 4xx/5xx를 성공이나 오프라인 판정으로 바꾸지 않는다.
- 워커 캐시 이름은 `pawproof-pwa:<origin+scope>:<release>`다. 활성화 시 같은 앱 scope의 이전 캐시만 삭제한다.
- 기기 입력 저장은 기존 pawproof.trip.v1의 명시적 사용자 동작이다. 워커 캐시와 별개이며 Firebase 동기화도 아니다.

## 업데이트

`pnpm build` 실행기는 매 빌드에 새 release ID를 생성한다. 워커 응답에 ID가 들어가므로 앱 코드만 변경해도 업데이트를 감지할 수 있다. 배포는 기존 계약대로 실행기를 사용하는 `pnpm build`를 사용한다. 개발 워커는 고정 development ID이며 캐시 자산 변경 확인에는 재등록/캐시 제거가 필요할 수 있다.

워커는 설치 후 기다리고, 사용자가 ‘새 버전으로 열기’를 선택했을 때만 SKIP_WAITING을 보낸다. 저장하지 않은 입력이 사라질 수 있음을 모달에 설명한다. 갱신을 요청한 탭만 controllerchange 시 새로고침하며 다른 탭을 강제로 새로고침하지 않는다. 열릴 때 등록하고, 마지막 확인에서 한 시간 이상 경과한 뒤 화면이 다시 활성화되면 업데이트를 확인한다.

Service-Worker-Allowed와 registration scope는 정확한 앱 접두사로 제한한다. 메시지 발신 페이지 역시 해당 scope인지 검사한다. 다른 앱의 워커나 캐시를 삭제하지 않는다.

## 환경·실행

- 운영 빌드: 워커 등록 기본 활성화.
- 일반 개발: 기본 비활성화. 매니페스트와 설치 안내는 확인 가능하다.
- `.env.development.local`의 `PWA_ENABLED=true`로 직접 개발/code-server 프록시에서 워커까지 검증할 수 있다. 설정 후 개발 서버를 재시작한다.
- `PWA_ENABLED=false`: 해당 앱의 정확한 scope/script와 일치하는 기존 워커를 등록 해제하고 자체 캐시만 제거한다. 이미 열린 페이지의 controller는 브라우저 수명에 따라 새로 탐색한 뒤 해제될 수 있다.
- `PWA_ENABLED`는 워커 등록 정책이다. public manifest·아이콘을 숨기거나 브라우저의 모든 설치 기능을 강제로 막는 설정은 아니다.
- 운영의 설정 변경은 다시 빌드/배포해야 한다. NEXT_PUBLIC 값을 별도 수동 설정하지 않는다.
- HTTPS 또는 브라우저가 허용하는 localhost secure context가 필요하다. IDE의 외부 로그인·프레임 제약은 PWA가 우회하지 않는다.

네이티브 브라우저 URL에는 공통 `appPath`를 사용한다. Next Link는 계속 논리 경로를 전달한다. 운영 scope는 `/`, code-server는 `/absproxy/<port>/`이며 manifest·worker·fallback·아이콘을 같은 범위로 검증한다. 개발 IDE URL로 설치한 앱과 최종 공개 도메인의 앱은 별개의 설치다.

Next가 정규화한 개발 홈 주소 `/absproxy/<port>`는 마지막 `/`가 없어 워커 범위 밖이다. 해당 홈은 온라인 페이지로 사용하며 설치 시작 경로 `/absproxy/<port>/plan`에서 워커 제어와 오프라인 동작을 검증한다. 다른 포트의 앱까지 포함하도록 scope를 넓히지 않는다. 운영 도메인의 `/` 홈에는 이 개발 경로 제약이 없다.

## 검증과 남은 실기기 확인

`pnpm verify`는 워커를 켠 직접 개발/실제 로컬 code-server 프록시/운영 빌드에서 데스크톱·모바일 테스트를 실행한다. 테스트가 실제 관광 API를 호출하지 않도록 LIVE_SERVICES_ENABLED=false를 유지한다.

`tests/e2e/pwa.spec.ts`는 매니페스트·아이콘 크기·HTTP 헤더·scope, 설치 안내/취소/요청/standalone UI, 오프라인 입력 보존·API 차단·fallback·캐시 allowlist, 실제 워커 버전 교체와 다른 탭 보존을 검사한다. 설치 이벤트 및 standalone 상태는 시뮬레이션이며 OS의 설치 완료를 검증한 결과가 아니다.

업데이트 검증에는 테스트 전용 루프백 HTTP/WebSocket 프록시를 사용한다. 실제 `/sw.js` 응답의 release만 바꾸며 제품 코드에 버전 주입 테스트 경로를 만들지 않는다. Next 개발 서버의 HMR handshake도 전달해야 hydration과 워커 등록이 진행된다. 캐시·워커 진단은 실패 시 리포트 첨부로 남긴다.

최종 공개 HTTPS URL에서 Android Chrome 설치·아이콘·재실행, iPhone Safari 홈 화면 추가·독립 창·안전 영역, 앱 전환 후 복귀를 실제 기기로 확인해야 한다. 외부 배포·OS 설치 실측은 현재 로컬 브라우저 검증과 구분한다. Web Push·백그라운드 동기화·오프라인 자동 API 재시도는 이번 범위가 아니다.

참고: [Next.js PWA 가이드](https://nextjs.org/docs/app/guides/progressive-web-apps), [MDN 설치 요건](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [MDN 캐시 전략](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching), [skipWaiting](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting). 구현 시 설치된 Next 16.3.4 가이드도 대조했다.


2026-09-12 계정 인증·저장 추가: Firebase Auth의 브라우저 세션과 별개로 워커는 `/api/account`와 Firebase 외부 인증 요청·계정 노트를 캐시하지 않는다. 온라인 Google 팝업 또는 이메일 로그인으로 인증하며 오프라인 계정 작업은 오류로 안내하고 기기 저장을 유지한다. 실제 설치 기기의 OAuth/메일 인증 복원은 프로젝트 연결 후 검증한다. [Firebase 기준](FIREBASE_AUTH_AND_STORAGE.md)
