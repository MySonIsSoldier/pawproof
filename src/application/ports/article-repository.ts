import type {
  Article,
  ArticleContent,
  ArticleList,
  ArticleStatus,
} from "../contracts/article";

export type ArticleOrigin = Article["origin"];

export interface ArticleRepository {
  listPublished(input: { tag?: string; cursor?: string }): Promise<ArticleList>;
  listAdmin(cursor?: string): Promise<ArticleList>;
  listPublishedTags(): Promise<string[]>;
  listPublishedForSitemap(cursor?: string): Promise<ArticleList>;
  getPublishedBySlug(slug: string): Promise<Article | null>;
  getById(id: string): Promise<Article | null>;
  createDraft(content: ArticleContent, origin: ArticleOrigin): Promise<Article>;
  updateContent(id: string, content: ArticleContent): Promise<Article>;
  setStatus(id: string, status: ArticleStatus): Promise<Article>;
  remove(id: string): Promise<void>;
}

export class ArticleRepositoryError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "SLUG_EXISTS" | "INVALID_CURSOR",
    message: string,
  ) {
    super(message);
    this.name = "ArticleRepositoryError";
  }
}
