import { z } from "zod";

const configSchema = z.object({
  apiKey: z.string().min(1),
  authDomain: z.string().regex(/^[a-zA-Z0-9.-]+$/),
  projectId: z.string().regex(/^[a-z][a-z0-9-]{4,60}$/),
  appId: z.string().min(1),
});
export type FirebaseWebConfig = z.infer<typeof configSchema>;
export function parseFirebaseWebConfig(
  input: unknown,
): FirebaseWebConfig | null {
  const result = configSchema.safeParse(input);
  return result.success ? result.data : null;
}
// Firebase web identifiers are public; Admin credentials never enter this module.
export function firebaseWebConfig() {
  return parseFirebaseWebConfig({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
}
export function authEmulatorUrl() {
  const url = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL;
  if (!url) return null;
  if (
    process.env.NODE_ENV === "production" ||
    !/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(url)
  )
    throw new Error(
      "Firebase emulator is only available on local development hosts.",
    );
  if (!firebaseWebConfig()?.projectId.startsWith("demo-"))
    throw new Error("Firebase emulator requires an isolated demo project.");
  return url;
}
