"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  type ComponentType,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { Toaster } from "../ui/sonner";
import type { ActionNotification } from "./types";

type Notify = (notification: ActionNotification) => void;
const NotificationContext = createContext<{
  notify: Notify;
  dismiss: () => void;
} | null>(null);

function NotificationBoundary({ children }: { children: ReactNode }) {
  const id = useId();
  const mounted = useRef(false);
  const current = useRef<string | number | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (current.current !== null) toast.dismiss(current.current);
    };
  }, [id]);
  const notify = useCallback<Notify>(
    ({ kind, title }) => {
      if (!mounted.current) return;
      // One current acknowledgement per screen; repeated actions refresh it.
      // A fresh toast ID avoids reviving an item during its exit animation.
      if (current.current !== null) toast.dismiss(current.current);
      current.current = toast[kind](title, {
        toasterId: id,
        duration: kind === "error" ? 6000 : 4000,
      });
    },
    [id],
  );
  const dismiss = useCallback(() => {
    if (current.current !== null) toast.dismiss(current.current);
  }, []);
  return (
    <NotificationContext.Provider value={{ notify, dismiss }}>
      {children}
      <Toaster id={id} />
    </NotificationContext.Provider>
  );
}

/** Apply once at module scope, around a screen that performs user actions. */
export function withNotifications<Props extends object>(
  Component: ComponentType<Props>,
) {
  function WithNotifications(props: Props) {
    return (
      <NotificationBoundary>
        <Component {...props} />
      </NotificationBoundary>
    );
  }
  WithNotifications.displayName = `withNotifications(${Component.displayName || Component.name || "Component"})`;
  return WithNotifications;
}

export function useNotify(): Notify {
  const notify = useContext(NotificationContext);
  if (!notify) throw new Error("withNotifications is required.");
  return notify.notify;
}

/** Clear a transient surface's notification without unmounting its exit animation. */
export function useDismissNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("withNotifications is required.");
  return context.dismiss;
}
