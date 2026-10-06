import { siteOrigin } from "../../config/site";
import { articleCover } from "../../config/article-cover";
import type { Article } from "../../application/contracts/article";

export function ArticleJsonLd({ article }: { article: Article }) {
  const url = `${siteOrigin}/articles/${article.slug}`;
  const graph = [
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: article.title,
      description: article.summary,
      inLanguage: "ko-KR",
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      isPartOf: { "@id": `${siteOrigin}/#website` },
    },
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: article.title,
      description: article.summary,
      url,
      inLanguage: "ko-KR",
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      keywords: article.tags,
      image: [articleCover.url],
      author: { "@id": `${siteOrigin}/#organization` },
      publisher: { "@id": `${siteOrigin}/#organization` },
      mainEntityOfPage: { "@id": `${url}#webpage` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "PawProof",
          item: siteOrigin,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "반려견 알아가기",
          item: `${siteOrigin}/articles`,
        },
        { "@type": "ListItem", position: 3, name: article.title, item: url },
      ],
    },
  ];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": graph,
        }).replace(/</g, "\\u003c"),
      }}
    />
  );
}
