import {
  requireAccount,
  accountErrorResponse,
} from "../../../../server/account";
import { adminDb } from "../../../../infrastructure/firebase/admin";
import { FirestoreProfile } from "../../../../infrastructure/persistence/firestore-profile";
import { profileInputSchema } from "../../../../application/contracts/profile";
import { inputJson, json } from "../../../../server/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const uid = await requireAccount(request, false);
    return json(await new FirestoreProfile(adminDb()).get(uid));
  } catch (error) {
    return accountErrorResponse(error);
  }
}
export async function PUT(request: Request) {
  try {
    const uid = await requireAccount(request, false);
    const input = profileInputSchema.parse(await inputJson(request));
    return json(
      await new FirestoreProfile(adminDb()).save(uid, {
        pets: input.pets,
        revision: input.expectedRevision,
      }),
    );
  } catch (error) {
    return accountErrorResponse(error);
  }
}
