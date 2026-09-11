"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

interface InstallPrompt extends Event {
  prompt(): Promise<unknown>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
export function useInstall() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const standalone = useSyncExternalStore(
    subscribeDisplay,
    isStandalone,
    serverFalse,
  );
  const ios = useSyncExternalStore(subscribePlatform, isIos, serverFalse);
  const [installed, setInstalled] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const inProgress = useRef(false);
  useEffect(() => {
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
      setInstalled(false);
      setMessage("");
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
      setMessage("홈 화면에 추가했어요. PawProof 아이콘으로 다시 만나요.");
    };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  async function install() {
    if (!prompt || inProgress.current) return;
    inProgress.current = true;
    setPending(true);
    setPrompt(null);
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      setMessage(
        outcome === "accepted"
          ? "설치 요청을 보냈어요. 브라우저의 안내를 확인해 주세요."
          : "설치를 취소했어요. 나중에 브라우저 메뉴에서 다시 추가할 수 있어요.",
      );
    } catch {
      setMessage(
        "설치 창을 열지 못했어요. 브라우저 메뉴에서 설치를 선택해 주세요.",
      );
    } finally {
      inProgress.current = false;
      setPending(false);
    }
  }
  return {
    canPrompt: !!prompt,
    standalone,
    ios,
    installed,
    message,
    pending,
    install,
  };
}

const serverFalse = () => false;
const subscribePlatform = () => () => {};
function isIos() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}
function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
function subscribeDisplay(listener: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
