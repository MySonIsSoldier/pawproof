"use client";
import type { Place } from "../../domain/policies/types";
import { usePlaceSearch } from "./hooks/use-place-search";
import { Button } from "../../components/ui/button";
import { Icon } from "../../components/icon";
import { Input } from "../../components/ui/input";
import { Disclosure } from "../../components/ui/accordion";
import {
  pilotRegion,
  regionSuggestions,
} from "../../application/places/regions";
export function PlaceSearch({
  mode,
  selected,
  busy,
  add,
}: {
  mode: "demo" | "live";
  selected: string[];
  busy: boolean;
  add: (place: Place) => void;
}) {
  const {
    recommendationFailed,
    recommended,
    recent,
    clearRecent,
    query,
    setQuery,
    category,
    setCategory,
    places,
    loading,
    message,
    searched,
    search,
  } = usePlaceSearch(mode, busy);
  return (
    <section className="place-search">
      <div className="search-heading">
        <h3>가고 싶은 곳 더하기</h3>
        <span>{selected.length}/5곳</span>
      </div>
      {mode === "live" && (
        <div className="region-discovery">
          <p className="field-caption">가까운 당일 여행부터 · 고양·파주·양주</p>
          <div
            className="filter-chips"
            role="group"
            aria-label="지역 바로 찾기"
          >
            {regionSuggestions.map((region) => (
              <Button
                key={region}
                variant="outline"
                type="button"
                disabled={busy || loading}
                onClick={() => search(region)}
              >
                {region}
              </Button>
            ))}
          </div>
          <Disclosure title="왜 경기 북서부부터 시작하나요?">
            <p>
              수도권 반려가구의 당일 여행을 먼저 돕기 위해 고양·파주·양주를 집중
              지역으로 정했어요.
            </p>
            <p>
              경기도의 반려가구는 약 157만 가구로 추정돼요. 전국 반려가구 중
              26.6%이며, 경기도 주민의 양육률을 뜻하지는 않아요.
            </p>
            <a
              href="https://kbthink.com/investment/deepdive/research/250629-2.html"
              target="_blank"
              rel="noreferrer"
            >
              근거: KB 2025 한국 반려동물 보고서 · 2024년 말 추정
            </a>
            <p>
              이 지역이 전국에서 양육률이 가장 높거나 모든 장소의 조건 확인이
              끝났다는 뜻은 아니에요. 인천과 다른 지역도 검색할 수 있어요.
            </p>
          </Disclosure>
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <label className="sr-only" htmlFor="place-query">
          장소 검색
        </label>
        <div className="search-input">
          <Icon name="search" />
          <Input
            id="place-query"
            value={query}
            maxLength={60}
            placeholder={
              mode === "demo"
                ? "가상 장소 이름으로 찾아보기"
                : "지역 또는 장소 이름으로 검색"
            }
            onChange={(e) => setQuery(e.target.value)}
            disabled={busy || loading}
          />
          <Button variant="plain" type="submit" disabled={busy || loading}>
            {loading ? "검색 중…" : "검색"}
          </Button>
        </div>
        <div className="filter-chips" aria-label="장소 유형">
          {(["", "관광지", "식당", "카페"] as const).map((item) => (
            <Button
              variant="plain"
              type="button"
              key={item}
              className={category === item ? "active" : ""}
              disabled={busy || loading}
              aria-pressed={category === item}
              onClick={() => {
                setCategory(item);
              }}
            >
              {item || "전체"}
            </Button>
          ))}
        </div>
      </form>
      {mode === "live" && (
        <p className="field-caption">
          경기 북서부·고양·파주·양주·경기·강원·인천은 지역으로, 그 외에는 장소
          이름으로 찾아요. 지역 결과는 유형별 최대 100건에서 골라 최대 100곳을
          보여줘요.
        </p>
      )}
      {recommended && (
        <div className="search-suggestions">
          {!!recent.length && (
            <>
              <div className="search-heading">
                <strong>최근 검색</strong>
                <Button variant="link" onClick={clearRecent}>
                  기록 지우기
                </Button>
              </div>
              <div className="filter-chips">
                {recent.map((term) => (
                  <Button
                    variant="outline"
                    key={term}
                    disabled={busy || loading}
                    onClick={() => search(term)}
                  >
                    {term}
                  </Button>
                ))}
              </div>
            </>
          )}
          <h4>
            {mode === "live"
              ? `${pilotRegion}에서 먼저 둘러볼 곳`
              : "가상 코스에서 둘러볼 곳"}
          </h4>
          <p className="field-caption">
            {mode === "live"
              ? "현재 관광 정보에서 가져온 탐색 후보예요. 반려견의 이용 조건은 코스에 담아 검사해 주세요."
              : "설명용 가상 장소예요."}
          </p>
        </div>
      )}
      {recommendationFailed && (
        <p className="field-caption">
          추천 장소를 불러오지 못했어요. 지역이나 장소 이름으로 검색해 주세요.
        </p>
      )}
      {loading && (
        <p role="status" className="field-caption">
          장소를 불러오고 있어요…
        </p>
      )}
      {message && (
        <p role="alert" className="inline-error">
          {message}
        </p>
      )}
      {searched && !places.length && !message && (
        <p className="field-caption">
          검색 결과가 없어요. 다른 이름이나 지역으로 찾아보세요.
        </p>
      )}
      <div className="search-results">
        {places.map((place) => (
          <div className="search-result" key={place.id}>
            <div>
              <strong>{place.name}</strong>
              <span>
                {place.category} · {place.address}
              </span>
            </div>
            <Button
              variant="icon"
              type="button"
              aria-label={`${place.name} 담기`}
              disabled={
                busy || selected.includes(place.id) || selected.length >= 5
              }
              onClick={() => add(place)}
            >
              <Icon name={selected.includes(place.id) ? "check" : "plus"} />
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
