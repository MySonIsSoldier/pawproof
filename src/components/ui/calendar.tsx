"use client";

import type { ComponentProps } from "react";
import { DayPicker } from "react-day-picker";
import { ko } from "date-fns/locale/ko";
import { Icon } from "../icon";

// shadcn Calendar composition, styled through DayPicker's semantic class names.
export function Calendar({
  className = "",
  ...props
}: ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      data-slot="calendar"
      className={`ui-calendar ${className}`}
      locale={ko}
      timeZone="Asia/Seoul"
      showOutsideDays
      captionLayout="label"
      labels={{ labelPrevious: () => "이전 달", labelNext: () => "다음 달" }}
      components={{
        Chevron: ({ orientation }) => (
          <Icon
            name="down"
            size={16}
            style={{
              transform:
                orientation === "left"
                  ? "rotate(90deg)"
                  : orientation === "right"
                    ? "rotate(-90deg)"
                    : undefined,
            }}
          />
        ),
      }}
      {...props}
    />
  );
}
