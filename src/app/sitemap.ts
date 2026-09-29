import type { MetadataRoute } from "next";
import { appPath } from "../config/public";
import { siteOrigin } from "../config/site";

export default function sitemap(): MetadataRoute.Sitemap {
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
      url: `${siteOrigin}${appPath("/regions/gyeonggi-northwest")}`,
      lastModified: new Date("2026-09-29"),
      changeFrequency: "monthly",
      priority: 0.8,
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
