import type { MetadataRoute } from "next";
import { appPath } from "../config/public";
import { siteOrigin } from "../config/site";
import { getPublicArticlesForSitemap } from "../server/public-articles";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getPublicArticlesForSitemap();
  return [
    {
      url: `${siteOrigin}${appPath("/")}`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteOrigin}${appPath("/about")}`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteOrigin}${appPath("/contact")}`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteOrigin}${appPath("/guide/dog-friendly-travel")}`,
      lastModified: new Date("2026-09-29"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteOrigin}${appPath("/articles")}`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...articles.map((article) => ({
      url: `${siteOrigin}${appPath(`/articles/${article.slug}`)}`,
      lastModified: new Date(article.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${siteOrigin}${appPath("/regions/gyeonggi-northwest")}`,
      lastModified: new Date("2026-09-29"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteOrigin}${appPath("/regions/seoul-myeongdong")}`,
      lastModified: new Date("2026-09-29"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: siteOrigin + appPath("/privacy"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: siteOrigin + appPath("/terms"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
