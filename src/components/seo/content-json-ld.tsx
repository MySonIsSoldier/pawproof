import { siteOrigin } from "../../config/site";

type BreadcrumbItem = {
  name: string;
  url: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type ContentJsonLdProps = {
  title: string;
  description: string;
  image: string;
  url: string;
  datePublished: string;
  dateModified: string;
  breadcrumbs: BreadcrumbItem[];
  faqs: FaqItem[];
};

export function ContentJsonLd({
  title,
  description,
  image,
  url,
  datePublished,
  dateModified,
  breadcrumbs,
  faqs,
}: ContentJsonLdProps) {
  const pageId = `${url}#webpage`;
  const articleId = `${url}#article`;
  const breadcrumbId = `${url}#breadcrumb`;
  const faqId = `${url}#faq`;
  const graph = [
    {
      "@type": "WebPage",
      "@id": pageId,
      url,
      name: title,
      description,
      inLanguage: "ko-KR",
      datePublished,
      dateModified,
      isPartOf: { "@id": `${siteOrigin}/#website` },
      breadcrumb: { "@id": breadcrumbId },
    },
    {
      "@type": "Article",
      "@id": articleId,
      headline: title,
      description,
      url,
      inLanguage: "ko-KR",
      datePublished,
      dateModified,
      image,
      author: { "@id": `${siteOrigin}/#organization` },
      publisher: { "@id": `${siteOrigin}/#organization` },
      mainEntityOfPage: { "@id": pageId },
    },
    {
      "@type": "BreadcrumbList",
      "@id": breadcrumbId,
      itemListElement: breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    },
    {
      "@type": "FAQPage",
      "@id": faqId,
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
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
