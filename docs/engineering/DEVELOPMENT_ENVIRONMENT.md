# 개발 환경과 경로 처리

기준일: 2026-09-11\
상태: Next.js 설정·환경 파싱·URL 유틸·pnpm 실행기를 구현했다. 아래 계약과 실제 파일을 함께 관리한다. 외부 Vercel 배포는 아직 수행하지 않았다.

## 구현 파일

| 파일 | 책임 |
|---|---|
| [app-config.ts](../../src/config/app-config.ts) | 환경 프로필·포트·basePath·origin·개발 허용 호스트 검증 |
| [next.config.ts](../../next.config.ts) | 검증된 설정을 Next에 적용하고 공개 basePath 하나만 주입 |
| [app-urls.ts](../../src/lib/urls/app-urls.ts) | API·public 자산·절대 내부 URL의 순수 생성 함수 |
| [public.ts](../../src/config/public.ts) | 브라우저에서 사용할 빌드 시점 경로 함수 |
| [server.ts](../../src/config/server.ts) | OpenRouter·KTO 서버 전용 설정의 지연 검증 |
| [next.ts](../../scripts/next.ts) | 환경 파일을 먼저 로드한 뒤 Next CLI 실행·종료 신호 전달 |
| [build-profile.ts](../../scripts/build-profile.ts) | 빌드와 실행의 경로 프로필 일치 확인 |

OpenRouter·KTO 설정 함수는 연결 시에만 키·모델을 요구한다. 현재는 API를 호출하지 않으며 키가 없어도 앱 빌드가 가능하다. Firebase SDK 연결은 사용자 준비 이후의 후속 범위다.

## 해결할 문제

사용자는 OCI의 Coolify에서 호스팅한 code-server 터미널로 개발한다. 브라우저의 개발 URL에 붙는 프록시 경로와 Next.js가 생성하는 HTML·CSS·JS·API URL이 일치해야 한다. 배포 서비스는 도메인 루트에서 실행한다.

현재 IDE 환경변수에서 `ide.hothyun.com`과 `/proxy/{{port}}/` 포트 링크를 확인했다. 설치된 code-server는 4.127.0이다. 실제 외부 Coolify·TLS·로그인 세션 경유 동작은 별도 확인 사항이다. 재현 가능한 로컬·프록시 검증 범위는 [구현 기록](../delivery/IMPLEMENTATION_STATUS.md)에 남긴다.

## `/proxy`와 `/absproxy`

