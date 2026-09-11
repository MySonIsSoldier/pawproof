"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Icon } from "../icon";
import { Button } from "./button";

const hours = Array.from({ length: 24 }, (_, n) => String(n).padStart(2, "0"));
const minutes = Array.from({ length: 60 }, (_, n) =>
  String(n).padStart(2, "0"),
);

export function TimePicker({
  value,
  onChange,
  disabled,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [hour, minute] = draft.split(":");
  return (
    <Popover
      open={open && !disabled}
      onOpenChange={(next) => {
        if (next) setDraft(value);
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="plain"
          type="button"
          className="ui-control ui-picker-trigger"
          aria-label={label}
          disabled={disabled}
        >
          <Icon name="clock" size={16} />
          <span>{value}</span>
          <span className="ui-time-unit">도착</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent aria-label={`${label} 선택`} className="ui-time-popover">
        <h3>첫 만남은 몇 시인가요?</h3>
        <p className="ui-picker-caption">24시간 기준 · 한국 시간</p>
        <div className="ui-time-fields">
          <Select
            value={hour}
            onValueChange={(next) => setDraft(`${next}:${minute}`)}
            disabled={disabled}
          >
            <SelectTrigger aria-label="도착 시">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {hours.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}시
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span aria-hidden="true">:</span>
          <Select
            value={minute}
            onValueChange={(next) => setDraft(`${hour}:${next}`)}
            disabled={disabled}
          >
            <SelectTrigger aria-label="도착 분">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {minutes.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}분
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="plain"
          type="button"
          className="ui-time-apply"
          disabled={disabled}
          onClick={() => {
            onChange(draft);
            setOpen(false);
          }}
        >
          이 시간으로 적용 <Icon name="check" size={16} />
        </Button>
      </PopoverContent>
    </Popover>
  );
}
