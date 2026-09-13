export function authErrorMessage(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
  const messages: Record<string, string> = {
    "auth/email-not-verified":
      "아직 인증되지 않았어요. 이메일의 인증 링크를 누른 뒤 다시 확인해 주세요.",
    "auth/invalid-credential": "이메일과 비밀번호를 확인해 주세요.",
    "auth/user-not-found": "이메일과 비밀번호를 확인해 주세요.",
    "auth/wrong-password": "이메일과 비밀번호를 확인해 주세요.",
    "auth/email-already-in-use":
      "가입할 수 없는 이메일이에요. 로그인 또는 비밀번호 재설정을 이용해 주세요.",
    "auth/weak-password":
      "더 안전한 비밀번호를 입력해 주세요. 10자 이상으로 입력해 주세요.",
    "auth/popup-blocked":
      "로그인 팝업이 차단됐어요. 팝업을 허용하거나 이메일로 로그인해 주세요.",
    "auth/popup-closed-by-user":
      "로그인을 취소했어요. 원할 때 다시 시도할 수 있어요.",
    "auth/cancelled-popup-request": "진행 중인 로그인 창에서 계속해 주세요.",
    "auth/unauthorized-domain":
      "현재 접속 주소의 로그인 연결을 준비하고 있어요. 비로그인으로 계속 이용할 수 있어요.",
    "auth/network-request-failed": "연결을 확인한 뒤 다시 시도해 주세요.",
    "auth/too-many-requests": "요청이 많아요. 잠시 후 다시 시도해 주세요.",
    "auth/operation-not-allowed": "이 로그인 방법을 아직 준비하고 있어요.",
  };
  return (
    messages[code] ||
    "로그인 작업을 완료하지 못했어요. 잠시 후 다시 시도해 주세요."
  );
}
