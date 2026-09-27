import { publicAssetPath } from "../../config/public";
import { siteOrigin } from "../../config/site";

const organizationId = `${siteOrigin}/#organization`;
const websiteId = `${siteOrigin}/#website`;

const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: "PawProof",
      url: siteOrigin,
      logo: `${siteOrigin}${publicAssetPath("/pwa/icon-512.png")}`,
      description:
        "반려견과 함께 가고 싶은 곳을 미리 살펴보고 더 좋은 여행을 준비하는 PawProof 서비스입니다.",
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: "PawProof",
      alternateName: "포프루프",
      url: siteOrigin,
      inLanguage: "ko-KR",
      description:
        "반려견과 함께 가고 싶은 여행 코스를 미리 살펴보고 동반 조건과 준비사항을 확인하는 웹앱입니다.",
      publisher: { "@id": organizationId },
    },
    {
      "@type": "WebApplication",
      "@id": `${siteOrigin}/#web-application`,
      name: "PawProof",
      url: siteOrigin,
      applicationCategory: "TravelApplication",
      operatingSystem: "Web",
      inLanguage: "ko-KR",
      description:
        "우리 강아지의 조건에 맞는 장소와 준비사항을 살펴보고, 함께할 여행을 계획하는 앱입니다.",
      publisher: { "@id": organizationId },
    },
  ],
} as const;

export function SiteJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(siteJsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}
