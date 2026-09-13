"use client";

import { useEffect } from "react";
import { useAuth } from "../../auth/auth-provider";
import { useTripStoreApi } from "../state/planner-provider";

/** Browser-owned refresh/close confirmation; guest work never enters storage. */
export function useGuestLeaveWarning() {
  const { user } = useAuth();
  const store = useTripStoreApi();
  const canSave = !!user?.verified;
  useEffect(() => {
    if (canSave) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const sync = () => {
      const state = store.getState();
      const hasWork = state.revision > 0 || state.verification !== null;
      window.removeEventListener("beforeunload", warn);
      if (hasWork) window.addEventListener("beforeunload", warn);
    };
    sync();
    const unsubscribe = store.subscribe(sync);
    return () => {
      unsubscribe();
      window.removeEventListener("beforeunload", warn);
    };
  }, [store, canSave]);
}
