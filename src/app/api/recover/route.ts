import { recoverySchema } from "../../../application/contracts/trip";
import { recoverTrip } from "../../../application/use-cases/recover-trip";
import { createProviders } from "../../../server/providers";
import { errorResponse, inputJson, json } from "../../../server/http";
export const maxDuration = 300;
export async function POST(request: Request) {
  try {
    const { trip, index } = recoverySchema.parse(await inputJson(request));
    return json(await recoverTrip(trip, index, createProviders(trip.mode)));
  } catch (error) {
    return errorResponse(error);
  }
}
