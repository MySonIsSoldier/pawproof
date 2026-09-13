"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { accountSuccess } from "../../components/notifications/account-notice";
import type { Auth, User } from "firebase/auth";
import { firebaseWebConfig } from "../../config/firebase";
import { Toaster } from "../../components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { authErrorMessage } from "./errors";

type AuthAction = (
  auth: Auth,
  sdk: typeof import("firebase/auth"),
) => Promise<void>;

type Identity = {
  uid: string;
  email: string | null;
  verified: boolean;
  displayName: string | null;
  photoURL: string | null;
};
type AuthContextValue = {
  configured: boolean;
  ready: boolean;
  user: Identity | null;
  error: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  run: (
    action: (auth: Auth, sdk: typeof import("firebase/auth")) => Promise<void>,
  ) => Promise<void>;
  completeLogin: (message: string) => void;
  token: (expectedUid: string) => Promise<string>;
};
const Context = createContext<AuthContextValue | null>(null);
const identity = (user: User | null): Identity | null =>
  user
    ? {
        uid: user.uid,
        email: user.email,
        verified: user.emailVerified,
        displayName: user.displayName,
        photoURL: user.photoURL,
      }
    : null;
export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const loginNotice = useRef<string | null>(null);
  useEffect(() => {
    if (pathname.endsWith("/plan") && loginNotice.current) {
      accountSuccess(loginNotice.current);
      loginNotice.current = null;
    }
  }, [pathname]);
  const queryClient = useQueryClient();
  const lastUid = useRef<string | null>(null);
  const configured = !!firebaseWebConfig();
  const [ready, setReady] = useState(!configured);
  const [user, setUser] = useState<Identity | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const instance = useRef<Auth | null>(null);
  useEffect(() => {
    if (!configured) return;
    let active = true;
    let unsubscribe: (() => void) | undefined;
    void Promise.all([
      import("../../infrastructure/firebase/client"),
      import("firebase/auth"),
    ])
      .then(([client, sdk]) => {
        if (!active) return;
        const auth = client.firebaseAuth();
        instance.current = auth;
        unsubscribe = sdk.onIdTokenChanged(
          auth,
          (next) => {
            if (active) {
              if (lastUid.current && lastUid.current !== next?.uid) {
                void queryClient.cancelQueries({ queryKey: ["account"] });
                queryClient.removeQueries({ queryKey: ["account"] });
              }
              lastUid.current = next?.uid || null;
              setUser(identity(next));
              setReady(true);
              setError("");
            }
          },
          (error) => {
            if (active) {
              setUser(null);
              setError(authErrorMessage(error));
              setReady(true);
            }
          },
        );
      })
      .catch((error: unknown) => {
        if (active) {
          setError(authErrorMessage(error));
          setReady(true);
        }
      });
    return () => {
      active = false;
      unsubscribe?.();
      instance.current = null;
    };
  }, [configured, queryClient]);
  async function run(action: AuthAction) {
    if (!instance.current) throw new Error("로그인 연결을 준비하고 있어요.");
    const sdk = await import("firebase/auth");
    await action(instance.current, sdk);
    setUser(identity(instance.current.currentUser));
  }
  const token = useCallback(async (expectedUid: string) => {
    const current = instance.current?.currentUser;
    if (!current || current.uid !== expectedUid)
      throw new Error("계정이 변경됐어요. 다시 로그인해 주세요.");
    const result = await current.getIdToken();
    if (instance.current?.currentUser?.uid !== expectedUid)
      throw new Error("계정이 변경됐어요. 다시 시도해 주세요.");
    return result;
  }, []);
  return (
    <Context.Provider
      value={{
        configured,
        ready,
        user,
        error,
        open,
        setOpen,
        run,
        token,
        completeLogin: (message) => {
          setOpen(false);
          if (pathname.endsWith("/plan")) accountSuccess(message);
          else {
            loginNotice.current = message;
            router.push("/plan");
          }
        },
      }}
    >
      {children}
      <Toaster id="account-global" />
    </Context.Provider>
  );
}
export function useAuth() {
  const context = useContext(Context);
  if (!context) throw new Error("AuthProvider is required.");
  return context;
}
