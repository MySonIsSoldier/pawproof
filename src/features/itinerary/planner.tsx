"use client";
import { useState } from "react";
import { MapExplorer } from "../explore/map-explorer";
import { CloudTrips } from "../account/cloud-trips";
import { ProfileEditor } from "./profile-editor";
import { FoodVisitGuide } from "./food-visit-guide";
import { VisitCard } from "./visit-card";
import { RouteBoard } from "./route-board";
import { EvidenceDialog } from "../verification/evidence-dialog";
import { Preparation } from "../verification/preparation";
import { Button } from "../../components/ui/button";
import { Icon } from "../../components/icon";
import { usePlanner } from "./hooks/use-planner";
import { VerificationPanel } from "./verification-panel";
import { AlternativesPanel } from "./alternatives-panel";

import { withNotifications } from "../../components/notifications/with-notifications";

function PlannerScreen({
  initialView = "map",
}: {
  initialView?: "map" | "note";
}) {
  const [view, setView] = useState(initialView);
  const [mapVisited, setMapVisited] = useState(initialView === "map");
  const model = usePlanner();
  const {
    trip,
    busy,
    result,
    stale,
    detail,
    setDetail,
    placeFor,
    update,
    switchMode,
    verify,
    recover,
    move,
    add,
    newNote,
    copied,
    fail,
    remove,
  } = model;
  const showMap = trip.mode === "live" && view === "map";
  return (
    <main
      id="main"
      className={`planner wrap${trip.mode === "live" ? " live-workspace" : ""}${showMap ? " exploring" : ""}`}
    >
      {trip.mode === "live" && (
        <nav className="workspace-tabs" aria-label="여행 작업 화면">
          <Button
            variant="plain"
            aria-pressed={showMap}
            onClick={() => {
              setMapVisited(true);
              setView("map");
            }}
          >
            <Icon name="pin" size={20} /> 지도에서 찾기
          </Button>
          <Button
            variant="plain"
            aria-pressed={!showMap}
            onClick={() => setView("note")}
          >
            <Icon name="bag" size={20} /> 여행 노트 · {trip.visits.length}곳
          </Button>
          <span>우리 강아지와 갈 곳, 가까이에서부터.</span>
        </nav>
      )}
      {trip.mode === "live" && mapVisited && (
        <div hidden={!showMap}>
          <MapExplorer
            trip={trip}
            places={model.places}
            update={update}
            add={add}
            remove={remove}
            newNote={newNote}
            active={showMap}
            busy={!!busy}
            note={() => setView("note")}
          />
        </div>
      )}
      <div hidden={showMap}>
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
          <div
            className="mode-tabs no-print"
            role="group"
            aria-label="여행 모드"
          >
            <Button
              variant="plain"
              disabled={!!busy}
              aria-pressed={trip.mode === "live"}
              onClick={() => switchMode("live")}
            >
              실제 장소
            </Button>
            <Button
              variant="plain"
              disabled={!!busy}
              aria-pressed={trip.mode === "demo"}
              onClick={() => switchMode("demo")}
            >
              가상 체험
            </Button>
          </div>
        </div>
        <CloudTrips busy={!!busy} restore={model.restoreTrip} />
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
                  <p>방문할 곳을 1~5곳 담아주세요.</p>
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
                      remove={() => remove(index)}
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
                  <Button
                    variant="link"
                    type="button"
                    onClick={() => switchMode("demo")}
                  >
                    먼저 가상 코스로 둘러보기 <Icon name="arrow" size={16} />
                  </Button>
                </div>
              )}
              {trip.mode === "live" && (
                <FoodVisitGuide
                  places={trip.visits.map((visit) => placeFor(visit.placeId))}
                />
              )}
            </section>
          </div>
          <aside className="summary-column">
            <div className="sticky-summary">
              <RouteBoard
                places={trip.visits.map((v) => placeFor(v.placeId))}
                result={result}
                stale={stale}
                mode={trip.mode}
              />
              <VerificationPanel {...model} />
              <AlternativesPanel {...model} />
            </div>
          </aside>
        </div>
        {result && !stale && (
          <Preparation
            trip={trip}
            result={result}
            notify={copied}
            onError={fail}
          />
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
          <Button
            variant="primary"
            type="button"
            disabled={!!busy}
            onClick={() => void verify()}
          >
            <Icon name="shield" size={17} />
            {busy ? "확인 중…" : "코스 검사"}
          </Button>
        </div>
        <footer className="planner-footer">
          <Icon name="paw" size={18} />
          <span>작은 발걸음도, 여행의 끝까지. PawProof</span>
        </footer>
        {detail && (
          <EvidenceDialog
            historical={model.historical}
            result={detail}
            onClose={() => setDetail(null)}
          />
        )}
      </div>
    </main>
  );
}

export const Planner = withNotifications(PlannerScreen);
