"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Auth, User } from "firebase/auth";
import { firebaseWebConfig } from "../../config/firebase";
import { authErrorMessage } from "./errors";

type AuthAction = (
  auth: Auth,
  sdk: typeof import("firebase/auth"),
) => Promise<void>;

type Identity = { uid: string; email: string | null; verified: boolean };
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
  token: (expectedUid: string) => Promise<string>;
};
const Context = createContext<AuthContextValue | null>(null);
const identity = (user: User | null): Identity | null =>
  user
    ? { uid: user.uid, email: user.email, verified: user.emailVerified }
    : null;
export function AuthProvider({ children }: { children: ReactNode }) {
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
  }, [configured]);
  async function run(action: AuthAction) {
    if (!instance.current) throw new Error("로그인 연결을 준비하고 있어요.");
    const sdk = await import("firebase/auth");
    await action(instance.current, sdk);
    setUser(identity(instance.current.currentUser));
  }
  async function token(expectedUid: string) {
    const current = instance.current?.currentUser;
    if (!current || current.uid !== expectedUid)
      throw new Error("계정이 변경됐어요. 다시 로그인해 주세요.");
    const result = await current.getIdToken();
    if (instance.current?.currentUser?.uid !== expectedUid)
      throw new Error("계정이 변경됐어요. 다시 시도해 주세요.");
    return result;
  }
  return (
    <Context.Provider
      value={{ configured, ready, user, error, open, setOpen, run, token }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const context = useContext(Context);
  if (!context) throw new Error("AuthProvider is required.");
  return context;
}
