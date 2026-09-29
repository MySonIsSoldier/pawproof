import Link from "next/link";
import type { Metadata } from "next";
import { ContentJsonLd } from "../../../components/seo/content-json-ld";
import { Icon } from "../../../components/icon";
import { SiteFooter } from "../../../components/site-footer";
import { SiteHeader } from "../../../components/site-header";
import { siteOrigin } from "../../../config/site";

const pageUrl = `${siteOrigin}/regions/gyeonggi-northwest`;
const publishedDate = "2026-09-29";
const title = "고양·파주·양주 반려견 동반여행 코스와 정보 | PawProof";
const description =
  "고양·파주·양주에서 반려견과 떠날 곳을 찾을 때 확인할 공식 데이터, 장소 조건과 여행 코스 준비 방법을 PawProof가 정리합니다.";

const faqs = [
  {
    question: "고양·파주·양주의 모든 장소가 반려견 동반 가능한가요?",
    answer:
      "아닙니다. 지역에 장소가 있다는 사실과 개별 장소의 입장 조건은 다릅니다. 실내·야외, 견종·체중·마릿수와 준비물 조건을 장소별로 확인해야 합니다.",
  },
  {
    question: "지역 페이지의 장소 수가 실제 이용 가능한 장소 수인가요?",
    answer:
      "아닙니다. 2026년 9월 조사 수치는 한국관광공사 항목과 식품안전나라 목록 행을 기준으로 한 탐색 범위입니다. 중복과 세부 조건 확인 전 항목이 포함될 수 있어 실제 이용 가능 장소 수로 해석하면 안 됩니다.",
  },
  {
    question: "경기 북서부 반려견 여행 코스는 어떻게 확인하나요?",
    answer:
      "PawProof에서 반려견의 조건과 여행 날짜를 입력하고 장소를 코스에 담은 뒤, 장소별 동반 조건과 남은 확인사항을 검사할 수 있습니다. 실제 방문 전에는 업체의 최신 안내를 다시 확인해야 합니다.",
  },
];

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/regions/gyeonggi-northwest" },
  openGraph: {
    type: "article",
    title,
    description,
    url: "/regions/gyeonggi-northwest",
    publishedTime: publishedDate,
    modifiedTime: publishedDate,
    images: [
      {
        url: "/media/travel-dog.jpg",
        width: 900,
        height: 600,
        alt: "반려견과 함께 걷는 PawProof 여행",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/media/travel-dog.jpg"],
  },
};

export default function GyeonggiNorthwestRegion() {
  return (
    <>
      <SiteHeader compact />
      <ContentJsonLd
        title={title}
        description={description}
        image={`${siteOrigin}/media/travel-dog.jpg`}
        url={pageUrl}
        datePublished={publishedDate}
        dateModified={publishedDate}
        breadcrumbs={[
          { name: "PawProof", url: `${siteOrigin}/` },
          { name: "고양·파주·양주", url: pageUrl },
        ]}
        faqs={faqs}
      />
      <main id="main" className="seo-content-page seo-region-page wrap">
        <header className="seo-content-hero seo-region-hero">
          <div>
            <p className="eyebrow">
              <span /> A CLOSER WEEKEND
            </p>
            <h1>
              고양·파주·양주
              <br />
              반려견 동반여행을 준비해요
            </h1>
            <p className="seo-content-lead">
              멀리 떠나지 않아도 함께 걷고 쉬는 하루를 만들 수 있도록, PawProof가
              경기 북서부의 장소 조건과 여행 코스를 차분히 살펴봅니다.
            </p>
            <div className="seo-content-actions">
              <Link href="/plan" className="button">
                지도에서 장소 찾기 <Icon name="arrow" />
              </Link>
              <Link href="/guide/dog-friendly-travel" className="text-button">
                준비 가이드 읽기 <Icon name="arrow" size={16} />
              </Link>
            </div>
          </div>
          <aside className="seo-note region-note" aria-label="지역 선정 기준">
            <Icon name="pin" size={29} />
            <strong>첫 탐색 권역</strong>
            <p>서울에서 이어지는 자가용 당일 여행 시나리오에 맞춰 확인 범위를 좁혔어요.</p>
            <time dateTime={publishedDate}>2026년 9월 29일 기준</time>
          </aside>
        </header>

        <div className="seo-region-intro">
          <div>
            <p className="eyebrow">WHY THIS AREA</p>
            <h2>가까운 하루를 더 꼼꼼하게</h2>
          </div>
          <p>
            경기 북서부는 고객 규모와 수도권 당일 여행이라는 제품 시나리오를 함께
            고려해 선택한 첫 탐색 권역입니다. 이 페이지의 수치는 지역의 인기도나
            이용 가능 장소 수를 보장하는 순위가 아니라, 공식 데이터를 어디부터
            확인할지 정한 작업 기준입니다.
          </p>
        </div>

        <section className="region-data-section" aria-labelledby="regional-data">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A SNAPSHOT, NOT A PROMISE</p>
              <h2 id="regional-data">확인 범위를 공개합니다</h2>
            </div>
            <p>
              2026년 9월 16일 조회 기준의 탐색 표본이에요.
              <br />실제 입장 가능 여부는 장소별로 다시 확인합니다.
            </p>
          </div>
          <div className="region-stat-grid">
            <article>
              <span>고양</span>
              <strong>9</strong>
              <p>한국관광공사 항목</p>
              <small>식품안전나라 목록 행 58</small>
            </article>
            <article>
              <span>파주</span>
              <strong>10</strong>
              <p>한국관광공사 항목</p>
              <small>식품안전나라 목록 행 36</small>
            </article>
            <article>
              <span>양주</span>
              <strong>4</strong>
              <p>한국관광공사 항목</p>
              <small>식품안전나라 목록 행 22</small>
            </article>
          </div>
          <p className="region-data-note">
            두 자료의 모집단과 기준이 달라 수치를 합산하지 않았습니다. 중복 시설과
            세부 운영 조건 확인 전 항목이 포함될 수 있으며, 목록에 없다고 동반
            불가라는 뜻도 아닙니다.
          </p>
        </section>

        <section className="region-city-section" aria-labelledby="cities">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THREE WAYS TO GO</p>
              <h2 id="cities">도시마다 다른 하루를 담아요</h2>
            </div>
            <p>장소를 많이 담는 것보다 우리 강아지와 맞는지 확인하는 일이 먼저예요.</p>
          </div>
          <div className="region-city-grid">
            <article className="region-city-card city-goyang">
              <span className="region-city-index">01</span>
              <Icon name="tree" size={29} />
              <h3>고양</h3>
              <p>공원과 도시 안의 쉼터를 중심으로 실내외 구역과 산책 동선을 확인해요.</p>
            </article>
            <article className="region-city-card city-paju">
              <span className="region-city-index">02</span>
              <Icon name="car" size={29} />
              <h3>파주</h3>
              <p>장소 사이 이동과 체류시간을 함께 생각하며 하루 코스를 구성해요.</p>
            </article>
            <article className="region-city-card city-yangju">
              <span className="region-city-index">03</span>
              <Icon name="leaf" size={29} />
              <h3>양주</h3>
              <p>자연 속 장소를 고를 때 목줄, 구역, 준비물과 운영 안내를 살펴봐요.</p>
            </article>
          </div>
        </section>

        <section className="region-method-section" aria-labelledby="regional-method">
          <div className="region-method-copy">
            <p className="eyebrow">HOW PAWPROOF CHECKS</p>
            <h2 id="regional-method">지역을 고른 뒤에도, 장소별로 다시 확인해요</h2>
            <p>
              같은 도시 안에서도 장소마다 안내가 다르고, 공식 데이터에 비어 있는
              조건이 있을 수 있습니다. PawProof는 빈칸을 허용으로 해석하지 않고,
              확인된 사실과 아직 물어봐야 할 질문을 나눠 보여줍니다.
            </p>
            <Link href="/about" className="text-button">
              데이터 기준 자세히 보기 <Icon name="arrow" size={16} />
            </Link>
          </div>
          <ol className="region-method-list">
            <li><span>01</span><strong>공식 장소 후보를 찾기</strong><p>지역과 장소 유형으로 탐색 범위를 좁혀요.</p></li>
            <li><span>02</span><strong>동반 조건과 출처 보기</strong><p>원문, 조회 시각, 구역 조건을 함께 확인해요.</p></li>
            <li><span>03</span><strong>내 코스를 다시 검사하기</strong><p>반려견 조건과 방문 순서에 맞춰 결과를 봐요.</p></li>
          </ol>
        </section>

        <section className="seo-faq-section" aria-labelledby="regional-faq">
          <div>
            <p className="eyebrow">BEFORE YOU GO</p>
            <h2 id="regional-faq">경기 북서부 여행 전 자주 묻는 질문</h2>
          </div>
          <div className="seo-faq-list">
            {faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="seo-content-cta" aria-label="여행 시작하기">
          <Icon name="paw" size={32} />
          <div>
            <h2>우리 강아지와 갈 곳을 찾아볼까요?</h2>
            <p>장소를 코스에 담고, 출발 전 동반 조건을 확인해 보세요.</p>
          </div>
          <Link href="/plan" className="button light">
            여행 노트 시작하기 <Icon name="arrow" />
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
