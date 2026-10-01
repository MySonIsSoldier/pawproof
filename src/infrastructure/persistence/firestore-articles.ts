import "server-only";
import { FieldPath, type Firestore } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import {
  articleSchema,
  articleSummarySchema,
  type Article,
  type ArticleContent,
  type ArticleList,
  type ArticleSummary,
  type ArticleStatus,
} from "../../application/contracts/article";
import {
  ArticleRepositoryError,
  type ArticleOrigin,
  type ArticleRepository,
} from "../../application/ports/article-repository";

const PAGE_SIZE = 20;
const SITEMAP_PAGE_SIZE = 500;
const COLLECTION = "articles";
const SLUG_COLLECTION = "articleSlugs";
const METADATA_COLLECTION = "articleMetadata";
const PUBLIC_TAGS_DOCUMENT = "publicTags";

type ArticleCursor = { sortAt: string; id: string };

function encodeCursor(cursor: ArticleCursor) {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeCursor(value: string): ArticleCursor {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    );
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "sortAt" in parsed &&
      "id" in parsed &&
      typeof parsed.sortAt === "string" &&
      typeof parsed.id === "string" &&
      !Number.isNaN(Date.parse(parsed.sortAt)) &&
      parsed.id.length > 0
    )
      return { sortAt: parsed.sortAt, id: parsed.id };
  } catch {
    // The cursor is untrusted URL input.
  }
  throw new ArticleRepositoryError(
    "INVALID_CURSOR",
    "아티클 목록 위치를 확인해 주세요.",
  );
}

function updatePublicTagCounts(
  transaction: FirebaseFirestore.Transaction,
  metadata: FirebaseFirestore.DocumentSnapshot,
  removedTags: string[],
  addedTags: string[],
) {
  const counts = new Map(
    Object.entries(
      (metadata.data()?.counts as Record<string, number> | undefined) ?? {},
    ),
  );
  for (const tag of removedTags) {
    const nextCount = Math.max(0, (counts.get(tag) ?? 0) - 1);
    if (nextCount === 0) counts.delete(tag);
    else counts.set(tag, nextCount);
  }
  for (const tag of addedTags)
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  transaction.set(metadata.ref, { counts: Object.fromEntries(counts) });
}

function toArticle(id: string, data: FirebaseFirestore.DocumentData): Article {
  return articleSchema.parse({ id, ...data });
}

function toSummary(
  id: string,
  data: FirebaseFirestore.DocumentData,
): ArticleSummary {
  return articleSummarySchema.parse({ id, ...data });
}

export class FirestoreArticles implements ArticleRepository {
  constructor(private readonly db: Firestore) {}

  async listPublished({
    tag,
    cursor,
  }: {
    tag?: string;
    cursor?: string;
  }): Promise<ArticleList> {
    let query = this.db
      .collection(COLLECTION)
      .where("status", "==", "published");
    if (tag) query = query.where("tags", "array-contains", tag);
    query = query
      .select(
        "title",
        "slug",
        "summary",
        "tags",
        "status",
        "createdAt",
        "updatedAt",
        "publishedAt",
        "origin",
      )
      .orderBy("publishedAt", "desc")
      .orderBy(FieldPath.documentId(), "desc");
    if (cursor) {
      const decoded = decodeCursor(cursor);
      query = query.startAfter(decoded.sortAt, decoded.id);
    }
    const snapshot = await query.limit(PAGE_SIZE + 1).get();
    const hasMore = snapshot.docs.length > PAGE_SIZE;
    const documents = snapshot.docs.slice(0, PAGE_SIZE);
    const articles = documents.map((document) =>
      toSummary(document.id, document.data()),
    );
    const last = documents.at(-1);
    return {
      articles,
      nextCursor:
        hasMore && last
          ? encodeCursor({
              sortAt: last.get("publishedAt"),
              id: last.id,
            })
          : null,
    };
  }

