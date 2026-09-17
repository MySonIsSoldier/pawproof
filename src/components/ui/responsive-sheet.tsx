"use client";
import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useMobile } from "../hooks/use-mobile";
import { Button } from "./button";
import "./responsive-sheet.css";

/** A non-modal mobile sheet keeps the map usable; desktop uses its sidebar. */
export function ResponsiveSheet({
  open,
  onOpenChange,
  title,
  children,
  className = "",
  returnFocusId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  className?: string;
  returnFocusId?: string;
}) {
  const mobile = useMobile();
  if (!mobile)
    return (
      <aside className={className} aria-label={title}>
        {children}
      </aside>
    );
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          className={`ui-bottom-sheet ${className}`}
          aria-describedby={undefined}
          onInteractOutside={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (returnFocusId) document.getElementById(returnFocusId)?.focus();
          }}
        >
          <div className="ui-bottom-sheet-heading">
            <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" aria-label="패널 닫기">
                닫기
              </Button>
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
