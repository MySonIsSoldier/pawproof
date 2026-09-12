import {
  accountTrips,
  requireAccount,
  accountErrorResponse,
} from "../../../../server/account";
import { json } from "../../../../server/http";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function GET(request: Request) {
  try {
    const uid = await requireAccount(request);
    return json(await accountTrips().list(uid));
  } catch (error) {
    return accountErrorResponse(error);
  }
}
