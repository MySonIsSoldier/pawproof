"use client";
import { useState } from "react";
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
import styles from "./cloud-trips.module.css";

export function CloudTrips({
  busy,
  restore,
}: {
  busy: boolean;
  restore: (trip: SavedTrip["trip"]) => void;
}) {
  const auth = useAuth();
  return (
    <section className={`${styles.panel} no-print`} aria-label="계정 여행 노트">
      <h3>어디서든, 나의 여행 노트</h3>
      <p>
        반려견 프로필과 코스 입력을 계정에 보관해요. 규정과 검사 결과는 저장하지
        않아요.
      </p>
      {!auth.ready ? (
        <p role="status">로그인 확인 중…</p>
      ) : !auth.user || !auth.user.verified ? (
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => auth.setOpen(true)}
        >
          {auth.user ? "이메일 인증하고 저장하기" : "로그인하고 계정에 저장"}
        </Button>
      ) : (
        <CloudTripEditor
          key={auth.user.uid}
          uid={auth.user.uid}
          busy={busy}
          restore={restore}
        />
      )}
    </section>
  );
}
function CloudTripEditor({
  uid,
  busy,
  restore,
}: {
  uid: string;
  busy: boolean;
  restore: (trip: SavedTrip["trip"]) => void;
}) {
  const model = useCloudTrips(uid, restore);
  const [confirmation, setConfirmation] = useState<{
    action: "load" | "delete";
    trip: SavedTrip;
  } | null>(null);
  const disabled = busy || model.pending;
  function confirm() {
    if (!confirmation || disabled) return;
    if (confirmation.action === "load") model.load(confirmation.trip);
    else model.remove.mutate(confirmation.trip);
    setConfirmation(null);
  }
  return (
    <div className={styles.body}>
      <label>
        노트 제목
        <Input
          value={model.title}
          maxLength={60}
          placeholder="예: 인천에서 보내는 토요일"
          disabled={disabled}
          onChange={(event) => model.setTitle(event.target.value)}
        />
      </label>
      <div className={styles.actions}>
        <Button disabled={disabled} onClick={() => model.save.mutate()}>
          {model.save.isPending
            ? "저장 중…"
            : model.selected
              ? "계정 노트 수정 저장"
              : "계정에 새 노트 저장"}
        </Button>
        {model.selected && (
          <Button variant="ghost" disabled={disabled} onClick={model.newNote}>
            새 노트로 전환
          </Button>
        )}
        <Button
          variant="outline"
          disabled={disabled}
          aria-expanded={model.open}
          onClick={() => model.setOpen(!model.open)}
        >
          계정 노트 목록
        </Button>
      </div>
      {model.error && (
        <p role="alert" className={styles.error}>
          {model.error}
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
          {model.list.data?.map((trip) => (
            <article key={trip.id} className={styles.item}>
              <h4>{trip.title}</h4>
              <p>
                {trip.trip.date} · {trip.trip.pets.length}마리 ·{" "}
                {trip.trip.visits.length}곳 ·{" "}
                {trip.trip.mode === "demo" ? "가상 체험" : "실제 장소"}
              </p>
              <div className={styles.actions}>
                <Button
                  variant="outline"
                  disabled={disabled}
                  onClick={() => setConfirmation({ action: "load", trip })}
                >
                  노트 불러오기
                </Button>
                <Button
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => setConfirmation({ action: "delete", trip })}
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
          if (!open) setConfirmation(null);
        }}
      >
        <DialogContent>
          <DialogTitle>
            {confirmation?.action === "load"
              ? "현재 입력을 바꿀까요?"
              : "계정 노트를 삭제할까요?"}
          </DialogTitle>
          <DialogDescription>
            {confirmation?.action === "load"
              ? "편집 중인 입력을 선택한 노트로 교체해요. 기존 검사 결과는 지우고 다시 검사해야 해요."
              : "선택한 노트를 계정에서 삭제해요. 현재 편집 중인 입력과 기기 저장은 유지돼요."}
          </DialogDescription>
          <p>{confirmation?.trip.title}</p>
          <div className={styles.actions}>
            <DialogClose asChild>
              <Button variant="outline">취소</Button>
            </DialogClose>
            <Button disabled={disabled} onClick={confirm}>
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
