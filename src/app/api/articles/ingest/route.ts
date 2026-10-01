import { articleIngestSchema } from "../../../../application/contracts/article";
import {
  articleErrorResponse,
  articleRepository,
  requireArticleIngestToken,
} from "../../../../server/articles";
import { inputJson, json } from "../../../../server/http";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function POST(request: Request) {
  try {
    requireArticleIngestToken(request);
    const input = articleIngestSchema.parse(await inputJson(request, 128_000));
    const article = await articleRepository().createDraft(input, "automation");
    return json({ article }, 201);
  } catch (error) {
    return articleErrorResponse(error);
  }
}
