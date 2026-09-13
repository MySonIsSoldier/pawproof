import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import {
  profileSchema,
  type AccountProfile,
} from "../../application/contracts/profile";
import type { ProfileRepository } from "../../application/ports/profile-repository";
import { AccountError } from "../../application/ports/trip-repository";
export class FirestoreProfile implements ProfileRepository {
  constructor(private readonly db: Firestore) {}
  private ref(uid: string) {
    if (!uid || uid.includes("/") || uid.length > 128)
      throw new AccountError("UNAUTHORIZED", "다시 로그인해 주세요.");
    return this.db.doc(`accounts/${uid}/profile/main`);
  }
  async get(uid: string) {
    const snapshot = await this.ref(uid).get();
    return profileSchema.parse(snapshot.data() || { pets: [], revision: 0 });
  }
  async save(uid: string, profile: AccountProfile) {
    const ref = this.ref(uid);
    return this.db.runTransaction(async (tx) => {
      const current = await tx.get(ref);
      if ((current.data()?.revision || 0) !== profile.revision)
        throw new AccountError(
          "CONFLICT",
          "다른 기기에서 프로필이 변경됐어요. 새로고침 후 다시 수정해 주세요.",
        );
      const next = profileSchema.parse({
        ...profile,
        revision: profile.revision + 1,
      });
      tx.set(ref, next);
      return next;
    });
  }
}
