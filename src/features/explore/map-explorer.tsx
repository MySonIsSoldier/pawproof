"use client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { Place, TripInput } from "../../domain/policies/types";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../../components/ui/dialog";
import { ResponsiveSheet } from "../../components/ui/responsive-sheet";
import { useMobile } from "../../components/hooks/use-mobile";
import { ProfileEditor } from "../itinerary/profile-editor";
import { useExplorer } from "./use-explorer";
import { PlaceDetail, mapStatusLabels } from "./place-detail";
import "./explore.css";
const Map = dynamic(() => import("./kakao-map").then((m) => m.KakaoMapView), {
  ssr: false,
  loading: () => <div className="map-loading">지도를 준비하고 있어요…</div>,
});

export function MapExplorer({
  trip,
  update,
  add,
  active,
  busy,
  note,
  places,
}: {
  trip: TripInput;
  update: (trip: TripInput) => void;
  add: (place: Place) => void;
  active: boolean;
  busy: boolean;
  note: () => void;
  places: Record<string, Place>;
}) {
  const mobile = useMobile();
  const route = useMemo(
    () =>
      trip.visits.flatMap((v) =>
        places[v.placeId] ? [places[v.placeId]] : [],
      ),
    [trip.visits, places],
  );
  const {
    state,
    search,
    inspect,
    destination,
    candidates,
    visible,
    selected,
    grouped,
    setArea,
    locate,
  } = useExplorer(trip, active, route);
  const shown = state.groupIds.length ? grouped : visible;
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const unchecked = candidates.filter((p) => !p.check).slice(0, 5);
  const moved =
    Math.abs(state.center.lat - state.draftCenter.lat) +
      Math.abs(state.center.lng - state.draftCenter.lng) >
    0.0005;
  const error =
    search.error?.message ||
    inspect.error?.message ||
    destination.error?.message;
  return (
    <section className="map-explorer" aria-label="지도에서 장소 찾기">
      <h1 className="sr-only">반려견과 갈 곳 찾기</h1>
      <div className="explore-toolbar desktop-map-tools">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (state.term.trim()) destination.mutate(state.term.trim());
          }}
        >
          <Input
            aria-label="여행지 또는 주소 검색"
            placeholder="어디로 떠날까요? 지역·주소 검색"
            value={state.term}
            maxLength={60}
            onChange={(e) => state.patch({ term: e.target.value, targets: [] })}
            disabled={destination.isPending}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={destination.isPending || !state.term.trim()}
          >
            {destination.isPending ? "찾는 중…" : "찾기"}
          </Button>
        </form>
        <Button variant="outline" disabled={state.locating} onClick={locate}>
          {state.locating ? "위치 확인 중…" : "◎ 내 주변"}
        </Button>
        <Button variant="outline" onClick={() => setProfileOpen(true)}>
          {trip.pets.every((p) => p.weight > 0)
            ? `${trip.pets.length}마리 · ${trip.pets.map((p) => `${p.weight}kg`).join(" / ")}`
            : "반려견 조건 입력"}
        </Button>
      </div>
      {!!state.targets.length && (
        <ul
          className="destination-results desktop-map-tools"
          aria-label="여행지 검색 결과"
        >
          {state.targets.map((p, i) => (
            <li key={i}>
              <Button
                variant="plain"
                onClick={() => {
                  setArea(p, p.name);
                  setMobileToolsOpen(false);
                }}
              >
                <strong>{p.name}</strong>
                <span>{p.address}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="explore-filters desktop-map-tools">
        <div className="filter-chips" role="group" aria-label="지도 장소 유형">
          {(["", "관광지", "식당", "카페"] as const).map((c) => (
            <Button
              variant="plain"
              key={c}
              aria-pressed={state.category === c}
              onClick={() =>
                state.patch({ category: c, selected: null, groupIds: [] })
              }
            >
              {c || "전체"}
            </Button>
          ))}
        </div>
        <div className="filter-chips" role="group" aria-label="동반 구역">
          {(["outdoor", "indoor"] as const).map((zone) => (
            <Button
              variant="plain"
              key={zone}
              aria-pressed={state.zone === zone}
              onClick={() => state.patch({ zone })}
            >
              {zone === "indoor" ? "실내" : "야외·테라스"}
            </Button>
          ))}
        </div>
        <label className="map-radius">
          반경{" "}
          <Select
            value={String(state.radius)}
            onValueChange={(value) =>
              state.patch({
                radius: Number(value),
                selected: null,
                groupIds: [],
              })
            }
          >
            <SelectTrigger aria-label="검색 반경">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[3000, 5000, 10000, 20000].map((r) => (
                <SelectItem key={r} value={String(r)}>
                  {r / 1000}km
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
      {mobile && !state.expanded && (error || state.message) && (
        <p className="map-mobile-message" role="status">
          {error || state.message}
        </p>
      )}
      <div className={`explore-body${state.expanded ? " expanded" : ""}`}>
        <div className="explore-map">
          <Map
            places={visible}
            center={state.center}
            radius={state.radius}
            route={route}
            group={(groupIds) =>
              state.patch({ groupIds, selected: null, expanded: true })
            }
            selected={state.selected}
            select={(selected) => state.patch({ selected, expanded: true })}
            moved={(draftCenter) => state.patch({ draftCenter })}
          />
          {mobile && (
            <div className="map-mobile-controls" aria-label="지도 도구">
              <Button
                id="map-search-button"
                variant="primary"
                onClick={() => setMobileToolsOpen(true)}
              >
                검색
              </Button>
              <Button
                variant="outline"
                onClick={() => setMobileToolsOpen(true)}
              >
                필터
              </Button>
            </div>
          )}
          <Button
            className="search-this-area"
            variant="primary"
            disabled={!moved || search.isFetching}
            onClick={() => setArea(state.draftCenter, "선택한 지도 위치 주변")}
          >
            {search.isFetching
              ? "주변 찾는 중…"
              : moved
                ? "이 지역 다시 검색"
                : `반경 ${state.radius / 1000}km 탐색 중`}
          </Button>
        </div>
        <ResponsiveSheet
          className="explore-panel"
          returnFocusId="map-place-list"
          open={active && state.expanded}
          onOpenChange={(expanded) => state.patch({ expanded })}
          title={
            selected
              ? selected.place.name
              : state.groupIds.length
                ? `겹친 장소 ${grouped.length}곳`
                : "주변 장소 목록"
          }
        >
          <div className="explore-panel-heading">
            <div>
              <strong>{state.area}</strong>
              <span>
                {search.isFetching
                  ? "주변 후보를 찾고 있어요"
                  : `${visible.length}곳 · 한국관광공사 제공 후보`}
              </span>
            </div>
          </div>
          <div className="explore-scroll">
            {error && (
              <p className="inline-error" role="alert">
                {error}{" "}
                <Button variant="link" onClick={() => void search.refetch()}>
                  주변 다시 찾기
                </Button>
              </p>
            )}
            {state.message && (
              <p className="field-caption" role="status">
                {state.message}
              </p>
            )}
            {selected ? (
              <PlaceDetail
                {...selected}
                trip={trip}
                zone={state.zone}
                inspecting={inspect.isPending}
                added={trip.visits.some((v) => v.placeId === selected.place.id)}
                full={trip.visits.length >= 5 || busy}
                back={() => state.patch({ selected: null })}
                inspect={() => inspect.mutate([selected.place.id])}
                add={() => {
                  add(selected.place);
                  if (mobile) state.patch({ expanded: false, selected: null });
                }}
              />
            ) : (
              <>
                {!!state.groupIds.length && (
                  <div className="map-group-summary">
                    <p>
                      지도에 보이는 숫자는 같은 위치에 겹친 장소의 개수예요.
                      {grouped.length}곳을 모두 펼쳐 각각 선택해 코스에 담을 수
                      있어요.
                    </p>
                    <Button
                      variant="link"
                      onClick={() => state.patch({ groupIds: [] })}
                    >
                      전체 장소 보기
                    </Button>
                  </div>
                )}
                <p className="field-caption">
                  미확인 장소는 ‘확인 필요’로 보여요. 조건 확인 버튼으로 우리
                  강아지와 맞는지 살펴보세요.
                </p>
                <Button
                  className="inspect-batch"
                  variant="outline"
                  disabled={inspect.isPending || !unchecked.length}
                  onClick={() =>
                    inspect.mutate(unchecked.map((c) => c.place.id))
                  }
                >
                  {inspect.isPending
                    ? "동반 조건 확인 중…"
                    : unchecked.length
                      ? `가까운 ${unchecked.length}곳 조건 확인`
                      : candidates.length
                        ? "현재 후보 조회 완료"
                        : "주변 장소를 먼저 찾아주세요"}
                </Button>
                {!shown.length && !search.isFetching && !search.error && (
                  <p className="explore-empty">
                    {candidates.length
                      ? "현재 필터에 맞는 장소가 없어요. 미확인 장소도 보거나 조건 확인을 진행해 주세요."
                      : "이 반경에서 제공되는 후보가 없어요. 반경을 넓히거나 지도를 옮겨보세요."}
                  </p>
                )}
                <ol className="explore-results">
                  {shown.map((item, i) => (
                    <li key={item.place.id}>
                      <button
                        className="explore-result"
                        onClick={() =>
                          state.patch({
                            selected: item.place.id,
                            expanded: true,
                          })
                        }
                      >
                        <span className={`result-number ${item.status}`}>
                          {i + 1}
                        </span>
                        <span>
                          <strong>{item.place.name}</strong>
                          <small>
                            {item.place.category} · {item.place.address}
                          </small>
                          <span className={`map-status ${item.status}`}>
                            {mapStatusLabels[item.status]}
                            {item.check ? "" : " · 미조회"}
                            {trip.visits.some(
                              (v) => v.placeId === item.place.id,
                            )
                              ? " · 코스에 담음"
                              : ""}
                          </span>
                        </span>
                        <span aria-hidden="true">›</span>
                      </button>
                    </li>
                  ))}
                </ol>
                <p className="field-caption">
                  최대 100곳을 보여요. 목록에 없다고 동반 불가인 것은 아니에요.
                  지도 숫자는 가맹점 개수이며, 숫자를 누르면 해당 장소를 모두
                  확인할 수 있어요. ‘조건 충족’은 확인한 동반 조건 기준이며
                  입장 보장이 아니에요.
                </p>
              </>
            )}
          </div>
          <Button
            className="explore-note-button"
            variant="primary"
            onClick={note}
          >
            완료 · 여행 노트 {trip.visits.length}곳 보기
          </Button>
        </ResponsiveSheet>
        {mobile && (
          <ResponsiveSheet
            className="mobile-map-tools"
            returnFocusId="map-search-button"
            open={mobileToolsOpen}
            onOpenChange={setMobileToolsOpen}
            title="지도 검색·필터"
          >
            <div className="mobile-map-tools-content">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (state.term.trim()) destination.mutate(state.term.trim());
                }}
              >
                <Input
                  aria-label="여행지 또는 주소 검색"
                  placeholder="어디로 떠날까요? 지역·주소 검색"
                  value={state.term}
                  maxLength={60}
                  onChange={(e) =>
                    state.patch({ term: e.target.value, targets: [] })
                  }
                  disabled={destination.isPending}
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={destination.isPending || !state.term.trim()}
                >
                  {destination.isPending ? "찾는 중…" : "찾기"}
                </Button>
              </form>
              <div className="mobile-map-tool-actions">
                <Button variant="outline" disabled={state.locating} onClick={locate}>
                  {state.locating ? "위치 확인 중…" : "◎ 내 주변"}
                </Button>
                <Button variant="outline" onClick={() => setProfileOpen(true)}>
                  반려견 조건
                </Button>
              </div>
              {!!state.targets.length && (
                <ul className="destination-results" aria-label="여행지 검색 결과">
                  {state.targets.map((p, i) => (
                    <li key={i}>
                      <Button
                        variant="plain"
                        onClick={() => {
                          setArea(p, p.name);
                          setMobileToolsOpen(false);
                        }}
                      >
                        <strong>{p.name}</strong>
                        <span>{p.address}</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="explore-filters mobile-map-filter-controls">
                <div className="filter-chips" role="group" aria-label="지도 장소 유형">
                  {(["", "관광지", "식당", "카페"] as const).map((c) => (
                    <Button
                      variant="plain"
                      key={c}
                      aria-pressed={state.category === c}
                      onClick={() =>
                        state.patch({ category: c, selected: null, groupIds: [] })
                      }
                    >
                      {c || "전체"}
                    </Button>
                  ))}
                </div>
                <div className="filter-chips" role="group" aria-label="동반 구역">
                  {(["outdoor", "indoor"] as const).map((zone) => (
                    <Button
                      variant="plain"
                      key={zone}
                      aria-pressed={state.zone === zone}
                      onClick={() => state.patch({ zone })}
                    >
                      {zone === "indoor" ? "실내" : "야외·테라스"}
                    </Button>
                  ))}
                </div>
                <label className="map-radius">
                  반경
                  <Select
                    value={String(state.radius)}
                    onValueChange={(value) =>
                      state.patch({
                        radius: Number(value),
                        selected: null,
                        groupIds: [],
                      })
                    }
                  >
                    <SelectTrigger aria-label="검색 반경">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[3000, 5000, 10000, 20000].map((r) => (
                        <SelectItem key={r} value={String(r)}>
                          {r / 1000}km
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              </div>
              {(error || state.message) && (
                <p className="map-mobile-message" role="status">
                  {error || state.message}
                </p>
              )}
            </div>
          </ResponsiveSheet>
        )}
        <div className="map-bottom-actions">
          <Button
            id="map-place-list"
            variant="outline"
            onClick={() =>
              state.patch({ expanded: true, selected: null, groupIds: [] })
            }
          >
            목록 {visible.length}곳
          </Button>
          <Button variant="primary" onClick={note}>
            완료 · {trip.visits.length}곳
          </Button>
        </div>
      </div>
      <div className="map-trip-summary" aria-label="지도에서 담은 코스">
        <p>
          {route.length
            ? route.map((p, i) => `${i + 1}. ${p.name}`).join(" → ")
            : "장소를 선택해 나만의 여행 코스를 담아보세요."}
        </p>
        <small>
          점선은 실제 도로 경로가 아닌 방문 순서예요. 예상 이동시간은 여행
          노트의 코스 검사에서 확인해 주세요.
        </small>
      </div>
      <p className="map-attribution">
        출처: ⓒ한국관광공사 · 지도에는 검색된 후보만 표시돼요.
      </p>
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="map-profile-dialog">
          <DialogTitle>우리 강아지의 여행 조건</DialogTitle>
          <DialogDescription>
            체중·견종·마릿수와 준비물을 입력하면 확인한 규정에 바로 대조해요.
          </DialogDescription>
          <ProfileEditor trip={trip} update={update} busy={busy} />
          <DialogClose asChild>
            <Button variant="primary">조건 적용하고 지도 보기</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </section>
  );
}
