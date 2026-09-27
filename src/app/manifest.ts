import type { MetadataRoute } from "next";
import { appPath, publicAssetPath } from "../config/public";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: appPath("/"),
    name: "PawProof · 반려견과 함께하는 좋은 여행",
    short_name: "PawProof",
    description: "우리 강아지와 가고 싶은 곳을 미리 살펴보고 여행을 준비해요.",
    lang: "ko",
    start_url: appPath("/plan"),
    scope: appPath("/"),
    display: "standalone",
    background_color: "#fafbf7",
    theme_color: "#2f6b50",
    icons: [
      {
        src: publicAssetPath("/pwa/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: publicAssetPath("/pwa/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: publicAssetPath("/pwa/icon-maskable-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "가상 코스로 체험하기", url: appPath("/plan?mode=demo") },
    ],
  };
}
