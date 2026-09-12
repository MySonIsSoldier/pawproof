"use client";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "../auth/auth-provider";
import { useTripStoreApi } from "../itinerary/state/planner-provider";
import { useNotify } from "../../components/notifications/with-notifications";
import {
  savedTripListSchema,
  savedTripSchema,
  saveTripSchema,
  type SavedTrip,
} from "../../application/contracts/saved-trip";
import { accountRequest } from "./api";

export function useCloudTrips(
  uid: string,
  restore: (trip: SavedTrip["trip"]) => void,
) {
  const auth = useAuth();
  const store = useTripStoreApi();
  const client = useQueryClient();
  const notify = useNotify();
  const alive = useRef(false);
  const draftId = useRef<string | null>(null);
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<SavedTrip | null>(null);
  const [open, setOpen] = useState(false);
  const key = ["account-trips", uid] as const;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      void client.cancelQueries({ queryKey: ["account-trips", uid] });
      client.removeQueries({ queryKey: ["account-trips", uid] });
    };
  }, [client, uid]);
  const list = useQuery({
    queryKey: key,
    enabled: open,
    queryFn: async ({ signal }) =>
      accountRequest(
        "/api/account/trips",
        savedTripListSchema,
        await auth.token(uid),
        "GET",
        undefined,
        signal,
      ),
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const save = useMutation({
    mutationFn: async () => {
      const parsed = saveTripSchema.safeParse({
        title,
        trip: store.getState().trip,
        expectedRevision: selected?.revision || 0,
      });
      if (!parsed.success)
        throw new Error("제목과 반려견 정보, 방문지 3~5곳을 채워 주세요.");
      const id = selected?.id || (draftId.current ??= crypto.randomUUID());
      return accountRequest(
        `/api/account/trips/${id}`,
        savedTripSchema,
        await auth.token(uid),
        "PUT",
        parsed.data,
      );
    },
    onSuccess: (saved) => {
      if (!alive.current) return;
      setSelected(saved);
      setTitle(saved.title);
      void client.invalidateQueries({ queryKey: key });
      notify({ kind: "success", title: "여행 노트를 계정에 저장했어요" });
    },
    onError: () => {
      if (alive.current)
        notify({
          kind: "error",
          title: "계정 저장에 실패했어요. 입력은 그대로 유지돼요.",
        });
    },
    retry: false,
  });
  const remove = useMutation({
    mutationFn: async (saved: SavedTrip) =>
      accountRequest(
        `/api/account/trips/${saved.id}`,
        z.object({ deleted: z.literal(true) }),
        await auth.token(uid),
        "DELETE",
        { expectedRevision: saved.revision },
      ),
    onSuccess: (_, saved) => {
      if (!alive.current) return;
      if (selected?.id === saved.id) {
        draftId.current = null;
        setSelected(null);
        setTitle("");
      }
      void client.invalidateQueries({ queryKey: key });
      notify({ kind: "success", title: "계정에서 여행 노트를 삭제했어요" });
    },
    onError: () => {
      if (alive.current)
        notify({
          kind: "error",
          title: "삭제하지 못했어요. 오류 안내를 확인해 주세요.",
        });
    },
    retry: false,
  });
  function load(saved: SavedTrip) {
    restore(saved.trip);
    setSelected(saved);
    setTitle(saved.title);
    save.reset();
    remove.reset();
  }
  return {
    title,
    setTitle,
    selected,
    open,
    setOpen,
    list,
    save,
    remove,
    load,
    newNote: () => {
      draftId.current = null;
      setSelected(null);
      setTitle("");
      save.reset();
      remove.reset();
    },
    error: save.error?.message || remove.error?.message || list.error?.message,
    pending: save.isPending || remove.isPending,
  };
}