  async listAdmin(cursor?: string): Promise<ArticleList> {
    let query = this.db
      .collection(COLLECTION)
      .select(
        "title",
        "slug",
        "summary",
        "tags",
        "status",
        "createdAt",
        "updatedAt",
        "publishedAt",
        "origin",
      )
      .orderBy("updatedAt", "desc")
      .orderBy(FieldPath.documentId(), "desc");
    if (cursor) {
      const decoded = decodeCursor(cursor);
      query = query.startAfter(decoded.sortAt, decoded.id);
    }
    const snapshot = await query.limit(PAGE_SIZE + 1).get();
    const hasMore = snapshot.docs.length > PAGE_SIZE;
    const documents = snapshot.docs.slice(0, PAGE_SIZE);
    const articles = documents.map((document) =>
      toSummary(document.id, document.data()),
    );
    const last = documents.at(-1);
    return {
      articles,
      nextCursor:
        hasMore && last
          ? encodeCursor({ sortAt: last.get("updatedAt"), id: last.id })
          : null,
    };
  }

  async listPublishedTags(): Promise<string[]> {
    const metadata = await this.db
      .collection(METADATA_COLLECTION)
      .doc(PUBLIC_TAGS_DOCUMENT)
      .get();
    const counts: unknown = metadata.get("counts");
    if (typeof counts !== "object" || counts === null) return [];
    return Object.entries(counts)
      .filter(([, count]) => typeof count === "number" && count > 0)
      .map(([tag]) => tag)
      .sort((left, right) => left.localeCompare(right, "ko-KR"));
  }

  async listPublishedForSitemap(cursor?: string): Promise<ArticleList> {
    let query = this.db
      .collection(COLLECTION)
      .where("status", "==", "published")
      .select(
        "slug",
        "updatedAt",
        "createdAt",
        "title",
        "summary",
        "tags",
        "status",
        "publishedAt",
        "origin",
      )
      .orderBy("publishedAt", "desc")
      .orderBy(FieldPath.documentId(), "desc");
    if (cursor) {
      const decoded = decodeCursor(cursor);
      query = query.startAfter(decoded.sortAt, decoded.id);
    }
    const snapshot = await query.limit(SITEMAP_PAGE_SIZE + 1).get();
    const hasMore = snapshot.docs.length > SITEMAP_PAGE_SIZE;
    const documents = snapshot.docs.slice(0, SITEMAP_PAGE_SIZE);
    const articles = documents.map((document) =>
      toSummary(document.id, document.data()),
    );
    const last = documents.at(-1);
    return {
      articles,
      nextCursor:
        hasMore && last
          ? encodeCursor({ sortAt: last.get("publishedAt"), id: last.id })
          : null,
    };
  }

  async getPublishedBySlug(slug: string): Promise<Article | null> {
    const snapshot = await this.db
      .collection(COLLECTION)
      .where("slug", "==", slug)
      .where("status", "==", "published")
      .limit(1)
      .get();
    const document = snapshot.docs[0];
    return document ? toArticle(document.id, document.data()) : null;
  }

  async getById(id: string): Promise<Article | null> {
    const document = await this.db.collection(COLLECTION).doc(id).get();
    if (!document.exists) return null;
    const data = document.data();
    return data ? toArticle(document.id, data) : null;
  }

  async createDraft(
    content: ArticleContent,
    origin: ArticleOrigin,
  ): Promise<Article> {
    const collection = this.db.collection(COLLECTION);
    const reference = collection.doc(randomUUID());
    const slugReference = this.db
      .collection(SLUG_COLLECTION)
      .doc(content.slug);
    const now = new Date().toISOString();
    const value = {
      ...content,
      status: "draft" as const,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
      origin,
    };
    await this.db.runTransaction(async (transaction) => {
      const existingSlug = await transaction.get(slugReference);
      if (existingSlug.exists)
        throw new ArticleRepositoryError(
          "SLUG_EXISTS",
          "이미 사용 중인 slug입니다.",
        );
      transaction.create(reference, value);
      transaction.create(slugReference, { articleId: reference.id });
    });
    return articleSchema.parse({ id: reference.id, ...value });
  }

