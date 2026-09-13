"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useNotify } from "../../components/notifications/with-notifications";
import { useAuth } from "./auth-provider";
import { authErrorMessage } from "./errors";

/** Release the app modal before handing input focus to the external OAuth window. */
export function useGoogleSignIn() {
  const auth = useAuth();
  const notify = useNotify();
  const inFlight = useRef<symbol | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    if (inFlight.current || !auth.ready || auth.user) return;
    const attempt = Symbol("google-sign-in");
    inFlight.current = attempt;
    // Commit unmount/scroll-lock cleanup within the gesture, without timers or imports.
    flushSync(() => {
      setError("");
      setPending(true);
    });
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
    try {
      await auth.run(async (instance, sdk) => {
        const provider = new sdk.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await sdk.signInWithPopup(instance, provider);
      });
      if (inFlight.current === attempt)
        auth.completeLogin("Google 계정으로 로그인했어요.");
    } catch (cause) {
      if (inFlight.current !== attempt) return;
      const message = authErrorMessage(cause);
      setError(message);
      notify({ kind: "error", title: message });
    } finally {
      if (inFlight.current === attempt) {
        inFlight.current = null;
        setPending(false);
      }
    }
  }

  return {
    start,
    pending,
    error,
    clearError: () => setError(""),
    returnToLogin: () => {
      // iOS standalone gives Firebase no Window handle, so closing it may not settle.
      // This leaves the wait screen; it does not revoke an OAuth request at Google.
      inFlight.current = null;
      setPending(false);
    },
    onCloseAutoFocus: (event: Event) => {
      // Radix runs focus restoration after unmount; do not steal it from Google.
      if (inFlight.current) event.preventDefault();
    },
  };
}
