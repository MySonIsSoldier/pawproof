"use client";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "../auth/auth-provider";
import { useTripStoreApi } from "../itinerary/state/planner-provider";
import { tripRecord } from "../itinerary/state/trip-store";
import { initialTrip } from "../itinerary/state/initial-trip";
import { AccountRequestError, accountRequest } from "./api";
import {
  savedTripListSchema,
  savedTripSchema,
  saveTripSchema,
  tripIdSchema,
  type SavedTrip,
} from "../../application/contracts/saved-trip";
import {
  draftTripSchema,
  type TripRecord,
} from "../../application/contracts/trip-record";

type State = {
  title: string;
  status: "loading" | "saved" | "editing" | "saving" | "error";
  error: string;
  selected: string | null;
};
type Actions = {
  title: (title: string) => void;
  flush: () => Promise<void>;
  load: (note: SavedTrip) => Promise<void>;
  fresh: (mode?: "live" | "demo") => Promise<void>;
  remove: (note: SavedTrip) => Promise<void>;
};
const empty: Actions = {
  title: () => {},
  flush: async () => {},
  load: async () => {},
  fresh: async () => {},
  remove: async () => {},
};
const pendingSchema = z.object({ id: tripIdSchema, input: saveTripSchema });
/** Serializes writes, keeps an unsent draft per account/tab, and rejects stale revisions. */
export function useCloudTrips(
  uid: string,
  restore: (record: TripRecord) => void,
) {
  const { token } = useAuth();
  const store = useTripStoreApi();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>({
    title: "",
    status: "loading",
    error: "",
    selected: null,
  });
  const actions = useRef<Actions>(empty);
  const restoreRef = useRef(restore);
  useEffect(() => {
    restoreRef.current = restore;
  }, [restore]);
  const key = ["account", uid, "trips"];
  const list = useQuery({
    queryKey: key,
    enabled: open,
    queryFn: async ({ signal }) =>
      accountRequest(
        "/api/account/trips",
        savedTripListSchema,
        await token(uid),
        "GET",
        undefined,
        signal,
      ),
  });
  useEffect(() => {
    let alive = true,
      paused = true,
      dirty = false,
      blocked = false;
    let id = crypto.randomUUID() as string,
      revision = 0,
      title = "",
      timer: ReturnType<typeof setTimeout> | undefined;
    let inFlight: Promise<void> | null = null;
    const outbox = `pawproof.pending-note.${uid}`;
    const controller = new AbortController();
    const patch = (next: Partial<State>) => {
      if (alive) setState((s) => ({ ...s, ...next }));
    };
    const url = (noteId: string | null) => {
      const next = new URL(window.location.href);
      if (noteId) next.searchParams.set("note", noteId);
      else next.searchParams.delete("note");
      next.searchParams.set("mode", store.getState().trip.mode);
      window.history.replaceState(null, "", next);
    };
    const input = () =>
      saveTripSchema.parse({
        ...tripRecord(store.getState()),
        title: title.trim() || `${store.getState().trip.date} 여행 노트`,
        expectedRevision: revision,
      });
    const remember = () => {
      try {
        sessionStorage.setItem(outbox, JSON.stringify({ id, input: input() }));
      } catch {
        /* Quota/disabled storage never claims cloud success. */
      }
    };
    const fail = (error: unknown) => {
      blocked = true;
      patch({
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "자동 저장에 실패했어요. 입력은 유지돼요.",
      });
    };
    async function flush() {
      clearTimeout(timer);
      if (paused || !alive) return;
      if (inFlight) {
        await inFlight;
        if (dirty && !blocked) await flush();
        return;
      }
      if (!dirty) return;
      blocked = false;
      let payload;
      try {
        payload = input();
      } catch (error) {
        fail(error);
        throw error;
      }
      dirty = false;
      patch({ status: "saving", error: "" });
      inFlight = (async () => {
        try {
          const saved = await accountRequest(
            `/api/account/trips/${id}`,
            savedTripSchema,
            await token(uid),
            "PUT",
            payload,
            controller.signal,
          );
          if (!alive) return;
          revision = saved.revision;
          patch({ selected: id, status: dirty ? "editing" : "saved" });
          url(id);
          // Preserve edits made while this snapshot was in flight.
          if (dirty) remember();
          else {
            try {
              sessionStorage.removeItem(outbox);
            } catch {}
          }
          void client.invalidateQueries({
            queryKey: ["account", uid, "trips"],
          });
        } catch (error) {
          dirty = true;
          if (alive) fail(error);
          throw error;
        } finally {
          inFlight = null;
        }
      })();
      await inFlight;
      if (dirty && !blocked) await flush();
    }
    function schedule() {
      if (paused || !alive) return;
      dirty = true;
      remember();
      patch({ status: blocked ? "error" : "editing" });
      clearTimeout(timer);
      if (!blocked)
        timer = setTimeout(() => {
          void flush().catch(() => {});
        }, 900);
    }
    function apply(note: SavedTrip) {
      paused = true;
      restoreRef.current(note);
      id = note.id;
      revision = note.revision;
      title = note.title;
      dirty = false;
      blocked = false;
      patch({ title, selected: id, status: "saved", error: "" });
      url(id);
      paused = false;
    }
    async function transition(action: () => Promise<void>) {
      store.getState().setLoading(true);
      try {
        await action();
      } finally {
        if (alive) store.getState().setLoading(false);
      }
    }
    actions.current = {
      title: (next) => {
        title = next;
        patch({ title });
        schedule();
      },
      flush,
      load: (note) =>
        transition(async () => {
          // Confirmation explicitly discards a conflicted unsent draft; never overwrites the remote note.
          if (!blocked) await flush();
          if (!alive) return;
          clearTimeout(timer);
          const latest = await accountRequest(
            `/api/account/trips/${note.id}`,
            savedTripSchema,
            await token(uid),
            "GET",
            undefined,
            controller.signal,
          );
          if (alive) {
            try {
              sessionStorage.removeItem(outbox);
            } catch {}
            apply(latest);
          }
        }),
      fresh: (mode) =>
        transition(async () => {
          let conflict = blocked;
          if (!blocked) {
            try {
              await flush();
            } catch (error) {
              if (!(error instanceof AccountRequestError) || error.status !== 409)
                throw error;
              // The user explicitly chose a new note. Keep the remote note
              // untouched and discard this unsaved local draft before the
              // next note gets its own id and revision sequence.
              conflict = true;
            }
          }
          if (!alive) return;
          clearTimeout(timer);
          if (conflict) {
            try {
              sessionStorage.removeItem(outbox);
            } catch {}
          }
          paused = true;
          const current = store.getState().trip;
          restoreRef.current({
            trip: draftTripSchema.parse({
              ...initialTrip(mode || current.mode, current.date),
              pets: current.pets,
              visits:
                mode === "demo" ? initialTrip("demo", current.date).visits : [],
            }),
            places: [],
            verification: null,
          });
          id = crypto.randomUUID();
          revision = 0;
          title = "";
          dirty = false;
          blocked = false;
          url(null);
          patch({ title: "", selected: null, status: "saved", error: "" });
          paused = false;
          if (conflict)
            store
              .getState()
              .notify(
                "기존 노트가 다른 기기에서 바뀌어 저장하지 못한 변경사항은 새 노트에 옮기지 않았어요.",
                "새 여행 노트를 열었어요",
              );
        }),
      remove: (note) =>
        transition(async () => {
          await flush();
          clearTimeout(timer);
          if (inFlight) await inFlight;
          await accountRequest(
            `/api/account/trips/${note.id}`,
            z.object({ deleted: z.literal(true) }),
            await token(uid),
            "DELETE",
            { expectedRevision: note.id === id ? revision : note.revision },
            controller.signal,
          );
          if (!alive) return;
          if (note.id === id) {
            paused = true;
            dirty = false;
            blocked = false;
            id = crypto.randomUUID();
            revision = 0;
            title = "";
            try {
              sessionStorage.removeItem(outbox);
            } catch {}
            url(null);
            patch({ selected: null, title: "", status: "saved", error: "" });
            paused = false;
          }
          void client.invalidateQueries({
            queryKey: ["account", uid, "trips"],
          });
        }),
    };
    store.setState({ startNote: actions.current.fresh });
    const unsubscribe = store.subscribe((next, previous) => {
      if (
        next.trip !== previous.trip ||
        next.verification !== previous.verification ||
        next.places !== previous.places
      )
        schedule();
    });
    store.getState().setLoading(true);
    void (async () => {
      try {
        let pending: z.infer<typeof pendingSchema> | null = null;
        try {
          const raw = sessionStorage.getItem(outbox);
          if (raw) pending = pendingSchema.parse(JSON.parse(raw));
        } catch {
          try {
            sessionStorage.removeItem(outbox);
          } catch {}
        }
        if (pending) {
          id = pending.id;
          revision = pending.input.expectedRevision;
          title = pending.input.title;
          restoreRef.current(pending.input);
          dirty = true;
          patch({ title, selected: revision ? id : null });
        } else {
          const wanted = new URL(window.location.href).searchParams.get("note");
          if (wanted) {
            if (!tripIdSchema.safeParse(wanted).success)
              throw new Error("올바르지 않은 노트 주소예요.");
            const saved = await accountRequest(
              `/api/account/trips/${wanted}`,
              savedTripSchema,
              await token(uid),
              "GET",
              undefined,
              controller.signal,
            );
            if (!alive) return;
            apply(saved);
          } else {
            const current = store.getState();
            dirty = current.revision > 0 || current.verification !== null;
          }
        }
        paused = false;
        patch({ status: dirty ? "editing" : "saved" });
        if (dirty) await flush();
      } catch (error) {
        if (alive) {
          paused = false;
          fail(error);
        }
      } finally {
        if (alive) store.getState().setLoading(false);
      }
    })();
    const unload = (event: BeforeUnloadEvent) => {
      if (dirty || inFlight) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const online = () => {
      if (dirty && !blocked) void flush().catch(() => {});
    };
    const hide = () => {
      if (document.visibilityState === "hidden") void flush().catch(() => {});
    };
    window.addEventListener("beforeunload", unload);
    window.addEventListener("online", online);
    document.addEventListener("visibilitychange", hide);
    return () => {
      alive = false;
      clearTimeout(timer);
      controller.abort();
      unsubscribe();
      actions.current = empty;
      store.getState().setLoading(false);
      store.setState({ startNote: null });
      window.removeEventListener("beforeunload", unload);
      window.removeEventListener("online", online);
      document.removeEventListener("visibilitychange", hide);
    };
  }, [uid, store, token, client]);
  return {
    ...state,
    open,
    setOpen,
    list,
    actions: {
      title: (value: string) => actions.current.title(value),
      flush: () => actions.current.flush(),
      load: (note: SavedTrip) => actions.current.load(note),
      fresh: () => actions.current.fresh(),
      remove: (note: SavedTrip) => actions.current.remove(note),
    },
  };
}
