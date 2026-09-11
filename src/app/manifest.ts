import type { MetadataRoute } from "next";
import { appPath, publicAssetPath } from "../config/public";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: appPath("/"),
    name: "PawProof · 반려견 여행 노트",
    short_name: "PawProof",
    description: "우리 강아지와 떠나는 여행, 방문 조건부터 출발 준비까지.",
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
