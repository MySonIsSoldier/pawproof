import { z } from "zod";
import { createProviders } from "../../../../server/providers";
import { json, errorResponse } from "../../../../server/http";
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const id = z
      .string()
      .regex(/^\d{1,12}$/)
      .parse((await context.params).id);
    return json((await createProviders("live", true).places.get(id)).place);
  } catch (error) {
    return errorResponse(error);
  }
}
