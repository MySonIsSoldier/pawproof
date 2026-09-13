"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../auth/auth-provider";
import { useCloudTrips } from "./use-cloud-trips";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Dialog,
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
      <h3>어디서든, 나의 여행 노트</h3>
      <p>
        로그인하면 작성 중인 코스가 자동 저장돼요. 장소와 저장 당시 검사 요약을
        다시 열 수 있어요.
      </p>
      {!auth.ready ? (
        <p role="status">로그인 확인 중…</p>
      ) : !auth.user ? (
        <Button variant="outline" onClick={() => auth.setOpen(true)}>
          로그인하고 자동 저장
        </Button>
      ) : !auth.user.verified ? (
        <Link href="/profile">이메일 인증하고 자동 저장 시작</Link>
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
  async function perform(action: () => Promise<void>) {
    setPending(true);
    setError("");
    try {
      await action();
      setConfirmation(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "노트 작업을 완료하지 못했어요.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div className={styles.body}>
      <label>
        노트 제목
        <Input
          value={model.title}
          maxLength={60}
          placeholder="여행 날짜로 자동 제목을 만들어요"
          disabled={disabled}
          onChange={(e) => model.actions.title(e.target.value)}
        />
      </label>
      <p role="status" aria-live="polite">
        {model.status === "saving"
          ? "자동 저장 중…"
          : model.status === "editing"
            ? "변경사항 저장 대기 중…"
            : model.status === "error"
              ? "자동 저장을 완료하지 못했어요"
              : model.status === "loading"
                ? "노트 복원 중…"
                : model.selected
                  ? "모든 변경사항을 저장했어요"
                  : "작성하면 자동으로 저장돼요"}
      </p>
      <div className={styles.actions}>
        <Button
          variant="outline"
          disabled={disabled}
          onClick={() => void perform(model.actions.fresh)}
        >
          새 여행 노트
        </Button>
        <Button
          variant="outline"
          disabled={disabled}
          aria-expanded={model.open}
          onClick={() => model.setOpen(!model.open)}
        >
          계정 노트 목록
        </Button>
        {model.status === "error" && (
          <Button
            disabled={disabled}
            onClick={() => void perform(model.actions.flush)}
          >
            자동 저장 다시 시도
          </Button>
        )}
      </div>
      {(error || model.error || model.list.error) && (
        <p role="alert" className={styles.error}>
          {error || model.error || model.list.error?.message}
        </p>
      )}
      {model.open && (
        <div className={styles.list}>
          <div className={styles.actions}>
            <strong>저장한 노트 · 최대 20개</strong>
            <Button
              variant="link"
              disabled={disabled || model.list.isFetching}
              onClick={() => void model.list.refetch()}
            >
              목록 새로고침
            </Button>
          </div>
          {model.list.isFetching && (
            <p role="status">노트를 불러오고 있어요…</p>
          )}
          {model.list.data?.length === 0 && <p>아직 저장한 노트가 없어요.</p>}
          {model.list.data?.map((note) => (
            <article className={styles.item} key={note.id}>
              <h4>{note.title}</h4>
              <p>
                {note.trip.date} · {note.trip.pets.length}마리 ·{" "}
                {note.trip.visits.length}곳 ·{" "}
                {note.trip.mode === "demo" ? "가상 체험" : "실제 장소"}
              </p>
              <p>{note.verification ? "검사 기록 포함" : "작성 중인 코스"}</p>
              <div className={styles.actions}>
                <Button
                  variant="outline"
                  disabled={disabled}
                  onClick={() =>
                    setConfirmation({ action: "load", trip: note })
                  }
                >
                  노트 불러오기
                </Button>
                <Button
                  variant="ghost"
                  disabled={disabled}
                  onClick={() =>
                    setConfirmation({ action: "delete", trip: note })
                  }
                >
                  계정 노트 삭제
                </Button>
              </div>
            </article>
          ))}
        </div>
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
              ? "선택한 여행을 열까요?"
              : "계정 노트를 삭제할까요?"}
          </DialogTitle>
          <DialogDescription>
            {confirmation?.action === "load"
              ? "현재 변경사항을 저장한 뒤 선택한 장소와 검사 기록을 불러와요. 저장 충돌이 있다면 미전송 초안을 버리고 선택한 노트를 열어요."
              : "선택한 노트를 계정에서 삭제해요. 현재 입력은 남지만 다음 편집부터 새 노트로 저장돼요."}
          </DialogDescription>
          <p>{confirmation?.trip.title}</p>
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
                  void perform(() =>
                    confirmation.action === "load"
                      ? model.actions.load(confirmation.trip)
                      : model.actions.remove(confirmation.trip),
                  );
              }}
            >
              {confirmation?.action === "load"
                ? "입력 바꾸고 불러오기"
                : "삭제 확인"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
