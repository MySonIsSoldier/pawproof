"use client";
import { createContext, useContext, type ReactNode } from "react";
import { useInstall } from "./use-install";
import { useServiceWorker } from "./use-service-worker";
import { useOnline } from "../../hooks/use-online";
import { UpdateNotice } from "./update-notice";

type PwaState = ReturnType<typeof useInstall> &
  ReturnType<typeof useServiceWorker>;
const PwaContext = createContext<PwaState | null>(null);
export function PwaProvider({ children }: { children: ReactNode }) {
  const install = useInstall();
  const worker = useServiceWorker();
  const online = useOnline();
  return (
    <PwaContext.Provider value={{ ...install, ...worker }}>
      {!online && (
        <aside className="pwa-status no-print" role="status">
          <strong>지금은 오프라인이에요.</strong>
          <span>
            열린 입력은 그대로 유지해요. 기존 검사 결과는 최신 확인이 아니므로,
            연결 후 직접 다시 검사해 주세요.
          </span>
        </aside>
      )}
      {worker.updateAvailable && <UpdateNotice apply={worker.applyUpdate} />}
      {children}
    </PwaContext.Provider>
  );
}
export function usePwa() {
  const value = useContext(PwaContext);
  if (!value) throw new Error("PwaProvider is required.");
  return value;
}
