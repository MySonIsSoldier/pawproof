"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../auth/auth-provider";
import { useCloudTrips } from "./use-cloud-trips";
import { NoteLibrary } from "./note-library";
import { Icon } from "../../components/icon";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../../components/ui/dialog";
import type { SavedTrip } from "../../application/contracts/saved-trip";
import type { TripRecord } from "../../application/contracts/trip-record";
import styles from "./cloud-trips.module.css";

export function CloudTrips({
  busy,
  restore,
}: {
  busy: boolean;
  restore: (record: TripRecord) => void;
}) {
  const auth = useAuth();
  return (
    <section className={`${styles.panel} no-print`} aria-label="계정 여행 노트">
      {!auth.ready ? (
        <p role="status">여행 노트를 준비하고 있어요…</p>
      ) : !auth.user?.verified ? (
        <div className={styles.guest}>
          <span className={styles.mark}>
            <Icon name="paw" size={24} />
          </span>
          <div className={styles.guestCopy}>
            <h2>이 여행, 다음에도 이어가세요</h2>
            <p>새로고침하면 작성 내용과 검사 결과가 사라져요.</p>
            <p>로그인하면 나의 계정에 자동으로 보관돼요.</p>
          </div>
          {!auth.user ? (
            <Button variant="primary" onClick={() => auth.setOpen(true)}>
              로그인하고 이어가기 <Icon name="arrow" size={16} />
            </Button>
          ) : (
            <Link className="button small" href="/profile">
              이메일 인증하고 이어가기
            </Link>
          )}
        </div>
      ) : (
        <Editor
          key={auth.user.uid}
          uid={auth.user.uid}
          busy={busy}
          restore={restore}
        />
      )}
    </section>
  );
}
function Editor({
  uid,
  busy,
  restore,
}: {
  uid: string;
  busy: boolean;
  restore: (record: TripRecord) => void;
}) {
  const model = useCloudTrips(uid, restore);
  const [confirmation, setConfirmation] = useState<{
    action: "load" | "delete";
    trip: SavedTrip;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const disabled = busy || pending || model.status === "loading";
  async function perform(action: () => Promise<void>, closeLibrary = false) {
    setPending(true);
    setError("");
    try {
      await action();
      setConfirmation(null);
      if (closeLibrary) model.setOpen(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "노트를 열지 못했어요. 다시 시도해 주세요.",
      );
    } finally {
      setPending(false);
    }
  }
  const message =
    model.status === "saving"
      ? "자동 저장 중…"
      : model.status === "editing"
        ? "변경사항 반영 중…"
        : model.status === "error"
          ? "저장하지 못했어요"
          : model.status === "loading"
            ? "노트 여는 중…"
            : model.selected
              ? "자동 저장됨"
              : "작성하면 자동 저장돼요";
  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.titleField}>
          <label htmlFor="trip-note-title">나의 여행 노트</label>
          <Input
            id="trip-note-title"
            aria-label="노트 제목"
            value={model.title}
            maxLength={60}
            placeholder="이번 여행에 이름을 붙여주세요"
            disabled={disabled}
            onChange={(event) => model.actions.title(event.target.value)}
          />
          <p
            className={styles.status}
            data-state={model.status}
            role="status"
            aria-live="polite"
          >
            <Icon
              name={
                model.status === "error"
                  ? "info"
                  : model.status === "saved" && model.selected
                    ? "check"
                    : "clock"
              }
              size={14}
            />
            {message}
          </p>
        </div>
        <div className={styles.actions}>
          <Dialog
            open={model.open}
            onOpenChange={(open) => {
              if (!pending) {
                setError("");
                model.setOpen(open);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" disabled={disabled}>
                <Icon name="bag" size={17} />내 여행 노트
              </Button>
            </DialogTrigger>
            <NoteLibrary
              allowReload={model.status === "error"}
              notes={model.list.data}
              selected={model.selected}
              loading={model.list.isFetching}
              disabled={disabled}
              error={error || model.list.error?.message || ""}
              refresh={() => void model.list.refetch()}
              openNote={(trip) => {
                if (model.status === "error")
                  setConfirmation({ action: "load", trip });
                else void perform(() => model.actions.load(trip), true);
              }}
              deleteNote={(trip) => setConfirmation({ action: "delete", trip })}
            />
          </Dialog>
          <Button
            variant="ghost"
            disabled={disabled}
            onClick={() => void perform(model.actions.fresh)}
          >
            <Icon name="plus" size={17} />새 여행 노트
          </Button>
        </div>
      </div>
      {(error || model.error) && (
        <p role="alert" className={styles.error}>
          {error || model.error}
        </p>
      )}
      {model.status === "error" && (
        <Button
          variant="link"
          disabled={disabled}
          onClick={() => void perform(model.actions.flush)}
        >
          자동 저장 다시 시도
        </Button>
      )}
      <Dialog
        open={!!confirmation}
        onOpenChange={(open) => {
          if (!open && !pending) setConfirmation(null);
        }}
      >
        <DialogContent>
          <DialogTitle>
            {confirmation?.action === "load"
              ? "저장하지 못한 변경사항을 버릴까요?"
              : "계정 노트를 삭제할까요?"}
          </DialogTitle>
          <DialogDescription>
            {confirmation?.action === "load"
              ? "현재 미전송 초안을 버리고 선택한 노트를 열어요. 서버에 저장된 내용은 바뀌지 않아요."
              : "이 노트를 계정에서 삭제해요. 현재 열린 노트라면 화면의 입력은 유지되고, 다음 편집부터 새 노트로 자동 저장돼요."}
          </DialogDescription>
          <p>{confirmation?.trip.title}</p>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          <div className={styles.actions}>
            <DialogClose asChild>
              <Button variant="outline" disabled={pending}>
                취소
              </Button>
            </DialogClose>
            <Button
              disabled={pending}
              onClick={() => {
                if (confirmation)
                  void perform(
                    () =>
                      confirmation.action === "load"
                        ? model.actions.load(confirmation.trip)
                        : model.actions.remove(confirmation.trip),
                    confirmation.action === "load",
                  );
              }}
            >
              {confirmation?.action === "load"
                ? "변경사항 버리고 열기"
                : "삭제 확인"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