code-server는 `/proxy/<port>` 접두사를 업스트림 요청에서 제거하고, `/absproxy/<port>`는 유지한다. 따라서 `/proxy/3000`으로 접속하면서 Next.js에 같은 `basePath`를 설정하는 것만으로는 양쪽 경로가 일치하지 않는다. [code-server 프록시 안내](https://coder.com/docs/code-server/guide)

| 모드 | 브라우저 주소 예시 | Next.js가 받는 경로 | 앱 basePath |
|---|---|---|---|
| 직접 로컬 | `http://localhost:3000/trips` | `/trips` | 빈 문자열 |
| **code-server 권고** | `https://IDE_HOST/absproxy/3000/trips` | `/absproxy/3000/trips` | `/absproxy/3000` |
| 배포 | `https://SERVICE_HOST/trips` | `/trips` | 빈 문자열 |

`IDE_HOST`, `SERVICE_HOST`는 자리표시자다. code-server 자체가 상위 경로 아래 있다면 공식 `abs-proxy-base-path` 설정과 앱 경로를 함께 확인한다. 외부에 보이는 경로를 추측하여 하드코딩하지 않는다.

기본안은 기존 code-server의 `/absproxy`를 활용한다. 이것이 실제 설치 환경에서 불가능하면 Coolify의 별도 개발 호스트에서 루트 경로로 접속하는 대안을 검토한다. 새 도메인 구매가 선행 조건은 아니다.

## 환경변수 계약

| 변수 | 역할 | 예시·규칙 |
|---|---|---|
| `APP_ENV` | 앱 실행 프로필 | `local`, `code-server`, `preview`, `production` |
| `APP_BASE_PATH` | 브라우저와 서버가 공유하는 경로 접두사 | 기본 `""`, code-server에서는 `/absproxy/3000` |
| `APP_ORIGIN` | 명시적으로 절대 URL을 만들 때 사용할 외부 origin | 스킴과 호스트, 필요 시 포트. 경로·쿼리 없음 |
| `DEV_ALLOWED_HOSTS` | 개발 서버를 여는 허용 호스트 | 호스트명 목록. 스킴·경로·포트 없이 지정 |
| `PORT` | 개발 실행기가 전달할 포트 | 기본 `3000`; 경로의 포트와 일치 확인 |
| `NEXT_PUBLIC_APP_BASE_PATH` | 브라우저에 노출할 계산된 값 | `APP_BASE_PATH`에서 설정 단계에 생성. 수동 중복 관리 금지 |

`NODE_ENV`는 Next.js의 표준 `development`/`production`/`test` 의미를 유지한다. `NODE_ENV=code-server`처럼 사용자 정의 값으로 바꾸지 않는다. 앱 프로필과 프레임워크 빌드 모드는 별개다.

개발용 설정 예시이며 실제 호스트로 교체해야 한다.

```dotenv
APP_ENV=code-server
APP_BASE_PATH=/absproxy/3000
APP_ORIGIN=https://ide.example.com
DEV_ALLOWED_HOSTS=ide.example.com
PORT=3000
```

배포 빌드에서는 `APP_ENV=production`, `APP_BASE_PATH=`를 사용한다. 프리뷰도 루트 경로를 사용한다. 자동 생성되는 프리뷰 origin은 신뢰하는 플랫폼 설정에서 구하고, 사용자 요청의 임의 `Host` 헤더로 공유 URL을 만들지 않는다.

`.env.example`에는 빈 값만, 개발 비밀은 Git에서 제외한 `.env.local`에 둔다. 프록시 프로필은 `.env.code-server.example`을 참고하여 **`.env.development.local`**에 둔다. 공통 `.env.local`의 프록시 값이 배포 빌드까지 적용되는 것을 피한다. 배포 비밀은 호스팅 플랫폼 환경 설정에 둔다. KTO·LLM 키·Firebase 관리 자격증명에는 `NEXT_PUBLIC_` 접두사를 붙이지 않는다.

`APP_ENV`가 비어 있으면 개발은 `local`, 빌드·실행은 `production`으로 추론하고 Vercel의 `preview`·`production` 값도 지원한다. code-server의 origin은 명시한 `APP_ORIGIN`을 우선하고, 없으면 환경의 `VSCODE_PROXY_URI`에서 가져온다. 프리뷰의 origin은 `VERCEL_URL`을 사용할 수 있다. 운영 origin이 아직 정해지지 않아도 초기 빌드는 가능하며 절대 URL을 생성할 때 검증된 origin을 전달해야 한다.

## 설정을 한 곳에서 해석

`config` 모듈의 `resolveAppConfig`가 환경변수를 검증하고 공개 설정만 분리한다. `next.config.ts`는 이 결과로 `basePath`와 개발용 `allowedDevOrigins`를 설정한다. 브라우저용 경로 값은 명시적으로 하나만 주입하며 서버 환경 전체를 노출하지 않는다.

Next.js의 `basePath`와 `NEXT_PUBLIC_*` 값은 빌드에 반영된다. **같은 빌드 결과물에 런타임 환경변수만 바꿔 프록시용과 루트용을 전환할 수 없다.** 프로필이 바뀌면 개발 서버를 재시작하고, 배포는 해당 프로필로 새로 빌드한다. [basePath](https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath), [환경변수](https://nextjs.org/docs/app/guides/environment-variables)

`assetPrefix`는 CDN용 정적 자산 설정이며 전체 라우팅·public 파일·API 문제를 해결하지 않는다. 이 설계에서는 기본적으로 설정하지 않는다. [assetPrefix](https://nextjs.org/docs/app/api-reference/config/next-config-js/assetPrefix)

`allowedDevOrigins`에는 실제 IDE 호스트를 넣는다. 개발 출처 허용을 전체 공개 CORS나 인증 해제로 대체하지 않는다. [allowedDevOrigins](https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins)

개발 프로필을 연속 전환한 브라우저 검사에서 HMR 연결은 유지되지만 변경된 제목이 반영되지 않는 사례가 발생했다. Next 16.3.4의 개발 파일시스템 컴파일 캐시는 비활성화해 프로세스 사이 상태를 재사용하지 않는다. 운영 빌드 캐시는 기본값을 유지한다. 실제 근본 원인은 Next 내부까지 확정하지 않았으며, 이 설정을 적용한 반복 검증 결과를 구현 기록에 남긴다.

설정 오류는 조용히 보정하기보다 시작·빌드 단계에서 설명과 함께 실패시킨다.

- basePath는 빈 문자열 또는 `/`로 시작하는 경로다. 루트 `/`는 빈 값으로 정규화하고 마지막 `/`는 제거한다.
- 스킴, 쿼리, 해시, `//`, 역슬래시, `..` 경로 이동이나 인코딩된 우회 경로는 허용하지 않는다.
- `production`과 `preview`에서는 프록시 basePath를 허용하지 않는다.
- code-server 프로필의 포트와 경로가 다르면 실행 전에 알린다.
- 공개 경로 변수에 서로 다른 값이 중복 지정되면 실패시킨다.

## URL 유틸의 책임

모든 URL에 접두사를 붙이는 범용 함수를 만들지 않는다. 자동 처리하는 Next.js 기능과 직접 URL을 만드는 지점을 구분한다.

| 호출 지점 | 사용 규칙 | code-server 결과 예시 |
|---|---|---|
| `next/link`, Next router | 논리 경로 `/trips` 그대로 전달. 수동 접두사 추가 금지 | Next가 basePath 처리 |
| 브라우저 `fetch` | `apiPath('/api/verify')` | `/absproxy/3000/api/verify` |
| public 폴더 이미지·다운로드 | `publicAssetPath('/images/logo.svg')` | `/absproxy/3000/images/logo.svg` |
| 직접 만드는 절대 내부 링크 | `absoluteAppUrl('/trips', trustedOrigin)` | origin + basePath + `/trips` |
| 외부 지도·출처·전화 URL | 내부 경로 유틸에 넣지 않음 | 원래 URL 사용 |
| CSS·JS 모듈의 import 자산 | 번들러가 처리. CSS에 프록시 경로 하드코딩 금지 | 빌드 결과 검증 |

`apiPath` 등은 **접두사가 없는 내부 논리 경로만 받는 계약**으로 만든다. 이미 basePath가 붙은 경로는 중복 접두사 오류로 거부한다. 쿼리와 해시는 유지하고, 외부 URL과 `//host`는 거부한다. API 경로와 자산 경로도 각 용도에 맞게 검사한다.

Next Image의 public 파일 경로에는 필요한 basePath를 명시한다. 원격 이미지에는 이를 붙이지 않는다. Route Handler에서 직접 만드는 `Location` 헤더, 쿠키의 `Path`, OG 이미지·manifest URL도 검증 목록에 포함한다. 기능마다 프레임워크의 자동 처리를 확인하고 한 번만 접두사를 적용한다.

`utils.ts` 하나에 환경변수·서버 비밀·브라우저 URL 처리를 섞지 않는다. 경로의 순수 함수, 환경 파싱, 서버 전용 설정을 나누고 클라이언트는 공개 설정만 import한다.

## pnpm 실행 계약

아래 명령을 구현했다. Node.js 24.x의 TypeScript 실행 기능을 사용하므로 실행기용 별도 번들러를 추가하지 않았다.

| 명령 | 역할 |
|---|---|
| `pnpm dev` | 선택한 개발 프로필을 읽고 Next 개발 서버 실행 |
| `pnpm dev:direct` | 로컬 루트 경로로 실행 |
| `pnpm dev:code-server` | code-server 프로필·포트를 검증한 뒤 실행 |
| `pnpm build` | 선택된 배포 프로필의 검증 후 빌드 |
| `pnpm start` | 해당 프로필로 이미 빌드한 Node 서버 실행 |
| `pnpm typecheck` | 현재 라우트 타입 생성 후 TypeScript 검사 |
| `pnpm test` | 환경·URL·빌드 프로필의 순수 함수 테스트 |
| `pnpm test:e2e` | 직접 개발·프록시 개발·운영 빌드 브라우저 검사 |

실행기는 환경 파일을 먼저 읽고 포트를 CLI 인자로 전달한다. Next.js가 `.env`를 읽는 시점만 믿고 서버 시작 포트를 변경하지 않는다. 컨테이너 내 프록시 접근을 위해 필요하면 `0.0.0.0`에 바인딩하되 실제 외부 노출은 Coolify·code-server 라우팅에서 관리한다.

빌드 성공 시 `.next/pawproof-build.json`에 `appEnv`와 `basePath`를 기록하고 `pnpm start`가 일치 여부를 검증한다. 다른 프로필의 빌드로 실행하려면 다시 빌드해야 한다. Next의 개발 서버는 네이티브 잠금과 별도 개발 출력 경로를 사용하므로 두 개발 프로필을 동시에 실행하지 않는다.

도메인·포트·TLS·WebSocket 전달은 인프라의 책임이고, URL 접두사 생성은 앱 설정의 책임이다. 앱 유틸로 프록시의 WebSocket 설정 오류를 해결하려 하지 않는다.

개발 전용 `/dev/check`에서 public 이미지와 클라이언트 API 호출을 점검할 수 있다. 프로덕션에서는 404를 반환하며, `/api/health`는 앱 자체 응답만 확인하고 외부 연결 성공을 주장하지 않는다.

## 개발 서버 유지와 접속 장애 점검

현재 저장소에는 `pnpm preview:start`, `pnpm preview:stop`이 있다. Linux에서 PID의 명령·작업 경로를 확인한 뒤 해당 실행기만 관리하고, 표준 출력을 `.cache/dev-server.log`에 분리한다. `pnpm verify`는 관리 미리보기를 잠시 중지하고 검사 종료 시 복원한다. 수동 실행 방법은 아래와 같다.

일반 작업은 code-server의 열린 터미널에서 `pnpm dev`로 실행한다. Codex 도구의 출력 파이프에 연결한 서버를 작업 종료 후 계속 사용하면 파이프가 닫혀 `write EPIPE`가 발생할 수 있다. 이 환경에서 장시간 미리보기를 유지할 때는 별도 프로세스 세션과 파일 로그를 사용한다.

기존 개발 서버를 종료한 뒤 저장소 루트에서 실행한다. `.cache/`는 Git 제외 대상이다.

```bash
mkdir -p .cache
setsid nohup node scripts/next.ts dev code-server > .cache/dev-server.log 2>&1 < /dev/null &
printf '%s\n' "$!" > .cache/dev-server.pid
curl --retry 10 --retry-connrefused --retry-delay 1 --max-time 15 \
  http://localhost:3000/absproxy/3000/api/health
```

기본 포트 3000 예시다. `node scripts/next.ts dev code-server`는 `pnpm dev:code-server`와 같은 실행기를 직접 호출한다. 종료할 때는 PID 파일의 프로세스가 현재 저장소의 실행기인지 확인하고 해당 PID에 `SIGTERM`을 보낸다. 오래된 PID를 확인 없이 종료하지 않는다. 컨테이너 재시작이나 앱 오류 후 자동 복구를 제공하는 배포 방식은 아니다.

의존성 설치·갱신과 개발 모드 E2E 실행 전에는 기존 개발 서버를 중지하고, 완료 후 다시 시작한다. 개발 중 `node_modules`가 재구성되면 Turbopack이 Next 패키지를 찾지 못할 수 있다.

접속 문제는 다음 순서로 구분한다.

1. 로컬 `/absproxy/3000/api/health`가 응답하지 않으면 `.cache/dev-server.log`와 `.next/dev/logs/next-development.log`를 확인한다. 포트가 열려 있어도 앱이 정상이라는 의미는 아니다.
2. 로컬 응답은 정상인데 외부가 로그인 화면이면 Cloudflare Access와 code-server 인증 세션을 확인한다. 앱 설정으로 인증을 해제하지 않는다.
3. 로그인한 브라우저에서 `https://ide.hothyun.com/absproxy/3000/`로 접속한다. IDE가 자동 제시하는 `/proxy/3000`과 구분한다.
4. 화면은 열리는데 개발 자산·HMR이 차단되면 요청 호스트와 `DEV_ALLOWED_HOSTS`를 확인한다. 로컬 브라우저 점검은 기본 허용된 `localhost`를 사용한다. `127.0.0.1`은 별도 허용 없이 동일하게 취급되지 않는다.

## 필수 검증

세 환경을 각각 검사한다: 직접 로컬 루트, code-server `/absproxy/3000`, 실제 배포 루트.

1. 최초 페이지의 HTML·CSS·JS 응답이 정상이고 MIME 타입이 맞는지.
2. 내부 이동, 깊은 경로 직접 접속, 새로고침이 동작하는지.
3. public 이미지, 지도, API, RSC 요청과 동적 청크가 올바른 경로인지.
4. hydration 오류·404·리디렉션 반복이 없는지.
5. code-server 개발 화면에서 WebSocket 연결과 코드 수정 후 HMR이 동작하는지.
6. 루트 배포의 앱 생성 URL에 개발 프록시 접두사가 남지 않는지.
7. 빈 값·후행 슬래시·잘못된 origin·중복 접두사·외부 URL 입력을 유틸이 의도대로 처리하는지.

Cloudflare로 전환하면 일반 `next dev`와 별도로 OpenNext의 `workerd` 프리뷰·실제 배포를 검증한다. 프리뷰 포트가 8787이면 `/absproxy/8787`용 빌드가 필요하고, 루트 배포 빌드 검증에는 루트로 접근 가능한 별도 호스트나 포트 전달을 사용한다. 프록시 빌드를 운영에 재사용하지 않는다. [OpenNext 실행 환경](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/)

## PWA 개발 검사

워커는 개발 중 기본 비활성화하고, 필요할 때 PWA_ENABLED=true로 재시작한다. code-server의 정확한 앱 scope만 사용하며 다른 워커/캐시를 변경하지 않는다. 네이티브 URL은 appPath, Next Link는 논리 경로를 사용한다. 운영 빌드는 실행기가 새 PWA release를 생성한다. [PWA 환경·수명 계약](PWA.md)을 따른다.
