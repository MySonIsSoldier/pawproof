import { test } from "node:test";
import assert from "node:assert/strict";
import { firebaseAuthError } from "../../src/infrastructure/firebase/auth-error.ts";

test("only expired tokens are reported as expired; rejected sessions remain denied", () => {
  assert.equal(
    firebaseAuthError({ code: "auth/id-token-expired" }).reason,
    "TOKEN_EXPIRED",
  );
  for (const code of [
    "auth/id-token-revoked",
    "auth/user-disabled",
    "auth/user-not-found",
    "auth/argument-error",
    "auth/invalid-id-token",
  ]) {
    const result = firebaseAuthError({ code });
    assert.equal(result.code, "UNAUTHORIZED");
    assert.doesNotMatch(result.message, /만료/);
  }
});

test("server credential, permission and unknown failures are unavailable, never expired", () => {
  for (const [code, reason] of [
    ["app/invalid-credential", "AUTH_CREDENTIAL_INVALID"],
    ["auth/insufficient-permission", "AUTH_PERMISSION_DENIED"],
    ["auth/internal-error", "AUTH_SERVER_ERROR"],
    ["unexpected-sensitive-code", "AUTH_SERVER_ERROR"],
  ]) {
    const error = Object.assign(new Error("secret-token private-key"), {
      code,
    });
    const result = firebaseAuthError(error);
    assert.equal(result.code, "UNAVAILABLE");
    assert.equal(result.reason, reason);
    assert.doesNotMatch(
      JSON.stringify(result),
      /secret-token|private-key|unexpected-sensitive-code/,
    );
  }
});

test("Firebase wrapped key-fetch and dependency failures do not become token rejections", () => {
  for (const [message, reason] of [
    [
      "Error fetching public keys for Google certs: secret",
      "AUTH_CONNECTION_FAILED",
    ],
    ["Cannot find module 'secret-path'", "AUTH_DEPENDENCY_ERROR"],
  ]) {
    const result = firebaseAuthError(
      Object.assign(new Error(message), { code: "auth/argument-error" }),
    );
    assert.equal(result.code, "UNAVAILABLE");
    assert.equal(result.reason, reason);
    assert.doesNotMatch(JSON.stringify(result), /secret/);
  }
});
