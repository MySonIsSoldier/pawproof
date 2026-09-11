"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Category, TripInput } from "../../../domain/policies/types";
import { searchResultSchema } from "../../../application/contracts/result";
import { callApi } from "../api";

export function usePlaceSearch(mode: TripInput["mode"], busy: boolean) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState<{
    query: string;
    category: string;
    sequence: number;
  } | null>(null);
  const search = useQuery({
    queryKey: ["places", mode, submitted],
    enabled: submitted !== null,
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ mode, q: submitted?.query || "" });
      if (submitted?.category) params.set("category", submitted.category);
      return callApi(
        `/api/places?${params}`,
        searchResultSchema,
        undefined,
        signal,
      );
    },
  });
  return {
    query,
    setQuery,
    category,
    setCategory: (next: Category | "") => {
      setCategory(next);
      setSubmitted(null);
      setMessage("");
    },
    places: search.data?.places || [],
    loading: search.isFetching,
    searched: search.isSuccess,
    message: message || search.error?.message || "",
    search: () => {
      if (busy || search.isFetching) return;
      if (mode === "live" && !query.trim()) {
        setMessage("지역이나 장소 이름을 입력해 주세요.");
        return;
      }
      setMessage("");
      setSubmitted((old) => ({
        query: query.trim(),
        category,
        sequence: (old?.sequence || 0) + 1,
      }));
    },
  };
}
