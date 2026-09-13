# Firebase 인증과 계정 여행 노트

기준일: 2026-09-13. 코드 구현과 에뮬레이터 검증, 실제 Firebase 프로젝트 연결을 구분한다. 실제 설정값은 저장소에 기록하지 않는다.

## 구조와 저장 범위

서버 SDK의 `jwks-rsa@4.1.0`에는 jose를 비동기 import하는 버전 한정 pnpm 패치를 적용한다. Vercel의 require(ESM) 기본 비활성화 조건에서 계정 라우트가 로딩되도록 하며, 토큰 검증·서명 키 처리·SDK 버전은 유지한다. [운영 장애와 패치 유지 기준](../operations/VERCEL_DEPLOYMENT.md#계정-api가-빈-본문과-http-500을-반환하면), [반복 검사](TESTING.md#firebase-서버-모듈-호환성-2026-09-13)를 따른다.

- Google 로그인은 `useGoogleSignIn`이 담당한다. SDK는 AuthProvider 초기화 때 로드하고 클릭 시 다시 import하지 않는다. 클릭 안에서 flushSync로 앱 로그인 모달을 완전히 제거한 뒤 팝업을 열어 Radix 포커스 잠금·스크롤 잠금·종료 시 포커스 복귀가 외부 인증 입력에 간섭하지 않게 한다. 취소·차단·실패하면 모달과 안내를 복원하고 성공하면 기존 `/plan` 이동·토스트를 유지한다.
- iOS standalone에서 SDK가 창 참조를 받지 못해 취소를 감지하지 못할 수 있으므로 잠금 없는 진행 안내에 ‘로그인 화면으로 돌아가기’를 제공한다. 이 버튼은 앱 대기를 종료하며 Google의 인증 요청을 취소하는 기능은 아니다. 요청별 식별자로 이전 요청의 취소/완료가 재시도 상태를 덮어쓰지 않게 한다.
- iPhone Safari 설치 PWA의 Google 화면 키보드 미표시 제보에 대한 앱 측 포커스 간섭 완화다. Google 도메인의 입력과 OS 키보드는 앱에서 직접 제어할 수 없다. 자동 검사는 로컬 Auth 에뮬레이터 팝업의 입력·취소·차단·복귀를 확인하며 실제 iPhone에서 해결됐는지는 별도 확인한다. 리디렉션은 동일 출처 인증 헬퍼 등 [Firebase 선행 조건](https://firebase.google.com/docs/auth/web/redirect-best-practices)이 필요하므로 임의 전환하지 않는다.
- 공통 AuthProvider는 Firebase 상태를 복원한다. Google·이메일 가입/로그인 성공 시 모달을 닫고 `/plan`으로 이동하며 전역 Sonner로 성공을 알린다. 기존 여행 편집 중 로그인은 그 입력을 유지한다. 비밀번호는 10자 이상이다.
- `/profile`에서 계정 상태·이메일 인증·로그아웃과 반려견 최대 5마리의 등록/수정/삭제를 제공한다. 서버 인증은 필수이며 반려견 프로필은 이메일 미인증 사용자도 관리할 수 있다. 여행 자동 저장은 이메일 인증 후 시작한다.
- 반려견 등록 정보는 여행에서 여러 마리를 선택해 입력할 수 있다. 프로필 수정은 이미 작성한 여행의 입력을 바꾸지 않는다.
- Firestore는 Admin SDK를 통해서만 접근한다. ID 토큰의 UID로 경로를 결정하며 직접 클라이언트 접근은 Rules로 거부한다. 수정은 revision 비교로 충돌을 차단한다.

```text
accounts/{verifiedUid}                  -> tripCount
accounts/{verifiedUid}/trips/{uuid}     -> title, trip, places, verification, revision, timestamps
accounts/{uid}/profile/main             -> pets (stable IDs), revision
```

계정 노트는 최대 20개다. 작성 중인 0~5개 방문지·미완성 반려견 입력도 초안으로 저장하지만 코스 검증 API의 엄격한 3~5곳 요건은 유지한다. 900ms 입력 대기 후 직렬로 저장하고 저장 중 새 입력은 다음 요청에 반영한다. 미전송 초안은 계정별 sessionStorage에 두며 성공한 최신 내용만 지운다. 실패·revision 충돌은 자동 반복하지 않고 화면에 남긴다. 새로고침·탭 닫기 때 미저장 입력이 있으면 브라우저 이탈 경고를 요청한다. 브라우저 기본 문구와 모바일 호출 제한을 따르며 저장 성공 후에는 경고하지 않는다. 로그아웃 후 다른 계정에는 이전 계정의 초안을 불러오지 않는다.

저장 범위는 사용자 입력, 선택한 장소의 표시 정보(이름·주소·유형·좌표·ID), 검사 당시 입력과 앱의 계산 결과(상태·이유·준비사항·시간·검사 시각)다. 공급자 규정 원문·인용문·추출 규칙·사진은 저장하지 않는다. 이는 사용자가 요청한 개인 노트 복원을 위한 기록이며 장소 규정 DB 적재/재사용 용도가 아니다. 저장된 결과는 과거 요약으로 표시하고 최신 원문은 명시적인 재검사로 조회한다.

계정 노트 URL에는 해당 노트 ID를 기록해 새로고침 후 복원한다. ID 자체가 접근 권한은 아니며 다른 계정이면 조회되지 않는다. 이전 버전의 ID만 있는 노트는 현재 장소 표시 정보를 재조회하고, 과거에 저장하지 않은 검사 결과는 만들어내지 않는다. 비회원 기기 저장은 제거했으며 이전 기기 기록은 읽거나 계정에 이전하지 않는다. 현재 화면에서 로그인한 사용자의 편집 입력은 유지하여 자동 저장한다. 로그아웃·다른 계정 전환 시 이전 스토어와 노트 URL 선택을 비운다. 계정 API는 no-store이며 PWA Service Worker는 계정 요청과 토큰을 캐시하지 않는다.

## Firebase Console 설정 순서

1. Firebase Console에서 프로젝트를 생성하거나 기존 프로젝트를 선택한다. 무료 운영을 위해 Spark를 유지하고 Analytics·Storage·Functions·App Hosting은 이 기능에 필요하지 않다.
2. 프로젝트 설정 → 일반 → 내 앱 → 웹 앱을 등록한다. SDK 설정의 apiKey/authDomain/projectId/appId를 아래 공개 환경변수에 각각 넣는다.
3. Authentication → 시작하기 → 로그인 방법에서 **Google**과 **이메일/비밀번호**를 사용 설정한다. Google의 지원 이메일도 설정한다. 이메일 링크 로그인은 이번 구현에 필요하지 않다.
4. Authentication → 설정 → 승인된 도메인에 실제 접속 호스트를 추가한다. 개발 서버는 `ide.hothyun.com`, 로컬 테스트는 필요에 따라 `localhost`와 `127.0.0.1`, 배포 후에는 실제 서비스 도메인을 추가한다. 도메인에는 프로토콜·포트·`/absproxy/3000` 경로를 넣지 않는다.
5. Authentication의 비밀번호 정책은 사용자가 설정한 최소 10자 이상을 기준으로 하며 가입 화면의 입력 제한·안내도 일치시킨다. 이메일 열거 방지 설정을 유지한다. 인증·재설정 메일 템플릿의 서비스 이름과 언어도 확인한다.
6. Firestore Database에서 **Standard / Native 모드**, `(default)` 데이터베이스를 만들고 지역은 사용자 위치와 서버 배치에 맞춰 선택한다. 한국 중심이라면 서울 `asia-northeast3`를 검토한다. 테스트 모드로 공개하지 않는다.
7. Firestore Rules 탭에 저장소의 `firestore.rules`를 적용한다. 이 작업은 실제 프로젝트 연결 준비에 포함되며 이번 코드 작성 과정에서 원격 배포하지 않는다. `firestore.indexes.json`은 여행 입력·장소 표시 정보·검사 요약의 불필요한 인덱싱을 제외하며 운영 적용 방법은 Firebase CLI의 명시적 프로젝트 선택을 따른다.
8. 프로젝트 설정 → 서비스 계정 → Firebase Admin SDK에서 서비스 계정을 준비한다. 다운로드한 JSON의 project_id/client_email/private_key를 서버 환경변수에 넣는다. JSON 파일 자체를 공개 저장소에 복사하지 않는다. 실제 서버 서비스 계정은 Auth 사용자 조회·토큰 검증과 Firestore 데이터 접근에 필요한 IAM 권한만 부여한다.
9. 환경변수를 채운 뒤 개발 서버를 재시작한다. 공개 환경변수는 Next.js 빌드 시 포함되므로 배포에서는 설정 후 다시 빌드해야 한다.

### `.env.local`에 넣을 항목

```dotenv
# Firebase Web 앱의 공개 식별자
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# 서버 전용 서비스 계정
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

두 project ID는 동일해야 한다. private_key 안의 줄바꿈은 실제 줄바꿈 또는 `\n` 형식을 지원한다. 서비스 계정 키에 `NEXT_PUBLIC_` 접두사를 붙이지 않는다. Vercel에서도 같은 이름으로 설정하며, Firebase Web의 공개 API 키와 Admin 개인 키를 혼동하지 않는다.

설정이 없거나 불완전하면 로그인 패널에서 준비 중임을 안내하고 비로그인 검사를 계속 제공하되 저장할 수 없음을 안내한다. 서버 설정이 없으면 DB API가 503을 반환한다. 오프라인 계정 저장을 성공 처리하거나 나중에 몰래 업로드하지 않는다.

## 로컬 검증

```bash
pnpm test:firebase
E2E_MODE=proxy pnpm test:firebase
pnpm verify
```

Firebase CLI와 Java 21 이상이 필요하다. 현재 OCI 환경은 `/tmp/pawproof-jre21/bin/java`와 설치된 Chromium을 스크립트가 사용할 수 있다. 다른 환경에서는 Java 21+를 PATH에 넣고 Playwright 브라우저를 설치한다.

`test:firebase`는 `demo-pawproof` 프로젝트의 로컬 Auth(9099)·Firestore(8080) 에뮬레이터만 시작한다. 실제 키·실제 계정·유료 API를 사용하지 않는다. Firebase 모드는 개발 환경의 loopback 호스트에 한정하고 실제 운영에서는 에뮬레이터 설정을 거부한다. Firebase 에뮬레이터의 테스트 사용자·메일은 실제 사용자 인증/메일 전송과 구분한다.

Auth 상태 복원, 이메일 인증 차단, CRUD, 소유권 격리, 비활성 계정 차단, 직접 DB 접근 거부, 동시 저장 한도, 버전 충돌, 저장 실패와 입력 보존, 삭제 확인을 검사한다. Google의 실제 OAuth 동의 화면과 실제 이메일 도착·외부 도메인/PWA 기기의 동작은 Firebase 설정 후 별도로 확인한다. 전체 회귀 검사 `verify`는 실제 Firebase 연결을 비활성화한다.

## 실제 프로젝트 검증 (2026-09-13)

사용자가 입력한 환경변수로 Admin Auth/Firestore 연결, 실제 이메일 로그인, 미인증 계정 403·비로그인 401, 브라우저 직접 Firestore 읽기/쓰기 403, 인증 상태 갱신, 여행 노트 저장·목록·수정·새로고침 후 로그인 복원·불러오기·삭제·로그아웃을 확인했다. 임시 사용자와 노트만 만들었으며 모두 삭제 후 부재를 확인했다. 반려견·방문지는 가상 체험 입력을 사용했고 관광/LLM API 호출은 하지 않았다.

재사용 스크립트는 `scripts/playwright/generated/firebase-live-configuration-login-and-account-tr-2fe1dc79ab.js`다. 실행 중인 로컬 미리보기가 필요하며 실제 프로젝트에 쓰기 때문에 일반 회귀 검사에 포함하지 않는다.

```bash
FIREBASE_LIVE_CHECK=true node scripts/playwright/generated/firebase-live-configuration-login-and-account-tr-2fe1dc79ab.js
```

OCI에서는 `PLAYWRIGHT_BROWSERS_PATH=/tmp/ms-playwright`, `LD_LIBRARY_PATH=/tmp/pawproof-browser-libs/usr/lib/aarch64-linux-gnu`를 함께 지정한다. 기본 주소는 `http://localhost:3000/absproxy/3000/`이며 필요하면 첫 번째 인자로 로컬 URL을 전달한다. `127.0.0.1`은 현재 Next.js 개발 리소스 origin 검사에서 차단되므로 localhost로 검사한다. 이 결과는 외부 code-server 프록시·실기기 OAuth 검증을 대신하지 않는다.

실제 메일은 보내지 않았다. 임시 사용자의 인증 상태를 Admin SDK로 바꿔 인증 후 토큰 갱신·서버 접근 흐름만 확인했다. 키·토큰·비밀번호·브라우저 trace는 기록하지 않는다. 실패 화면은 입력을 가린 `.cache/firebase-live-failure.png`에만 남긴다.

## 남은 운영 검증

로그인 화면·프로필·자동 저장 확장 후 개발 basePath에서 Firebase 에뮬레이터 검사 **14개**(데스크톱·모바일 각 7개)와 추가 탭 간 계정 전환 검사 **2개**를 통과했다. 등록 반려견 재사용, 10자 가입, 로그인 후 이동·토스트, 장소/검사 요약 복원, 저장 도중 편집, 통신 실패·재시도, 노트 전환·삭제, 소유권·revision 충돌, 다른 탭의 계정 전환 시 이전 프로필 초안 폐기를 확인했다. 이 검사는 합성 장소/판정 응답을 사용하며 실제 KTO/LLM 호출이나 실제 Firebase 프로젝트 검증이 아니다. 위 실제 프로젝트 결과는 확장 전 인증·노트 기능의 기록이다. 실제 프로젝트용 재사용 스크립트의 화면 경로와 자동 저장 대기는 갱신했으나 이번 확장 작업에서 다시 실행하지 않았다.

실제 Firebase 설정 후 Google 로그인과 이메일 가입·인증·재설정, 모바일 PWA에서 로그인 복원, 두 기기 간 저장·불러오기·충돌을 확인한다. 계정 탈퇴·전체 데이터 삭제를 자동 처리하는 기능과 전역 요청량 제한/App Check는 이번 기본 인증·저장 범위 이후의 운영 보강 사항이다. 저장된 노트 개별 삭제는 현재 제공한다.

## 공식 근거

- [Web SDK 설정](https://firebase.google.com/docs/web/setup)
- [Google 로그인](https://firebase.google.com/docs/auth/web/google-signin), [이메일 인증](https://firebase.google.com/docs/auth/web/password-auth)
- [인증 상태 보존](https://firebase.google.com/docs/auth/web/auth-state-persistence), [서버 ID 토큰 검증](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Admin SDK 초기화](https://firebase.google.com/docs/admin/setup), [서버 SDK와 Firestore Rules](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [로컬 에뮬레이터](https://firebase.google.com/docs/emulator-suite/install_and_configure)


노트 관리 UI는 여행 화면 상단의 제목·자동 저장 상태·내 여행 노트·새 여행 노트로 구성한다. 노트 목록은 제목/날짜로 검색하고 선택 즉시 열며 정상 미전송 변경은 전환 전에 flush한다. 저장 실패 초안 폐기와 삭제만 확인한다. 비회원과 이메일 미인증 사용자에게는 저장 전제와 새로고침 시 손실을 안내한다.
