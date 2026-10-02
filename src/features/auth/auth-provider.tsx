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
  signInProvider: string | "checking" | null;
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
const identity = (
  user: User | null,
  signInProvider: Identity["signInProvider"] = "checking",
): Identity | null =>
  user
    ? {
        uid: user.uid,
        email: user.email,
        verified: user.emailVerified,
        displayName: user.displayName,
        photoURL: user.photoURL,
        signInProvider,
      }
    : null;
function tokenSignInProvider(claims: Record<string, unknown>) {
  const firebase = claims.firebase;
  if (
    typeof firebase !== "object" ||
    firebase === null ||
    !("sign_in_provider" in firebase)
  )
    return null;
  const provider = firebase.sign_in_provider;
  return typeof provider === "string" ? provider : null;
}
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
  const lastIdentity = useRef<Identity | null>(null);
  const identityGeneration = useRef(0);
  const configured = !!firebaseWebConfig();
  const [ready, setReady] = useState(!configured);
  const [user, setUser] = useState<Identity | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const instance = useRef<Auth | null>(null);
  const authSdk = useRef<typeof import("firebase/auth") | null>(null);
  const clearPrivateArticleQueries = useCallback(() => {
    for (const queryKey of [["admin-articles"], ["admin-article"]])
      void queryClient
        .cancelQueries({ queryKey })
        .then(() => queryClient.removeQueries({ queryKey }));
  }, [queryClient]);
  const applyIdentity = useCallback(
    (nextIdentity: Identity | null) => {
      const previousIdentity = lastIdentity.current;
      if (
        previousIdentity &&
        (!nextIdentity ||
          previousIdentity.uid !== nextIdentity.uid ||
          previousIdentity.email !== nextIdentity.email ||
          previousIdentity.verified !== nextIdentity.verified ||
          previousIdentity.signInProvider !== nextIdentity.signInProvider)
      )
        clearPrivateArticleQueries();
      lastIdentity.current = nextIdentity;
      setUser(nextIdentity);
    },
    [clearPrivateArticleQueries],
  );
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
        authSdk.current = sdk;
        unsubscribe = sdk.onIdTokenChanged(
          auth,
          (next) => {
            if (active) {
              const generation = ++identityGeneration.current;
              if (lastUid.current && lastUid.current !== next?.uid) {
                void queryClient.cancelQueries({ queryKey: ["account"] });
                queryClient.removeQueries({ queryKey: ["account"] });
                clearPrivateArticleQueries();
                lastIdentity.current = null;
                const url = new URL(window.location.href);
                url.searchParams.delete("note");
                window.history.replaceState(null, "", url);
              }
              lastUid.current = next?.uid || null;
              if (!next) lastIdentity.current = null;
              setUser(identity(next));
              setReady(true);
              setError("");
              if (next) {
                void next
                  .getIdTokenResult()
                  .then((result) => {
                    if (
                      active &&
                      generation === identityGeneration.current &&
                      auth.currentUser?.uid === next.uid
                    ) {
                      const resolvedIdentity = identity(
                        next,
                        tokenSignInProvider(result.claims),
                      );
                      applyIdentity(resolvedIdentity);
                    }
                  })
                  .catch(() => {
                    if (
                      active &&
                      generation === identityGeneration.current &&
                      auth.currentUser?.uid === next.uid
                    ) {
                      applyIdentity(identity(next, null));
                    }
                  });
              }
            }
          },
          (error) => {
            if (active) {
              identityGeneration.current += 1;
              applyIdentity(null);
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
      authSdk.current = null;
    };
  }, [applyIdentity, clearPrivateArticleQueries, configured, queryClient]);
  async function run(action: AuthAction) {
    const auth = instance.current;
    const sdk = authSdk.current;
    if (!auth || !sdk) throw new Error("로그인 연결을 준비하고 있어요.");
    // The SDK is loaded before ready; preserve the click's user activation for OAuth.
    await action(auth, sdk);
    if (instance.current === auth) {
      const current = auth.currentUser;
      const generation = ++identityGeneration.current;
      setUser(identity(current));
      if (!current) {
        applyIdentity(null);
      } else {
        void current
          .getIdTokenResult()
          .then((result) => {
            if (
              instance.current === auth &&
              identityGeneration.current === generation &&
              auth.currentUser === current
            )
              applyIdentity(
                identity(current, tokenSignInProvider(result.claims)),
              );
          })
          .catch(() => {
            if (
              instance.current === auth &&
              identityGeneration.current === generation &&
              auth.currentUser === current
            )
              applyIdentity(identity(current, null));
          });
      }
    }
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
          else if (pathname.startsWith("/admin/")) accountSuccess(message);
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
