"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { appPath } from "../../config/public";
import { removeOwnWorker } from "./remove-worker";

const subscribeSupport = () => () => {};
const browserSupport = () =>
  window.isSecureContext && "serviceWorker" in navigator;
const serverSupport = () => false;

export function useServiceWorker() {
  const enabled = process.env.NEXT_PUBLIC_PWA_ENABLED === "true";
  const supported = useSyncExternalStore(
    subscribeSupport,
    browserSupport,
    serverSupport,
  );
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [attempt, setAttempt] = useState(0);
  const reloadRequested = useRef(false);
  useEffect(() => {
    if (!supported) return;
    if (!enabled) {
      void removeOwnWorker(
        new URL(appPath("/"), location.origin).href,
        new URL(appPath("/sw.js"), location.origin).href,
      ).catch(() => {});
      return;
    }
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    let installing: ServiceWorker | null = null;
    let lastCheck = Date.now();
    const checkState = () => {
      if (disposed || !registration) return;
      setReady(!!registration.active);
      setWaiting(registration.waiting);
      if (installing?.state === "redundant") setError(true);
    };
    const updateFound = () => {
      installing?.removeEventListener("statechange", checkState);
      installing = registration?.installing || null;
      installing?.addEventListener("statechange", checkState);
      checkState();
    };
    const controllerChanged = () => {
      if (reloadRequested.current) window.location.reload();
      else checkState();
    };
    const checkForUpdate = () => {
      if (
        document.visibilityState !== "visible" ||
        !navigator.onLine ||
        Date.now() - lastCheck < 60 * 60 * 1000
      )
        return;
      lastCheck = Date.now();
      void registration?.update().catch(() => {
        /* Retry on the next foreground check. */
      });
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      controllerChanged,
    );
    document.addEventListener("visibilitychange", checkForUpdate);
    void navigator.serviceWorker
      .register(appPath("/sw.js"), {
        scope: appPath("/"),
        updateViaCache: "none",
      })
      .then((value) => {
        if (disposed) return;
        registration = value;
        setError(false);
        registration.addEventListener("updatefound", updateFound);
        updateFound();
      })
      .catch(() => {
        if (!disposed) setError(true);
      });
    return () => {
      disposed = true;
      installing?.removeEventListener("statechange", checkState);
      registration?.removeEventListener("updatefound", updateFound);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        controllerChanged,
      );
      document.removeEventListener("visibilitychange", checkForUpdate);
    };
  }, [enabled, supported, attempt]);
  const applyUpdate = useCallback(() => {
    if (!waiting) return;
    reloadRequested.current = true;
    waiting.postMessage({ type: "SKIP_WAITING" });
  }, [waiting]);
  return {
    enabled,
    supported,
    ready,
    error,
    updateAvailable: !!waiting,
    applyUpdate,
    retry: () => setAttempt((value) => value + 1),
  };
}
