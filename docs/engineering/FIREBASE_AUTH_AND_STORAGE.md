# Firebase 인증과 계정 여행 노트

기준일: 2026-09-13. 코드 구현과 에뮬레이터 검증, 실제 Firebase 프로젝트 연결을 구분한다. 실제 설정값은 저장소에 기록하지 않는다.

## 구조와 저장 범위

- AuthProvider가 Firebase 인증 상태 복원·변경을 구독한다. SDK는 설정이 있는 브라우저에서 지연 초기화하고 HMR 중 앱을 중복 생성하지 않는다.
- Google 팝업 로그인과 이메일 가입/로그인/비밀번호 재설정/인증 메일/로그아웃을 제공한다. PWA에서 팝업이 차단되면 이메일 방식을 이용할 수 있다. 리다이렉트 로그인이나 자체 인증 쿠키를 도입하지 않는다.
- Firebase Web 설정은 공개 식별자다. 공개 API 키로 DB 접근이 허용되는 구조가 아니다. 서비스 계정 이메일·개인 키와 관광/LLM 키는 서버 전용이다.
- 계정 API는 `Authorization: Bearer <Firebase ID token>`을 Admin SDK로 검증하고 비활성화·취소 여부와 이메일 인증을 확인한다. 소유자 UID는 검증한 토큰에서만 가져온다. 요청 본문에 ownerId를 받지 않는다.
- Firestore는 서버 Admin SDK에서만 접근한다. `firestore.rules`는 브라우저의 모든 직접 접근을 거부한다. Admin SDK는 Rules를 우회하므로 서버 소유권 검사가 필수다.
- 사용자가 제목과 함께 명시적으로 저장한 반려견 프로필·여행일·시간·준비물·방문지 ID/순서/체류시간/구역/고정 여부만 저장한다. 관광공사 원문, 장소 설명·사진, LLM 추출 규정, 검사 결과는 저장하지 않는다.

```text
accounts/{verifiedUid}                 -> tripCount
accounts/{verifiedUid}/trips/{uuid}    -> title, trip, revision, createdAt, updatedAt
```

목록은 최신 수정순 최대 20개다. 신규 저장·삭제 시 카운트와 문서를 같은 Firestore 트랜잭션으로 처리한다. 제목 최대 60자, 반려견 최대 5마리, 방문지 3~5곳이며 기존 입력 스키마를 재사용한다. 저장/삭제는 expectedRevision으로 다른 기기의 변경을 검사하고 충돌이면 409를 반환한다. 새 노트의 요청 ID는 재시도 동안 유지해 응답 유실 후 중복 생성을 줄인다.

로그인 자체가 기기 노트를 자동 업로드하지 않는다. 계정 목록은 열었을 때 조회한다. 저장 결과를 가져오면 기존 판정을 지우고 현재 규정으로 다시 검사하도록 안내한다. 로그아웃/계정 변경 시 계정 목록과 선택 상태를 폐기한다. 편집 중인 입력과 사용자가 명시적으로 기기에 저장한 입력은 유지하며 계정 안내에서 이를 고지한다. Query 캐시는 메모리에만 두고 재시도·포커스 자동 조회를 사용하지 않는다.

## Firebase Console 설정 순서

1. Firebase Console에서 프로젝트를 생성하거나 기존 프로젝트를 선택한다. 무료 운영을 위해 Spark를 유지하고 Analytics·Storage·Functions·App Hosting은 이 기능에 필요하지 않다.
2. 프로젝트 설정 → 일반 → 내 앱 → 웹 앱을 등록한다. SDK 설정의 apiKey/authDomain/projectId/appId를 아래 공개 환경변수에 각각 넣는다.
3. Authentication → 시작하기 → 로그인 방법에서 **Google**과 **이메일/비밀번호**를 사용 설정한다. Google의 지원 이메일도 설정한다. 이메일 링크 로그인은 이번 구현에 필요하지 않다.
4. Authentication → 설정 → 승인된 도메인에 실제 접속 호스트를 추가한다. 개발 서버는 `ide.hothyun.com`, 로컬 테스트는 필요에 따라 `localhost`와 `127.0.0.1`, 배포 후에는 실제 서비스 도메인을 추가한다. 도메인에는 프로토콜·포트·`/absproxy/3000` 경로를 넣지 않는다.
5. Authentication의 비밀번호 정책은 사용자가 설정한 최소 10자 이상을 기준으로 하며 가입 화면의 입력 제한·안내도 일치시킨다. 이메일 열거 방지 설정을 유지한다. 인증·재설정 메일 템플릿의 서비스 이름과 언어도 확인한다.
6. Firestore Database에서 **Standard / Native 모드**, `(default)` 데이터베이스를 만들고 지역은 사용자 위치와 서버 배치에 맞춰 선택한다. 한국 중심이라면 서울 `asia-northeast3`를 검토한다. 테스트 모드로 공개하지 않는다.
7. Firestore Rules 탭에 저장소의 `firestore.rules`를 적용한다. 이 작업은 실제 프로젝트 연결 준비에 포함되며 이번 코드 작성 과정에서 원격 배포하지 않는다. `firestore.indexes.json`은 여행 입력 맵의 불필요한 인덱싱을 제외하며 운영 적용 방법은 Firebase CLI의 명시적 프로젝트 선택을 따른다.
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

설정이 없거나 불완전하면 로그인 패널에서 준비 중임을 안내하고 비로그인 검사·기기 저장을 계속 제공한다. 서버 설정이 없으면 DB API가 503을 반환한다. 오프라인 계정 저장을 성공 처리하거나 나중에 몰래 업로드하지 않는다.

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

실제 Firebase 설정 후 Google 로그인과 이메일 가입·인증·재설정, 모바일 PWA에서 로그인 복원, 두 기기 간 저장·불러오기·충돌을 확인한다. 계정 탈퇴·전체 데이터 삭제를 자동 처리하는 기능과 전역 요청량 제한/App Check는 이번 기본 인증·저장 범위 이후의 운영 보강 사항이다. 저장된 노트 개별 삭제는 현재 제공한다.

## 공식 근거

- [Web SDK 설정](https://firebase.google.com/docs/web/setup)
- [Google 로그인](https://firebase.google.com/docs/auth/web/google-signin), [이메일 인증](https://firebase.google.com/docs/auth/web/password-auth)
- [인증 상태 보존](https://firebase.google.com/docs/auth/web/auth-state-persistence), [서버 ID 토큰 검증](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Admin SDK 초기화](https://firebase.google.com/docs/admin/setup), [서버 SDK와 Firestore Rules](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [로컬 에뮬레이터](https://firebase.google.com/docs/emulator-suite/install_and_configure)
