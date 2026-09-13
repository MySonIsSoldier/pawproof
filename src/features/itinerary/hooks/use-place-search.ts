"use client";

import { useRecentSearches } from "./use-recent-searches";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Category, TripInput } from "../../../domain/policies/types";
import { searchResultSchema } from "../../../application/contracts/result";
import { callApi } from "../api";
import { useNotify } from "../../../components/notifications/with-notifications";

export function usePlaceSearch(mode: TripInput["mode"], busy: boolean) {
  const notify = useNotify();
  const { recent, setRecent } = useRecentSearches(mode);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState<{
    query: string;
    category: string;
    sequence: number;
  } | null>(null);
  const search = useQuery({
    queryKey: ["places", mode, submitted, category],
    enabled: true,
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        mode,
        q: submitted?.query ?? (mode === "live" ? "인천" : ""),
      });
      if (category) params.set("category", category);
      return callApi(
        `/api/places?${params}`,
        searchResultSchema,
        undefined,
        signal,
      );
    },
  });
  const { data, error, dataUpdatedAt, errorUpdatedAt } = search;
  useEffect(() => {
    if (!submitted) return;
    if (error)
      notify({
        kind: "error",
        title: "장소를 찾지 못했어요. 검색창의 오류 안내를 확인해 주세요.",
      });
    else if (data)
      notify({
        kind: "info",
        title: data.places.length
          ? `검색 결과 ${data.places.length}곳을 찾았어요`
          : "검색 조건에 맞는 장소가 없어요",
      });
  }, [data, error, dataUpdatedAt, errorUpdatedAt, notify, submitted]);
  return {
    query,
    setQuery,
    category,
    setCategory: (next: Category | "") => {
      setCategory(next);
      setSubmitted(null);
      setMessage("");
    },
    places: (search.data?.places || []).slice(0, submitted ? 100 : 8),
    recommended: !submitted,
    recent,
    clearRecent: () => setRecent([]),
    loading: search.isFetching,
    searched: search.isSuccess,
    message: message || (submitted ? search.error?.message : "") || "",
    recommendationFailed: !submitted && !!search.error,
    search: (term = query) => {
      if (busy || search.isFetching) return;
      if (mode === "live" && !term.trim()) {
        setMessage("지역이나 장소 이름을 입력해 주세요.");
        notify({ kind: "info", title: "검색할 지역이나 장소 이름이 필요해요" });
        return;
      }
      setQuery(term);
      const history = [
        term.trim(),
        ...recent.filter((value) => value !== term.trim()),
      ]
        .filter(Boolean)
        .slice(0, 6);
      setRecent(history);
      setMessage("");
      setSubmitted((old) => ({
        query: term.trim(),
        category,
        sequence: (old?.sequence || 0) + 1,
      }));
    },
  };
}
