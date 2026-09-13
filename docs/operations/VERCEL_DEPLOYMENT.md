# PawProof Vercel 첫 배포

2026-09-13 · 현재 코드와 공식 문서 기준의 사용자 실행 안내. 이 문서 작성 중 원격 푸시·Vercel 배포·Firebase 설정·DNS 변경은 수행하지 않았다. 로컬 운영 빌드 통과와 Vercel 실환경 검증을 구분한다.

## 1. GitHub 연결

우선 기본 `*.vercel.app` 주소로 배포한다. 새 도메인 구매는 필요하지 않다.

1. GitHub 공개 Organization 저장소의 main에 최신 코드가 있는지 확인한다. 이 작업 공간에는 origin이 등록되어 있다. 로컬 변경을 반영할 때 사용자 터미널에서 `git push origin main`을 실행한다. 원격 변경으로 거절되면 강제 푸시하지 않고 차이를 확인한다.
2. Vercel에 GitHub 계정으로 로그인하고 Hobby 공간을 선택한다.
3. **Add New → Project → Import Git Repository**에서 PawProof 저장소를 선택한다.
4. 목록에 없으면 GitHub Vercel 앱 설정에서 Organization/해당 저장소 접근을 허용한다. 필요한 경우 Organization 소유자의 승인을 받는다.
5. Production Branch는 main을 사용한다. 연결 후 main 푸시는 운영 배포를 발생시킨다.

