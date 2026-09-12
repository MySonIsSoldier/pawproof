# 기술 스택 선택

기준일: 2026-09-10\
상태: 사용자가 우선안을 채택했고 Next.js 기반 구현을 시작했다. 외부 배포·DB 연결은 사용자 준비 사항이며 아직 검증하지 않았다.

## 채택한 기본 스택

2026-09-11 추가: UI는 shadcn/Radix와 React DayPicker, 여행 편집 상태는 Zustand, 요청 생명주기는 TanStack Query를 채택했다. 호스팅·DB 채택과 별개로 현재 화면에 적용했으며 자세한 책임 경계는 [UI_DESIGN_SYSTEM.md](UI_DESIGN_SYSTEM.md)에 기록한다.

**Next.js App Router + TypeScript + pnpm + Vercel Hobby + Cloud Firestore Standard/Spark**를 기본 스택으로 채택했다. 공개 GitHub Organization 저장소라는 사용자 확인을 반영한 선택이다. Cloudflare는 현재 DNS를 유지하고, Workers + D1은 Vercel 이용 조건이나 실제 배포에 문제가 있을 때 검토할 대안으로 둔다.

공모전 제출까지 시간이 짧으므로 Next.js를 별도 어댑터 없이 배포하고, 서버 운영과 DB 관리를 줄이는 편이 유리하다. 지도·LLM·관광 API 연동과 판정 품질에 개발 시간을 집중한다. 이는 프로젝트 상황에 따른 판단이며, 무료 호스팅이 모든 트래픽과 외부 API 비용을 보장한다는 뜻은 아니다.

## 사용자 요구와 제안의 구분

| 항목 | 상태 |
|---|---|
| GitHub Organization의 공개 저장소 | 사용자 확인 완료 |
| 무료 호스팅·DB 우선 | 사용자 요구 |
| Next.js | 사용자 채택 완료 |
| OCI → Coolify → code-server 개발 환경 | 사용자 설명. 실제 프록시 구성은 구현 시 확인 |
| 환경변수와 공통 유틸로 개발 경로·배포 경로 분리 | 사용자 요구 |
| 클린 코드·단일 책임·아키텍처 경계 | 사용자 요구 |
| Vercel + Firestore 우선 | 사용자 채택 완료. 계정 연결 전 |
| 현재 코드 작업 | 사용자 1명, `main` 직접 작업, 기능 완료마다 검증 후 커밋 |
| Cloudflare Workers 허용 | 사용자 제시 대안 |
| 새 도메인 구매 여부 | 사용자가 결정 |
| 디자인 레퍼런스 | ref/ 4장 수령. DESIGN.md 기준으로 구현 |
| LLM | 사용자 보유 OpenRouter 크레딧으로 서버 API 호출. 모델·사용량 예산은 연결 시 결정 |
| 배포·DB 연결 준비 | 사용자가 담당 |

## Vercel과 공개 Organization 저장소

