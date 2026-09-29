import Link from "next/link";
import type { Metadata } from "next";
import { ContentJsonLd } from "../../../components/seo/content-json-ld";
import { Icon } from "../../../components/icon";
import { SiteFooter } from "../../../components/site-footer";
import { SiteHeader } from "../../../components/site-header";
import { siteOrigin } from "../../../config/site";

const pageUrl = `${siteOrigin}/guide/dog-friendly-travel`;
const publishedDate = "2026-09-29";
const title = "반려견 동반여행 준비 체크리스트와 가이드 | PawProof";
const description =
  "반려견 동반여행을 떠나기 전 확인할 장소 조건, 실내외 구분, 준비물과 업체 문의 방법을 PawProof의 여행 코스 기준으로 정리했습니다.";

const faqs = [
  {
    question: "반려견 동반여행에서 가장 먼저 확인할 것은 무엇인가요?",
    answer:
      "장소가 반려견 동반을 허용하는지뿐 아니라 실내·야외 구역, 견종·체중·마릿수, 목줄·이동장·예약과 추가요금 조건을 함께 확인해야 합니다.",
  },
  {
    question: "공식 데이터에 동반 조건이 없으면 방문할 수 있나요?",
    answer:
      "조건이 확인되지 않은 경우에는 이용 가능으로 단정하지 않는 것이 안전합니다. PawProof는 확인 필요로 남기고 업체의 최신 공식 안내나 문의를 통해 확인하도록 안내합니다.",
  },
  {
    question: "반려견 동반여행 준비물은 무엇인가요?",
    answer:
      "기본적으로 목줄과 배변봉투를 준비하고, 장소와 반려견 조건에 따라 이동장·유모차·입마개·예약·추가요금 여부를 확인합니다.",
  },
  {
    question: "PawProof의 이용 가능 결과만으로 입장이 보장되나요?",
    answer:
      "아닙니다. PawProof의 결과는 조회한 안내와 입력한 조건을 비교한 사전 확인 결과이며, 실제 입장·예약·좌석을 보장하지 않습니다. 출발 전 업체의 최신 안내를 다시 확인해야 합니다.",
  },
];

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/guide/dog-friendly-travel" },
  openGraph: {
    type: "article",
    title,
    description,
    url: "/guide/dog-friendly-travel",
    publishedTime: publishedDate,
    modifiedTime: publishedDate,
    images: [
      {
        url: "/media/travel-companion.jpg",
        width: 900,
        height: 600,
        alt: "반려견과 함께 떠나는 PawProof 여행",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/media/travel-companion.jpg"],
  },
};

export default function DogFriendlyTravelGuide() {
  return (
    <>
      <SiteHeader compact />
      <ContentJsonLd
        title={title}
        description={description}
        image={`${siteOrigin}/media/travel-companion.jpg`}
        url={pageUrl}
        datePublished={publishedDate}
        dateModified={publishedDate}
        breadcrumbs={[
          { name: "PawProof", url: `${siteOrigin}/` },
          { name: "반려견 동반여행 준비 가이드", url: pageUrl },
        ]}
        faqs={faqs}
      />
      <main id="main" className="seo-content-page wrap">
        <header className="seo-content-hero">
          <div>
            <p className="eyebrow">
              <span /> PAWPROOF FIELD GUIDE
            </p>
            <h1>
              반려견 동반여행,
              <br />
              출발 전에 이렇게 확인하세요
            </h1>
            <p className="seo-content-lead">
              함께 떠나는 여행은 장소를 고르는 순간부터 시작됩니다. 우리 강아지의
              조건과 장소의 안내를 한 번 더 맞춰보고, 현장에서 당황할 일을 줄이는
              준비 순서를 정리했어요.
            </p>
            <div className="seo-content-actions">
              <Link href="/plan" className="button">
                내 코스 확인하기 <Icon name="arrow" />
              </Link>
              <Link href="/regions/gyeonggi-northwest" className="text-button">
                경기 북서부 지역 보기 <Icon name="arrow" size={16} />
              </Link>
            </div>
          </div>
          <aside className="seo-note" aria-label="가이드 기준">
            <Icon name="paw" size={31} />
            <strong>좋은 여행의 첫 단계</strong>
            <p>동반 가능 여부보다, 우리 여행에 맞는 조건을 먼저 살펴보세요.</p>
            <time dateTime={publishedDate}>2026년 9월 29일 업데이트</time>
          </aside>
        </header>

        <div className="seo-content-body">
          <article className="seo-article">
            <section aria-labelledby="why-check">
              <p className="eyebrow">01 · START WITH THE REAL QUESTION</p>
              <h2 id="why-check">“반려견 동반 가능”만으로는 충분하지 않아요</h2>
              <p>
                같은 장소라도 야외 산책로는 가능하고 실내 공간은 제한될 수 있습니다.
                소형견만 허용하거나 체중·견종·마릿수에 따라 조건이 달라지는 곳도
                있어요. 목줄, 이동장, 입마개, 예약, 추가요금처럼 출발 전에 준비할
                항목이 따로 안내되기도 합니다.
              </p>
              <p>
                그래서 반려견 동반여행은 장소 이름만 모으는 것보다 <strong>우리 강아지의
                조건과 방문하려는 구역을 장소별 안내에 대조하는 일</strong>이 먼저입니다.
                PawProof는 확인된 조건, 준비하면 해결되는 조건, 아직 업체에 물어봐야
                하는 조건을 나누어 여행 노트에 남깁니다.
              </p>
            </section>

            <section aria-labelledby="check-order">
              <p className="eyebrow">02 · A SMALL CHECKLIST</p>
              <h2 id="check-order">출발 전 확인 순서</h2>
              <ol className="seo-checklist">
                <li>
                  <span>01</span>
                  <div>
                    <h3>함께 가는 반려견을 정리해요</h3>
                    <p>견종, 체중, 마릿수와 함께 방문할 실내·야외 구역을 정합니다.</p>
                  </div>
                </li>
                <li>
                  <span>02</span>
                  <div>
                    <h3>장소의 원문 안내를 확인해요</h3>
                    <p>출처와 확인 시점을 보고 동반 조건, 운영시간, 예약 여부를 살펴봅니다.</p>
                  </div>
                </li>
                <li>
                  <span>03</span>
                  <div>
                    <h3>준비하면 해결되는 항목을 챙겨요</h3>
                    <p>목줄·배변봉투부터 이동장·유모차·입마개까지 장소별 요구를 구분합니다.</p>
                  </div>
                </li>
                <li>
                  <span>04</span>
                  <div>
                    <h3>모호한 내용은 직접 확인해요</h3>
                    <p>정보가 없거나 서로 다르면 업체에 보낼 질문을 만들고 최신 안내를 확인합니다.</p>
                  </div>
                </li>
              </ol>
            </section>

            <section aria-labelledby="four-states">
              <p className="eyebrow">03 · READ THE RESULT</p>
              <h2 id="four-states">결과를 네 가지로 나누는 이유</h2>
              <div className="seo-status-grid">
                <div className="seo-status-item available">
                  <strong>이용 가능</strong>
                  <p>입력한 조건과 확인된 안내가 맞아요.</p>
                </div>
                <div className="seo-status-item prepare">
                  <strong>준비 필요</strong>
                  <p>필요한 준비를 적용한 뒤 다시 확인해요.</p>
                </div>
                <div className="seo-status-item confirm">
                  <strong>확인 필요</strong>
                  <p>정보가 부족하거나 최신 확인이 필요해요.</p>
                </div>
                <div className="seo-status-item blocked">
                  <strong>이용 불가</strong>
                  <p>현재 조건과 명시된 제한이 맞지 않아요.</p>
                </div>
              </div>
              <p>
                정보가 비어 있다고 해서 이용 가능으로 바꾸지 않는 것이 중요합니다.
                결과가 좋게 보이는 것보다, 남아 있는 확인 부담을 정확히 보여주는
                것이 현장 헛걸음을 줄이는 데 도움이 됩니다.
              </p>
            </section>

            <section aria-labelledby="sources">
              <p className="eyebrow">04 · USE THE SOURCE</p>
              <h2 id="sources">공식 정보와 현장 안내를 함께 보세요</h2>
              <p>
                PawProof의 실제 모드는 한국관광공사 관광정보와 장소 안내를 바탕으로
                조건을 정리합니다. 음식점은 식품안전나라의 반려동물 동반출입 안내를
                참고할 수 있지만, 목록 등재만으로 모든 실내·체중·마릿수 조건이
                확정되는 것은 아닙니다.
              </p>
              <div className="seo-source-links">
                <a href="https://api.visitkorea.or.kr/" target="_blank" rel="noreferrer">
                  한국관광공사 관광데이터 <Icon name="arrow" size={15} />
                </a>
                <a href="https://www.foodsafetykorea.go.kr/portal/petKorea.do" target="_blank" rel="noreferrer">
                  식품안전나라 반려동물 동반출입 음식점 <Icon name="arrow" size={15} />
                </a>
              </div>
              <p className="seo-caution">
                출처의 조회 시점과 업체가 실제로 정책을 확인한 시점은 다를 수 있어요.
                예약이나 방문 직전에는 업체의 최신 공지를 다시 확인해 주세요.
              </p>
            </section>

            <section aria-labelledby="faq">
              <p className="eyebrow">05 · BEFORE YOU GO</p>
              <h2 id="faq">반려견 동반여행 자주 묻는 질문</h2>
              <div className="seo-faq-list">
                {faqs.map((faq) => (
                  <details key={faq.question}>
                    <summary>{faq.question}</summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          </article>

          <aside className="seo-content-sidebar" aria-label="여행 준비 링크">
            <div className="seo-sidebar-card">
              <p className="eyebrow">NEXT STEP</p>
              <h2>이제 우리 코스를 살펴볼까요?</h2>
              <p>반려견 정보를 입력하고 실제 장소 또는 가상 코스를 여행 노트에 담아보세요.</p>
              <Link href="/plan" className="text-button">
                여행 노트 열기 <Icon name="arrow" size={16} />
              </Link>
            </div>
            <nav className="seo-related-links" aria-label="관련 콘텐츠">
              <strong>더 살펴보기</strong>
              <Link href="/regions/gyeonggi-northwest">
                고양·파주·양주 반려견 여행 <Icon name="arrow" size={15} />
              </Link>
              <Link href="/about">
                PawProof가 정보를 확인하는 방법 <Icon name="arrow" size={15} />
              </Link>
              <Link href="/contact">
                장소 정보 알려주기 <Icon name="arrow" size={15} />
              </Link>
            </nav>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
