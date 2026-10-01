import "server-only";
import { cache } from "react";
import type { ArticleSummary } from "../application/contracts/article";
import { articleRepository } from "./articles";

export const getPublicArticles = cache(async (tag?: string, cursor?: string) =>
  articleRepository().listPublished({ tag, cursor }),
);

export const getPublicArticleTags = cache(async () =>
  articleRepository().listPublishedTags(),
);

export const getPublicArticleBySlug = cache(async (slug: string) =>
  articleRepository().getPublishedBySlug(slug),
);

export const getPublicArticlesForSitemap = cache(async () => {
  const articles: ArticleSummary[] = [];
  const maxArticles = 49_900;
  let cursor: string | undefined;
  do {
    const page = await articleRepository().listPublishedForSitemap(cursor);
    articles.push(...page.articles);
    cursor = page.nextCursor ?? undefined;
  } while (cursor && articles.length < maxArticles);
  return articles.slice(0, maxArticles);
});
