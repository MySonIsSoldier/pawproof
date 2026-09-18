export const umamiConfig = {
  websiteId: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim() || "",
  scriptUrl:
    process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL?.trim() ||
    "https://umami.hothyun.com/script.js",
  domains: process.env.NEXT_PUBLIC_UMAMI_DOMAINS?.trim() || "",
};

export const umamiEnabled = Boolean(umamiConfig.websiteId);
