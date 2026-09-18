import type { MetadataRoute } from "next";
import { appPath } from "../config/public";
import { siteOrigin } from "../config/site";

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV
    ? process.env.VERCEL_ENV === "production"
    : process.env.APP_ENV === "production";
  return {
    rules: isProduction
      ? {
          userAgent: "*",
          allow: "/",
          disallow: ["/api/", appPath("/plan"), appPath("/profile"), appPath("/offline")],
        }
      : { userAgent: "*", disallow: "/" },
    sitemap: `${siteOrigin}${appPath("/sitemap.xml")}`,
  };
}
