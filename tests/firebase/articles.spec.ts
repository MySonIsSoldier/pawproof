import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { auth, db, createUser, login } from "./helpers";

const adminUid = "pawproof-article-admin-test";
const ingestToken =
  "local-only-pawproof-article-ingest-token-never-for-production";
const ingestPath = "./api/articles/ingest";
const adminPath = "./api/admin/articles";

test("article ingestion stays draft-only and an allowlisted admin can review and publish", async ({
  page,
  request,
}) => {
  const storedArticleIds: string[] = [];
  let outsiderUid: string | undefined;
  try {
    await auth.deleteUser(adminUid).catch(() => undefined);
    const admin = await createUser(true, adminUid);
    const outsider = await createUser();
    outsiderUid = outsider.uid;
    const adminHeaders = { Authorization: `Bearer ${admin.token}` };
    const outsiderHeaders = { Authorization: `Bearer ${outsider.token}` };
    const machineHeaders = {
      Authorization: `Bearer ${ingestToken}`,
      "Content-Type": "application/json",
    };
    const suffix = randomUUID().slice(0, 8);
    const slug = `dog-walk-stops-${suffix}`;
    const content = {
      title: `산책 중 멈추는 행동 ${suffix}`,
      slug,
      summary: "주변을 살피며 산책 중 멈추는 행동을 차분하게 이해해요.",
      body: "## 먼저 살펴보기\n\n주변 환경과 강아지의 몸짓을 함께 관찰해요.",
      tags: ["산책", "행동 이해"],
    };

    expect((await request.post(ingestPath, { data: content })).status()).toBe(
      401,
    );
    expect(
      (await request.get(adminPath, { headers: outsiderHeaders })).status(),
    ).toBe(403);
    expect(
      (
        await request.post(ingestPath, {
          headers: { Authorization: "Bearer wrong-token" },
          data: content,
        })
      ).status(),
    ).toBe(401);
    expect(
      (
        await request.post(ingestPath, {
          headers: machineHeaders,
          data: { ...content, status: "published" },
        })
      ).status(),
    ).toBe(400);

    const ingestResponse = await request.post(ingestPath, {
      headers: machineHeaders,
      data: content,
    });
    expect(ingestResponse.status()).toBe(201);
    const created = (await ingestResponse.json()).article as {
      id: string;
      status: string;
      publishedAt: string | null;
    };
    storedArticleIds.push(created.id);
    expect(created.status).toBe("draft");
    expect(created.publishedAt).toBeNull();
    expect(
      (
        await request.post(ingestPath, {
          headers: machineHeaders,
          data: content,
        })
      ).status(),
    ).toBe(409);

    const adminListResponse = await request.get(adminPath, {
      headers: adminHeaders,
    });
    expect(adminListResponse.status()).toBe(200);
    const adminList = await adminListResponse.json();
    const listed = adminList.articles.find(
      (article: { id: string }) => article.id === created.id,
    );
    expect(listed).toBeTruthy();
    expect(listed).not.toHaveProperty("body");

    const deniedPublish = await request.patch(`${adminPath}/${created.id}`, {
      headers: outsiderHeaders,
      data: { status: "published" },
    });
    expect(deniedPublish.status()).toBe(403);
    const directFirestoreRead = await fetch(
      `http://127.0.0.1:8080/v1/projects/demo-pawproof/databases/(default)/documents/articles/${created.id}`,
    );
    expect(directFirestoreRead.status).toBe(403);

    expect((await request.get(`./articles/${slug}`)).status()).toBe(404);
    const publishResponse = await request.patch(`${adminPath}/${created.id}`, {
      headers: adminHeaders,
      data: { status: "published" },
    });
    expect(publishResponse.status()).toBe(200);
    const publicResponse = await request.get(`./articles/${slug}`);
    expect(publicResponse.status()).toBe(200);
    expect(await publicResponse.text()).toContain(content.title);
    expect((await request.get("./sitemap.xml")).status()).toBe(200);
    await page.goto("./articles");
    const articleTags = page.getByRole("navigation", { name: "아티클 태그" });
    await expect(articleTags.getByRole("link", { name: "산책" })).toBeVisible();
    await page.goto("./articles?tag=산책");
    await expect(page.getByRole("heading", { name: content.title })).toBeVisible();

    const draftAgain = await request.patch(`${adminPath}/${created.id}`, {
      headers: adminHeaders,
      data: { status: "draft" },
    });
    expect(draftAgain.status()).toBe(200);
    expect((await request.get(`./articles/${slug}`)).status()).toBe(404);
    await page.goto("./articles");
    await expect(
      page
        .getByRole("navigation", { name: "아티클 태그" })
        .getByRole("link", { name: "산책" }),
    ).toHaveCount(0);
    expect(
      (
        await request.delete(`${adminPath}/${created.id}`, {
          headers: adminHeaders,
        })
      ).status(),
    ).toBe(200);
    storedArticleIds.splice(storedArticleIds.indexOf(created.id), 1);

    const uiSlug = `editorial-note-${suffix}`;
    await page.goto("./admin/articles");
    await expect(
      page.getByRole("heading", { name: "관리자 로그인이 필요해요." }),
    ).toBeVisible();
    await login(page, admin.email);
    await expect(page).toHaveURL(/\/admin\/articles$/);
    await expect(
      page.getByRole("heading", { name: "아티클 책상" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "새 아티클" }).click();
    await page
      .getByPlaceholder("반려견 보호자가 궁금해할 이야기를 적어주세요")
      .fill(`산책을 읽는 작은 방법 ${suffix}`);
    await page.getByPlaceholder("dog-walking-signals").fill(uiSlug);
    await page
      .getByPlaceholder("목록과 검색 결과에 보여줄 짧은 설명")
      .fill("강아지의 산책 행동을 살펴보는 짧은 안내입니다.");
    await page
      .getByPlaceholder("행동 이해, 산책 팁, 건강")
      .fill("산책, 행동 이해");
    await page
      .locator("textarea")
      .last()
      .fill(
        "## 한 걸음씩\n\n강아지의 신호를 보고 속도를 맞춰요.\n\n<script>alert(1)</script>",
      );
    if ((page.viewportSize()?.width ?? 1440) <= 560) {
      await page.getByRole("button", { name: "미리보기" }).click();
      await expect(
        page.getByRole("heading", { name: `산책을 읽는 작은 방법 ${suffix}` }),
      ).toBeVisible();
      await page.getByRole("button", { name: "편집", exact: true }).click();
    } else {
      await expect(
        page.getByRole("heading", { name: `산책을 읽는 작은 방법 ${suffix}` }),
      ).toBeVisible();
    }
    await page.getByRole("button", { name: "초안 저장" }).click();
    await expect(page).toHaveURL(/\/admin\/articles\/[0-9a-f-]+$/);
    const uiArticleId = page.url().split("/").at(-1)!;
    storedArticleIds.push(uiArticleId);
    await expect(
      page.getByRole("button", { name: "검수 완료 · 공개하기" }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "검수 완료 · 공개하기" }).click();
    await expect(page.getByText("아티클을 공개했어요.")).toBeVisible();

    await page.goto(`./articles/${uiSlug}`);
    await expect(
      page.getByRole("heading", { name: `산책을 읽는 작은 방법 ${suffix}` }),
    ).toBeVisible();
    await expect(
      page.getByText("강아지의 신호를 보고 속도를 맞춰요."),
    ).toBeVisible();
    await expect(page.locator("article script")).toHaveCount(0);

    await page.goto(`./admin/articles/${uiArticleId}`);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "영구 삭제" }).click();
    await expect(page).toHaveURL(/\/admin\/articles$/);
    storedArticleIds.splice(storedArticleIds.indexOf(uiArticleId), 1);
  } finally {
    await Promise.all(
      storedArticleIds.map((id) => db.collection("articles").doc(id).delete()),
    );
    if (outsiderUid) await auth.deleteUser(outsiderUid).catch(() => undefined);
    await auth.deleteUser(adminUid).catch(() => undefined);
  }
});
