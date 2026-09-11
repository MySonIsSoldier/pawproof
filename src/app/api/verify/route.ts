import { tripSchema } from "../../../application/contracts/trip";
import { verifyTrip } from "../../../application/use-cases/verify-trip";
import { createProviders } from "../../../server/providers";
import { errorResponse, inputJson, json } from "../../../server/http";
export const maxDuration = 180;
export async function POST(request: Request) {
  try { const input = tripSchema.parse(await inputJson(request)); return json(await verifyTrip(input, createProviders(input.mode))); }
  catch (error) { return errorResponse(error); }
}
