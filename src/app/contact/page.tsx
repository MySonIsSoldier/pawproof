import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "../../components/icon";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { ContactForm } from "../../features/contact/contact-form";

export const metadata: Metadata = {
  title: { absolute: "PawProof 문의하기 | 더 좋은 반려견 여행을 함께 만들어요" },
  description:
    "반려견과 함께 가고 싶은 장소, 여행 중 발견한 정보, PawProof에 전하고 싶은 이야기를 들려주세요.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "PawProof 문의하기 | 더 좋은 반려견 여행을 함께 만들어요",
    description:
      "우리 강아지와 함께 가고 싶은 곳과 PawProof에 전하고 싶은 이야기를 들려주세요.",
    url: "/contact",
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
    title: "PawProof 문의하기 | 더 좋은 반려견 여행을 함께 만들어요",
    description:
      "반려견과 함께하는 여행에 필요한 이야기와 의견을 PawProof에 보내주세요.",
    images: ["/media/travel-companion.jpg"],
  },
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader compact />
      <main id="main" className="contact-page wrap">
        <section className="contact-intro" aria-labelledby="contact-title">
          <p className="eyebrow">
            <span /> A NOTE FOR THE JOURNEY
          </p>
          <h1 id="contact-title">
            우리의 다음 여행을 위해
            <br />
            <em>작은 이야기</em>를 들려주세요.
          </h1>
          <p className="contact-lead">
            잘못된 장소 정보, 헷갈리는 동반 조건, 사용하면서 느낀 작은 불편까지
            알려주시면 PawProof를 더 다정하고 믿을 수 있는 여행 동반자로
            다듬을게요.
          </p>
          <Link href="/about" className="text-button">
            PawProof가 여행을 살피는 방법 <Icon name="arrow" size={16} />
          </Link>
          <div className="contact-promise">
            <span className="contact-promise-mark">
              <Icon name="heart" size={18} />
            </span>
            <p>
              보내주신 이야기를 소중히 읽고, 확인이 필요한 정보는 가볍게
              넘기지 않을게요.
            </p>
          </div>
        </section>
        <ContactForm />
      </main>
      <SiteFooter />
    </>
  );
}
