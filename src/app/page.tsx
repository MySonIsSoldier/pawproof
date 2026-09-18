import Link from "next/link";
import Image from "next/image";
import dog from "../../public/media/travel-dog.jpg";
import companion from "../../public/media/travel-companion.jpg";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../components/ui/accordion";
import { Icon } from "../components/icon";
import { HeroPhotos } from "../components/hero-photos";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";
export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="hero wrap">
          <div className="hero-copy">
            <p className="eyebrow">
              <span /> EVERY PAW, EVERYWHERE
            </p>
            <h1>
              우리 강아지와,
              <br />
              끝까지 <span className="handline">함께.</span>
            </h1>
            <p className="hero-description">
              설레는 여행에, 문 앞에서 돌아서는 일 없도록.
              <br className="desktop-break" />
              가고 싶은 코스를 담으면 동반 조건부터
              <br className="desktop-break" />더 나은 대안까지 함께 살펴드려요.
            </p>
            <div className="hero-actions">
              <Link
                href="/plan"
                className="button"
                data-umami-event="home_map_cta"
              >
                지도에서 갈 곳 찾기
                <Icon name="arrow" />
              </Link>
              <Link
                href="/plan?mode=demo"
                className="text-button"
                data-umami-event="home_demo_cta"
              >
                가상 코스로 체험하기 <span>↗</span>
              </Link>
            </div>
            <p className="hero-note">
              <Icon name="shield" size={16} /> 회원가입 없이 · 나의 반려견
              조건에 맞게
            </p>
          </div>
          <HeroPhotos>
            <div className="hero-card photo-backdrop">
              <Image
                src={companion}
                alt="바닷가에서 바람을 맞는 갈색과 흰색 반려견"
                fill
                sizes="(max-width: 720px) 80vw, 440px"
                placeholder="blur"
              />
            </div>
            <div className="hero-card hero-photo">
              <Image
                src={dog}
                alt="노란 꽃을 물고 야외에 앉아 있는 골든리트리버"
                fill
                sizes="(max-width: 720px) 80vw, 440px"
                priority
                placeholder="blur"
              />
              <span className="photo-caption">
                좋아하는 곳에, 좋아하는 너와.
              </span>
            </div>
            <div className="float-note note-top">
              <span className="round-icon">
                <Icon name="paw" />
              </span>
              <div>
                <strong>함께라서 더 좋은 하루</strong>
                <span>우리만의 여행을 준비해요</span>
              </div>
              <Icon name="heart" size={18} />
            </div>
            <div className="float-note note-bottom">
              <span className="round-icon yellow">
                <Icon name="shield" size={22} />
              </span>
              <div>
                <strong>출발 전, 한 번 더 안심</strong>
                <span>동반 조건부터 준비물까지</span>
              </div>
            </div>
            <svg
              className="hero-trail"
              viewBox="0 0 500 560"
              aria-hidden="true"
            >
              <path d="M55 50C-50 190 40 460 180 500S490 550 485 390" />
              <circle cx="55" cy="50" r="6" />
              <circle cx="485" cy="390" r="6" />
            </svg>
            <span className="hero-paw">
              <Icon name="paw" size={38} />
            </span>
            <span className="photo-stamp">
              <span>WITH YOU</span>
              <Icon name="paw" size={20} />
              <span>ALL THE WAY</span>
            </span>
          </HeroPhotos>
        </section>
        <div className="promise-strip">
          <div className="wrap">
            <span>
              <Icon name="paw" /> 반려견별 맞춤 조건
            </span>
            <i />
            <span>
              <Icon name="shield" /> 원문 근거로 꼼꼼하게
            </span>
            <i />
            <span>
              <Icon name="swap" /> 일정은 최대한 그대로
            </span>
          </div>
        </div>
        <section id="how-it-works" className="how-section wrap">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A LITTLE CHECK, A BETTER TRIP</p>
              <h2>
                여행의 설렘은 그대로,
                <br />
                걱정은 한 발 먼저.
              </h2>
            </div>
            <p>
              복잡한 규정은 차근차근 확인하고,
              <br />
              우리는 함께할 순간에 집중해요.
            </p>
          </div>
          <div className="steps">
            {[
              {
                number: "01",
                icon: "paw",
                title: "우리 강아지를 알려주세요",
                body: "견종과 체중, 함께 가는 반려견 수에 맞춰 필요한 조건을 살펴봐요.",
              },
              {
                number: "02",
                icon: "pin",
                title: "가고 싶은 곳을 담아주세요",
                body: "산책길부터 식당과 카페까지. 방문 순서와 시간을 내 여행에 맞게 정해요.",
              },
              {
                number: "03",
                icon: "shield",
                title: "확인하고, 더 좋은 코스로",
                body: "조건과 근거를 확인하고 문제가 있는 곳은 일정 변화가 적은 대안으로 바꿔요.",
              },
            ].map((step) => (
              <article className="step" key={step.number}>
                <span className="step-number">{step.number}</span>
                <div className="step-icon">
                  <Icon
                    name={step.icon as "paw" | "pin" | "shield"}
                    size={34}
                  />
                </div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="trust-section wrap">
          <div className="trust-copy">
            <p className="eyebrow">CLEAR REASONS, BETTER CHOICES</p>
            <h2>
              ‘동반 가능’ 한마디보다
              <br />한 걸음 더 꼼꼼하게.
            </h2>
            <p>
              작은 조건 하나가 하루의 코스를 바꿀 수 있으니까.
              <br />
              조건을 충족하는지, 무엇을 준비해야 하는지,
              <br />
              아직 확인할 것은 무엇인지 구분해 알려드려요.
            </p>
            <Link href="/plan?mode=demo" className="text-button">
              네 가지 판정 직접 살펴보기 <Icon name="arrow" />
            </Link>
          </div>
          <div className="status-examples">
            {[
              [
                "available",
                "이용 가능",
                "확인된 조건을 모두 충족했어요.",
                "check",
              ],
              [
                "prepare",
                "준비 필요",
                "준비하면 해결할 수 있는 조건이에요.",
                "bag",
              ],
              [
                "confirm",
                "확인 필요",
                "정보가 부족해 직접 확인이 필요해요.",
                "info",
              ],
              [
                "blocked",
                "이용 불가",
                "현재 계획이 명시된 제한에 맞지 않아요.",
                "close",
              ],
            ].map(([state, title, body, icon]) => (
              <div key={state} className={`status-example ${state}`}>
                <span className="round-icon">
                  <Icon name={icon as "check" | "bag" | "info" | "close"} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="faq wrap">
          <div>
            <p className="eyebrow">BEFORE WE GO</p>
            <h2>출발 전, 궁금한 점</h2>
          </div>
          <Accordion type="multiple" className="faq-accordion">
            <AccordionItem value="guarantee">
              <AccordionTrigger>
                이용 가능이면 입장이 보장되나요?
              </AccordionTrigger>
              <AccordionContent>
                <p>
                  조회한 규정과 입력한 조건을 대조한 결과예요. 예약·좌석 확보나
                  현장 입장을 보장하지는 않아요. 남은 확인사항과 업체의 최신
                  안내도 함께 확인해 주세요.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="demo">
              <AccordionTrigger>
                가상 체험 코스는 실제 여행에 써도 되나요?
              </AccordionTrigger>
              <AccordionContent>
                <p>
                  가상 체험의 장소·규정·이동시간은 기능을 설명하기 위해 직접
                  만든 예시예요. 실제 여행 정보가 아니며, 실제 코스는 장소 검색
                  모드에서 별도로 구성해 주세요.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="privacy">
              <AccordionTrigger>
                입력한 반려견 정보는 저장되나요?
              </AccordionTrigger>
              <AccordionContent>
                <p>
                  비회원의 작성 내용과 검사 결과는 저장하지 않으며 새로고침하면
                  사라져요. 로그인하고 이메일 인증을 마치면 여행 입력이 자동
                  저장되어 다른 기기에서도 열 수 있어요. 장소와 검사 당시 요약을
                  복원하며, 최신 규정은 다시 검사해 주세요. 공급자 규정 원문은
                  저장하지 않아요.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
        <section className="closing wrap">
          <Icon name="paw" size={38} />
          <h2>다음 여행도, 너와 함께.</h2>
          <p>가고 싶은 곳이 있다면, 지금 코스에 담아보세요.</p>
          <Link href="/plan" className="button light">
            우리의 여행 준비하기
            <Icon name="arrow" />
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
