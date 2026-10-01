import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { AccountError } from "../application/ports/trip-repository";
import {
  ArticleRepositoryError,
  type ArticleRepository,
} from "../application/ports/article-repository";
import { adminDb } from "../infrastructure/firebase/admin";
import { FirestoreArticles } from "../infrastructure/persistence/firestore-articles";
import { requireAccount } from "./account";
import { json } from "./http";

export const articleRepository = (): ArticleRepository => {
  assertArticleEnvironmentEnabled();
  return new FirestoreArticles(adminDb());
};

export class ArticleAccessError extends Error {
  constructor(
    readonly code:
      | "UNAUTHORIZED"
      | "FORBIDDEN"
      | "ADMIN_NOT_CONFIGURED"
      | "INGEST_NOT_CONFIGURED"
      | "ARTICLE_ENV_DISABLED",
    message: string,
  ) {
    super(message);
    this.name = "ArticleAccessError";
  }
}

function assertArticleEnvironmentEnabled() {
  const isVercelProduction =
    process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";
  const usesFirebaseEmulators = Boolean(
    process.env.FIREBASE_AUTH_EMULATOR_HOST &&
    process.env.FIRESTORE_EMULATOR_HOST,
  );
  const isLocalEmulator = process.env.VERCEL !== "1" && usesFirebaseEmulators;
  if (!isVercelProduction && !isLocalEmulator)
    throw new ArticleAccessError(
      "ARTICLE_ENV_DISABLED",
      "Preview와 기본 로컬 환경에서는 운영 아티클 저장소를 사용할 수 없습니다.",
    );
}

export async function requireArticleAdmin(request: Request) {
  assertArticleEnvironmentEnabled();
  const uid = await requireAccount(request, false);
  const allowedUids = (process.env.ARTICLE_ADMIN_UIDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (allowedUids.length === 0)
    throw new ArticleAccessError(
      "ADMIN_NOT_CONFIGURED",
      "관리자 권한 설정이 필요합니다.",
    );
  if (!allowedUids.includes(uid))
    throw new ArticleAccessError("FORBIDDEN", "아티클 관리자 권한이 없습니다.");
  return uid;
}

function tokenDigest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function requireArticleIngestToken(request: Request) {
  assertArticleEnvironmentEnabled();
  const expected = process.env.ARTICLE_INGEST_TOKEN?.trim();
  if (!expected || expected.length < 32)
    throw new ArticleAccessError(
      "INGEST_NOT_CONFIGURED",
      "아티클 수집 API 설정이 필요합니다.",
    );
  const supplied = request.headers
    .get("authorization")
    ?.match(/^Bearer ([^\s]+)$/)?.[1];
  if (
    !supplied ||
    supplied.length > 8192 ||
    !timingSafeEqual(tokenDigest(expected), tokenDigest(supplied))
  )
    throw new ArticleAccessError("UNAUTHORIZED", "인증 정보를 확인해 주세요.");
}

export function articleErrorResponse(error: unknown) {
  if (error instanceof ArticleAccessError) {
    const status = {
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      ADMIN_NOT_CONFIGURED: 503,
      INGEST_NOT_CONFIGURED: 503,
      ARTICLE_ENV_DISABLED: 503,
    }[error.code];
    return json({ error: error.message, code: error.code }, status);
  }
  if (error instanceof AccountError) {
    const statuses = {
      UNAUTHORIZED: 401,
      VERIFY_EMAIL: 403,
      UNAVAILABLE: 503,
      CONFLICT: 409,
      LIMIT: 409,
      NOT_FOUND: 404,
    };
    return json(
      { error: error.message, code: error.code },
      statuses[error.code],
    );
  }
  if (error instanceof ArticleRepositoryError) {
    const status =
      error.code === "NOT_FOUND"
        ? 404
        : error.code === "INVALID_CURSOR"
          ? 400
          : 409;
    return json({ error: error.message, code: error.code }, status);
  }
  if (error instanceof z.ZodError)
    return json(
      { error: "아티클 입력 형식을 확인해 주세요.", code: "INVALID_INPUT" },
      400,
    );
  console.error("Article operation failed", {
    error: error instanceof Error ? error.message : "Unknown error",
  });
  return json(
    { error: "아티클 작업을 완료하지 못했어요.", code: "UNAVAILABLE" },
    503,
  );
}