현재 공개 저장소와 비공개 Organization 저장소의 Hobby 제한을 구분한다. Hobby는 개인·비상업 용도에 한정된다. [Git 연동](https://vercel.com/docs/git), [Hobby 조건](https://vercel.com/docs/plans/hobby).

## 2. 빌드 설정

2026-09-13 사용자가 첫 배포 주소 `https://pawproof-rose.vercel.app/`와 환경변수 설정 완료를 확인했다. 이후 관련 변경은 검증·커밋 후 에이전트가 `main`에 푸시해 Vercel 자동 배포를 진행하도록 승인했다. 사용자 설명상 푸시 후 약 1분 이내 배포가 시작되며 완료 시점은 운영 응답과 변경 반영으로 별도 확인한다. [작업 로그](../delivery/WORK_LOG.md).

| 항목 | 값 |
|---|---|
| Framework Preset | Next.js |
| Root Directory | 저장소 루트 `./` — package.json 위치 |
| Node.js Version | 24.x |
| Build Command | `pnpm build`로 Override |
| Install Command | 우선 기본값 유지, Override 끔 |
| Output Directory | Next.js 기본값 유지, Override 끔 |
| Production Branch | main |

`pnpm build`는 환경 파싱과 PWA 릴리스 ID 생성을 수행한다. `next build`로 임의 대체하지 않는다. 개발 서버/포트 3000/code-server 프록시/정적 export를 배포 설정에 넣지 않는다.

프로젝트는 pnpm 12.3.4와 Node `>=24.13.0 <25`를 요구한다. **ENABLE_EXPERIMENTAL_COREPACK=1**을 넣어 package.json의 packageManager 버전을 사용하고, 첫 Install 로그에서 pnpm 12.3.4를 확인한다. Vercel의 기본 자동 선택 버전 목록과 프로젝트의 고정 버전은 다르므로 실제 설치는 첫 배포로 검증한다. [Node 버전](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [Corepack](https://vercel.com/docs/builds/configure-a-build#corepack), [패키지 매니저](https://vercel.com/docs/package-managers).

Corepack에서 버전 선택 문제가 나면 Install Command를 아래처럼 명시한다. lockfile을 삭제하거나 버전을 임의로 낮추지 않는다.

```bash
npx --yes pnpm@12.3.4 install --frozen-lockfile
```

### 설치 중 ERR_PNPM_IGNORED_BUILDS가 발생하면

pnpm 12는 빌드 스크립트의 실행/생략 여부가 정해지지 않은 의존성을 만나면 설치를 중단한다. `re2@1.26.1`은 `firebase-tools → superstatic`의 선택적 네이티브 의존성이며 PawProof 런타임에서 사용하지 않는다. superstatic은 로딩 실패 시 JavaScript RegExp로 대체하고 현재 Firebase 검사는 Auth·Firestore 에뮬레이터만 사용한다. 따라서 `pnpm-workspace.yaml`의 `allowBuilds`에 `re2: false`를 명시하여 빌드를 생략한다. RE2 전용 정규식이 필요한 Firebase Hosting 설정을 추가할 때는 이 결정을 재검토한다. [pnpm 빌드 정책](https://pnpm.io/settings/build#allowbuilds).

수정된 커밋을 GitHub main에 반영한 뒤 **그 커밋**으로 배포한다. 같은 실패 커밋을 Redeploy하면 저장소 수정이 적용되지 않는다. 환경변수나 Install Command를 바꾸거나 전체 빌드 스크립트를 허용할 필요는 없다.

## 3. Production 환경변수

Import 화면의 Environment Variables 또는 **Project → Settings → Environment Variables**에 입력한다. 첫 운영 연결은 Production에 적용한다. Preview는 필요할 때 별도 구성한다. Corepack 플래그는 Preview 빌드를 사용할 때 해당 환경에도 필요하다.

`.env.local`은 GitHub에 올라가지 않으므로 자동 복사되지 않는다. 아래 기존 값은 사용자가 로컬 파일에서 직접 옮긴다. 실제 키를 문서·커밋·채팅에 넣지 않는다.

루트 [.env.example](../../.env.example)은 Production 기본값을 채운 템플릿이다. `[직접 입력]` 10개만 본인 값으로 채운다. APP_BASE_PATH와 선택 항목 APP_ORIGIN의 빈칸은 누락이 아니다. 실제 값은 Vercel 입력란 또는 비추적 `.env.vercel.local` 사본에 입력한다. 공개 템플릿과 기존 `.env.local`을 덮어쓰지 않는다. `.env.vercel.local`은 가져오기용 사본이며 Next.js가 자동으로 읽는 파일은 아니다.

| 변수 | 입력 값 |
|---|---|
| ENABLE_EXPERIMENTAL_COREPACK | `1` |
| APP_ENV | `production` |
| APP_BASE_PATH | 등록하지 않거나 빈 값. `/absproxy/3000` 금지 |
| APP_ORIGIN | 첫 배포는 생략 가능. 주소 확정 후 `https://운영-호스트` 설정 가능. 경로 제외 |
| PWA_ENABLED | `true` |
| LIVE_SERVICES_ENABLED | `true` |
| KTO_SERVICE_KEY | 기존 로컬 값 |
| OPENROUTER_API_KEY | 기존 로컬 값 |
| OPENROUTER_MODEL | 현재 검증한 로컬 모델 ID |
| KAKAO_MOBILITY_REST_KEY | 기존 로컬 값 |
| FIREBASE_PROJECT_ID | 기존 로컬 값 |
| FIREBASE_CLIENT_EMAIL | 기존 서비스 계정 이메일 |
| FIREBASE_PRIVATE_KEY | 기존 서비스 계정 PEM 개인 키 |
| NEXT_PUBLIC_FIREBASE_API_KEY | 기존 Firebase Web 앱 값 |
| NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN | 기존 Firebase 인증 도메인 유지 |
| NEXT_PUBLIC_FIREBASE_PROJECT_ID | 기존 Firebase Web 앱 값 |
| NEXT_PUBLIC_FIREBASE_APP_ID | 기존 Firebase Web 앱 값 |

두 Firebase PROJECT_ID는 같아야 한다. AUTH_DOMAIN은 기존 `<프로젝트>.firebaseapp.com` 등 설정값을 유지하며 Vercel 주소로 바꾸지 않는다. 앱 접속 도메인 허용은 다음 단계에서 처리한다.

개별 Value 입력란에는 바깥쪽 따옴표를 제외한 값만 넣는다. PRIVATE_KEY는 BEGIN/END 줄을 포함한 실제 여러 줄 PEM 또는 문자 `\n`으로 줄바꿈을 표현한 문자열을 지원한다. JSON 전체나 `private_key:` 필드명은 넣지 않는다. Secret 선택이 제공되면 서버 키와 개인 키에 사용한다.

배포에 넣지 않는 개발 설정: PORT, DEV_ALLOWED_HOSTS, VSCODE_PROXY_URI, NEXT_PUBLIC_APP_BASE_PATH, NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL, FIREBASE_AUTH_EMULATOR_HOST, FIRESTORE_EMULATOR_HOST. NODE_ENV와 PWA 릴리스 ID도 수동 설정하지 않는다.

환경변수 변경은 기존 배포에 소급되지 않으므로 Redeploy한다. NEXT_PUBLIC_*는 빌드 결과에 포함된다. [Vercel 환경변수](https://vercel.com/docs/environment-variables).

## 4. 함수와 Deploy

**Settings → Functions**에서 Fluid Compute가 켜져 있는지 확인한다. 현재 검사 라우트는 최대 180초, 대체 탐색은 최대 300초를 선언한다. Hobby의 Fluid Compute 최대 실행시간은 300초다. 비-Fluid의 짧은 제한과 혼동하지 않는다. [함수 실행시간](https://vercel.com/docs/functions/configuring-functions/duration).

함수 지역은 Firebase DB와의 거리를 고려한다. DB가 서울이면 Seoul/icn1을 우선 검토한다. Hobby는 단일 지역을 사용한다. [함수 지역](https://vercel.com/docs/functions/configuring-functions/region).

Deploy를 눌러 Ready가 되면 프로젝트의 **고정 Production 주소**를 확인한다. 매 커밋의 임시 배포 주소와 구분한다. 빌드 성공은 외부 API 연결 성공을 뜻하지 않는다. OpenRouter 크레딧과 키별 사용 한도도 확인한다.

## 5. Firebase 승인 도메인

1. Firebase Console → Authentication → Settings → **Authorized domains/승인된 도메인**을 연다.
2. 고정 운영 호스트(예: `pawproof-example.vercel.app`)를 추가한다. https://·포트·경로·마지막 슬래시는 넣지 않는다.
3. Google·이메일/비밀번호 제공자 활성화와 기존 10자 비밀번호 정책을 확인한다.
4. Firestore Rules는 저장소의 firestore.rules를 사용한다. 서버 Admin 접근과 브라우저 직접 접근 거부 구조를 유지하며 공개 테스트 모드로 바꾸지 않는다.
5. Vercel Deploy는 Firestore Rules/인덱스를 자동 배포하지 않는다. firestore.indexes.json의 입력·장소·요약 인덱스 제외는 별도 운영 설정이다. [Firebase 기준](../engineering/FIREBASE_AUTH_AND_STORAGE.md)을 따른다.

앱 접속 도메인 추가와 커스텀 Firebase 인증 도메인 구성은 다르다. 현재는 기존 Firebase 인증 도메인을 유지한다. [Firebase Google 로그인](https://firebase.google.com/docs/auth/web/google-signin).

## 6. 선택: 기존 도메인 연결

사용자가 원하면 `pawproof.hothyun.com` 같은 서브도메인을 사용한다. IDE 호스트와 구분한다.

1. Vercel Project → Settings → Domains에서 서브도메인을 추가한다.
2. Cloudflare DNS에 Vercel 화면의 **정확한 DNS 레코드**를 추가한다. CNAME 대상을 추측하거나 과거 예시를 복사하지 않는다.
3. 초기에는 **DNS only(회색 구름)**로 둔다. 전체 도메인의 네임서버를 옮길 필요는 없다.
4. Vercel 도메인·인증서 상태를 확인한다.
5. Firebase 승인된 도메인에도 새 호스트를 추가한다. APP_ORIGIN을 사용한다면 변경 후 Redeploy한다.

[도메인 연결](https://vercel.com/docs/domains/working-with-domains/add-a-domain), [Vercel 앞단 프록시 안내](https://vercel.com/docs/security/reverse-proxy).

## 7. 배포 후 점검

- 시크릿 창에서 Production URL이 Vercel 계정 로그인 없이 열린다. 심사용 주소의 Deployment Protection과 Preview 보호를 구분한다. [배포 보호](https://vercel.com/docs/deployment-protection).
- `/api/health`가 200과 status=ok를 반환한다. 이것은 생존 확인이며 외부 API 검사는 아니다.
- `/plan`, `/profile` 직접 접속·새로고침과 CSS/JS/폰트/사진이 정상이다. `/absproxy` 요청이 없어야 한다.
- Google·이메일 로그인 → /plan·토스트 → 오른쪽 아바타 → /profile을 확인한다.
- 반려견 등록 → 여행에 적용 → 자동 저장 → 새 노트 → 불러오기 → 새로고침으로 장소·검사 요약을 확인한다. 이메일 계정의 노트 저장은 인증 후 가능하다.
- 실제 인천 검색 → 3~5곳 검사 → 대체 후보 검토를 수행한다. 실패하면 Runtime Logs에서 상태를 확인하되 키 포함 요청 URL을 공유하지 않는다.
- 휴대폰 PWA 설치·로그인 복원·오프라인 안내를 확인한다. 개발 주소의 설치 앱과 운영 주소의 설치 앱은 별개다.

## 문제별 확인

### 계정 API가 빈 본문과 HTTP 500을 반환하면

2026-09-13 운영에서 프로필 조회와 노트 저장이 인증 검사 전에 실패했다. Firebase Admin 14.4.0 → jwks-rsa 4.1.0이 ESM 전용 jose 6을 `require()`하는 경로가 있으며, [Vercel은 require(ESM)을 기본 비활성화](https://vercel.com/docs/functions/runtimes/node-js/advanced-node-configuration#experimental-nodejs-require-of-es-module)한다. Node 24 로컬 기본 설정의 성공만으로 운영 호환성을 판단하지 않는다.

`patches/jwks-rsa@4.1.0.patch`는 두 진입점의 jose 로딩을 기존 비동기 처리 안의 `import()`로 바꾼다. pnpm-workspace.yaml의 patchedDependencies와 lockfile을 함께 유지한다. SDK/암호화 라이브러리 버전과 인증 검증은 유지하며 별도 NODE_OPTIONS 변경은 필요하지 않다. 상위 패키지가 이 문제를 해결하면 패치를 제거하고 제한 조건의 회귀 검사를 다시 실행한다.

배포 후 `/api/health`뿐 아니라 인증 정보 없는 `/api/account/profile`·`/api/account/trips`가 401 JSON을 반환하는지 확인한다. 이는 계정 함수 로딩 검사이며 실제 계정 저장 성공을 의미하지 않는다. 빈 500은 Runtime Logs의 모듈 로딩 스택을 확인하고, JSON 503은 Admin 설정·Firestore 연결을 구분해서 확인한다.

| 현상 | 확인할 것 |
|---|---|
| pnpm/lockfile 오류 | Corepack 플래그·실제 pnpm 12.3.4·버전 고정 Install Command |
| Node 엔진 오류 | Node 24.x와 프로젝트 최소 버전 |
| CSS 404·/absproxy 경로 | APP_ENV=production, APP_BASE_PATH 비움 후 재빌드 |
| 로그인 연결 준비 중 | Firebase Web 값 4개의 Production 적용·재배포 |
| auth/unauthorized-domain | 실제 호스트의 Firebase 승인 도메인 등록 |
| Admin/PEM 오류 | 키 바깥 따옴표·줄바꿈·프로젝트 ID·서비스 계정 권한 |
| 실제 검사 503 | LIVE_SERVICES_ENABLED·공급자 키·모델·Runtime Logs |
| 긴 요청 504 | Fluid Compute·실행시간·공급자 응답 시간 |
| 이전 화면 표시 | GitHub main과 배포 커밋 일치·고정 Production 주소 사용 |
| Vercel 로그인 요구 | 해당 URL/환경의 Deployment Protection |

실제 URL을 확보한 뒤 운영 환경의 인증·관광 API·저장 흐름을 검증한다. [호스팅·비용 기준](HOSTING_AND_COST.md)도 함께 참고한다.
