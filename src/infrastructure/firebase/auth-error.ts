import { AccountError } from "../../application/ports/trip-repository.ts";

export class FirebaseAccountAuthError extends AccountError {
  readonly reason: string;
  constructor(
    code: "UNAUTHORIZED" | "UNAVAILABLE",
    message: string,
    reason: string,
  ) {
    super(code, message);
    this.reason = reason;
  }
}

// Never return/log provider messages: they can contain credentials or token claims.
export function firebaseAuthError(error: unknown): FirebaseAccountAuthError {
  const code =
    error && typeof error === "object" && "code" in error
      ? error.code
      : undefined;
  const message = error instanceof Error ? error.message : "";
  let reason = "AUTH_SERVER_ERROR";
  if (code === "auth/id-token-expired")
    return new FirebaseAccountAuthError(
      "UNAUTHORIZED",
      "로그인이 만료되었어요. 다시 로그인해 주세요.",
      "TOKEN_EXPIRED",
    );
  if (
    [
      "auth/id-token-revoked",
      "auth/user-disabled",
      "auth/user-not-found",
    ].includes(String(code))
  )
    return new FirebaseAccountAuthError(
      "UNAUTHORIZED",
      "로그인을 다시 확인해 주세요. 재로그인이 필요해요.",
      "SESSION_REJECTED",
    );
  if (code === "auth/insufficient-permission")
    reason = "AUTH_PERMISSION_DENIED";
  else if (
    code === "app/invalid-credential" ||
    code === "auth/invalid-credential"
  )
    reason = "AUTH_CREDENTIAL_INVALID";
  else if (
    /Cannot find (module|package)|require\(\) of ES Module/.test(message)
  )
    reason = "AUTH_DEPENDENCY_ERROR";
  else if (
    /Error fetching public keys|Error while making request/.test(message) ||
    code === "app/network-error" ||
    code === "app/network-timeout"
  )
    reason = "AUTH_CONNECTION_FAILED";
  else if (
    [
      "auth/argument-error",
      "auth/invalid-argument",
      "auth/invalid-id-token",
    ].includes(String(code))
  )
    return new FirebaseAccountAuthError(
      "UNAUTHORIZED",
      "로그인 정보를 확인하지 못했어요. 다시 로그인해 주세요.",
      "TOKEN_INVALID",
    );
  return new FirebaseAccountAuthError(
    "UNAVAILABLE",
    "계정 인증 서버에 연결하지 못했어요. 입력은 그대로 두고 잠시 후 다시 시도해 주세요.",
    reason,
  );
}
