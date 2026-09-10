# PawProof

반려견 동반 여행 코스 사전검증 웹앱입니다. 현재 Next.js 개발 기반을 구현하는 단계이며 여행 검증 기능은 아직 제공하지 않습니다.

## 개발

Node.js 24.13 이상(24.x), pnpm 12.3.4를 사용합니다.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## 기준 문서

- [작업 규칙](AGENTS.md): 사용자 혼자 `main`에서 작업하며 기능 완료마다 검증 후 커밋합니다.
- [전체 기획](docs/README.md): 제품·대회·데이터·기술·운영 문서의 입구입니다.
- [개발 환경](docs/engineering/DEVELOPMENT_ENVIRONMENT.md): code-server 경로와 배포 설정을 설명합니다.

화면은 초기 구동 확인용입니다. 디자인 레퍼런스는 추후 제공 예정입니다.
