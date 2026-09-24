# 문의하기(CX) 메일 파이프라인

기준일: 2026-09-24
상태: 코드 연결 완료. Resend·Cloudflare Turnstile 계정과 Vercel Production 환경변수 입력은 운영자 설정으로 남아 있다. 2026-09-24 운영 QA에서 설정 누락 시 `SETUP_REQUIRED`로 안전하게 거부되는 것을 확인했다.

## 동작 범위

사용자는 Footer의 `문의하기`에서 `/contact` 페이지를 열고 이메일, 문의 유형, 내용을 입력한다. 브라우저는 같은 앱의 `/api/contact`에 요청하고, 서버가 입력을 검증한 뒤 Resend API를 호출한다.

```text
사용자 → /contact → /api/contact → Resend → ohsong656565@gmail.com
                                      └→ Reply-To: 사용자가 입력한 이메일
```

문의 내용은 PawProof Firestore에 저장하지 않는다. 발신 주소는 인증된 PawProof 도메인이고, 사용자 이메일은 `From`이 아니라 `Reply-To`로만 사용한다.

## 운영 설정 순서

### 1. Resend 도메인 인증

1. Resend 계정을 만든다.
2. `pawproof.kr`을 Domains에 추가한다.
3. Resend가 표시하는 SPF·DKIM DNS 레코드를 Cloudflare DNS에 추가하고 인증을 완료한다.
4. `contact@pawproof.kr`처럼 인증된 도메인 아래의 발신 주소를 정한다. 실제 메일함을 따로 만들 필요는 없지만, 답장은 사용자에게 가도록 코드가 `Reply-To`를 지정한다.
5. Sending 권한만 가진 API key를 발급한다.

Resend의 Free 플랜은 현재 월 3,000통·일 100통까지이며, 초기 문의량의 기준으로 충분하다. [Resend pricing](https://resend.com/pricing?product=marketing)

### 2. Turnstile 위젯 생성

Cloudflare Turnstile에서 Managed 위젯을 만들고 다음 hostname을 등록한다.

- `pawproof.kr`
- `www.pawproof.kr` (현재 canonical 주소)
- `pawproof-rose.vercel.app`

개발 중 브라우저 확인이 필요하면 `localhost`도 추가한다. 생성된 sitekey는 브라우저용이고 secret key는 서버용이다. 두 값을 서로 바꾸지 않는다.

### 3. Vercel Production 환경변수 입력

Vercel 프로젝트의 Production 환경에 아래 값을 입력한다.

```dotenv
RESEND_API_KEY=re_...
CONTACT_RECIPIENT_EMAIL=ohsong656565@gmail.com
CONTACT_FROM_EMAIL=contact@pawproof.kr
CONTACT_REQUIRE_TURNSTILE=true
TURNSTILE_SECRET_KEY=...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x...
```

`NEXT_PUBLIC_TURNSTILE_SITE_KEY`는 브라우저 번들에 들어가는 공개값이므로 secret으로 취급하지 않는다. 나머지 API key와 secret은 서버 전용으로 입력한다. `NEXT_PUBLIC_*` 값은 빌드 시 반영되므로 모두 입력한 뒤 반드시 Redeploy한다.

## 배포 후 확인

OCI code-server에서 변경을 `main`에 푸시한 뒤 Vercel 자동 배포가 끝날 시간을 두고 운영 주소에서 확인한다.

1. `https://pawproof.kr/contact`가 HTTP 200으로 열린다.
2. 이메일과 10자 이상의 테스트 문의를 입력한다. 실제 개인정보는 사용하지 않는다.
3. Turnstile이 완료된 뒤 `문의 보내기`가 활성화된다.
4. `ohsong656565@gmail.com`에 `[PawProof 문의]` 제목의 메일이 도착한다.
5. Gmail에서 답장을 눌렀을 때 사용자가 입력한 이메일 주소가 수신자로 잡힌다.
6. 실패 시 브라우저에는 실패 문구가 표시되고, 서버 로그·메일 본문에는 API key나 Turnstile secret이 기록되지 않아야 한다.

Resend 또는 Turnstile 환경변수가 빠진 운영 배포는 문의를 성공 처리하지 않고 `SETUP_REQUIRED`로 거부한다. 환경변수를 입력하기 전 운영 QA에서 이 응답이 보이는 것은 설정 미완료를 숨기지 않는 의도된 동작이다.

## 무료 운영 주의사항

- Resend의 일일 100통 제한을 넘으면 문의가 전송되지 않을 수 있다.
- 공개 폼은 자동화 공격 대상이 될 수 있으므로 Turnstile을 운영에서 끄지 않는다.
- 문의 내용은 이메일 서비스와 Gmail로 전달되므로 비밀번호·주민번호·민감한 건강정보를 입력하지 않도록 폼에 안내한다.
- 현재는 문의 이력 DB와 관리자 화면을 만들지 않았다. 답변·분류·재문의 관리는 Gmail에서 한다.
