"use client";
import { useSyncExternalStore } from "react";
import { z } from "zod";
const eventName = "pawproof-search-history";
function subscribe(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener(eventName, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(eventName, notify);
  };
}
const historySchema = z.array(z.string().max(60)).max(6);
export function useRecentSearches(mode: string) {
  const key = `pawproof.searches.${mode}`;
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key) || "[]";
      } catch {
        return "[]";
      }
    },
    () => "[]",
  );
  let recent: string[] = [];
  try {
    recent = historySchema.parse(JSON.parse(raw));
  } catch {}
  const setRecent = (values: string[]) => {
    try {
      localStorage.setItem(key, JSON.stringify(values));
      window.dispatchEvent(new Event(eventName));
    } catch {}
  };
  return { recent, setRecent };
}
