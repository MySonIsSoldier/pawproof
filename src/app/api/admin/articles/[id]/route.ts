import { z } from "zod";
import {
  articleContentSchema,
  articleStatusInputSchema,
} from "../../../../../application/contracts/article";
import {
  articleErrorResponse,
  articleRepository,
  requireArticleAdmin,
} from "../../../../../server/articles";
import { inputJson, json } from "../../../../../server/http";

export const runtime = "nodejs";
export const maxDuration = 20;

async function articleId(context: { params: Promise<{ id: string }> }) {
  return z
    .string()
    .uuid()
    .parse((await context.params).id);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireArticleAdmin(request);
    const article = await articleRepository().getById(await articleId(context));
    return article
      ? json({ article })
      : json({ error: "아티클을 찾을 수 없습니다.", code: "NOT_FOUND" }, 404);
  } catch (error) {
    return articleErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireArticleAdmin(request);
    const [id, content] = await Promise.all([
      articleId(context),
      inputJson(request, 128_000).then((value) =>
        articleContentSchema.parse(value),
      ),
    ]);
    return json({
      article: await articleRepository().updateContent(id, content),
    });
  } catch (error) {
    return articleErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireArticleAdmin(request);
    const [id, input] = await Promise.all([
      articleId(context),
      inputJson(request, 2_000).then((value) =>
        articleStatusInputSchema.parse(value),
      ),
    ]);
    return json({
      article: await articleRepository().setStatus(id, input.status),
    });
  } catch (error) {
    return articleErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireArticleAdmin(request);
    await articleRepository().remove(await articleId(context));
    return json({ deleted: true });
  } catch (error) {
    return articleErrorResponse(error);
  }
}
