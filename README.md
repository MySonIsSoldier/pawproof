# PawProof

반려견 동반 여행 코스 사전검증 웹앱입니다. 현재 Next.js 개발 기반을 구현하는 단계이며 여행 검증 기능은 아직 제공하지 않습니다.

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

외부 서비스 키는 `.env.example`의 이름을 참고하여 `.env.local` 또는 배포 플랫폼의 서버 환경변수에 설정합니다. 키 없이도 현재 앱의 개발·빌드·테스트가 가능합니다. OpenRouter의 모델·실호출, KTO 승인·실응답, Firebase 연결은 후속 작업입니다.

터미널 종료 후에도 개발 미리보기를 유지하거나 접속 장애를 복구하는 절차는 [개발 서버 유지와 접속 장애 점검](docs/engineering/DEVELOPMENT_ENVIRONMENT.md#개발-서버-유지와-접속-장애-점검)을 따른다. 의존성 재설치와 개발 모드 E2E 실행 전에는 실행 중인 개발 서버를 중지한다.

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
- [구현·검증 기록](docs/delivery/IMPLEMENTATION_STATUS.md): 실행한 검사와 외부 환경에서 남은 확인 사항입니다.

화면은 초기 구동 확인용입니다. 디자인 레퍼런스는 추후 제공 예정입니다.
