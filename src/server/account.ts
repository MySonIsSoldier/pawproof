import "server-only";
import { z } from "zod";
import { AccountError } from "../application/ports/trip-repository";
import { adminAuth, adminDb } from "../infrastructure/firebase/admin";
import {
  firebaseAuthError,
  FirebaseAccountAuthError,
} from "../infrastructure/firebase/auth-error";
import { FirestoreTrips } from "../infrastructure/persistence/firestore-trips";
import { json } from "./http";
export async function requireAccount(request: Request, verified = true) {
  const bearer = request.headers
    .get("authorization")
    ?.match(/^Bearer ([^\s]+)$/)?.[1];
  if (!bearer || bearer.length > 8192)
    throw new AccountError("UNAUTHORIZED", "로그인한 뒤 다시 시도해 주세요.");
  let auth;
  try {
    auth = adminAuth();
  } catch {
    throw new AccountError(
      "UNAVAILABLE",
      "계정 저장 연결을 준비하고 있어요. 지금은 여행 노트를 저장할 수 없어요.",
    );
  }
  let token;
  try {
    token = await auth.verifyIdToken(bearer, true);
  } catch (error) {
    const failure = firebaseAuthError(error);
    if (failure.code === "UNAVAILABLE")
      console.error("Account authentication failed", {
        reason: failure.reason,
      });
    throw failure;
  }
  if (verified && !token.email_verified)
    throw new AccountError(
      "VERIFY_EMAIL",
      "이메일 인증을 마친 뒤 계정 저장을 이용해 주세요.",
    );
  return token.uid;
}
export const accountTrips = () => new FirestoreTrips(adminDb());
export function accountErrorResponse(error: unknown) {
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
      {
        error: error.message,
        code: error.code,
        ...(error instanceof FirebaseAccountAuthError
          ? { reason: error.reason }
          : {}),
      },
      statuses[error.code],
    );
  }
  if (error instanceof z.ZodError)
    return json(
      {
        error: "노트와 반려견 정보의 형식을 확인해 주세요.",
        code: "INVALID_INPUT",
      },
      400,
    );
  return json(
    {
      error:
        "여행 노트를 처리하지 못했어요. 입력은 그대로 두고 잠시 후 다시 시도해 주세요.",
      code: "UNAVAILABLE",
    },
    503,
  );
}
