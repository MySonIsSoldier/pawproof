import type { Place } from "../../domain/policies/types";
import { Disclosure } from "../../components/ui/accordion";

/** General official guidance is kept separate from venue-specific rule evaluation. */
export function FoodVisitGuide({ places }: { places: Place[] }) {
  const foodPlaces = places.filter(
    (place) => place.source !== "demo" && place.category !== "관광지",
  );
  if (!foodPlaces.length) return null;
  return (
    <section
      className="food-visit-guide"
      aria-label="음식점 방문 전 공식 정보 확인"
    >
      <Disclosure title="식당·카페 방문 전, 공식 정보도 확인해요">
        <p>
          2026년 3월 1일부터 위생·안전 요건을 갖춘 음식점은 개·고양이 동반
          영업을 선택할 수 있어요. 가게별 동반 조건은 따로 확인해야 해요.
        </p>
        <h4>1. 같은 이름보다, 같은 지점인지</h4>
        <p>
          식품안전나라 목록의 상호와 아래 주소를 함께 대조해 주세요. 같은
          건물에도 여러 가게가 있을 수 있어요.
        </p>
        <ul>
          {foodPlaces.map((place) => (
            <li key={place.id}>
              <strong>{place.name}</strong>
              <br />
              {place.address}
            </li>
          ))}
        </ul>
        <a
          href="https://www.foodsafetykorea.go.kr/portal/petKorea.do"
          target="_blank"
          rel="noreferrer"
        >
          식약처 동반출입 음식점 목록 열기 ↗
        </a>
        <p className="field-caption">
          목록 등재를 자동 확인한 결과가 아니에요. 목록에 없어도 동반 영업을 할
          수 있고, 목록에 있어도 모든 반려견의 입장을 보장하지 않아요.
        </p>
        <h4>2. 예방접종 확인 방법 챙기기</h4>
        <p>
          가게가 어떤 방법으로 확인하는지 살펴보세요. 증명서·수첩의 원본이나
          사진, 건강앱 외에 매장의 수기대장·QR 양식에 보호자가 기재하는 방법도
          가능해요.
        </p>
        <h4>3. 우리 강아지의 이용 조건 확인하기</h4>
        <p>
          체중·견종·마릿수, 실내·테라스, 이동장·목줄 등 필요한 준비물을 확인해
          주세요. 모든 음식점에서 이동장을 반드시 요구하는 것은 아니에요.
        </p>
        <p className="field-caption">
          일반 제도 안내이며 코스의 ‘확인 필요’를 해제하지 않아요. 출처: 식약처
          매뉴얼·FAQ(2026년 3월 개정), 2026년 9월 16일 열람.
        </p>
        <a
          href="https://www.foodsafetykorea.go.kr/portal/board/boardDetail.do?menu_no=5818&menu_grp=MENU_NEW04&bbs_no=bbs260313&ntctxt_no=1109645"
          target="_blank"
          rel="noreferrer"
        >
          식약처 공식 매뉴얼 보기 ↗
        </a>
      </Disclosure>
    </section>
  );
}
