import assert from "node:assert/strict";
import test from "node:test";
import {
  articleContentSchema,
  articleIngestSchema,
  articleSummarySchema,
} from "../../src/application/contracts/article.ts";

const content = {
  title: "강아지가 산책 중 멈추는 이유",
  slug: "dog-stops-during-walk",
  summary: "멈추는 행동을 볼 때 주변 환경과 몸짓을 살펴봅니다.",
  body: "## 주변을 살펴보기\n\n본문 Markdown",
  tags: ["산책", "행동 이해"],
};

test("article content accepts bounded Markdown and normalized tags", () => {
  const result = articleContentSchema.parse(content);
  assert.equal(result.title, content.title);
  assert.deepEqual(result.tags, content.tags);
});

test("ingest payload cannot set status, timestamps, or storage origin", () => {
  assert.equal(
    articleIngestSchema.safeParse({ ...content, status: "published" }).success,
    false,
  );
  assert.equal(
    articleIngestSchema.safeParse({
      ...content,
      publishedAt: new Date().toISOString(),
    }).success,
    false,
  );
  assert.equal(
    articleIngestSchema.safeParse({ ...content, origin: "admin" }).success,
    false,
  );
});

test("article content rejects duplicate tags and unsafe slug characters", () => {
  assert.equal(
    articleContentSchema.safeParse({ ...content, tags: ["산책", "산책"] })
      .success,
    false,
  );
  assert.equal(
    articleContentSchema.safeParse({ ...content, slug: "../admin" }).success,
    false,
  );
});

test("article summaries omit the Markdown body", () => {
  const result = articleSummarySchema.parse({
    id: "e8d4a39f-84e9-441a-9068-1ad6490a094f",
    title: content.title,
    slug: content.slug,
    summary: content.summary,
    tags: content.tags,
    status: "draft",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    publishedAt: null,
    origin: "automation",
  });
  assert.equal("body" in result, false);
});
