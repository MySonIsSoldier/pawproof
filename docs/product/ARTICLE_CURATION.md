# PawProof 반려견 알아가기 콘텐츠

기준일: 2026-10-05

상태: 구현 기준. 운영 Firebase 연결과 수집 토큰 설정은 배포 환경에서 별도로 완료해야 한다.

## 목표

반려견에 관한 정보를 누구나 쉽게 찾아 읽을 수 있는 블로그형 콘텐츠를 만든다. 특히 처음 반려견을 키우는 보호자가 행동·소통·일상 돌봄에 관한 질문을 편하게 읽고, 근거와 다정한 설명을 바탕으로 자기 반려견을 이해하도록 돕는다. 외출과 여행도 중요한 주제지만 모든 글을 PawProof의 제품 기능에 맞추지는 않는다.

글은 태그로 찾아볼 수 있고 운영자가 검수한 뒤 공개한다. ChatGPT 예약 작업 등 자동화는 글을 **비공개 초안**으로만 생성하며, 공개 여부는 관리자가 편집 화면에서 결정한다.

브랜드 방향은 초보 보호자가 반려견을 이해하도록 돕는 데 두고, 주제 우선순위·키워드 후보와 글별 진척은 [아티클 편집 계획](ARTICLE_EDITORIAL_PLAN.md)에서 관리한다. AI 에이전트가 글을 조사·작성할 때는 [아티클 작성 system prompt](ARTICLE_WRITING_SYSTEM_PROMPT.md)와 그 문서가 연결한 제품·출처 기준을 따른다. 키워드 검색량은 실제로 확인하기 전까지 미검증 가설로 둔다.

## 제품 범위

- 공개 목록 `/articles`, 공개 상세 `/articles/[slug]`를 제공한다.
- 글은 제목, 고유 slug, 요약, Markdown 본문, 태그, 상태, 작성·수정·발행 시각을 가진다.
- 목록에서 태그로 글을 좁혀보고 최신순으로 탐색한다.
- 관리자 `/admin/articles`와 편집기는 이메일 인증을 완료한 `ohsong656565@gmail.com` Google 계정만 접근할 수 있다.
- 관리자는 초안 작성, Markdown 미리보기, 기존 글 편집, 발행, 보관, 영구 삭제를 수행한다.
- 서버 간 수집 API는 공유 비밀 토큰으로 인증하고 새 글을 초안 상태로만 저장한다. 요청으로 상태나 발행 시각을 지정할 수 없다.
- 공개 페이지·메타데이터·사이트맵에는 `published` 상태의 글만 포함한다.
- 모든 상세 글 상단과 공유 미리보기에는 하나의 고정 대표 이미지를 재사용한다. 글별 이미지 선택·저장은 하지 않으며 이미지 업로드는 범위에서 제외한다.
- 댓글, 협업 편집, 스케줄러, 자동 발행, 별도 CMS/DB는 범위에서 제외한다.

## 상태와 전이

```text
draft ──관리자 발행──> published ──관리자 보관──> archived
  ▲                         │                         │
  └──── 관리자 초안 복귀 ────┴──── 관리자 초안 복귀 ────┘
```

- 생성 API는 항상 `draft`로 시작한다.
- `published` 전이는 지정된 Google 계정의 인증을 통과한 요청만 수행한다.
- 수정 시 `updatedAt`을 갱신한다. 발행 시 `publishedAt`을 기록하고, 초안 복귀 시 공개 목록에서 즉시 제외한다.
- 영구 삭제는 관리자만 할 수 있다. 보관은 복구 가능한 비공개 상태다.

## 저장 모델

Firestore의 `articles/{id}` 컬렉션에 PawProof가 직접 작성한 콘텐츠만 저장한다. 고유 slug는 `articleSlugs/{slug}` 예약 문서로 트랜잭션 안에서 점유해 동시에 같은 slug를 만드는 요청도 하나만 성공하게 한다. 공개 태그 조회 비용을 글 수에 비례시키지 않도록 `articleMetadata/publicTags` 문서에 공개 태그별 글 수를 보관한다. 발행·초안 복귀·보관·삭제·공개 글 태그 수정은 아티클과 태그 요약을 한 트랜잭션에서 함께 갱신한다. 공급자 원문이나 타 사이트 글을 복제하지 않는다.

```ts
type Article = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string; // Markdown
  tags: string[];
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  origin: "admin" | "automation";
};
```

날짜는 API 경계에서 ISO-8601 문자열로 변환한다. slug는 전체 상태에서 중복을 허용하지 않는다. 저장소 어댑터가 입력 검증 후 유일성을 확인한다.

## 인터페이스와 권한 경계

| 경로                                      | 권한                                     | 동작                          |
| ----------------------------------------- | ---------------------------------------- | ----------------------------- |
| `POST /api/articles/ingest`               | `ARTICLE_INGEST_TOKEN` Bearer 토큰       | 새 초안 생성만 가능           |
| `/api/admin/articles`                     | 이메일 인증된 지정 Google 계정의 Firebase ID token | 관리자 목록·생성              |
| `/api/admin/articles/[id]`                | 이메일 인증된 지정 Google 계정의 Firebase ID token | 단건 조회·수정·상태 변경·삭제 |
| `/articles`, `/articles/[slug]`           | 공개                                     | 발행 글만 조회                |
| `/admin/articles`, `/admin/articles/[id]` | 이메일 인증된 지정 Google 계정            | 관리자용 편집 UI              |

