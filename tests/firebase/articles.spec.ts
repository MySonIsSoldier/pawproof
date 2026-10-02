import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import {
  auth,
  db,
  createGoogleUser,
  createUser,
  createUserWithEmail,
  email,
  login,
} from "./helpers";

const articleAdminEmail = "ohsong656565@gmail.com";
const ingestToken =
  "local-only-pawproof-article-ingest-token-never-for-production";
const ingestPath = "./api/articles/ingest";
const adminPath = "./api/admin/articles";

test("article APIs require the designated Google admin", async ({
  request,
}) => {
  const storedArticleIds: string[] = [];
  const userUids: string[] = [];
  try {
    const emailPasswordUser = await createUserWithEmail(articleAdminEmail);
    userUids.push(emailPasswordUser.uid);
    const outsider = await createUser();
    userUids.push(outsider.uid);
    const emailPasswordHeaders = {
      Authorization: `Bearer ${emailPasswordUser.token}`,
    };
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
    expect((await request.get(adminPath)).status()).toBe(401);
    expect(
      (
        await request.get(adminPath, { headers: emailPasswordHeaders })
      ).status(),
    ).toBe(403);
    expect(
      (
        await request.post(adminPath, {
          headers: outsiderHeaders,
          data: content,
        })
      ).status(),
    ).toBe(403);
    const nonexistentArticleId = randomUUID();
    const detailPath = `${adminPath}/${nonexistentArticleId}`;
    expect(
      (
        await request.get(detailPath, { headers: emailPasswordHeaders })
      ).status(),
    ).toBe(403);
    expect(
      (
        await request.put(detailPath, {
          headers: outsiderHeaders,
          data: content,
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await request.patch(detailPath, {
          headers: emailPasswordHeaders,
          data: { status: "published" },
        })
      ).status(),
    ).toBe(403);
    expect(
      (await request.delete(detailPath, { headers: outsiderHeaders })).status(),
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

    await auth.deleteUser(emailPasswordUser.uid);
    userUids.splice(userUids.indexOf(emailPasswordUser.uid), 1);

    const otherGoogleUser = await createGoogleUser(email());
    userUids.push(otherGoogleUser.uid);
    const admin = await createGoogleUser(articleAdminEmail);
    userUids.push(admin.uid);
    const adminHeaders = { Authorization: `Bearer ${admin.token}` };
    const otherGoogleHeaders = {
      Authorization: `Bearer ${otherGoogleUser.token}`,
    };
    expect(
      (await request.get(adminPath, { headers: otherGoogleHeaders })).status(),
    ).toBe(403);
    expect(
      (
        await request.patch(`${adminPath}/${created.id}`, {
          headers: otherGoogleHeaders,
          data: { status: "published" },
        })
      ).status(),
    ).toBe(403);

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
    expect(await (await request.get("./articles")).text()).toContain(
      content.title,
    );
    expect(await (await request.get("./articles?tag=산책")).text()).toContain(
      content.title,
    );

    const draftAgain = await request.patch(`${adminPath}/${created.id}`, {
      headers: adminHeaders,
      data: { status: "draft" },
    });
    expect(draftAgain.status()).toBe(200);
    expect((await request.get(`./articles/${slug}`)).status()).toBe(404);
    expect(await (await request.get("./articles")).text()).not.toContain(
      content.title,
    );
    expect(
      (
        await request.delete(`${adminPath}/${created.id}`, {
          headers: adminHeaders,
        })
      ).status(),
    ).toBe(200);
    storedArticleIds.splice(storedArticleIds.indexOf(created.id), 1);

    const adminCreated = await request.post(adminPath, {
      headers: adminHeaders,
      data: { ...content, slug: `admin-${suffix}` },
    });
    expect(adminCreated.status()).toBe(201);
    const adminArticle = (await adminCreated.json()).article as {
      id: string;
      status: string;
    };
    storedArticleIds.push(adminArticle.id);
    expect(adminArticle.status).toBe("draft");
    const adminArticlePath = `${adminPath}/${adminArticle.id}`;
    const adminArticleRead = await request.get(adminArticlePath, {
      headers: adminHeaders,
    });
    expect(adminArticleRead.status()).toBe(200);
    expect(
      (
        await request.put(adminArticlePath, {
          headers: adminHeaders,
          data: { ...content, slug: `admin-edited-${suffix}` },
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await request.patch(adminArticlePath, {
          headers: adminHeaders,
          data: { status: "published" },
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await request.delete(adminArticlePath, { headers: adminHeaders })
      ).status(),
    ).toBe(200);
    storedArticleIds.splice(storedArticleIds.indexOf(adminArticle.id), 1);
  } finally {
    await Promise.all(
      storedArticleIds.map((id) => db.collection("articles").doc(id).delete()),
    );
    await Promise.all(
      userUids.map((uid) => auth.deleteUser(uid).catch(() => undefined)),
    );
  }
});

test("only the designated Google account can see the article editor", async ({
  page,
}) => {
  const user = await createUserWithEmail(articleAdminEmail);
  try {
    await page.goto("./admin/articles");
    await expect(
      page.getByRole("heading", { name: "관리자 로그인이 필요해요." }),
    ).toBeVisible();
    await login(page, articleAdminEmail);
    await expect(
      page.getByRole("heading", {
        name: "이 계정은 아티클 관리 화면을 사용할 수 없어요.",
      }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "새 아티클" })).toHaveCount(0);

    await page.goto("./admin/articles/new");
    await expect(
      page.getByRole("heading", {
        name: "이 계정은 아티클 관리 화면을 사용할 수 없어요.",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "새 이야기를 시작해요" }),
    ).toHaveCount(0);
    await page.goto(`./admin/articles/${randomUUID()}`);
    await expect(
      page.getByRole("heading", {
        name: "이 계정은 아티클 관리 화면을 사용할 수 없어요.",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "한 편을 다듬어요" }),
    ).toHaveCount(0);
  } finally {
    await auth.deleteUser(user.uid).catch(() => undefined);
  }
});

test("article editor toggles between full-width writing and preview views", async ({
  page,
}) => {
  try {
    await page.goto("./");
    await page
      .getByRole("banner")
      .getByRole("button", { name: "로그인", exact: true })
      .click();
    const popupEvent = page.waitForEvent("popup");
    await page.getByRole("button", { name: "Google로 계속하기" }).click();
    const popup = await popupEvent;
    await popup.getByRole("button", { name: "Add new account" }).click();
    const emailInput = popup.locator("#email-input");
    await emailInput.fill(articleAdminEmail);
    await popup.getByRole("button", { name: "Sign in with Google" }).click();

    await page.goto("./admin/articles/new");
    await expect(
      page.getByRole("heading", { name: "새 이야기를 시작해요" }),
    ).toBeVisible();

    const main = page.getByRole("main");
    const editor = page.getByRole("region", { name: "아티클 편집" });
    const preview = page.getByRole("region", { name: "아티클 미리보기" });
    const editorMode = page.getByRole("button", { name: "편집", exact: true });
    const previewMode = page.getByRole("button", {
      name: "미리보기",
      exact: true,
    });
    await expect(editor).toBeVisible();
    await expect(preview).toBeHidden();
    const mainWidth = await main.evaluate(
      (element) => element.getBoundingClientRect().width,
    );
    const editorWidth = await editor.evaluate(
      (element) => element.getBoundingClientRect().width,
    );
    expect(editorWidth).toBeGreaterThan(mainWidth * 0.98);

    const title = "넓은 편집 화면 미리보기 확인";
    await page.getByRole("textbox", { name: /제목/u }).fill(title);
    await previewMode.click();
    await expect(previewMode).toHaveAttribute("aria-pressed", "true");
    await expect(editor).toBeHidden();
    await expect(preview).toBeVisible();
    await expect(preview.getByRole("heading", { name: title })).toBeVisible();

    await editorMode.click();
    await expect(editorMode).toHaveAttribute("aria-pressed", "true");
    await expect(editor).toBeVisible();
    await expect(preview).toBeHidden();
    await expect(page.getByRole("textbox", { name: /제목/u })).toHaveValue(
      title,
    );
  } finally {
    const user = await auth.getUserByEmail(articleAdminEmail).catch(() => null);
    if (user) await auth.deleteUser(user.uid).catch(() => undefined);
  }
});
