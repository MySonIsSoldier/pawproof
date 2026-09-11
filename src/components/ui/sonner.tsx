"use client";

import { Toaster as Sonner } from "sonner";
import { Icon } from "../icon";

/** shadcn Sonner adapter using PawProof tokens and the existing icon set. */
export function Toaster({ id }: { id: string }) {
  return (
    <Sonner
      id={id}
      theme="light"
      className="ui-toaster"
      position="top-right"
      offset={24}
      mobileOffset={{
        top: "max(16px, env(safe-area-inset-top))",
        left: 16,
        right: 16,
      }}
      closeButton
      visibleToasts={1}
      containerAriaLabel="작업 알림"
      customAriaLabel="작업 알림, Alt+T로 이동"
      icons={{
        success: <Icon name="check" size={18} />,
        info: <Icon name="info" size={18} />,
        error: <Icon name="close" size={18} />,
      }}
      toastOptions={{ closeButtonAriaLabel: "알림 닫기" }}
    />
  );
}
