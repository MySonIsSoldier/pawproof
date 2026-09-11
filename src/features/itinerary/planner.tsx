"use client";
import { useState } from "react";
import type {
  Place,
  TripInput,
  TripResult,
  VisitResult,
} from "../../domain/policies/types";
import { statusLabels } from "../../domain/policies/types";
import { createDemoTrip, demoPlaces } from "../../infrastructure/demo/catalog";
import { tripSchema } from "../../application/contracts/trip";
import {
  recoveryResultSchema,
  resultSchema,
} from "../../application/contracts/result";
import type { Alternative } from "../../application/use-cases/recover-trip";
import { callApi } from "./api";
import { ProfileEditor } from "./profile-editor";
import { PlaceSearch } from "./place-search";
import { VisitCard } from "./visit-card";
import { RouteBoard } from "./route-board";
import { EvidenceDialog } from "../verification/evidence-dialog";
import { Preparation } from "../verification/preparation";
import { Icon } from "../../components/icon";

const storageKey = "pawproof.trip.v1";
function initialTrip(mode: TripInput["mode"]): TripInput {
  const demo = createDemoTrip();
  return mode === "demo"
    ? demo
    : {
        ...demo,
        mode,
        pets: [{ name: "", breed: "", weight: 0 }],
        equipment: [],
        visits: [],
      };
}
export function Planner({ initialMode }: { initialMode: TripInput["mode"] }) {
  const [trip, setTrip] = useState<TripInput>(() => initialTrip(initialMode));
  const [knownPlaces, setKnownPlaces] = useState<Place[]>(demoPlaces);
  const [result, setResult] = useState<TripResult | null>(null);
  const [snapshot, setSnapshot] = useState("");
  const [busy, setBusy] = useState<"verify" | "recover" | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<VisitResult | null>(null);
  const [alternatives, setAlternatives] = useState<{
    index: number;
    items: Alternative[];
    inspected: number;
  } | null>(null);
  const [previous, setPrevious] = useState<{
    trip: TripInput;
    result: TripResult | null;
  } | null>(null);
  const stale = result !== null && snapshot !== JSON.stringify(trip);
  const placeFor = (id: string): Place =>
    knownPlaces.find((p) => p.id === id) || {
      id,
      name: `장소 ${id}`,
      address: "다시 검사하면 현재 장소 정보를 불러와요.",
      category: "관광지",
      lat: 0,
      lng: 0,
      source: "kto",
    };
  function update(next: TripInput) {
    setTrip(next);
    setAlternatives(null);
    setError("");
    setNotice("");
  }
  function switchMode(mode: TripInput["mode"]) {
    if (busy || mode === trip.mode) return;
    setTrip(initialTrip(mode));
    setResult(null);
    setSnapshot("");
    setAlternatives(null);
    setPrevious(null);
    setError("");
    setNotice("모드를 바꾸고 새로운 여행 노트를 열었어요.");
  }
  async function verify() {
    if (busy) return;
    const parsed = tripSchema.safeParse(trip);
    if (!parsed.success) {
      setError("반려견의 이름·견종·체중, 날짜와 방문지 3~5곳을 확인해 주세요.");
      return;
    }
    setBusy("verify");
    setError("");
    setNotice("");
    setAlternatives(null);
    try {
      const next = await callApi("/api/verify", resultSchema, parsed.data);
      setResult(next);
      setSnapshot(JSON.stringify(trip));
      setKnownPlaces((places) => [
        ...next.visits.map((v) => v.place),
        ...places,
      ]);
      setNotice("코스 검사가 끝났어요. 방문지별 조건과 근거를 살펴보세요.");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "검사를 완료하지 못했어요.",
      );
    } finally {
      setBusy(null);
    }
  }
  async function recover(index: number) {
    if (busy || stale) return;
    setBusy("recover");
    setError("");
    setNotice("");
    setAlternatives(null);
    try {
      const data = await callApi("/api/recover", recoveryResultSchema, {
        trip,
        index,
      });
      setAlternatives({
        index,
        items: data.alternatives,
        inspected: data.inspected,
      });
      setNotice(
        data.alternatives.length
          ? "조건과 일정을 확인한 대체 후보를 찾았어요."
          : "조건과 고정 일정을 모두 지킬 수 있는 대체 후보가 없어요.",
      );
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "대체 장소를 찾지 못했어요.",
      );
    } finally {
      setBusy(null);
    }
  }
  function applyAlternative(alternative: Alternative, index: number) {
    const next = {
      ...trip,
      visits: trip.visits.map((v, i) =>
        i === index ? { ...v, placeId: alternative.place.id } : v,
      ),
    };
    setPrevious({ trip, result });
    setTrip(next);
    setResult(alternative.result);
    setSnapshot(JSON.stringify(next));
    setKnownPlaces((places) => [alternative.place, ...places]);
    setAlternatives(null);
    setNotice(
      `${alternative.place.name}(으)로 바꾸고 이후 일정까지 다시 검사했어요.`,
    );
  }
  function undo() {
    if (!previous || busy) return;
    setTrip(previous.trip);
    setResult(previous.result);
    setSnapshot(JSON.stringify(previous.trip));
    setPrevious(null);
    setAlternatives(null);
    setNotice("교체 전 코스로 되돌렸어요.");
  }
  function save() {
    if (!tripSchema.safeParse(trip).success) {
      setError("반려견 정보와 방문지 3~5곳을 채운 뒤 저장해 주세요.");
      return;
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify({ version: 1, trip }));
      setNotice(
        "프로필과 코스 입력만 이 기기에 저장했어요. 규정·검사 결과는 저장하지 않아요.",
      );
    } catch {
      setError(
        "이 브라우저에서는 저장할 수 없어요. 현재 화면에서 계속 사용할 수 있어요.",
      );
    }
  }
  function load() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setNotice("이 기기에 저장된 여행 노트가 없어요.");
        return;
      }
      const data = JSON.parse(raw);
      if (data.version !== 1) throw new Error("version");
      const saved = tripSchema.parse(data.trip);
      setTrip(saved);
      setResult(null);
      setSnapshot("");
      setAlternatives(null);
      setPrevious(null);
      setError("");
      setNotice("저장한 입력을 불러왔어요. 최신 규정으로 다시 검사해 주세요.");
    } catch {
      setError(
        "저장한 입력을 읽을 수 없어요. 저장 삭제 후 새 코스를 만들어 주세요.",
      );
    }
  }
  function removeSaved() {
    try {
      localStorage.removeItem(storageKey);
      setNotice("이 기기에 저장한 입력을 삭제했어요.");
    } catch {
      setError("브라우저 저장소에 접근할 수 없어요.");
    }
  }
  function move(index: number, offset: number) {
    const target = index + offset;
    if (trip.visits[target]?.locked) {
      setNotice("꼭 유지할 방문지의 순서는 바꿀 수 없어요.");
      return;
    }
    const visits = [...trip.visits];
    [visits[index], visits[target]] = [visits[target], visits[index]];
    update({ ...trip, visits });
  }
  return (
    <main id="main" className="planner wrap">
      <div className="planner-heading">
        <div>
          <p className="eyebrow">OUR LITTLE TRAVEL NOTE</p>
          <h1>
            우리의 여행 노트
            <span>
              .<Icon name="paw" size={27} />
            </span>
          </h1>
          <p>가고 싶은 곳은 그대로, 우리 강아지에게 맞는 하루로.</p>
        </div>
        <div className="mode-tabs no-print" role="group" aria-label="여행 모드">
          <button
            disabled={!!busy}
            aria-pressed={trip.mode === "live"}
            onClick={() => switchMode("live")}
          >
            실제 장소
          </button>
          <button
            disabled={!!busy}
            aria-pressed={trip.mode === "demo"}
            onClick={() => switchMode("demo")}
          >
            가상 체험
          </button>
        </div>
      </div>
      <div className={`mode-notice ${trip.mode}`}>
        <Icon name={trip.mode === "demo" ? "leaf" : "shield"} size={18} />
        <p>
          {trip.mode === "demo" ? (
            <>
              <strong>가상 체험 코스예요.</strong> 장소·규정·이동시간은 설명을
              위한 예시이며 실제 여행 정보가 아니에요.
            </>
          ) : (
            <>
              <strong>현재 규정으로 확인하는 여행.</strong> 실제 장소를 검색해
              담아주세요. 연결 준비 중이면 가상 체험을 이용할 수 있어요.
            </>
          )}
        </p>
      </div>
      <div className="planner-grid">
        <div className="editor-column">
          <ProfileEditor trip={trip} update={update} busy={!!busy} />
          <section className="itinerary-editor">
            <div className="panel-title">
              <span className="round-icon">
                <Icon name="pin" />
              </span>
              <div>
                <h2>어디로 떠날까요?</h2>
                <p>방문할 곳을 3~5곳 담아주세요.</p>
              </div>
              <span className="counter">{trip.visits.length}곳</span>
            </div>
            {trip.visits.length ? (
              <div className="visit-list">
                {trip.visits.map((visit, index) => (
                  <VisitCard
                    key={visit.placeId}
                    place={placeFor(visit.placeId)}
                    visit={visit}
                    index={index}
                    count={trip.visits.length}
                    busy={!!busy}
                    stale={stale}
                    result={result?.visits.find(
                      (v) => v.place.id === visit.placeId,
                    )}
                    update={(next) =>
                      update({
                        ...trip,
                        visits: trip.visits.map((v, i) =>
                          i === index ? next : v,
                        ),
                      })
                    }
                    move={(offset) => move(index, offset)}
                    remove={() =>
                      update({
                        ...trip,
                        visits: trip.visits.filter((_, i) => i !== index),
                      })
                    }
                    evidence={() =>
                      setDetail(
                        result?.visits.find(
                          (v) => v.place.id === visit.placeId,
                        ) || null,
                      )
                    }
                    recover={() => void recover(index)}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-itinerary">
                <Icon name="pin" size={36} />
                <h3>어떤 하루를 보내고 싶나요?</h3>
                <p>
                  산책길, 맛있는 점심, 쉬어갈 카페.
                  <br />
                  아래에서 첫 방문지를 찾아보세요.
                </p>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => switchMode("demo")}
                >
                  먼저 가상 코스로 둘러보기 <Icon name="arrow" size={16} />
                </button>
              </div>
            )}
            <PlaceSearch
              key={trip.mode}
              mode={trip.mode}
              selected={trip.visits.map((v) => v.placeId)}
              busy={!!busy}
              add={(place) => {
                setKnownPlaces((items) => [place, ...items]);
                update({
                  ...trip,
                  visits: [
                    ...trip.visits,
                    {
                      placeId: place.id,
                      duration: 60,
                      zone: place.category === "관광지" ? "outdoor" : "indoor",
                      locked: false,
                    },
                  ],
                });
              }}
            />
          </section>
        </div>
        <aside className="summary-column">
          <div className="sticky-summary">
            <RouteBoard
              places={trip.visits.map((v) => placeFor(v.placeId))}
              result={result}
              stale={stale}
            />
            <section className="verification-panel">
              <div className="panel-title">
                <span className="round-icon">
                  <Icon name="shield" />
                </span>
                <div>
                  <h2>
                    {result ? "코스 확인 결과" : "출발 전, 함께 확인해요"}
                  </h2>
                  <p>
                    {result
                      ? `${trip.visits.length}개 방문지 · ${stale ? "입력 변경됨" : "조건별 근거를 확인하세요"}`
                      : "반려견 조건과 방문 시간을 살펴볼게요."}
                  </p>
                </div>
              </div>
              <div className={`status-counts ${stale ? "stale" : ""}`}>
                {(["available", "prepare", "confirm", "blocked"] as const).map(
                  (status) => (
                    <div key={status} className={status}>
                      <strong>
                        {result
                          ? result.visits.filter((v) => v.status === status)
                              .length
                          : "—"}
                      </strong>
                      <span>{statusLabels[status]}</span>
                    </div>
                  ),
                )}
              </div>
              {stale && (
                <p role="status" className="stale-notice">
                  입력이 변경되었어요. 다시 검사해 주세요.
                </p>
              )}
              <button
                type="button"
                className="button verify-button no-print"
                onClick={() => void verify()}
                disabled={!!busy}
                aria-busy={busy === "verify"}
              >
                <Icon name={busy ? "clock" : "shield"} />
                {busy === "verify"
                  ? "동반 조건을 확인하고 있어요…"
                  : busy === "recover"
                    ? "대체 코스를 살펴보고 있어요…"
                    : result
                      ? "코스 다시 검사하기"
                      : "이 코스 검사하기"}
                <Icon name="arrow" size={18} />
              </button>
              <p className="field-caption">
                {trip.mode === "demo"
                  ? "가상 체험에도 실제와 같은 판정 규칙을 적용해요."
                  : "규정 조회와 분석에 시간이 걸릴 수 있어요. 결과는 원문과 함께 확인해 주세요."}
              </p>
              <div aria-live="polite" className="notice">
                {notice}
              </div>
              {error && (
                <p role="alert" className="inline-error">
                  {error}
                </p>
              )}
              {previous && (
                <button
                  type="button"
                  className="text-button no-print"
                  onClick={undo}
                  disabled={!!busy}
                >
                  <Icon name="undo" size={16} /> 교체 전 코스로 되돌리기
                </button>
              )}
            </section>
            {alternatives && (
              <section className="alternatives" aria-label="대체 장소 비교">
                <p className="eyebrow">A SMALL CHANGE, A BETTER DAY</p>
                <h2>이런 곳은 어떨까요?</h2>
                <p className="field-caption">
                  {placeFor(trip.visits[alternatives.index].placeId).name} 대신
                  · 검토한 후보 {alternatives.inspected}곳
                </p>
                {alternatives.items.length ? (
                  alternatives.items.map((alternative) => (
                    <article key={alternative.place.id}>
                      <div>
                        <span className="place-category">
                          {alternative.place.category}
                        </span>
                        <h3>{alternative.place.name}</h3>
                        <p>
                          전체 이동 {alternative.extraMinutes >= 0 ? "+" : ""}
                          {alternative.extraMinutes}분 · 이후 일정 재검증
                        </p>
                        <p className="field-caption">
                          {alternative.result.visits[alternatives.index]
                            .status === "prepare"
                            ? "준비사항이 있어요. 적용 후 해당 규정을 확인해 주세요."
                            : "확인된 동반 조건을 충족해요."}
                        </p>
                      </div>
                      <button
                        className="button small"
                        type="button"
                        onClick={() =>
                          applyAlternative(alternative, alternatives.index)
                        }
                      >
                        이 장소로 교체 <Icon name="swap" size={15} />
                      </button>
                    </article>
                  ))
                ) : (
                  <p>
                    유효한 후보가 없어요. 고정 일정·이용 구역·시간을 살펴보거나
                    다른 장소를 직접 찾아주세요.
                  </p>
                )}
                <p className="field-caption">
                  조회한 후보 중 비교한 결과예요. 모든 장소 중 최적의 코스를
                  보장하지 않아요.
                </p>
              </section>
            )}
            <div className="save-actions no-print">
              <button type="button" disabled={!!busy} onClick={save}>
                <Icon name="save" size={15} /> 이 기기에 저장
              </button>
              <button type="button" disabled={!!busy} onClick={load}>
                불러오기
              </button>
              <button type="button" disabled={!!busy} onClick={removeSaved}>
                저장 삭제
              </button>
            </div>
            <p className="privacy-note no-print">
              회원가입 없이 사용해요.
              <br />
              기기 저장은 입력한 프로필·코스에만 적용돼요.
            </p>
          </div>
        </aside>
      </div>
      {result && !stale && (
        <Preparation trip={trip} result={result} notify={setNotice} />
      )}
      <div className="mobile-check-bar no-print">
        <div>
          <strong>
            {trip.pets.length}마리 · {trip.visits.length}곳의 하루
          </strong>
          {stale
            ? "입력 변경 · 다시 확인해 주세요"
            : trip.mode === "demo"
              ? "가상 체험 코스"
              : "우리의 여행 노트"}
        </div>
        <button
          type="button"
          className="button"
          disabled={!!busy}
          onClick={() => void verify()}
        >
          <Icon name="shield" size={17} />
          {busy ? "확인 중…" : "코스 검사"}
        </button>
      </div>
      <footer className="planner-footer">
        <Icon name="paw" size={18} />
        <span>작은 발걸음도, 여행의 끝까지. PawProof</span>
      </footer>
      {detail && (
        <EvidenceDialog result={detail} onClose={() => setDetail(null)} />
      )}
    </main>
  );
}
