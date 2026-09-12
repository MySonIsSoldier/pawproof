import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { authEmulatorUrl, firebaseWebConfig } from "../../config/firebase";

export function firebaseAuth() {
  const config = firebaseWebConfig();
  if (!config)
    throw new Error(
      "로그인 연결을 준비하고 있어요. 비로그인으로 계속 이용할 수 있어요.",
    );
  const name = "pawproof-browser";
  const existing = getApps().find((app) => app.name === name);
  const app = existing ? getApp(name) : initializeApp(config, name);
  const auth = getAuth(app);
  auth.languageCode = "ko";
  const emulator = authEmulatorUrl();
  if (emulator && !auth.emulatorConfig)
    connectAuthEmulator(auth, emulator, { disableWarnings: true });
  return auth;
}
