"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { Place, TripInput } from "../../domain/policies/types";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../../components/ui/dialog";
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
}: {
  trip: TripInput;
  update: (trip: TripInput) => void;
  add: (place: Place) => void;
  active: boolean;
  busy: boolean;
  note: () => void;
}) {
  const {
    state,
    search,
    inspect,
    destination,
    candidates,
    visible,
    selected,
    setArea,
    locate,
  } = useExplorer(trip, active);
  const [profileOpen, setProfileOpen] = useState(false);
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
      <div className="explore-toolbar">
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
        <ul className="destination-results" aria-label="여행지 검색 결과">
          {state.targets.map((p, i) => (
            <li key={i}>
              <Button variant="plain" onClick={() => setArea(p, p.name)}>
                <strong>{p.name}</strong>
                <span>{p.address}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="explore-filters">
        <div className="filter-chips" role="group" aria-label="지도 장소 유형">
          {(["", "관광지", "식당", "카페"] as const).map((c) => (
            <Button
              variant="plain"
              key={c}
              aria-pressed={state.category === c}
              onClick={() => state.patch({ category: c, selected: null })}
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
          <select
            aria-label="검색 반경"
            value={state.radius}
            onChange={(e) =>
              state.patch({ radius: Number(e.target.value), selected: null })
            }
          >
            {[3000, 5000, 10000, 20000].map((r) => (
              <option key={r} value={r}>
                {r / 1000}km
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={`explore-body${state.expanded ? " expanded" : ""}`}>
        <div className="explore-map">
          <Map
            places={visible}
            center={state.center}
            radius={state.radius}
            selected={state.selected}
            select={(selected) => state.patch({ selected, expanded: true })}
            moved={(draftCenter) => state.patch({ draftCenter })}
          />
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
        <div className="explore-panel">
          <div className="explore-panel-heading">
            <div>
              <strong>{state.area}</strong>
              <span>
                {search.isFetching
                  ? "주변 후보를 찾고 있어요"
                  : `${visible.length}곳 · 한국관광공사 제공 후보`}
              </span>
            </div>
            <Button
              variant="link"
              className="panel-expand"
              aria-expanded={state.expanded}
              onClick={() => state.patch({ expanded: !state.expanded })}
            >
              {state.expanded ? "지도 크게" : "목록 크게"}
            </Button>
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
                add={() => add(selected.place)}
              />
            ) : (
              <>
                <div className="map-condition-filters">
                  <label>
                    <Checkbox
                      checked={state.fitOnly}
                      onCheckedChange={(v) =>
                        state.patch({ fitOnly: v === true })
                      }
                    />{" "}
                    우리 조건과 불일치하는 곳 제외
                  </label>
                  <label>
                    <Checkbox
                      checked={state.confirmedOnly}
                      onCheckedChange={(v) =>
                        state.patch({ confirmedOnly: v === true })
                      }
                    />{" "}
                    조건이 확인된 곳만 보기
                  </label>
                </div>
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
                {!visible.length && !search.isFetching && !search.error && (
                  <p className="explore-empty">
                    {candidates.length
                      ? "현재 필터에 맞는 장소가 없어요. 미확인 장소도 보거나 조건 확인을 진행해 주세요."
                      : "이 반경에서 제공되는 후보가 없어요. 반경을 넓히거나 지도를 옮겨보세요."}
                  </p>
                )}
                <ol className="explore-results">
                  {visible.map((item, i) => (
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
                          </span>
                        </span>
                        <span aria-hidden="true">›</span>
                      </button>
                    </li>
                  ))}
                </ol>
                <p className="field-caption">
                  최대 100곳을 보여요. 목록에 없다고 동반 불가인 것은 아니에요.
                  ‘조건 충족’은 확인한 동반 조건 기준이며 입장 보장이 아니에요.
                </p>
              </>
            )}
          </div>
          <Button
            className="explore-note-button"
            variant="primary"
            onClick={note}
          >
            여행 노트 {trip.visits.length}곳 보기 →
          </Button>
        </div>
      </div>
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
