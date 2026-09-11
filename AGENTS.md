# PawProof 작업 지침

PawProof는 반려견 동반 여행 코스를 규정과 일정에 대조하고 문제 방문지의 해결안을 제시하는 웹앱이다. **상세 기획·대회 요건·설계·운영 기준은 모두 `docs/`에 있다.** 작업 전에 [문서 안내](docs/README.md)와 해당 작업의 기준 문서를 읽는다. 이 파일은 핵심 작업 규칙만 요약한다.

## 개발 원칙

- 채택 스택: **Next.js App Router + TypeScript + pnpm + Vercel Hobby + Firestore Standard/Spark**. 실제 연결·성능 검증 여부는 계획과 구분해 기록한다.
- 클린 코드와 클린 아키텍처를 따른다. 함수·모듈은 단일 책임을 갖고, 이름·타입·입출력으로 의도를 명확히 표현한다.
- 도메인은 순수 로직으로 유지한다. Next.js·Firebase·LLM SDK를 도메인에 의존시키지 않는다. 사용 사례는 외부 기능 인터페이스에 의존하고 어댑터는 그 인터페이스를 구현한다.
- 라우트·UI는 얇게 유지하고 판정·일정 계산을 분리한다. 불필요한 클래스·추상화·범용 프레임워크를 추가하지 않는다.
- 공통 UI는 `src/components/ui`의 shadcn/Radix 디자인 시스템을 사용한다. 편집 상태는 화면별 Zustand, 요청 상태는 TanStack Query가 담당하며 도메인에 이들을 의존시키지 않는다. [UI·상태 기준](docs/engineering/UI_DESIGN_SYSTEM.md)을 따른다.
- 외부 입력과 LLM 결과는 런타임 검증한다. LLM은 규정 추출을 맡고 최종 판정은 결정론적 규칙으로 수행한다. 누락·오류를 이용 가능으로 바꾸지 않는다.
- 환경 파싱과 URL 생성은 공통 설정·유틸에 둔다. 개발 프록시 경로나 운영 도메인을 화면 코드에 하드코딩하지 않는다.
- 자격증명은 서버 전용으로 관리하고 코드·문서·로그·커밋에 넣지 않는다. KTO 원문·파생 규정 저장은 데이터 전략의 허용 범위를 따른다.

## 작업과 Git

- 현재 개발 작업자는 **사용자 1명**이며 **`main`에서 계속 작업**한다. 기능 브랜치·PR을 필수 절차로 만들지 않는다.
- **기능을 완성할 때마다 관련 검증 후 Git 커밋을 남긴다.** 재확인 요청 없이 진행하되 관련 없는 사용자 변경은 포함하지 않는다.
- 커밋은 독립적으로 설명·검토·되돌릴 수 있는 단위로 작게 나눈다. 여러 기능·무관한 리팩터링을 묶지 않고, 한 기능이 크면 동작 가능한 단계로 나눈다.
- 해당 변경의 코드·필요한 테스트·관련 문서는 함께 반영한다. `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:` 등으로 목적을 드러낸다.
- 커밋 전에 diff와 staged 파일을 확인하고 변경에 맞는 타입 검사·린트·테스트·빌드를 수행한다. 구현을 복사한 테스트나 불필요한 반복 검증은 피한다.
- 커밋과 푸시·배포는 구분한다. 원격 푸시·배포는 해당 요청 범위에 따라 진행한다. 완료 보고에는 검증 결과·커밋·남은 제약을 적는다.

## 상세 기준 문서

- [기술 스택](docs/engineering/STACK_DECISION.md), [아키텍처](docs/engineering/ARCHITECTURE.md), [코드·커밋 규칙](docs/engineering/CODE_STANDARDS.md)
- [개발 환경·경로 유틸](docs/engineering/DEVELOPMENT_ENVIRONMENT.md), [호스팅·비용](docs/operations/HOSTING_AND_COST.md)
- [제품 기획](docs/product/PRODUCT_PLAN.md), [판정·복구](docs/product/RULES_AND_RECOVERY.md), [데이터 전략](docs/data/DATA_STRATEGY.md)
- [공모전 요건](docs/competition/COMPETITION.md), [개발·제출 계획](docs/delivery/DELIVERY_PLAN.md), [결정 이력](docs/history/DECISION_HISTORY.md)

결정이나 동작을 바꾸면 해당 기준 문서와 이력을 함께 갱신한다. 사용자 최신 지시를 우선하며, 기획·구현·실측 결과를 혼동하지 않는다.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
