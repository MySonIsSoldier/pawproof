"use client";

import type { ComponentProps } from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Icon } from "../icon";

export function Checkbox({
  className = "",
  children,
  ...props
}: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={`ui-checkbox ${className}`}
      {...props}
    >
      {children || (
        <CheckboxPrimitive.Indicator className="ui-checkbox-indicator">
          <Icon name="check" size={13} />
        </CheckboxPrimitive.Indicator>
      )}
    </CheckboxPrimitive.Root>
  );
}
