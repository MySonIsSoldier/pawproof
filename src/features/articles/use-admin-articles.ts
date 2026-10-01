"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ArticleContent,
  ArticleStatus,
} from "../../application/contracts/article";
import { useAuth } from "../auth/auth-provider";
import {
  deleteAdminArticle,
  getAdminArticle,
  listAdminArticles,
  saveAdminArticle,
  setAdminArticleStatus,
} from "./admin-api";

export function useAdminArticles(cursor?: string) {
  const auth = useAuth();
  const uid = auth.user?.uid ?? null;
  const key = ["admin-articles", uid, cursor] as const;

  const list = useQuery({
    queryKey: key,
    enabled: auth.ready && auth.configured && !!uid,
    retry: false,
    queryFn: async () => listAdminArticles(await auth.token(uid!), cursor),
  });
  const actions = useAdminArticleActions();

  return { auth, list, ...actions };
}

export function useAdminArticleActions() {
  const auth = useAuth();
  const uid = auth.user?.uid ?? null;
  const queryClient = useQueryClient();
  const key = ["admin-articles", uid] as const;

  const save = useMutation({
    mutationFn: async (input: { id?: string; content: ArticleContent }) =>
      saveAdminArticle(await auth.token(uid!), input.content, input.id),
    onSuccess: (saved) => {
      queryClient.setQueryData(["admin-article", uid, saved.id], saved);
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
  const changeStatus = useMutation({
    mutationFn: async (input: { id: string; status: ArticleStatus }) =>
      setAdminArticleStatus(await auth.token(uid!), input.id, input.status),
    onSuccess: (saved) => {
      queryClient.setQueryData(["admin-article", uid, saved.id], saved);
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      await deleteAdminArticle(await auth.token(uid!), id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: ["admin-article", uid, id] });
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });

  return { save, changeStatus, remove };
}

export function useAdminArticle(id: string | null) {
  const auth = useAuth();
  const uid = auth.user?.uid ?? null;
  return useQuery({
    queryKey: ["admin-article", uid, id],
    enabled: auth.ready && auth.configured && !!uid && !!id,
    retry: false,
    queryFn: async () => getAdminArticle(await auth.token(uid!), id!),
  });
}
