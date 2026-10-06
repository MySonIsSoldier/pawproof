import { publicAssetPath } from "./public";
import { siteOrigin } from "./site";

const src = publicAssetPath("/media/travel-companion.jpg");

/** One shared editorial cover for article pages and search previews. */
export const articleCover = {
  src,
  url: new URL(src, siteOrigin).toString(),
  width: 900,
  height: 600,
  alt: "바닷가에서 바람을 맞으며 서 있는 반려견",
} as const;
