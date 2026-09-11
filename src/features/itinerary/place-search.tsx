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
