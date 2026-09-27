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
        "반려견의 조건과 장소별 동반 규정을 여행 일정에 대조하는 PawProof 서비스입니다.",
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: "PawProof",
      alternateName: "포프루프",
      url: siteOrigin,
      inLanguage: "ko-KR",
      description:
        "반려견의 조건과 장소별 동반 규정을 확인하고 여행 코스를 출발 전에 점검하는 웹앱입니다.",
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
        "반려견의 견종·체중·마릿수와 장소별 동반 규정을 대조하고 준비사항과 대체 코스를 안내하는 여행 앱입니다.",
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
