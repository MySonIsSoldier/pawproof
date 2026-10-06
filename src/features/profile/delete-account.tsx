"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useAuth } from "../auth/auth-provider";
import { accountRequest } from "../account/api";
import {
  accountDeletionResultSchema,
} from "../../application/contracts/account";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import styles from "./profile.module.css";

export function DeleteAccount() {
  const auth = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (!auth.user || confirmation !== "DELETE") return;
    setPending(true);
    setError("");
    try {
      await accountRequest(
        "/api/account",
        accountDeletionResultSchema,
        await auth.token(auth.user.uid),
        "DELETE",
        { confirmation },
      );
      await auth.run(async (instance, sdk) => sdk.signOut(instance));
      router.replace("/");
    } catch (caught) {
      setError(
        caught instanceof z.ZodError
          ? "삭제 응답을 확인할 수 없어요."
          : caught instanceof Error
            ? caught.message
            : "계정과 저장 정보를 삭제하지 못했어요.",
      );
    } finally {
      setPending(false);
    }
  }

  function close(next: boolean) {
    if (pending) return;
    setOpen(next);
    if (!next) {
      setConfirmation("");
      setError("");
    }
  }

  return (
    <section className={`${styles.card} ${styles.danger}`} aria-labelledby="delete-account-title">
      <div>
        <h2 id="delete-account-title">계정과 저장 정보 삭제</h2>
        <p>
          반려견 프로필과 여행 노트, 로그인 계정을 함께 삭제합니다. 삭제 후에는
          복구할 수 없습니다.
        </p>
      </div>
      <Dialog open={open} onOpenChange={close}>
        <Button variant="outline" className={styles.dangerButton} onClick={() => setOpen(true)}>
          계정 삭제하기
        </Button>
        <DialogContent>
          <DialogTitle>정말 계정을 삭제할까요?</DialogTitle>
          <DialogDescription>
            저장된 반려견 프로필과 여행 노트, 계정 정보가 모두 삭제됩니다. 이
            작업은 되돌릴 수 없습니다.
          </DialogDescription>
          <label className="field-label" htmlFor="delete-account-confirmation">
            계속하려면 <strong>DELETE</strong>를 입력하세요.
          </label>
          <Input
            id="delete-account-confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            autoFocus
          />
          {error && <p className="inline-error" role="alert">{error}</p>}
          <div className={styles.actions}>
            <Button variant="ghost" disabled={pending} onClick={() => close(false)}>
              취소
            </Button>
            <Button
              className={styles.dangerButton}
              disabled={pending || confirmation !== "DELETE"}
              onClick={() => void remove()}
            >
              {pending ? "삭제 중…" : "영구 삭제"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
