# 현재 구현·검증 기록

기준일: 2026-09-11

## 구현한 범위

- Next.js 16.3.4 App Router, React 19.3.0, TypeScript strict, pnpm 12.3.4 기반.
- 최소 시작·소개 화면과 외부 연결을 검사하지 않는 `/api/health`.
- `APP_ENV`, `APP_BASE_PATH`, `APP_ORIGIN`, `DEV_ALLOWED_HOSTS`, `PORT` 검증.
- Next의 자동 Link 처리와 직접 생성하는 API·public 자산·절대 URL의 경로 처리 분리.
- code-server 환경의 `VSCODE_PROXY_URI`에서 개발 origin·허용 호스트 추론.
- 공개 basePath와 서버 전용 OpenRouter·KTO 설정 분리. 키는 실제 연결 시 지연 검증.
- 개발·배포 환경 파일을 구분하는 pnpm 실행기와 빌드 프로필 불일치 방지.
- 개발 전용 `/dev/check`: 이미지·클라이언트 API·상태·HMR 점검. 운영 빌드에서는 404.
- 재사용 가능한 [단위 테스트](../../tests/unit/app-config.test.ts)와 [브라우저 테스트](../../tests/e2e/environment.spec.ts).

디자인 레퍼런스가 오기 전의 최소 화면이다. 실제 프로필 입력·코스 구성·규정 추출·판정·대체 추천 기능은 아직 구현하지 않았다.

## 실행 결과

| 검사 | 결과 | 범위 |
|---|---|---|
| `pnpm lint` | 통과 | 앱·유틸·실행기·테스트 |
| `pnpm typecheck` | 통과 | Next 라우트 타입 생성 및 TypeScript 검사 |
| `pnpm test` | **46개 통과** | 경로·origin·환경·포트·공개 설정·빌드 프로필 |
| `pnpm build` | 통과 | 외부 키 없이 루트 경로의 프로덕션 빌드 |
| 직접 개발 브라우저 | **2개 통과**, 운영 전용 1개 제외 | HTML·CSS·JS·페이지 이동·깊은 경로 새로고침·API·이미지·HMR |
| code-server 경유 브라우저 | **2개 통과**, 운영 전용 1개 제외 | 임시 로컬 code-server → `/absproxy/3101` → Next 개발 서버 |
| 프로덕션 브라우저 | **2개 통과**, 개발 전용 1개 제외 | `pnpm start`, 루트 URL·자산·상태 API, 개발 점검 페이지 404 |
| 빌드·실행 설정 분리 | 통과 | 개발 환경 파일이 있어도 운영은 루트로 빌드. 다른 프로필의 `pnpm start`는 실행 전에 거부 |
| 서버 설정 노출 점검 | 통과 | 가상의 서버 키 표식을 넣고 빌드한 뒤 브라우저 JS·HTML에 없는지 확인 |

HMR 검증에서는 컴포넌트 문구를 변경한 뒤 WebSocket 통신·화면 갱신·기존 클라이언트 상태 유지를 확인하고 파일을 복원했다. 테스트가 변경하는 파일은 테스트 실행 중 편집하지 않는다. 모드별 제외는 의도한 검사 범위 차이이며 미해결 실패가 아니다.

`pnpm dev`가 Git에서 제외한 `.env.development.local`을 먼저 읽고 3000번 프록시 개발 모드로 시작하는 것도 확인했다. 파일에는 개발 프로필만 있고 서비스 인증키는 없다.

## 검증 환경과 재실행

OCI 컨테이너의 Node.js 24.13.0, Linux ARM64에서 수행했다. 기존 IDE의 외부 인증 세션 대신 설치된 **code-server 4.127.0 바이너리**로 루프백에 임시 프록시를 실행하여 재현했다. 외부 Coolify·HTTPS·로그인 세션까지 검증한 결과로 일반화하지 않는다.

현재 컨테이너에는 Corepack 기본 캐시 쓰기 권한과 Chromium의 `libxkbcommon.so.0`가 없었다. 초기 검증에는 `/tmp/pawproof-corepack`, `/tmp/ms-playwright`, `/tmp/pawproof-browser-libs`를 사용했다. 이후 `.corepack.env`를 추가해 **일반 pnpm 명령이 프로젝트의 `.cache/corepack`을 사용하도록 해결**하고 버전 확인·lockfile 기반 설치를 검증했다. 시스템 권한은 변경하지 않았다. 브라우저의 임시 경로는 환경 정리 후 없어질 수 있으며 앱의 배포 의존성은 아니다.

일반적인 브라우저 의존성이 설치된 환경의 실행 명령은 [루트 README](../../README.md)를 따른다. 이번 컨테이너에서 사용한 환경 설정은 다음과 같다.

