# 운영 smoke test

기준일: 2026-09-29

PawProof는 지도·메일·Turnstile·Firebase·Google 인증처럼 앱 밖 설정에 의존하는 기능이 있다. 배포가 성공해도 이 연결들이 모두 정상이라는 뜻은 아니므로, main 배포 후 아래 검사를 순서대로 실행한다. 실제 사용자 계정·비용이 발생하는 검사는 명시적으로 선택한다.

## 1. 기본 운영 점검

OCI code-server에서 Chromium 경로가 준비된 뒤 다음을 실행한다.

```bash
PLAYWRIGHT_BROWSERS_PATH=/tmp/ms-playwright \
LD_LIBRARY_PATH=/tmp/pawproof-browser-libs/usr/lib/aarch64-linux-gnu \
node scripts/playwright/generated/production-pawproof-operations-smoke-test-for-co-6783a2eeda.js \
  https://www.pawproof.kr
```

이 검사는 다음을 확인하지만 실제 메일을 보내거나 계정을 만들지 않는다.

| 영역 | 확인 내용 |
|---|---|
| 공개 화면 | 홈·문의·실제 장소 모드 HTTP 200, 모바일 가로 넘침 없음 |
| 문의 보호 | Turnstile 위젯 존재 여부와 미완료 상태의 전송 버튼 잠금 |
| Firebase UI | 로그인 화면과 Google 로그인 버튼이 열리고 닫히는지 |
| 계정 API | 인증 없는 여행 노트 요청이 401/no-store인지 |
| 문의 API | 잘못된 본문이 400으로 거부되는지. Resend quota는 사용하지 않음 |

문의 API에서 `SETUP_REQUIRED`를 확인하려고 유효한 본문을 보내면 실제 설정이 있는 운영에서는 메일을 발송할 수 있다. 따라서 이 기본 검사는 의도적으로 malformed input만 보낸다. 실제 메일 도착은 테스트용 이메일 주소와 유효한 Turnstile을 사용해 수동으로 1회 확인한다.

## 2. Kakao 지도·후보 검색

실제 KTO 후보와 Kakao SDK 타일을 확인할 때만 다음을 추가 실행한다. 읽기 전용 검색과 장소 선택만 수행하며, LLM·계정 저장·업체 문의는 하지 않는다.

```bash
PLAYWRIGHT_BROWSERS_PATH=/tmp/ms-playwright \
LD_LIBRARY_PATH=/tmp/pawproof-browser-libs/usr/lib/aarch64-linux-gnu \
node scripts/playwright/generated/production-pawproof-operations-smoke-test-for-co-6783a2eeda.js \
  https://www.pawproof.kr --live-map

node scripts/check-map-discovery.mjs https://www.pawproof.kr --live
```

`check-map-discovery.mjs`는 운영 KTO 요청을 발생시키므로 정기적으로 반복하지 않고, 배포 후 또는 Kakao/KTO 환경변수 변경 후 실행한다. 기본 지도 중심은 서울 명동이다.

## 3. Google 로그인·여행 노트 저장

실제 운영 계정을 자동화하지 않는다. 로그인·이메일 인증·여행 노트 저장은 다음 둘을 구분한다.

- 정기 브라우저 smoke: 1번 기본 점검의 로그인 UI 확인.
- 연결 변경 후 실제 Firebase 점검: 별도 임시 계정을 만들고 종료 시 Auth 사용자와 Firestore 노트를 삭제하는 명시적 live 스크립트.

```bash
FIREBASE_LIVE_CHECK=true \
PLAYWRIGHT_BROWSERS_PATH=/tmp/ms-playwright \
LD_LIBRARY_PATH=/tmp/pawproof-browser-libs/usr/lib/aarch64-linux-gnu \
node scripts/playwright/generated/firebase-live-configuration-login-and-account-tr-2fe1dc79ab.js \
  http://localhost:3000/absproxy/3000/
```

이 스크립트는 실제 Firebase 프로젝트 환경변수를 읽지만 실제 Google OAuth 화면은 사용하지 않고, 임시 이메일 계정으로 Auth·토큰·Firestore 소유권·노트 생성/수정/삭제를 점검한다. 실제 Google 로그인은 운영 브라우저에서 사용자 본인이 1회 확인한다. Firebase 환경변수·도메인·Google Provider를 변경한 뒤에만 실행한다.

## 4. 실제 문의 발송

1. `https://www.pawproof.kr/contact`를 열고 테스트용 이메일과 10자 이상의 비민감한 문구를 입력한다.
2. Turnstile을 완료하고 제출한다.
3. `ohsong656565@gmail.com`에 `[PawProof 문의]` 메일이 도착하는지 확인한다.
4. 답장 시 사용자의 입력 이메일이 Reply-To로 잡히는지 확인한다.

Resend·Turnstile 설정이 빠진 상태에서는 성공으로 처리하지 않고 `SETUP_REQUIRED` 또는 보호 실패를 반환해야 한다. API key·Turnstile secret·실제 토큰·사용자 비밀번호를 로그나 문서에 남기지 않는다.

## 운영 기록 템플릿

```text
점검일:
배포 커밋:
기본 smoke: PASS / FAIL
Kakao/KTO live: PASS / FAIL / SKIP
Firebase note live: PASS / FAIL / SKIP
문의 발송: PASS / FAIL / SKIP
남은 조치:
```
