import {
  accountTrips,
  requireAccount,
  accountErrorResponse,
} from "../../../../../server/account";
import { inputJson, json } from "../../../../../server/http";
import {
  deleteTripSchema,
  saveTripSchema,
  tripIdSchema,
} from "../../../../../application/contracts/saved-trip";
export const runtime = "nodejs";
export const maxDuration = 30;
type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, context: Context) {
  try {
    const uid = await requireAccount(request);
    const id = tripIdSchema.parse((await context.params).id);
    const input = saveTripSchema.parse(await inputJson(request, 256_000));
    return json(await accountTrips().save(uid, id, input));
  } catch (error) {
    return accountErrorResponse(error);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    const uid = await requireAccount(request);
    const id = tripIdSchema.parse((await context.params).id);
    const input = deleteTripSchema.parse(await inputJson(request, 256_000));
    await accountTrips().remove(uid, id, input.expectedRevision);
    return json({ deleted: true });
  } catch (error) {
    return accountErrorResponse(error);
  }
}

export async function GET(request: Request, context: Context) {
  try {
    const uid = await requireAccount(request);
    const id = tripIdSchema.parse((await context.params).id);
    return json(await accountTrips().get(uid, id));
  } catch (error) {
    return accountErrorResponse(error);
  }
}
