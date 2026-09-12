import "server-only";
export function firebaseAdminConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const dbHost = process.env.FIRESTORE_EMULATOR_HOST;
  if (authHost || dbHost) {
    if (
      process.env.NODE_ENV === "production" ||
      !projectId?.startsWith("demo-") ||
      !authHost ||
      !dbHost ||
      ![authHost, dbHost].every((host) =>
        /^(127\.0\.0\.1|localhost):\d+$/.test(host),
      )
    )
      throw new Error("Invalid Firebase emulator configuration.");
    return { projectId, emulator: true as const };
  }
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey)
    throw new Error("Firebase Admin is not configured.");
  if (projectId !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
    throw new Error("Firebase projects must match.");
  return { projectId, emulator: false as const, clientEmail, privateKey };
}