```bash
export COREPACK_HOME=/tmp/pawproof-corepack
export PLAYWRIGHT_BROWSERS_PATH=/tmp/ms-playwright
export LD_LIBRARY_PATH=/tmp/pawproof-browser-libs/usr/lib/aarch64-linux-gnu

pnpm test:e2e
# 8444번에 임시 code-server 프록시가 실행 중일 때:
E2E_MODE=proxy E2E_ORIGIN=http://127.0.0.1:8444 pnpm test:e2e
pnpm build
E2E_MODE=production pnpm test:e2e
```

임시 프록시가 없으면 `E2E_MODE=proxy pnpm test:e2e`로 Next의 접두사 경로 처리만 검사할 수 있다. 이 경우 실제 프록시 경유 검증과 구분한다.

검증용 임시 프록시는 종료했다. 사용자 확인용 Next 개발 서버는 3000번에서 실행하며, `https://ide.hothyun.com/absproxy/3000/`에서 로그인한 IDE 세션으로 확인한다. 일반 터미널 실행과 장시간 미리보기의 재시작 절차는 [개발 환경](../engineering/DEVELOPMENT_ENVIRONMENT.md#개발-서버-유지와-접속-장애-점검)을 따른다.

Next.js가 `next dev` 실행 중 AGENTS.md에 추가하는 관리 블록은 설치된 `generate-agent-files.js`에서 출처를 확인했다. 프로젝트의 간략한 작업 규칙 뒤에 해당 블록을 보존한다.

## 2026-09-11 개발 접속 장애 복구

기존 3000번 Next 프로세스는 살아 있었지만 상태 API가 8초 동안 응답하지 않았다. 개발 로그에서 `write EPIPE`와 이전 의존성 재설치 시점의 Next 패키지 탐색 오류를 확인했다. 표준 출력은 이전 도구 실행의 파이프에 연결되어 있었다.

해당 앱 실행기를 종료하고 별도 세션·파일 로그 방식으로 재시작했다. 실행 명령이 끝난 뒤에도 서버가 유지되며, `/absproxy/3000/api/health`가 200으로 응답하는 것을 확인했다. 현재 로그는 Git에서 제외한 `.cache/dev-server.log`, 실행기 PID는 `.cache/dev-server.pid`에 기록한다.

기존 `tests/e2e/environment.spec.ts`를 재사용해 실제 3000번 서버에 `http://localhost:3000/absproxy/3000/`으로 접속했다. HTML·CSS·JS·내부 이동·새로고침·상태 API와 public 이미지·클라이언트 API·WebSocket·HMR 상태 유지 검사 **2개 통과**, 운영 전용 검사 1개는 의도적으로 제외했다. 테스트 소스는 변경하지 않았으며 임시 접속 설정은 `.cache/access-check.config.ts`에 두었다. 최초 검사에서는 컨테이너의 Chromium 경로 설정 누락과 기본 허용 대상이 아닌 `127.0.0.1` 접속을 수정한 뒤 통과했다.

외부 HTTPS 주소는 미인증 요청에 Cloudflare Access 로그인 302를 반환했다. 사용자 인증 이후의 실제 외부 접속 성공은 아직 검증하지 않았다. 이번 조치는 개발 서버 실행 방식과 운영 문서에 한정하며 앱 코드·경로 설정·외부 인증 설정은 변경하지 않았다.

## 아직 연결·검증하지 않은 범위

- 사용자가 준비하는 Vercel 프로젝트와 Firestore DB.
- 사용자가 요청한 KTO API의 현재 승인 상태·키·실응답.
- OpenRouter 크레딧 잔액·모델·실제 추출 정확도·토큰 비용. 이번 작업의 유료 API 호출은 0회.
- 실제 외부 `ide.hothyun.com`의 Coolify·TLS·인증 세션 경유 동작.
- 실제 배포 URL, 최종 도메인, 사용자 제공 디자인 레퍼런스.

다음 제품 구현은 실제 KTO 원문 하나를 OpenRouter 추출·규칙 판정·근거 표시로 연결하는 흐름이다. 이 기록의 기반 검증을 제품 기능 완성이나 공모전 제출 준비 완료로 표시하지 않는다.

## 제품 도메인 구현 (2026-09-11)

반려견·구역·규정·코스 타입, 요청/추출 런타임 스키마, 네 상태 순수 판정, 분 단위 일정 계산, 제한된 후보의 교체·재검증을 구현했다. 자체 작성 가상 장소 7곳은 실데이터와 구분한다. 기존 46개에 정책·일정·복구 사례 11개를 추가한 총 57개 단위 검사, 타입·린트·빌드 통과. 어댑터와 제품 UI는 이후 단계다.
