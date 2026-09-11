"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { tripSchema } from "../../../application/contracts/trip";
import {
  resultSchema,
  recoveryResultSchema,
} from "../../../application/contracts/result";
import type { TripInput } from "../../../domain/policies/types";
import { isTripStale } from "../state/trip-store";
import { useTripStoreApi } from "../state/planner-provider";
import { callApi } from "../api";

type Request = { trip: TripInput; revision: number; signal: AbortSignal };
export function useTripOperations() {
  const store = useTripStoreApi();
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  const callbacks = {
    onError: (error: Error, request: Request) => {
      if (
        !request.signal.aborted &&
        store.getState().revision === request.revision
      )
        store.getState().fail(error.message);
    },
    onSettled: () => {
      active.current = null;
    },
  };
  const verification = useMutation({
    mutationFn: (request: Request) =>
      callApi("/api/verify", resultSchema, request.trip, request.signal),
    ...callbacks,
    onSuccess: (result, request) => {
      if (!request.signal.aborted)
        store.getState().acceptVerification(request.revision, result);
    },
  });
  const recovery = useMutation({
    mutationFn: (request: Request & { index: number }) =>
      callApi(
        "/api/recover",
        recoveryResultSchema,
        { trip: request.trip, index: request.index },
        request.signal,
      ),
    ...callbacks,
    onSuccess: (result, request) => {
      if (
        request.signal.aborted ||
        store.getState().revision !== request.revision
      )
        return;
      store
        .getState()
        .notify(
          result.alternatives.length
            ? "조건과 일정을 확인한 대체 후보를 찾았어요."
            : "조건과 고정 일정을 모두 지킬 수 있는 대체 후보가 없어요.",
          result.alternatives.length
            ? "대체 후보를 찾았어요"
            : "조건에 맞는 대체 후보가 없어요",
        );
    },
  });
  function begin() {
    if (active.current) return null;
    const state = store.getState();
    const parsed = tripSchema.safeParse(state.trip);
    if (!parsed.success) {
      state.fail(
        "반려견의 이름·견종·체중, 날짜와 방문지 3~5곳을 확인해 주세요.",
      );
      return null;
    }
    active.current = new AbortController();
    state.clearFeedback();
    recovery.reset();
    return {
      trip: parsed.data,
      revision: state.revision,
      signal: active.current.signal,
    };
  }
  return {
    busy: verification.isPending
      ? ("verify" as const)
      : recovery.isPending
        ? ("recover" as const)
        : null,
    verify: () => {
      const request = begin();
      if (request) verification.mutate(request);
    },
    recover: (index: number) => {
      const state = store.getState();
      if (
        isTripStale(state) ||
        !state.verification ||
        !state.trip.visits[index] ||
        state.trip.visits[index].locked
      )
        return;
      const request = begin();
      if (request) recovery.mutate({ ...request, index });
    },
    alternatives:
      recovery.isSuccess &&
      recovery.variables.revision === store.getState().revision
        ? {
            index: recovery.variables.index,
            revision: recovery.variables.revision,
            items: recovery.data.alternatives,
            inspected: recovery.data.inspected,
          }
        : null,
    clearAlternatives: recovery.reset,
  };
}
