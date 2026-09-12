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
import styles from "./auth.module.css";

function AuthDialogScreen() {
  const auth = useAuth();
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
  ) {
    if (pending) return;
    setPending(true);
    setError("");
    setMessage("");
    try {
      await auth.run(action);
      setMessage(success);
      notify({ kind: "success", title: success });
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
    );
    event.currentTarget
      .querySelector<HTMLInputElement>('[name="password"]')
      ?.blur();
  }
  return (
    <Dialog
      open={auth.open}
      onOpenChange={(next) => {
        if (!pending) {
          auth.setOpen(next);
          setError("");
          setMessage("");
        }
      }}
    >
      <DialogContent className={styles.dialog}>
        <div className="dialog-header">
          <div>
            <p className="eyebrow">YOUR TRAVEL NOTE</p>
            <DialogTitle>
              {auth.user ? "나의 계정" : "어디서든 이어가는 여행"}
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
            계정 연결을 준비하고 있어요. 지금은 ‘이 기기에 저장’을 이용해
            주세요.
          </p>
        ) : !auth.ready ? (
          <p role="status">로그인 상태를 확인하고 있어요…</p>
        ) : auth.user ? (
          <div className={styles.body}>
            <p className={styles.email}>
              {auth.user.email || "로그인한 사용자"}
            </p>
            {!auth.user.verified && (
              <div className={styles.notice}>
                <p>계정에 저장하려면 이메일 인증이 필요해요.</p>
                <div className={styles.actions}>
                  <Button
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      void perform(async (auth, sdk) => {
                        if (auth.currentUser)
                          await sdk.sendEmailVerification(auth.currentUser);
                      }, "인증 메일을 보냈어요.")
                    }
                  >
                    인증 메일 다시 보내기
                  </Button>
                  <Button
                    disabled={pending}
                    onClick={() =>
                      void perform(async (auth) => {
                        if (auth.currentUser) {
                          await auth.currentUser.reload();
                          await auth.currentUser.getIdToken(true);
                          if (!auth.currentUser.emailVerified)
                            throw Object.assign(new Error("Not verified"), {
                              code: "auth/email-not-verified",
                            });
                        }
                      }, "이메일 인증을 확인했어요.")
                    }
                  >
                    인증 완료 확인
                  </Button>
                </div>
              </div>
            )}
            <p>
              로그아웃하면 계정의 노트 목록을 화면에서 지워요. 편집 중인 입력과
              직접 기기에 저장한 노트는 유지돼요.
            </p>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() =>
                void perform(async (auth, sdk) => {
                  await sdk.signOut(auth);
                  setMode("login");
                }, "로그아웃했어요.")
              }
            >
              로그아웃
            </Button>
          </div>
        ) : (
          <div className={styles.body}>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() =>
                void perform(async (auth, sdk) => {
                  const provider = new sdk.GoogleAuthProvider();
                  provider.setCustomParameters({ prompt: "select_account" });
                  await sdk.signInWithPopup(auth, provider);
                }, "Google 계정으로 로그인했어요.")
              }
            >
              Google로 계속하기
            </Button>
            <div
              className={styles.tabs}
              role="group"
              aria-label="이메일 로그인 방식"
            >
              {(
                [
                  ["login", "이메일 로그인"],
                  ["signup", "회원가입"],
                  ["reset", "비밀번호 찾기"],
                ] as const
              ).map(([value, label]) => (
                <Button
                  key={value}
                  variant="plain"
                  disabled={pending}
                  aria-pressed={mode === value}
                  onClick={() => {
                    setMode(value);
                    setError("");
                    setMessage("");
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>
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
                    minLength={mode === "signup" ? 12 : 1}
                    maxLength={128}
                    required
                    disabled={pending}
                  />
                  {mode === "signup" && (
                    <span className="field-caption" id={passwordHint}>
                      12자 이상으로 입력해 주세요.
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
          </div>
        )}
        {(error || auth.error) && (
          <p role="alert" className={styles.error}>
            {error || auth.error}
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
