import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import {
  AccountError,
  type TripRepository,
} from "../../application/ports/trip-repository";
import {
  savedTripSchema,
  type SaveTripInput,
} from "../../application/contracts/saved-trip";

export class FirestoreTrips implements TripRepository {
  constructor(private readonly db: Firestore) {}
  private owner(uid: string) {
    if (!uid || uid.includes("/") || uid.length > 128)
      throw new AccountError("UNAUTHORIZED", "다시 로그인해 주세요.");
    return this.db.collection("accounts").doc(uid);
  }
  async list(uid: string) {
    const result = await this.owner(uid)
      .collection("trips")
      .orderBy("updatedAt", "desc")
      .limit(20)
      .get();
    return result.docs.map((doc) =>
      savedTripSchema.parse({ ...doc.data(), id: doc.id }),
    );
  }
  async save(uid: string, id: string, input: SaveTripInput) {
    const owner = this.owner(uid);
    const ref = owner.collection("trips").doc(id);
    return this.db.runTransaction(async (tx) => {
      const current = await tx.get(ref);
      const previous = current.exists
        ? savedTripSchema.parse({ ...current.data(), id })
        : null;
      if ((previous?.revision || 0) !== input.expectedRevision)
        throw new AccountError(
          "CONFLICT",
          "다른 기기에서 변경된 노트예요. 목록을 새로고침하고 다시 불러와 주세요.",
        );
      if (!previous) {
        const account = await tx.get(owner);
        const count = Number(account.data()?.tripCount || 0);
        if (count >= 20)
          throw new AccountError(
            "LIMIT",
            "계정에는 여행 노트를 20개까지 저장할 수 있어요.",
          );
        tx.set(owner, { tripCount: count + 1 }, { merge: true });
      }
      const now = new Date().toISOString();
      const saved = savedTripSchema.parse({
        id,
        title: input.title,
        trip: input.trip,
        revision: (previous?.revision || 0) + 1,
        createdAt: previous?.createdAt || now,
        updatedAt: now,
      });
      const { id: _id, ...document } = saved;
      void _id;
      tx.set(ref, document);
      return saved;
    });
  }
  async remove(uid: string, id: string, expectedRevision: number) {
    const owner = this.owner(uid);
    const ref = owner.collection("trips").doc(id);
    await this.db.runTransaction(async (tx) => {
      const current = await tx.get(ref);
      if (!current.exists)
        throw new AccountError(
          "NOT_FOUND",
          "이미 삭제된 여행 노트예요. 목록을 새로고침해 주세요.",
        );
      if (current.data()?.revision !== expectedRevision)
        throw new AccountError(
          "CONFLICT",
          "다른 기기에서 변경된 노트예요. 목록을 새로고침해 주세요.",
        );
      const account = await tx.get(owner);
      tx.delete(ref);
      tx.set(
        owner,
        { tripCount: Math.max(0, Number(account.data()?.tripCount || 0) - 1) },
        { merge: true },
      );
    });
  }
}
