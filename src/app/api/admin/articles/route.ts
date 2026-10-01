import { articleContentSchema } from "../../../../application/contracts/article";
import {
  articleErrorResponse,
  articleRepository,
  requireArticleAdmin,
} from "../../../../server/articles";
import { inputJson, json } from "../../../../server/http";

export const runtime = "nodejs";
export const maxDuration = 20;

export async function GET(request: Request) {
  try {
    await requireArticleAdmin(request);
    const cursor = new URL(request.url).searchParams.get("cursor") ?? undefined;
    if (cursor && cursor.length > 512)
      return json(
        { error: "아티클 목록 위치를 확인해 주세요.", code: "INVALID_INPUT" },
        400,
      );
    return json(await articleRepository().listAdmin(cursor));
  } catch (error) {
    return articleErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireArticleAdmin(request);
    const content = articleContentSchema.parse(
      await inputJson(request, 128_000),
    );
    const article = await articleRepository().createDraft(content, "admin");
    return json({ article }, 201);
  } catch (error) {
    return articleErrorResponse(error);
  }
}
