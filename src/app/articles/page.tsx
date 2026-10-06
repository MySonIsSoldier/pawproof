import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import {
  getPublicArticleTags,
  getPublicArticles,
} from "../../server/public-articles";
import { ArticleTagFilters } from "./article-tag-filters";
import styles from "./articles.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  let hasPublishedArticle = false;
  try {
    hasPublishedArticle = (await getPublicArticles()).articles.length > 0;
  } catch {
    // A disconnected Preview must not expose an empty editorial page to crawlers.
  }
  return {
    title: "반려견 알아가기",
    description:
      "처음 반려견과 살아가는 보호자도 편하게 읽을 수 있는 행동·소통·돌봄 이야기를 모았습니다.",
    alternates: { canonical: "/articles" },
    robots: hasPublishedArticle
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function displayDate(value: string | null) {
  if (!value) return "발행일 미정";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const tag = single(params.tag)?.trim().slice(0, 30) || undefined;
  const cursor = single(params.cursor)?.slice(0, 512) || undefined;
  let result = { articles: [], nextCursor: null } as Awaited<
    ReturnType<typeof getPublicArticles>
  >;
  let tags: Awaited<ReturnType<typeof getPublicArticleTags>> = [];
  let available = true;
  try {
    [result, tags] = await Promise.all([
      getPublicArticles(tag, cursor),
      getPublicArticleTags(),
    ]);
  } catch {
    available = false;
  }
  const first = result.articles[0];

  return (
    <>
      <SiteHeader />
      <main id="main" className={`${styles.page} wrap`}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>
              PAWPROOF READING ROOM · 반려견 알아가기
            </p>
            <h1>
              우리 강아지를
              <br />
              조금 더 알아가는 시간
            </h1>
            <p className={styles.intro}>
              처음 함께 살기 시작한 날부터 행동과 소통, 일상 돌봄과 나들이까지.
              반려견을 알아가며 생기는 질문에 차근차근 답하는 이야기를 모아요.
            </p>
          </div>
          <div className={styles.heroAside}>
            <span>읽는 시간</span>
            <strong>5분 안팎</strong>
            <span className={styles.asideRule} />
            <span>차분하게 읽고</span>
            <strong>함께 해봐요</strong>
          </div>
        </header>

        <ArticleTagFilters tags={tags} selectedTag={tag} />

        {!available ? (
          <section className={styles.emptyState} role="status">
            <span className={styles.emptyMark}>읽을거리</span>
            <h2>아티클을 잠시 불러오지 못했어요.</h2>
            <p>연결을 확인한 뒤 다시 방문해 주세요.</p>
          </section>
        ) : result.articles.length === 0 ? (
          <section className={styles.emptyState}>
            <span className={styles.emptyMark}>다음 이야기를 준비 중</span>
            <h2>
              {tag
                ? `“${tag}” 글을 준비하고 있어요.`
                : "첫 번째 이야기를 준비하고 있어요."}
            </h2>
            <p>새 글은 검수한 뒤 이곳에 차근차근 공개할게요.</p>
          </section>
        ) : (
          <section className={styles.collection} aria-label="최근 아티클">
            {first && !cursor && !tag && (
              <article className={styles.featured}>
                <div className={styles.featuredNumber}>01 / LATEST NOTE</div>
                <div className={styles.featuredContent}>
                  <div className={styles.tags}>
                    {first.tags.map((item) => (
                      <Link
                        href={`/articles?tag=${encodeURIComponent(item)}`}
                        key={item}
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                  <h2>
                    <Link href={`/articles/${first.slug}`}>{first.title}</Link>
                  </h2>
                  <p>{first.summary}</p>
                  <div className={styles.cardMeta}>
                    <time dateTime={first.publishedAt ?? undefined}>
                      {displayDate(first.publishedAt)}
                    </time>
                    <Link
                      className={styles.featuredReadLink}
                      href={`/articles/${first.slug}`}
                      aria-label={`${first.title} 아티클 읽기`}
                    >
                      차분히 읽어보기 <span aria-hidden="true">↗</span>
                    </Link>
                  </div>
                </div>
                <div className={styles.featuredSeal} aria-hidden="true">
                  <span>작은 관찰</span>
                  <strong>
                    함께 사는
                    <br />
                    지혜
                  </strong>
                  <span>PAWPROOF · EDITION</span>
                </div>
              </article>
            )}
            <div className={styles.gridHeading}>
              <h2>{tag ? `${tag}에 관한 글` : "천천히 읽어볼 이야기"}</h2>
              <span>
                {tag ? `태그 · ${tag}` : "FIELD NOTES FOR DOG PEOPLE"}
              </span>
            </div>
            <div className={styles.grid}>
              {result.articles.map((article, index) => (
                <article className={styles.card} key={article.id}>
                  <div className={styles.cardTopline}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <time dateTime={article.publishedAt ?? undefined}>
                      {displayDate(article.publishedAt)}
                    </time>
                  </div>
                  <h3>
                    <Link href={`/articles/${article.slug}`}>
                      {article.title}
                    </Link>
                  </h3>
                  <p>{article.summary}</p>
                  <div className={styles.cardBottom}>
                    <div className={styles.tags}>
                      {article.tags.slice(0, 3).map((item) => (
                        <Link
                          href={`/articles?tag=${encodeURIComponent(item)}`}
                          key={item}
                        >
                          #{item}
                        </Link>
                      ))}
                    </div>
                    <Link
                      className={styles.readLink}
                      href={`/articles/${article.slug}`}
                      aria-label={`${article.title} 읽기`}
                    >
                      읽기 <span aria-hidden="true">↗</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            {result.nextCursor && (
              <div className={styles.more}>
                <Link
                  href={`/articles?${new URLSearchParams({
                    ...(tag ? { tag } : {}),
                    cursor: result.nextCursor,
                  })}`}
                >
                  다음 이야기 더 보기 <span aria-hidden="true">↓</span>
                </Link>
              </div>
            )}
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