자동 수집 요청 예시는 다음 계약을 사용한다. 응답의 `status`는 서버가 부여하며 요청 본문에는 넣지 않는다.

```http
POST /api/articles/ingest
Authorization: Bearer <ARTICLE_INGEST_TOKEN>
Content-Type: application/json

{
  "title": "강아지가 산책 중 자꾸 멈추는 이유",
  "slug": "dog-stops-during-walk",
  "summary": "산책 중 멈추는 행동에서 살펴볼 만한 신호와 보호자가 해볼 수 있는 대응을 정리합니다.",
  "body": "## 먼저 주변을 살펴보세요\n\n본문 Markdown...",
  "tags": ["산책", "행동 이해"]
}
```

성공하면 `201`과 `article.status: "draft"`를 반환한다. 미설정 환경은 `503`, 잘못된 토큰은 `401`, 중복 slug는 `409`다.

Firebase Admin SDK는 Firestore Security Rules를 우회하므로 API가 매 요청마다 권한과 입력을 검증한다. 토큰은 서버 환경변수에만 두며 응답·로그·브라우저 번들에 노출하지 않는다. Preview/Development 환경에 Production Firebase Admin 자격증명이나 수집 토큰을 넣지 않는다.

## 사용자 흐름

1. 예약 작업이 `POST /api/articles/ingest`로 제목·slug·요약·본문·태그를 전송한다.
2. 서버가 토큰·크기·필드·slug·태그·Markdown 입력을 검사하고 `draft`로 저장한다.
3. 관리자는 운영 사이트에 로그인해 초안 목록에서 글을 선택한다.
4. Markdown을 편집하고 미리보기를 확인한다. 저장은 초안 상태를 유지한다.
5. 발행 버튼으로 공개한다. 보관·초안 복귀·삭제도 같은 관리자 화면에서 실행한다.
6. 공개 목록·상세·sitemap에는 게시된 글만 나타난다.

## 운영 환경

- Firestore의 `articles` 컬렉션, `articleSlugs` 예약 문서, `articleMetadata/publicTags` 요약 문서와 필요한 복합 인덱스를 사용한다. 기존 Firebase 프로젝트 및 계정 데이터와 분리 컬렉션으로 보관한다. 사이트맵은 500개씩 페이지를 읽고 Sitemap 프로토콜 한도보다 낮은 49,900개 아티클까지 포함한다.
- Production에는 긴 무작위 `ARTICLE_INGEST_TOKEN`을 설정한다. 관리자 계정은 `ohsong656565@gmail.com` Google 로그인으로 고정되며 UID 환경변수 설정은 필요하지 않다.
- Production 연결은 Vercel의 `VERCEL=1`, `VERCEL_ENV=production` 조합에서만 허용한다. Preview는 항상 차단하고, 로컬은 Auth와 Firestore 에뮬레이터가 모두 연결된 경우에만 허용한다. 로컬 에뮬레이터에서 전체 흐름을 검증하고 Preview는 공개 UI/레이아웃 검토에 사용한다.
- ChatGPT 예약 기능은 예약 작업 설정에서 Bearer 토큰을 안전하게 저장해 POST를 호출해야 한다. 예약 기능의 실제 HTTP 지원 여부는 별도로 확인한다.

## 구현 완료 조건

- 공개 페이지는 초안·보관 글을 전달하지 않으며 글 상세 metadata와 sitemap도 같은 공개 필터를 사용한다.
- 수집 API는 비밀 없는 요청, 잘못된 본문, 중복 slug를 거부하고 생성된 글을 항상 초안으로 저장한다.
- 관리자 API는 미인증 사용자, 이메일 미인증 사용자, 지정 이메일이 아니거나 Google provider가 아닌 계정을 거부한다. 편집기 화면도 같은 조건을 적용한다.
- 관리자는 목록·작성·수정·미리보기·발행·보관·초안 복귀·삭제를 수행할 수 있다.
- 외부 Markdown HTML 실행 없이 일반 Markdown 요소와 안전한 링크만 렌더링한다.
- 타입 검사, lint, 관련 단위/에뮬레이터 검증, 운영 빌드가 통과한다. Production 실계정 연결은 별도 운영 설정 이후 smoke 확인으로 기록한다.

## 알려진 운영 한계

이 구조는 1인 검수 운영에 맞춘 작은 CMS다. 초안 제출 토큰은 초안 생성 권한을 가지므로 유출 시 스팸 초안이 생길 수 있다. 토큰 회전과 Firestore 쓰기 한도 관리는 운영 책임이다. 내용의 사실성·수의학적 안전성·저작권 검토는 발행 전 관리자가 수행한다. 자동 작성 횟수만으로 검색 유입이나 콘텐츠 품질을 보장하지 않는다.
