"use client";

import { useState } from "react";
import { TZDate } from "react-day-picker";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Icon } from "../icon";
import { Button } from "./button";

export function DatePicker({
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
  // Date-only values always represent a Korean calendar day, in any browser zone.
  const selected = new TZDate(`${value}T12:00:00+09:00`, "Asia/Seoul");
  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="plain"
          type="button"
          className="ui-control ui-picker-trigger"
          aria-label={label}
          disabled={disabled}
        >
          <Icon name="calendar" size={16} />
          <span>{value.replaceAll("-", ". ")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent aria-label={`${label} 선택`} className="ui-date-popover">
        <Calendar
          mode="single"
          required
          autoFocus
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            onChange(`${year}-${month}-${day}`);
            setOpen(false);
          }}
        />
        <p className="ui-picker-caption">
          여행 날짜를 골라주세요 · 한국 시간 기준
        </p>
      </PopoverContent>
    </Popover>
  );
}
