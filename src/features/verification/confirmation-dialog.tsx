"use client";

import { useState } from "react";
import type { Finding } from "../../domain/policies/types";
import type { TripConfirmation } from "../../application/contracts/trip-confirmation";
import { readableMessage } from "../../domain/policies/presentation";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Icon } from "../../components/icon";

type FindingOption = Pick<Finding, "kind" | "message">;

const outcomes: {
  value: TripConfirmation["outcome"];
  label: string;
  hint: string;
}[] = [
  {
    value: "available",
    label: "조건을 충족해요",
    hint: "이 여행 노트에서는 이용 가능으로 반영해요.",
  },
  {
    value: "blocked",
    label: "조건에 맞지 않아요",
    hint: "이 여행 노트에서는 이용 불가로 반영해요.",
  },
  {
    value: "confirm",
    label: "아직 확실하지 않아요",
    hint: "답변은 남기되 확인 필요 상태를 유지해요.",
  },
];

export function ConfirmationDialog({
  placeName,
  options,
  confirmations,
  onSave,
}: {
  placeName: string;
  options: FindingOption[];
  confirmations: TripConfirmation[];
  onSave: (value: {
    kind: FindingOption["kind"];
    findingMessage: string;
    outcome: TripConfirmation["outcome"];
    answer: string;
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [outcome, setOutcome] = useState<TripConfirmation["outcome"]>(
    "available",
  );
  const [answer, setAnswer] = useState("");
  const selected = options[selectedIndex];
  const existing = selected
    ? confirmations.find(
        (confirmation) =>
          confirmation.kind === selected.kind &&
          confirmation.findingMessage === selected.message,
      )
    : undefined;

  if (!options.length) return null;
  const outcomeHint = outcomes.find((item) => item.value === outcome)?.hint;
  return (
    <>
      <Button
        variant="link"
        type="button"
        className="confirmation-open"
        onClick={() => {
          setSelectedIndex(0);
          const first = options[0];
          const saved = confirmations.find(
            (confirmation) =>
              confirmation.kind === first.kind &&
              confirmation.findingMessage === first.message,
          );
          setOutcome(saved?.outcome || "available");
          setAnswer(saved?.answer || "");
          setOpen(true);
        }}
      >
        <Icon name="info" size={14} />
        {existing ? "답변 수정" : "답변 기록"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="confirmation-dialog">
          <p className="eyebrow">A NOTE FOR THIS JOURNEY</p>
          <DialogTitle>{placeName}에 확인한 답변을 기록해요</DialogTitle>
          <DialogDescription>
            전화·문자·공식 채널로 받은 답변을 남겨두면, 이 여행 노트의 현재
            조건에만 반영돼요. 다른 사람의 결과나 장소의 공식 정책은 바뀌지
            않아요.
          </DialogDescription>

          <label className="confirmation-field">
            <span>확인한 항목</span>
            <Select
              value={String(selectedIndex)}
              onValueChange={(value) => {
                const nextIndex = Number(value);
                const next = options[nextIndex];
                const saved = confirmations.find(
                  (confirmation) =>
                    confirmation.kind === next.kind &&
                    confirmation.findingMessage === next.message,
                );
                setSelectedIndex(nextIndex);
                setOutcome(saved?.outcome || "available");
                setAnswer(saved?.answer || "");
              }}
            >
              <SelectTrigger aria-label="확인한 항목">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((option, index) => (
                  <SelectItem
                    key={`${option.kind}:${option.message}`}
                    value={String(index)}
                  >
                    {readableMessage(option.message)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <fieldset className="confirmation-outcomes">
            <legend>장소의 답변</legend>
            {outcomes.map((item) => (
              <label key={item.value} className="confirmation-outcome">
                <input
                  type="radio"
                  name={`confirmation-outcome-${placeName}`}
                  value={item.value}
                  checked={outcome === item.value}
                  onChange={() => setOutcome(item.value)}
                />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </span>
              </label>
            ))}
          </fieldset>

          <label className="confirmation-field">
            <span>받은 답변</span>
            <textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="예: 테라스 좌석은 가능하고, 목줄 착용이 필요하다고 안내받았어요."
              minLength={1}
              maxLength={500}
              rows={5}
              required
            />
            <small>{answer.length}/500</small>
          </label>

          <p className="confirmation-hint" role="status">
            {outcomeHint}
          </p>
          <div className="confirmation-actions">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button
              type="button"
              disabled={!selected || !answer.trim()}
              onClick={() => {
                if (!selected || !answer.trim()) return;
                onSave({
                  kind: selected.kind,
                  findingMessage: selected.message,
                  outcome,
                  answer: answer.trim(),
                });
                setOpen(false);
              }}
            >
              이 노트에 기록하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
