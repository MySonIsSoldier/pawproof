import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { firebaseAdminConfig } from "../../config/firebase-admin";
function adminApp() {
  // Validate even after HMR: a production process must never accept emulator tokens.
  const config = firebaseAdminConfig();
  const name = "pawproof-server";
  return (
    getApps().find((app) => app.name === name) ||
    initializeApp(
      {
        projectId: config.projectId,
        ...(!config.emulator ? { credential: cert(config) } : {}),
      },
      name,
    )
  );
}
export const adminAuth = () => getAuth(adminApp());
export const adminDb = () => getFirestore(adminApp());