공개 저장소의 협업은 무료로 안내된다. Hobby가 제한하는 **비공개 Organization 저장소 배포**와 현재 상황을 구분해야 한다. 다만 GitHub의 협업 권한과 Vercel 대시보드의 팀 권한은 같지 않다. 현재는 사용자가 코드와 배포 설정을 혼자 관리하고 `main`에서 작업한다. 실제 연결 때 사용자 커밋과 `main`의 배포 동작을 확인한다. [Vercel Git 연동](https://vercel.com/docs/git), [협업 안내](https://vercel.com/docs/deployments/troubleshoot-project-collaboration)

Hobby는 개인·비상업 용도로 제한된다. 공개 저장소라는 사실만으로 이 조건까지 충족하는 것은 아니다. 현재 공모전 시제품의 실제 운영 방식에 적용 가능한지 확인하고, 수익화·사업 운영 단계에서는 다시 판단한다. 무료 한도 초과 시 기능 사용이 중단될 수 있다. [Hobby 플랜](https://vercel.com/docs/plans/hobby)

공개 저장소를 개인 계정에 복제하거나 커밋 작성자를 바꾸는 우회 방식을 운영 계획으로 삼지 않는다. 실제 연동이 어려우면 플랫폼을 바꾼다.

## DB 무료 플랜 비교

아래 수치는 조회일 기준이다. 무료 제공량과 결제 계정을 연결한 뒤 적용되는 무상 사용량을 구분한다.

| 선택지 | 주요 무료 제공량 | PawProof에서의 장점 | 제약과 판단 |
|---|---|---|---|
| **Firestore Standard / Spark** | 저장 1 GiB, 읽기 50,000건/일, 쓰기 20,000건/일, 삭제 20,000건/일, 외부 전송 10 GiB/월 | 소규모 문서 저장에 충분하고 별도 DB 서버 관리 불필요 | 조인·복잡한 통계에 불리. 우선 선택 |
| **Supabase Free** | DB 500 MB, 파일 1 GB, egress 5 GB 및 별도 cached egress 5 GB, 활성 프로젝트 2개 | PostgreSQL, SQL 관계·관리 도구 | 1주 비활동 시 일시정지, 자동 백업 미포함. 10월 심사 운영에서 고려 필요 |
| **Cloudflare D1 Free** | 읽은 행 500만/일, 쓴 행 10만/일, 계정 합계 5 GB | Workers와 같은 환경에서 SQL 사용 | 무료 DB 하나는 최대 500 MB. Firestore 요청 수와 다른 과금 단위. Workers를 선택할 때 함께 검토 |
| 기존 OCI의 DB | 관리형 무료 플랜이 아닌 보유 서버 자원 사용 | 이미 있는 인프라 활용 | 실제 OCI 요금·여유 자원·백업·장애 대응은 별도 확인. 운영 책임 증가 |

출처: [Firebase 가격](https://firebase.google.com/pricing), [Firestore 할당량](https://firebase.google.com/docs/firestore/quotas), [Supabase 가격](https://supabase.com/pricing), [D1 가격](https://developers.cloudflare.com/d1/platform/pricing/), [D1 제한](https://developers.cloudflare.com/d1/platform/limits/).

Firestore 무료 할당량은 프로젝트당 DB 하나에 적용된다. TTL 삭제·백업·PITR 등은 위 무료량에 포함되지 않는다. 따라서 Spark에서 유료 TTL 기능을 전제로 설계하지 않는다. [Firestore 할당량](https://firebase.google.com/docs/firestore/quotas)

**Firebase Authentication과 Firestore를 사용한다.** 2026-09-12 사용자 요청으로 인증을 추가했으며, Cloud Functions·Storage 등은 도입하지 않는다. Next.js 서버 기능은 Vercel에서 실행한다. Firebase Cloud Functions와 App Hosting은 Spark만으로 운영하는 선택지가 아니며, Cloud Storage도 2026년 2월 3일부터 사용 유지에 Blaze가 필요하다. 초기 제품에 파일 업로드가 필수적이지 않으므로 이를 추가할 이유가 없다. [Firebase 가격](https://firebase.google.com/pricing), [Storage 변경 안내](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024?hl=en)

현재 DB를 선택하는 이유는 사용자 작성 데이터와 자체 운영 정보의 소규모 저장이다. 관광정보를 대량 적재하기 위한 선택이 아니다. 첫 비로그인 검증 흐름은 영구 저장 없이도 성립하도록 만든다.

## Cloudflare Workers는 언제 더 좋은가

Workers는 충분히 검토할 만한 대안이다. GitHub 연동으로 배포할 수 있고, D1과 함께 구성하면 호스팅과 SQL DB를 Cloudflare 안에서 관리할 수 있다. GitHub 앱은 필요한 저장소에만 접근하도록 설정한다. [Workers GitHub 연동](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/)

다만 무료 Workers는 동적 요청 100,000회/일과 요청당 CPU 10 ms 제한이 있다. 외부 응답을 기다리는 시간과 CPU 시간은 다르지만, Next.js 렌더링·JSON 처리·검증 로직은 CPU를 사용한다. 요청 수가 적어도 CPU 제한에 걸릴 수 있다. [Workers 가격](https://developers.cloudflare.com/workers/platform/pricing/), [Workers 제한](https://developers.cloudflare.com/workers/platform/limits/)

또한 현재 Cloudflare의 Next.js 안내는 신규 앱에 **베타인 vinext**를 권장하고, 기존 Next.js 앱용 OpenNext 경로도 안내한다. vinext는 Next.js API 표면을 구현하는 별도 Vite 기반 도구다. 따라서 ‘Cloudflare에서 Next를 선택하면 Vercel과 같은 실행 환경’이라고 전제하지 않는다. [현재 Next.js 안내](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)

PawProof가 Cloudflare로 전환한다면 실제 Next.js 코드를 유지하는 **OpenNext 어댑터**를 먼저 검증한다. 이는 이 프로젝트의 호환성과 Node 배포 대안 보존을 위한 선택이며, Cloudflare의 신규 앱 기본 권고와 구분한다. Node 호환 계층이 모든 Node SDK를 지원한다고 가정하지 않는다. [Cloudflare OpenNext 안내](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/), [OpenNext 지원 범위](https://opennext.js.org/cloudflare)

전환 판단은 반나절 이내의 작은 실험으로 한다. 실제 페이지, Route Handler, 외부 API, DB, 스트리밍 또는 일반 응답, 배포 후 CPU를 확인한다. 한도에 맞추려고 핵심 기능을 약화해야 한다면 기존 OCI의 Node 배포를 검토한다. Workers 유료 플랜으로 자동 전환하지 않는다.

## 프레임워크와 라이브러리 범위

| 역할 | 제안 |
|---|---|
| 웹·서버 | Next.js App Router, 기본 Node.js 서버 런타임 |
| 언어·패키지 | TypeScript strict, pnpm 및 lockfile |
| UI | React + 기능별 CSS, Pretendard 로컬 폰트. DESIGN.md 기준 |
| 입력·응답 검증 | Zod 등 런타임 스키마 검증 도구 하나 |
| DB 접근 | 서버 전용 Firestore 어댑터. 브라우저 DB 직접 접근은 초기 범위에서 제외 |
| 상태 | 화면 단위 React 상태 우선. 전역 상태 라이브러리는 실제 필요가 생길 때 |
| 테스트 | 규칙·일정·경로 유틸 단위 테스트, 핵심 사용 흐름 브라우저 테스트 |

버전은 개발 착수 시 배포 환경이 지원하는 안정 버전으로 정하고 정확한 버전과 lockfile을 기록한다. Next.js 실험 기능·베타 런타임·여러 ORM을 동시에 도입하지 않는다. 버전 번호만 최신으로 올리는 작업은 제출 직전에 하지 않는다.

초기 구현은 Next.js 16.3.4, React 19.3.0, TypeScript 5.9.3, pnpm 12.3.4, Node.js 24.x를 사용한다. 정확한 의존성은 루트 `package.json`과 `pnpm-lock.yaml`이 기준이다. OpenRouter는 추후 서버의 규정 추출 어댑터에서 연결한다. [OpenRouter API 안내](https://openrouter.ai/docs/quickstart)

세부 구조는 [아키텍처](ARCHITECTURE.md), 경로 설정은 [개발 환경](DEVELOPMENT_ENVIRONMENT.md), 무료 운영 기준은 [호스팅·비용](../operations/HOSTING_AND_COST.md)을 따른다.
