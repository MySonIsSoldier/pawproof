"use client";
import { useState, useId, useEffect, type FormEvent } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../../components/ui/dialog";
import { Icon } from "../../components/icon";
import {
  withNotifications,
  useNotify,
  useDismissNotifications,
} from "../../components/notifications/with-notifications";
import { useAuth } from "./auth-provider";
import { authErrorMessage } from "./errors";
import { useGoogleSignIn } from "./use-google-sign-in";
import styles from "./auth.module.css";

function AuthDialogScreen() {
  const auth = useAuth();
  const google = useGoogleSignIn();
  const passwordHint = useId();
  const notify = useNotify();
  const dismiss = useDismissNotifications();
  useEffect(() => {
    if (!auth.open) dismiss();
  }, [auth.open, dismiss]);
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function perform(
    action: Parameters<typeof auth.run>[0],
    success: string,
    navigate = false,
  ) {
    if (pending) return;
    setPending(true);
    setError("");
    google.clearError();
    setMessage("");
    try {
      await auth.run(action);
      setMessage(success);
      if (navigate) {
        auth.completeLogin(success);
      } else notify({ kind: "success", title: success });
    } catch (error) {
      const text = authErrorMessage(error);
      setError(text);
      notify({ kind: "error", title: text });
    } finally {
      setPending(false);
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    void perform(
      async (auth, sdk) => {
        if (mode === "reset") {
          await sdk.sendPasswordResetEmail(auth, email);
          return;
        }
        if (mode === "signup") {
          const result = await sdk.createUserWithEmailAndPassword(
            auth,
            email,
            password,
          );
          await sdk.sendEmailVerification(result.user);
        } else await sdk.signInWithEmailAndPassword(auth, email, password);
      },
      mode === "reset"
        ? "등록된 이메일이라면 재설정 메일이 전송돼요."
        : mode === "signup"
          ? "가입했어요. 이메일의 인증 링크를 확인해 주세요."
          : "로그인했어요. 여행 노트를 계정에 보관할 수 있어요.",
      mode !== "reset",
    );
    event.currentTarget
      .querySelector<HTMLInputElement>('[name="password"]')
      ?.blur();
  }
  // Unmount the entire modal, including Radix focus guards and scroll lock.
  // Merely closing it keeps those layers alive during the exit animation.
  if (google.pending)
    return (
      <section className={styles.googlePending} aria-label="Google 로그인 진행">
        <p role="status">Google 로그인 창에서 계속해 주세요.</p>
        <Button variant="outline" onClick={google.returnToLogin}>
          로그인 화면으로 돌아가기
        </Button>
      </section>
    );
  return (
    <Dialog
      open={auth.open && !auth.user}
      onOpenChange={(next) => {
        if (!pending) {
          auth.setOpen(next);
          setError("");
          google.clearError();
          setMessage("");
        }
      }}
    >
      <DialogContent
        className={styles.dialog}
        onCloseAutoFocus={google.onCloseAutoFocus}
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">YOUR TRAVEL NOTE</p>
            <DialogTitle>
              {mode === "signup"
                ? "우리의 첫 여행을 시작해요"
                : mode === "reset"
                  ? "비밀번호를 다시 설정해요"
                  : "어디서든 이어가는 여행"}
            </DialogTitle>
          </div>
          <DialogClose asChild>
            <Button
              variant="icon"
              aria-label="계정 안내 닫기"
              disabled={pending}
            >
              <Icon name="close" />
            </Button>
          </DialogClose>
        </div>
        <DialogDescription>
          회원가입 없이도 코스를 검사할 수 있어요. 로그인하면 여행 노트를 다른
          기기에서도 열 수 있어요.
        </DialogDescription>
        {!auth.configured ? (
          <p className={styles.notice}>
            계정 연결을 준비하고 있어요. 코스 검사는 계속 이용할 수 있지만,
            지금은 여행 노트를 저장할 수 없어요.
          </p>
        ) : !auth.ready ? (
          <p role="status">로그인 상태를 확인하고 있어요…</p>
        ) : auth.user ? (
          <p role="status">여행 노트를 준비하고 있어요…</p>
        ) : (
          <div className={styles.body}>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => {
                setError("");
                setMessage("");
                void google.start();
              }}
            >
              Google로 계속하기
            </Button>
            <div className={styles.divider} role="separator" />
            <form className={styles.form} onSubmit={submit} key={mode}>
              <label>
                이메일
                <Input
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  required
                  disabled={pending}
                />
              </label>
              {mode !== "reset" && (
                <label>
                  비밀번호
                  <Input
                    name="password"
                    aria-label="비밀번호"
                    aria-describedby={
                      mode === "signup" ? passwordHint : undefined
                    }
                    type="password"
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
                    minLength={mode === "signup" ? 10 : 1}
                    maxLength={128}
                    required
                    disabled={pending}
                  />
                  {mode === "signup" && (
                    <span className="field-caption" id={passwordHint}>
                      10자 이상으로 입력해 주세요.
                    </span>
                  )}
                </label>
              )}
              <Button type="submit" disabled={pending}>
                {pending
                  ? "처리 중…"
                  : mode === "login"
                    ? "이메일로 로그인"
                    : mode === "signup"
                      ? "이메일로 가입"
                      : "재설정 메일 받기"}
              </Button>
            </form>
            <div className={styles.links}>
              {mode !== "login" && (
                <Button
                  variant="link"
                  disabled={pending}
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                >
                  이메일 로그인
                </Button>
              )}
              {mode !== "signup" && (
                <Button
                  variant="link"
                  disabled={pending}
                  onClick={() => {
                    setMode("signup");
                    setError("");
                  }}
                >
                  회원가입
                </Button>
              )}
              {mode !== "reset" && (
                <Button
                  variant="link"
                  disabled={pending}
                  onClick={() => {
                    setMode("reset");
                    setError("");
                  }}
                >
                  비밀번호 찾기
                </Button>
              )}
            </div>
          </div>
        )}
        {(error || google.error || auth.error) && (
          <p role="alert" className={styles.error}>
            {error || google.error || auth.error}
          </p>
        )}
        {message && (
          <p role="status" className={styles.notice}>
            {message}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
export const AuthDialog = withNotifications(AuthDialogScreen);
