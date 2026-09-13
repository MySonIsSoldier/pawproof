"use client";

import { useTripStoreApi } from "../state/planner-provider";
import { loadTripRecord, saveTrip, removeTrip } from "../state/trip-storage";
import { tripRecord } from "../state/trip-store";
import { tripSchema } from "../../../application/contracts/trip";

export function useTripPersistence() {
  const store = useTripStoreApi();
  return {
    save: () => {
      const state = store.getState();
      if (!tripSchema.safeParse(state.trip).success) {
        state.fail("반려견 정보와 방문지 3~5곳을 채운 뒤 저장해 주세요.");
        return;
      }
      try {
        saveTrip(localStorage, state.trip, tripRecord(state));
        state.succeed(
          "코스와 장소 표시 정보, 저장 당시 검사 요약을 이 기기에 저장했어요.",
          "여행 노트를 이 기기에 저장했어요",
        );
      } catch {
        state.fail(
          "이 브라우저에서는 저장할 수 없어요. 현재 화면에서 계속 사용할 수 있어요.",
        );
      }
    },
    load: () => {
      try {
        const record = loadTripRecord(localStorage);
        if (record) store.getState().restore(record);
        else
          store
            .getState()
            .notify(
              "이 기기에 저장된 여행 노트가 없어요.",
              "저장된 여행 노트가 없어요",
            );
      } catch {
        store
          .getState()
          .fail(
            "저장한 입력을 읽을 수 없어요. 저장 삭제 후 새 코스를 만들어 주세요.",
          );
      }
    },
    removeSaved: () => {
      try {
        removeTrip(localStorage);
        store
          .getState()
          .succeed(
            "이 기기에 저장한 입력을 삭제했어요.",
            "저장한 여행 노트를 삭제했어요",
          );
      } catch {
        store.getState().fail("브라우저 저장소에 접근할 수 없어요.");
      }
    },
  };
}
