import Link from "next/link";
import { Icon } from "../../components/icon";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { ContactForm } from "../../features/contact/contact-form";

export const metadata = {
  title: "문의하기",
  description: "PawProof에 서비스 이용 경험과 장소 정보를 알려주세요.",
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader compact />
      <main id="main" className="contact-page wrap">
        <section className="contact-intro" aria-labelledby="contact-title">
          <p className="eyebrow">
            <span /> PAWPROOF LETTERBOX
          </p>
          <h1 id="contact-title">
            여행을 더 잘 걷게 하는
            <br />
            <em>작은 목소리</em>를 들려주세요.
          </h1>
          <p className="contact-lead">
            잘못된 장소 정보, 헷갈리는 동반 조건, 사용하면서 불편했던 점을
            알려주시면 PawProof를 더 믿을 수 있는 여행 동반자로 다듬을게요.
          </p>
          <Link href="/about" className="text-button">
            서비스와 데이터 기준 보기 <Icon name="arrow" size={16} />
          </Link>
          <div className="contact-promise">
            <span className="contact-promise-mark">
              <Icon name="heart" size={18} />
            </span>
            <p>
              모든 문의에 즉시 답변하지 못할 수 있지만, 확인이 필요한 정보는
              가볍게 넘기지 않을게요.
            </p>
          </div>
        </section>
        <ContactForm />
      </main>
      <SiteFooter />
    </>
  );
}