  async updateContent(id: string, content: ArticleContent): Promise<Article> {
    const collection = this.db.collection(COLLECTION);
    const reference = collection.doc(id);
    const now = new Date().toISOString();
    const article = await this.db.runTransaction(async (transaction) => {
      const current = await transaction.get(reference);
      if (!current.exists)
        throw new ArticleRepositoryError(
          "NOT_FOUND",
          "아티클을 찾을 수 없습니다.",
        );
      const previousSlug = current.get("slug") as string;
      const slugChanged = previousSlug !== content.slug;
      const previousSlugReference = this.db
        .collection(SLUG_COLLECTION)
        .doc(previousSlug);
      const nextSlugReference = this.db
        .collection(SLUG_COLLECTION)
        .doc(content.slug);
      const [previousSlugDocument, nextSlugDocument] = slugChanged
        ? await Promise.all([
            transaction.get(previousSlugReference),
            transaction.get(nextSlugReference),
          ])
        : [null, null];
      if (
        nextSlugDocument?.exists &&
        nextSlugDocument.get("articleId") !== id
      )
        throw new ArticleRepositoryError(
          "SLUG_EXISTS",
          "이미 사용 중인 slug입니다.",
        );
      const currentTags = current.get("tags") as string[];
      const currentIsPublished = current.get("status") === "published";
      const tagsChanged =
        currentTags.length !== content.tags.length ||
        currentTags.some((tag) => !content.tags.includes(tag));
      const metadata =
        currentIsPublished && tagsChanged
          ? await transaction.get(
              this.db
                .collection(METADATA_COLLECTION)
                .doc(PUBLIC_TAGS_DOCUMENT),
            )
          : null;
      const next = {
        ...current.data(),
        ...content,
        updatedAt: now,
      };
      transaction.update(reference, { ...content, updatedAt: now });
      if (slugChanged) {
        if (previousSlugDocument?.get("articleId") === id)
          transaction.delete(previousSlugReference);
        if (!nextSlugDocument?.exists)
          transaction.create(nextSlugReference, { articleId: id });
      }
      if (metadata)
        updatePublicTagCounts(
          transaction,
          metadata,
          currentTags,
          content.tags,
        );
      return toArticle(id, next);
    });
    return article;
  }

  async setStatus(id: string, status: ArticleStatus): Promise<Article> {
    const reference = this.db.collection(COLLECTION).doc(id);
    const article = await this.db.runTransaction(async (transaction) => {
      const current = await transaction.get(reference);
      if (!current.exists)
        throw new ArticleRepositoryError(
          "NOT_FOUND",
          "아티클을 찾을 수 없습니다.",
        );
      const currentIsPublished = current.get("status") === "published";
      const nextIsPublished = status === "published";
      const metadata =
        currentIsPublished !== nextIsPublished
          ? await transaction.get(
              this.db
                .collection(METADATA_COLLECTION)
                .doc(PUBLIC_TAGS_DOCUMENT),
            )
          : null;
      const now = new Date().toISOString();
      const publishedAt =
        status === "published"
          ? now
          : status === "draft"
            ? null
            : (current.get("publishedAt") ?? null);
      transaction.update(reference, { status, publishedAt, updatedAt: now });
      if (metadata) {
        const tags = current.get("tags") as string[];
        updatePublicTagCounts(
          transaction,
          metadata,
          currentIsPublished ? tags : [],
          nextIsPublished ? tags : [],
        );
      }
      return toArticle(id, {
        ...current.data(),
        status,
        publishedAt,
        updatedAt: now,
      });
    });
    return article;
  }

  async remove(id: string): Promise<void> {
    const reference = this.db.collection(COLLECTION).doc(id);
    await this.db.runTransaction(async (transaction) => {
      const document = await transaction.get(reference);
      if (!document.exists)
        throw new ArticleRepositoryError(
          "NOT_FOUND",
          "아티클을 찾을 수 없습니다.",
        );
      const slugReference = this.db
        .collection(SLUG_COLLECTION)
        .doc(document.get("slug") as string);
      const slugReservation = await transaction.get(slugReference);
      const isPublished = document.get("status") === "published";
      const metadata = isPublished
        ? await transaction.get(
            this.db.collection(METADATA_COLLECTION).doc(PUBLIC_TAGS_DOCUMENT),
          )
        : null;
      transaction.delete(reference);
      if (slugReservation.get("articleId") === id)
        transaction.delete(slugReference);
      if (metadata) {
        const tags = document.get("tags") as string[];
        updatePublicTagCounts(transaction, metadata, tags, []);
      }
    });
  }
}
