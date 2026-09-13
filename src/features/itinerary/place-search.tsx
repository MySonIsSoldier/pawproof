"use client";
import type { Place } from "../../domain/policies/types";
import { usePlaceSearch } from "./hooks/use-place-search";
import { Button } from "../../components/ui/button";
import { Icon } from "../../components/icon";
import { Input } from "../../components/ui/input";
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
          ‘인천’은 인천 지역에서, 다른 검색어는 장소 이름으로 찾아요.
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
              ? "인천에서 먼저 둘러볼 곳"
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
