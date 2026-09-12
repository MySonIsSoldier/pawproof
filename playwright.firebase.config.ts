import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
if (process.env.E2E_MODE === "production")
  throw new Error("Firebase emulator tests use development only.");
const webServer = base.webServer;
if (!webServer || Array.isArray(webServer))
  throw new Error("Expected one Next.js test server.");
export default defineConfig({
  ...base,
  testDir: "./tests/firebase",
  timeout: 60_000,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/firebase", open: "never" }],
  ],
  outputDir: "test-results/firebase",
  webServer: {
    ...webServer,
    env: {
      ...webServer.env,
      NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-pawproof.firebaseapp.com",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-pawproof",
      NEXT_PUBLIC_FIREBASE_APP_ID: "1:123:web:demo",
      NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL: "http://127.0.0.1:9099",
      FIREBASE_PROJECT_ID: "demo-pawproof",
      FIREBASE_CLIENT_EMAIL: "",
      FIREBASE_PRIVATE_KEY: "",
      FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
      FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
    },
  },
});
