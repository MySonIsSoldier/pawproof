import { z } from "zod";
import {
  articleListSchema,
  articleSchema,
  type Article,
  type ArticleContent,
  type ArticleStatus,
} from "../../application/contracts/article";
import { apiPath } from "../../config/public";

export class AdminArticleRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AdminArticleRequestError";
  }
}

const articleEnvelope = z.object({ article: articleSchema }).strict();
const articleListEnvelope = articleListSchema;
const deleteEnvelope = z.object({ deleted: z.literal(true) }).strict();

async function request<T>(
  path: string,
  token: string,
  schema: z.ZodType<T>,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(apiPath(path), {
    method,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsed = z
      .object({ error: z.string() })
      .passthrough()
      .safeParse(result);
    throw new AdminArticleRequestError(
      parsed.success ? parsed.data.error : "아티클 요청을 완료하지 못했어요.",
      response.status,
    );
  }
  const parsed = schema.safeParse(result);
  if (!parsed.success) throw new Error("아티클 응답 형식을 확인할 수 없어요.");
  return parsed.data;
}

export async function listAdminArticles(token: string, cursor?: string) {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return request(`/api/admin/articles${query}`, token, articleListEnvelope);
}

export async function getAdminArticle(token: string, id: string) {
  const result = await request(
    `/api/admin/articles/${encodeURIComponent(id)}`,
    token,
    articleEnvelope,
  );
  return result.article;
}

export async function saveAdminArticle(
  token: string,
  content: ArticleContent,
  id?: string,
) {
  const result = await request(
    id
      ? `/api/admin/articles/${encodeURIComponent(id)}`
      : "/api/admin/articles",
    token,
    articleEnvelope,
    id ? "PUT" : "POST",
    content,
  );
  return result.article;
}

export async function setAdminArticleStatus(
  token: string,
  id: string,
  status: ArticleStatus,
) {
  const result = await request(
    `/api/admin/articles/${encodeURIComponent(id)}`,
    token,
    articleEnvelope,
    "PATCH",
    { status },
  );
  return result.article;
}

export async function deleteAdminArticle(token: string, id: string) {
  return request(
    `/api/admin/articles/${encodeURIComponent(id)}`,
    token,
    deleteEnvelope,
    "DELETE",
  );
}

export type { Article };
