import Link from "next/link";
import type { Metadata } from "next";
import { ContentJsonLd } from "../../../components/seo/content-json-ld";
import { Icon } from "../../../components/icon";
import { SiteFooter } from "../../../components/site-footer";
import { SiteHeader } from "../../../components/site-header";
import { siteOrigin } from "../../../config/site";

const pageUrl = `${siteOrigin}/regions/seoul-myeongdong`;
const publishedDate = "2026-09-29";
const title = "서울 명동 반려견 동반여행 코스와 장소 확인 | PawProof";
const description =
  "서울 명동에서 반려견과 함께 걸을 곳과 쉬어갈 곳을 찾을 때, 공식 안내와 장소별 동반 조건을 확인하는 방법을 PawProof가 정리합니다.";

const faqs = [
  {
    question: "서울 명동의 모든 장소가 반려견 동반 가능한가요?",
    answer:
      "아닙니다. 명동 중심 5km 안에서도 장소마다 실내·야외 구역, 목줄·이동장, 체중·마릿수 조건이 다릅니다. PawProof는 확인된 조건과 업체에 물어볼 항목을 나누어 보여줍니다.",
  },
  {
    question: "서울 명동 페이지의 장소 수는 실제 이용 가능한 장소 수인가요?",
    answer:
      "아닙니다. 2026년 9월 기준으로 한국관광공사 후보와 식품안전나라 2026년 3월 31일 업소 현황을 탐색 범위로 사용합니다. 목록에 있다는 사실만으로 모든 반려견의 입장을 보장하지 않습니다.",
  },
  {
    question: "명동에서 반려견 여행 코스를 어떻게 확인하나요?",
    answer:
      "PawProof 지도는 서울 명동 좌표에서 반경 5km로 시작합니다. 반려견의 조건과 방문 구역을 입력하고 장소를 코스에 담은 뒤, 장소별 공식 안내·방문 시간·남은 확인사항을 함께 검사할 수 있습니다.",
  },
];

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/regions/seoul-myeongdong" },
  openGraph: {
    type: "article",
    title,
    description,
    url: "/regions/seoul-myeongdong",
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

export default function SeoulMyeongdongRegion() {
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
          { name: "서울 명동", url: pageUrl },
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
              서울 명동,
              <br />
              반려견과 함께 걷는 하루
            </h1>
            <p className="seo-content-lead">
              명동에서 걷고, 쉬고, 다음 장소로 이동하는 하루를 준비할 때 필요한
              장소별 동반 조건과 확인 순서를 PawProof가 차분히 정리합니다.
            </p>
            <div className="seo-content-actions">
              <Link href="/plan" className="button">
                명동 지도에서 찾기 <Icon name="arrow" />
              </Link>
              <Link href="/guide/dog-friendly-travel" className="text-button">
                준비 가이드 읽기 <Icon name="arrow" size={16} />
              </Link>
            </div>
          </div>
          <aside className="seo-note region-note" aria-label="대표 지역 기준">
            <Icon name="pin" size={29} />
            <strong>첫 대표 탐색 지역</strong>
            <p>서울 명동 좌표에서 반경 5km로 시작하고, 사용자가 다른 지역으로 이동할 수 있어요.</p>
            <time dateTime={publishedDate}>2026년 9월 29일 기준</time>
          </aside>
        </header>

        <div className="seo-region-intro">
          <div>
            <p className="eyebrow">START IN MYEONGDONG</p>
            <h2>가까운 도시 여행도 장소마다 다시 확인해요</h2>
          </div>
          <p>
            명동은 PawProof의 기본 지도 중심이자 첫 시연 권역입니다. 반려견 동반
            장소가 많다는 표현으로 입장을 보장하지 않고, 장소를 선택했을 때 공식
            안내와 조회 시각을 다시 확인해 우리 강아지의 조건과 맞춰봅니다.
          </p>
        </div>

        <section className="region-data-section" aria-labelledby="myeongdong-data">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A SNAPSHOT, NOT A PROMISE</p>
              <h2 id="myeongdong-data">무엇을 기준으로 찾나요?</h2>
            </div>
            <p>
              2026년 9월 18일 확인 기준의 탐색 범위예요.
              <br />실제 입장 가능 여부는 장소별로 다시 확인합니다.
            </p>
          </div>
          <div className="region-stat-grid">
            <article>
              <span>첫 중심</span>
              <strong>5km</strong>
              <p>명동 중심 반경</p>
              <small>37.5636, 126.9856에서 시작</small>
            </article>
            <article>
              <span>관광 후보</span>
              <strong>8곳</strong>
              <p>한국관광공사 표본</p>
              <small>장소별 원문과 수정 시각 확인</small>
            </article>
            <article>
              <span>음식점 범위</span>
              <strong>282곳</strong>
              <p>서울 식품안전나라 현황 행</p>
              <small>2026년 3월 31일 기준 · 세부 조건은 별도 확인</small>
            </article>
          </div>
          <p className="region-data-note">
            위 수치는 검색·검수 범위를 설명하는 서로 다른 자료의 수치입니다. 중복과
            운영 조건 확인 전 항목이 포함될 수 있으며, 목록에 없거나 있다고 해서
            개별 반려견의 입장 가능 여부를 자동으로 판단하지 않습니다.
          </p>
        </section>

        <section className="region-city-section" aria-labelledby="myeongdong-places">
          <div className="section-heading">
            <div>
              <p className="eyebrow">WHAT TO CHECK</p>
              <h2 id="myeongdong-places">명동에서 살펴볼 세 가지 장면</h2>
            </div>
            <p>장소 이름보다 우리 강아지와 실제로 이용할 구역을 먼저 생각해요.</p>
          </div>
          <div className="region-city-grid">
            <article className="region-city-card city-goyang">
              <span className="region-city-index">01</span>
              <Icon name="tree" size={29} />
              <h3>도심 산책</h3>
              <p>서울로 7017처럼 이동 동선과 목줄, 배변봉투 안내를 함께 살펴봐요.</p>
            </article>
            <article className="region-city-card city-paju">
              <span className="region-city-index">02</span>
              <Icon name="pin" size={29} />
              <h3>문화 공간</h3>
              <p>남산골한옥마을·DDP처럼 일부 구역과 실내 조건이 다른 곳을 구분해요.</p>
            </article>
            <article className="region-city-card city-yangju">
              <span className="region-city-index">03</span>
              <Icon name="cup" size={29} />
              <h3>식사와 휴식</h3>
              <p>음식점·카페는 동반 영업장 표시와 매장별 운영 조건을 따로 확인해요.</p>
            </article>
          </div>
        </section>

        <section className="region-method-section" aria-labelledby="myeongdong-method">
          <div className="region-method-copy">
            <p className="eyebrow">HOW PAWPROOF CHECKS</p>
            <h2 id="myeongdong-method">명동에서 찾은 장소도, 내 코스 기준으로 다시 봐요</h2>
            <p>
              한국관광공사 안내에 동반 가능 구역이 적혀 있어도 실내·야외와 반려견의
              체중·마릿수 조건이 모두 정해지는 것은 아닙니다. PawProof는 빈칸을
              허용으로 바꾸지 않고, 확인된 사실과 업체에 물어볼 질문을 분리합니다.
            </p>
            <div className="seo-source-links">
              <a href="https://datalab.visitkorea.or.kr/site/portal/ex/bbs/View.do?bcIdx=307494&cbIdx=1129" target="_blank" rel="noreferrer">
                한국관광공사 반려동물 동반여행 자료 ↗
              </a>
              <a href="https://www.law.go.kr/lsInfoP.do?ancYnChk=0&chrClsCd=010202&efYd=20260301&lsiSeq=282565&urlMode=lsEfInfoR&viewCls=lsRvsDocInfoR" target="_blank" rel="noreferrer">
                식품위생법 시행규칙 개정문 ↗
              </a>
            </div>
          </div>
          <ol className="region-method-list">
            <li><span>01</span><strong>명동 주변 후보 찾기</strong><p>관광지·식당·카페를 지도에서 살펴봐요.</p></li>
            <li><span>02</span><strong>장소를 선택해 조건 조회</strong><p>원문, 구역, 준비사항, 조회 시각을 확인해요.</p></li>
            <li><span>03</span><strong>내 코스를 검사하기</strong><p>방문 순서와 체류시간까지 함께 대조해요.</p></li>
          </ol>
        </section>

        <section className="seo-faq-section" aria-labelledby="myeongdong-faq">
          <div>
            <p className="eyebrow">BEFORE YOU GO</p>
            <h2 id="myeongdong-faq">서울 명동 여행 전 자주 묻는 질문</h2>
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
            <h2>우리 강아지와 명동을 걸어볼까요?</h2>
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
