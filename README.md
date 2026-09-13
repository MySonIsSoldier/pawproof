# PawProof

반려견 동반 여행 코스 사전검증 웹앱(PWA)입니다. 프로필·코스 편집, 네 상태 판정, 원문 근거, 대체·재검증과 출발 준비표를 제공합니다. 가상 체험은 키 없이 사용할 수 있습니다. 실제 API로 3개 장소의 브라우저 흐름을 검증했으며, 정보 완전성·유효 대체 후보와 전국 데이터 품질은 추가 검증이 필요합니다.

## 개발

Node.js 24.13 이상(24.x), pnpm 12.3.4를 사용합니다.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

현재 code-server에서는 다음 명령으로 프록시 모드를 선택할 수 있습니다. IDE의 `VSCODE_PROXY_URI`에서 허용 호스트를 읽습니다.

```bash
pnpm dev:code-server
```

접속 주소는 `https://ide.hothyun.com/absproxy/3000/`입니다. 일반 로컬 실행은 `pnpm dev:direct`를 사용합니다. `pnpm dev`의 기본 프로필까지 바꾸려면 `.env.code-server.example`을 `.env.development.local`로 복사합니다. 포트 변경 시 `PORT`와 `APP_BASE_PATH`를 함께 맞춥니다.

이 OCI 환경의 Corepack 캐시 권한 오류는 프로젝트의 `.corepack.env`에서 `.cache/corepack`을 사용하도록 해결했습니다. 저장소 루트에서 일반 `pnpm` 명령을 실행할 수 있습니다. 해당 설정 파일을 지원하지 않는 Corepack에서는 터미널에서 `export COREPACK_HOME="$PWD/.cache/corepack"`를 설정합니다.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

`build`·`start`는 개발 환경 파일을 읽지 않고 프로덕션 환경을 사용합니다. `start`는 빌드 시점과 현재 경로 프로필이 다르면 중단합니다. `.env.local`에 프록시 설정을 넣지 말고 `.env.development.local`에 둡니다.

`.env.example`은 Vercel Production 기본값을 채운 배포 템플릿입니다. `[직접 입력]` API 키·Firebase 설정 10개만 Vercel 또는 비추적 `.env.vercel.local` 사본에 입력합니다. 공개 템플릿과 기존 `.env.local`은 덮어쓰지 않습니다. 개발 비밀은 `.env.local`, code-server 프로필은 `.env.development.local`에서 관리합니다. [Vercel 배포 안내](docs/operations/VERCEL_DEPLOYMENT.md)를 따릅니다. 키 없이 빌드·가상 체험은 가능하지만 실제 API와 계정 기능은 설정이 필요합니다. 연결 결과는 [실사용 검증](docs/delivery/LIVE_VALIDATION_2026-09-11.md), [인천 데이터 보강](docs/data/INCHEON_COVERAGE.md), [Firebase 기준](docs/engineering/FIREBASE_AUTH_AND_STORAGE.md)을 참고합니다.

터미널 종료 후에도 개발 미리보기를 유지하거나 접속 장애를 복구하는 절차는 [개발 서버 유지와 접속 장애 점검](docs/engineering/DEVELOPMENT_ENVIRONMENT.md#개발-서버-유지와-접속-장애-점검)을 따른다. 의존성 재설치와 개발 모드 E2E 실행 전에는 실행 중인 개발 서버를 중지한다.

## 전체 검증과 미리보기

```bash
pnpm verify
pnpm preview:start
pnpm preview:stop
```

`verify`는 단위 검사 → 린트 → 타입 → 데스크톱·모바일 직접 개발 → code-server 프록시 → 운영 빌드·브라우저 검사를 순서대로 실행합니다. Linux/code-server의 관리 중인 미리보기는 잠시 중지하고 종료 시 다시 시작합니다. 다른 터미널의 개발 서버는 먼저 직접 종료해 주세요. 로컬 code-server 바이너리가 있으면 127.0.0.1:8444의 임시 인증 없는 프록시를 테스트에만 사용하고 종료합니다. 실제 IDE 인증 설정은 변경하지 않습니다.

리포트: `playwright-report/{direct,proxy,production}/index.html`. 스크린샷·실패 trace: `test-results/`. `preview:start`는 code-server 개발 실행기를 별도 세션·파일 로그로 유지합니다. 컨테이너 재시작 후 자동 기동하는 배포 서비스는 아닙니다.

실제 API를 연결하려면 [설정 안내](docs/engineering/API_INTEGRATION.md)에 따라 루트 `.env.local`을 작성합니다. KTO Decoding 키, OpenRouter 키·모델, Kakao Mobility REST 키를 넣고 `LIVE_SERVICES_ENABLED=true`로 설정합니다. Firestore는 계정 여행 노트와 등록 반려견 저장에 사용합니다.

## 브라우저 검증

```bash
pnpm exec playwright install chromium
pnpm test:e2e
E2E_MODE=proxy pnpm test:e2e
pnpm build
E2E_MODE=production pnpm test:e2e
```

브라우저 테스트는 개발 서버를 자동으로 켜고 종료합니다. 직접 개발·프록시 개발은 같은 Next 개발 출력 폴더를 사용하므로 순서대로 실행합니다. HMR 검증은 개발 전용 점검 컴포넌트의 문구를 잠시 바꾸고 복원하므로 다른 작업과 동시에 실행하지 않습니다.

`E2E_ORIGIN`을 지정하면 프록시 모드를 실제 code-server 프록시 경유로 검사할 수 있습니다. 설치 환경의 브라우저 시스템 의존성과 실제 검증 범위는 [구현·검증 기록](docs/delivery/IMPLEMENTATION_STATUS.md)을 참고합니다.

## 기준 문서

- [작업 규칙](AGENTS.md): 사용자 혼자 `main`에서 작업하며 기능 완료마다 검증 후 커밋합니다.
- [전체 기획](docs/README.md): 제품·대회·데이터·기술·운영 문서의 입구입니다.
- [개발 환경](docs/engineering/DEVELOPMENT_ENVIRONMENT.md): code-server 경로와 배포 설정을 설명합니다.
- [PWA](docs/engineering/PWA.md): 홈 화면 설치·오프라인 안내·업데이트·캐시 범위와 개발 중 활성화 방법입니다. 실제 규정 검증은 온라인 연결이 필요합니다.
- [구현·검증 기록](docs/delivery/IMPLEMENTATION_STATUS.md): 실행한 검사와 외부 환경에서 남은 확인 사항입니다.

디자인 기준은 [DESIGN.md](DESIGN.md)입니다. ref/의 사용자 레퍼런스를 바탕으로 숲색·세이지·Pretendard 자체 호스팅을 적용했습니다. `/plan?mode=demo`는 가상 체험, `/plan`은 실제 장소 모드입니다.

입력·선택·근거 모달은 shadcn/Radix 공통 컴포넌트를 사용합니다. `/dev/design-system`은 개발 전용 컴포넌트 갤러리입니다. Zustand 편집 상태·TanStack Query 요청·계정 자동 저장의 책임은 [UI·상태 설계](docs/engineering/UI_DESIGN_SYSTEM.md)에 정리했습니다.
