import { inspectInputSchema } from "../../../../application/contracts/discovery";
import { inspectPlaces } from "../../../../application/use-cases/inspect-places";
import { createProviders } from "../../../../server/providers";
import { errorResponse, inputJson, json } from "../../../../server/http";
export const maxDuration = 180;
export async function POST(request: Request) {
  try {
    const parsed = inspectInputSchema.safeParse(await inputJson(request));
    if (!parsed.success)
      return json({ error: "서로 다른 장소 1~5곳을 선택해 주세요." }, 400);
    return json(await inspectPlaces(parsed.data.ids, createProviders("live")));
  } catch (error) {
    return errorResponse(error);
  }
}
