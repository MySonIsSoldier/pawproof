import { test, expect } from "@playwright/test";

test("selected all articles filter keeps its active colors on hover", async ({
  page,
}) => {
  await page.goto("./articles");

  const allArticles = page
    .getByRole("navigation", { name: "아티클 태그" })
    .getByRole("link", { name: "전체 글", exact: true });

  await expect(allArticles).toHaveAttribute("aria-current", "page");
  await allArticles.hover();
  await expect(allArticles).toHaveCSS("background-color", "rgb(47, 107, 80)");
  await expect(allArticles).toHaveCSS("color", "rgb(255, 255, 255)");
});
