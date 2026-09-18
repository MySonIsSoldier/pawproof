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
  ];
}
