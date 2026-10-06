import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleJsonLd } from "../../../components/articles/article-json-ld";
import { MarkdownContent } from "../../../components/articles/markdown-content";
import { articleCover } from "../../../config/article-cover";
import { SiteFooter } from "../../../components/site-footer";
import { SiteHeader } from "../../../components/site-header";
import { getPublicArticleBySlug } from "../../../server/public-articles";
import styles from "../article-detail.module.css";

export const dynamic = "force-dynamic";

type ArticlePageProps = { params: Promise<{ slug: string }> };

async function articleFromParams(params: ArticlePageProps["params"]) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return getPublicArticleBySlug(slug);
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const article = await articleFromParams(params);
  if (!article)
    return { title: "아티클을 찾을 수 없습니다", robots: { index: false } };
  const canonical = `/articles/${article.slug}`;
  return {
    title: article.title,
    description: article.summary,
    keywords: article.tags,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary,
      url: canonical,
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.updatedAt,
      tags: article.tags,
      images: [
        {
          url: articleCover.url,
          width: articleCover.width,
          height: articleCover.height,
          alt: articleCover.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary,
      images: [articleCover.url],
    },
  };
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const article = await articleFromParams(params);
  if (!article) notFound();

  return (
    <>
      <SiteHeader compact />
      <ArticleJsonLd article={article} />
      <main id="main" className={`${styles.page} wrap`}>
        <Link href="/articles" className={styles.backLink}>
          <span aria-hidden="true">←</span> 반려견 알아가기
        </Link>
        <article>
          <header className={styles.header}>
            <p className={styles.kicker}>PAWPROOF FIELD NOTE</p>
            <div className={styles.tags}>
              {article.tags.map((tag) => (
                <Link
                  href={`/articles?tag=${encodeURIComponent(tag)}`}
                  key={tag}
                >
                  {tag}
                </Link>
              ))}
            </div>
            <h1>{article.title}</h1>
            <p className={styles.summary}>{article.summary}</p>
            <div className={styles.meta}>
              <span>PAWPROOF 편집팀</span>
              <time dateTime={article.publishedAt ?? article.createdAt}>
                {displayDate(article.publishedAt ?? article.createdAt)} 발행
              </time>
              {article.updatedAt !== article.publishedAt && (
                <time dateTime={article.updatedAt}>
                  {displayDate(article.updatedAt)} 수정
                </time>
              )}
            </div>
          </header>
          <figure className={styles.cover}>
            <Image
              src={articleCover.src}
              alt={articleCover.alt}
              width={articleCover.width}
              height={articleCover.height}
              sizes="(max-width: 932px) calc(100vw - 2rem), 900px"
              fetchPriority="high"
              className={styles.coverImage}
            />
          </figure>
          <MarkdownContent
            body={article.body}
            className={`${styles.body} article-markdown`}
          />
          <aside className={styles.editorialNote}>
            <span>PAWPROOF NOTE</span>
            <p>
              반려견마다 건강 상태와 생활 환경은 달라요. 글의 내용을 우리
              강아지에게 적용하기 전, 필요한 경우 수의사나 전문가와 상의해
              주세요.
            </p>
          </aside>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
