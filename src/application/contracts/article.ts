import { z } from "zod";

export const articleStatusSchema = z.enum(["draft", "published", "archived"]);
export type ArticleStatus = z.infer<typeof articleStatusSchema>;

const articleContentFields = {
  title: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  summary: z.string().trim().min(1).max(240),
  body: z.string().trim().min(1).max(30_000),
  tags: z
    .array(z.string().trim().min(1).max(30))
    .min(1)
    .max(12)
    .refine(
      (tags) =>
        new Set(tags.map((tag) => tag.toLocaleLowerCase("ko-KR"))).size ===
        tags.length,
      "태그는 중복할 수 없습니다.",
    ),
};

export const articleContentSchema = z.object(articleContentFields).strict();
export type ArticleContent = z.infer<typeof articleContentSchema>;

/** Automation receives no status, timestamps, origin, or document id fields. */
export const articleIngestSchema = articleContentSchema;

export const articleSchema = z
  .object({
    id: z.string().min(1),
    ...articleContentFields,
    status: articleStatusSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    publishedAt: z.string().datetime().nullable(),
    origin: z.enum(["admin", "automation"]),
  })
  .strict();
export type Article = z.infer<typeof articleSchema>;

export const articleSummarySchema = articleSchema.omit({ body: true });
export type ArticleSummary = z.infer<typeof articleSummarySchema>;

export const articleListSchema = z
  .object({
    articles: z.array(articleSummarySchema),
    nextCursor: z.string().nullable(),
  })
  .strict();
export type ArticleList = z.infer<typeof articleListSchema>;

export const articleUpdateSchema = articleContentSchema;
export const articleStatusInputSchema = z
  .object({ status: articleStatusSchema })
  .strict();
