"use client";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Icon } from "../../components/icon";
import {
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../../components/ui/dialog";
import type { SavedTrip } from "../../application/contracts/saved-trip";
import styles from "./cloud-trips.module.css";

export function NoteLibrary({
  allowReload,
  notes,
  selected,
  loading,
  disabled,
  error,
  refresh,
  openNote,
  deleteNote,
}: {
  allowReload: boolean;
  notes: SavedTrip[] | undefined;
  selected: string | null;
  loading: boolean;
  disabled: boolean;
  error: string;
  refresh: () => void;
  openNote: (note: SavedTrip) => void;
  deleteNote: (note: SavedTrip) => void;
}) {
  const [query, setQuery] = useState("");
  const matches = notes?.filter((note) =>
    `${note.title} ${note.trip.date}`.includes(query.trim()),
  );
  return (
    <DialogContent className={styles.library}>
      <div className={styles.libraryHeading}>
        <div>
          <p className="eyebrow">YOUR LITTLE JOURNEYS</p>
          <DialogTitle>내 여행 노트</DialogTitle>
        </div>
        <DialogClose asChild>
          <Button
            variant="icon"
            aria-label="노트 목록 닫기"
            disabled={disabled}
          >
            <Icon name="close" />
          </Button>
        </DialogClose>
      </div>
      <DialogDescription>
        나의 계정에 보관한 여행이에요. 노트를 열면 그때의 코스와 검사 기록을
        이어볼 수 있어요.
      </DialogDescription>
      <label className={styles.search}>
        <Icon name="search" size={18} />
        <Input
          aria-label="노트 검색"
          placeholder="제목이나 여행 날짜로 찾기"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className={styles.listMeta}>
        <span>{notes ? `${notes.length} / 20개 노트` : "나의 노트"}</span>
        <Button variant="link" disabled={disabled || loading} onClick={refresh}>
          목록 새로고침
        </Button>
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {loading && <p role="status">노트를 불러오고 있어요…</p>}
      {!loading && !error && notes?.length === 0 && (
        <div className={styles.empty}>
          <Icon name="leaf" size={32} />
          <h3>첫 여행을 기다리고 있어요</h3>
          <p>코스를 작성하면 이곳에 자동으로 모여요.</p>
        </div>
      )}
      {!!notes?.length && matches?.length === 0 && (
        <p className={styles.empty}>
          검색한 노트가 없어요. 다른 제목이나 날짜로 찾아보세요.
        </p>
      )}
      <div className={styles.list}>
        {matches?.map((note) => (
          <article
            className={styles.item}
            key={note.id}
            data-selected={note.id === selected}
          >
            <div className={styles.itemHeading}>
              <h3>{note.title}</h3>
              {note.id === selected && (
                <span className={styles.badge}>열린 노트</span>
              )}
            </div>
            <p>
              {note.trip.date} · 반려견 {note.trip.pets.length}마리 · 방문지{" "}
              {note.trip.visits.length}곳
            </p>
            <div className={styles.itemFooter}>
              <span>
                {note.trip.mode === "demo" ? "가상 체험 · " : ""}
                {note.verification ? "검사 기록 포함" : "작성 중인 코스"}
              </span>
              <div className={styles.actions}>
                <Button
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => deleteNote(note)}
                >
                  삭제
                </Button>
                <Button
                  variant="outline"
                  disabled={disabled || (note.id === selected && !allowReload)}
                  onClick={() => openNote(note)}
                >
                  노트 열기
                  <Icon name="arrow" size={15} />
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </DialogContent>
  );
}
