# 실제 API 검증 실행

2026-09-11 · 일반 회귀 검사와 실제 외부 호출을 구분한다. 결과는 [실측 기록](../delivery/LIVE_VALIDATION_2026-09-11.md)을 참고한다.

## 실행 전

`.env.local`에 KTO_SERVICE_KEY(Decoding), KAKAO_MOBILITY_REST_KEY, OPENROUTER_API_KEY, OPENROUTER_MODEL과 LIVE_SERVICES_ENABLED=true를 설정한다. 키는 서버에서만 읽고 문서·로그·커밋에 기록하지 않는다. OpenRouter 크레딧이 사용되므로 일반 `pnpm verify` 또는 CI에 아래 명령을 연결하지 않는다.

## 공급자 연결 검사

```bash
node scripts/verify-live.ts probe
```

지원 업종의 실제 인천 장소 검색 → 표본 장소 상세/동반 규정/소개 정보 → 카카오 이동시간 → OpenRouter 추출·서버 검증을 실행한다. 요청은 최대 20회로 제한하며 자동 재시도하지 않는다. 원문·규정·키를 저장하지 않고 HTTP 상태, 호출 시간, 제공된 토큰/비용, 공개 장소 메타데이터와 규칙 수만 `.cache/live/probe-<timestamp>.json`에 기록한다. 성공은 표본 연결 확인이며 전국 정보 품질이나 모델 정확도 보장이 아니다.

모델에는 생성 복잡도를 낮춘 JSON 스키마를 전달한다. 배열·문자열 길이와 수치 범위는 서버의 원래 Zod 스키마로 검증하며, 근거 원문 포함 여부와 규정 종류별 연산자도 별도 검사한다. KTO 제공 시설/물품과 방문자 준비사항을 구분하고, 지원하지 않는 연령 예외를 단순 체중 제한으로 바꾸지 않도록 명시한다.

## 브라우저 실사용 검사

검증 전 관리 중인 미리보기를 중지한다. 호출 메타데이터 관찰이 필요하면 서버 실행 시 다음을 사용한다. 프로젝트 루트에서 실행한다.

```bash
pnpm preview:stop
PWA_ENABLED=true PAWPROOF_LIVE_AUDIT=true \
NODE_OPTIONS="--import $PWD/scripts/live-audit.mjs" pnpm preview:start
```

관찰기는 지정한 공급자 3곳의 요청 경로(쿼리 제외), 상태, 시간, 제공된 토큰/비용만 기록한다. 헤더·키·프롬프트·응답 원문·사용자 입력은 기록하지 않는다. `.cache/live/browser-provider-events.jsonl`의 누적 시작 기록을 기준으로 KTO 100회, OpenRouter 20회, Kakao 40회에서 추가 요청을 차단한다. 실패 요청도 횟수에 포함한다. 이는 로컬 검사 도구의 호출 상한이며 제품의 운영 과금 제한 기능이 아니다.

```bash
PLAYWRIGHT_BROWSERS_PATH=/tmp/ms-playwright \
LD_LIBRARY_PATH=/tmp/pawproof-browser-libs/usr/lib/aarch64-linux-gnu \
node scripts/playwright/generated/pawproof-bounded-real-api-browser-flow-32ae4773a3.js
```

브라우저 설치 경로는 이 OCI 환경 기준이며 일반 환경에서는 해당 변수 없이 실행할 수 있다. 기본 대상은 `http://localhost:3000/absproxy/3000/`이고 인자로 다른 로컬 주소를 지정할 수 있다. 외부 IDE의 Cloudflare Access 인증을 거치는 검사는 아니다.

실제 검색으로 개떼놀이터 인천점·인천 차이나타운·자유공원(인천)을 담고, 검사·원문 근거 표시·대체 탐색·12kg→20kg 재검사·입력 저장/불러오기를 수행한다. POST는 최대 4회다. 후보가 있으면 적용·되돌리기를 검사하고, 없으면 빈 결과와 기존 코스 보존을 확인한다. 동적인 원문·후보 변화로 검사가 실패하면 원인을 확인한 뒤 필요한 부분만 다시 실행한다. 실 API 검사를 자동 5회 반복하지 않는다.

결과는 `.cache/live/browser-<timestamp>.json`의 집계 정보에 남긴다. 원문·추출 규칙 전체·네트워크 trace를 파일로 저장하지 않는다. 다른 검증 세션을 시작할 때는 서버를 중지한 상태에서 이전 메타데이터 파일을 별도로 보관하고 새 기록으로 시작한다. 호출 한도 오류를 무시하고 자동 초기화하지 않는다.

검증을 마치면 관찰기를 해제하고 일반 미리보기로 복원한다.

```bash
pnpm preview:stop
PWA_ENABLED=true pnpm preview:start
```

## 결과 판단

- HTTP 200이어도 정책 추출 실패, 브라우저 계약 오류, 규정 불확실성을 각각 확인한다.
- ‘확인 필요’는 업체 이용 가능을 확인한 결과가 아니다.
- 유효 대체 후보 0개를 실제 대체 적용 성공으로 기록하지 않는다.
- KTO 원문·규정의 운영 DB 저장은 여전히 비활성이다. 캐시 정책 변경 없이 매 요청에서 조회한다.
- Firebase·사용자 인증·공개 배포·실기기 설치·전국 정확도는 별도 검증 범위다.
