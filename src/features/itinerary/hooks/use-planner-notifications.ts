"use client";

import { useEffect } from "react";
import { useNotify } from "../../../components/notifications/with-notifications";
import { useTripStoreApi } from "../state/planner-provider";

export function usePlannerNotifications() {
  const store = useTripStoreApi();
  const notify = useNotify();
  useEffect(
    () =>
      store.subscribe((state, previous) => {
        // Subscribe to new events only: no replay on mount, no toast on typing.
        if (state.feedback && state.feedback !== previous.feedback)
          notify(state.feedback);
      }),
    [store, notify],
  );
}
