import type { Place, TripResult } from "../../domain/policies/types";
import { Icon } from "../../components/icon";
import { RouteMap } from "./route-map";
export function RouteBoard({
  places,
  result,
  stale,
  mode,
}: {
  places: Place[];
  result: TripResult | null;
  stale: boolean;
  mode: "demo" | "live";
}) {
  const positions = [
    [66, 200],
    [148, 111],
    [243, 190],
    [344, 91],
    [413, 164],
  ];
  return (
    <section className="route-board">
      <div className="board-heading">
        <span>
          <Icon name="pin" size={16} /> 우리의 하루, 한눈에
        </span>
        <span>방문 순서</span>
      </div>
      {mode === "live" && places.length ? (
        <>
          <RouteMap places={places} />
          <p className="field-caption route-map-caption">
            실제 카카오 지도에 방문 순서와 이동 경로를 표시해요. 이 지도는 보기 전용입니다.
          </p>
        </>
      ) : <div className="route-illustration">
        <svg
          viewBox="0 0 480 280"
          role="img"
          aria-label={`${places.length}개 방문지의 순서를 보여주는 노선도. 실제 지도가 아닙니다.`}
        >
          <defs>
            <pattern
              id="contour"
              width="120"
              height="110"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M-20 20Q30-20 70 20T160 20M-20 34Q30-6 70 34T160 34M-20 48Q30 8 70 48T160 48"
                fill="none"
                stroke="#ccdacc"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="480" height="280" fill="url(#contour)" />
          <path
            d="M-20 220Q100 80 195 140T510 40"
            fill="none"
            stroke="#d9e6e1"
            strokeWidth="38"
          />
          <path
            d="M66 200C65 115 126 174 148 111S214 253 243 190S295 52 344 91S415 110 413 164"
            fill="none"
            stroke="#65866c"
            strokeWidth="2.5"
            strokeDasharray="6 7"
          />
          {places.map((place, index) => (
            <g
              key={place.id}
              transform={`translate(${positions[index][0]}, ${positions[index][1]})`}
            >
              <circle r="21" fill="#fafbf7" />
              <circle
                r="16"
                fill={
                  result && !stale && result.visits[index]?.status === "blocked"
                    ? "#a35249"
                    : "#2f6b50"
                }
              />
              <text
                textAnchor="middle"
                dy="5"
                fill="white"
                fontSize="13"
                fontWeight="700"
              >
                {index + 1}
              </text>
              <rect
                x="-49"
                y="29"
                width="98"
                height="23"
                rx="11"
                fill="#fafbf7"
              />
              <text textAnchor="middle" y="45" fill="#193d30" fontSize="10">
                {place.name.slice(0, 11)}
              </text>
            </g>
          ))}
          {!places.length && (
            <text
              x="240"
              y="160"
              textAnchor="middle"
              fill="#5b6e63"
              fontSize="14"
            >
              가고 싶은 곳을 담아보세요
            </text>
          )}
        </svg>
        <span className="map-compass">N ↑</span>
      </div>}
      {result && !stale && (
        <div className="board-footer">
          {result.totalTravel !== null && (
            <span>
              <Icon name="car" size={16} />
              자가용 당일 여행
            </span>
          )}
          <span>{places.length}곳</span>
          {places.length > 1 && result.totalTravel !== null && (
            <span>차량 이동 {result.totalTravel}분</span>
          )}
          {places.length > 1 && result.totalWalking !== null && (
            <span>도보 산책 {result.totalWalking}분</span>
          )}
          {places.length > 1 &&
            result.totalTravel === null &&
            result.totalWalking === null && <span>이동시간 미확정</span>}
        </div>
      )}
      {mode === "demo" && result && !stale && (
        <p className="field-caption">
          실제 지도 대신 방문 순서를 보여드려요. 이동시간은 가상 예시예요.
        </p>
      )}
      {mode === "live" &&
        result &&
        !stale &&
        result.travelBasis === "kakao" &&
        result.totalTravel !== null && (
        <p className="field-caption">
          이동시간은 조회 시점 교통 기준이며 방문일 예측은 아니에요.
        </p>
      )}
      {mode === "live" &&
        result &&
        !stale &&
        places.length > 1 &&
        result.totalWalking !== null && (
        <p className="field-caption">도보 시간은 카카오 보행 경로 기준이에요.</p>
      )}
    </section>
  );
}
