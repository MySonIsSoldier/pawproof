"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  articleContentSchema,
  type Article,
  type ArticleContent,
  type ArticleStatus,
} from "../../application/contracts/article";
import { MarkdownContent } from "../../components/articles/markdown-content";
import { AdminArticleRequestError } from "./admin-api";
import { useAdminArticle, useAdminArticleActions } from "./use-admin-articles";
import styles from "./articles-admin.module.css";

type EditorForm = {
  title: string;
  slug: string;
  summary: string;
  body: string;
  tags: string;
};

const emptyForm: EditorForm = {
  title: "",
  slug: "",
  summary: "",
  body: "",
  tags: "",
};

const statusLabels: Record<ArticleStatus, string> = {
  draft: "검수 대기",
  published: "게시 중",
  archived: "보관함",
};

function toForm(article: {
  title: string;
  slug: string;
  summary: string;
  body: string;
  tags: string[];
}): EditorForm {
  return { ...article, tags: article.tags.join(", ") };
}

function errorMessage(error: unknown) {
  if (error instanceof AdminArticleRequestError && error.status === 409)
    return "같은 slug를 사용하는 글이 있어요. 다른 주소를 입력해 주세요.";
  if (error instanceof AdminArticleRequestError && error.status === 403)
    return "지정된 Google 계정만 아티클 관리 기능을 사용할 수 있어요.";
  if (error instanceof AdminArticleRequestError) return error.message;
  return "아티클을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.";
}

export function AdminArticleEditor({
  articleId,
}: {
  articleId: string | null;
}) {
  const articleQuery = useAdminArticle(articleId);
  if (articleId && articleQuery.isPending)
    return (
      <p className={styles.stateMessage} role="status">
        아티클을 여는 중이에요…
      </p>
    );
  if (articleId && articleQuery.error)
    return (
      <p className={styles.errorMessage} role="alert">
        {errorMessage(articleQuery.error)}
      </p>
    );
  if (articleId && !articleQuery.data) return null;
  return (
    <ArticleEditorForm
      key={articleQuery.data?.id ?? "new-article"}
      article={articleQuery.data}
    />
  );
}

function ArticleEditorForm({ article }: { article: Article | undefined }) {
  const router = useRouter();
  const { save, changeStatus, remove } = useAdminArticleActions();
  const [form, setForm] = useState<EditorForm>(() =>
    article ? toForm(article) : emptyForm,
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [message, setMessage] = useState("");
  const [fieldError, setFieldError] = useState("");

  const contentResult = useMemo(
    () =>
      articleContentSchema.safeParse({
        title: form.title,
        slug: form.slug,
        summary: form.summary,
        body: form.body,
        tags: form.tags
          .split(/[\n,]/)
          .map((tag) => tag.trim().replace(/^#/, ""))
          .filter(Boolean),
      }),
    [form],
  );
  const isDirty = article
    ? !contentResult.success ||
      JSON.stringify(contentResult.data) !==
        JSON.stringify({
          title: article.title,
          slug: article.slug,
          summary: article.summary,
          body: article.body,
          tags: article.tags,
        })
    : true;
  const busy = save.isPending || changeStatus.isPending || remove.isPending;

  async function saveArticle() {
    setMessage("");
    if (!contentResult.success) {
      setFieldError(
        contentResult.error.issues[0]?.message ?? "입력값을 확인해 주세요.",
      );
      return;
    }
    setFieldError("");
    try {
      const saved = await save.mutateAsync({
        id: article?.id,
        content: contentResult.data as ArticleContent,
      });
      setMessage(article ? "변경한 내용을 저장했어요." : "초안을 만들었어요.");
      if (!article) router.replace(`/admin/articles/${saved.id}`);
    } catch (error) {
      setMessage(errorMessage(error));
    }
  }

  async function changeArticleStatus(status: ArticleStatus) {
    if (!article) return;
    setMessage("");
    try {
      await changeStatus.mutateAsync({ id: article.id, status });
      setMessage(
        status === "published"
          ? "아티클을 공개했어요."
          : status === "archived"
            ? "아티클을 보관했어요."
            : "아티클을 초안으로 되돌렸어요.",
      );
    } catch (error) {
      setMessage(errorMessage(error));
    }
  }

  async function deleteArticle() {
    if (!article || !window.confirm(`“${article.title}” 글을 영구 삭제할까요?`))
      return;
    setMessage("");
    try {
      await remove.mutateAsync(article.id);
      router.replace("/admin/articles");
    } catch (error) {
      setMessage(errorMessage(error));
    }
  }

  function update<K extends keyof EditorForm>(key: K, value: EditorForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const status = article?.status;
  const statusDirty = isDirty || contentResult.success === false;

  return (
    <div className={`${styles.adminPage} ${styles.editorPage}`}>
      <header className={styles.editorHero}>
        <div>
          <Link href="/admin/articles" className={styles.backLink}>
            ← 아티클 목록
          </Link>
          <p className={styles.eyebrow}>PAWPROOF EDITORIAL · WRITE & REVIEW</p>
          <h1>{article ? "한 편을 다듬어요" : "새 이야기를 시작해요"}</h1>
          <p>넓은 편집 화면에서 작성하고 미리보기로 공개 모습을 확인하세요.</p>
        </div>
        {article && (
          <span className={`${styles.status} ${styles[article.status]}`}>
            {statusLabels[article.status]}
          </span>
        )}
      </header>

      <div className={styles.editorToolbar}>
        <div
          className={styles.viewToggle}
          role="group"
          aria-label="아티클 보기 모드"
        >
          <button
            type="button"
            aria-controls="article-editor-form"
            aria-pressed={!previewMode}
            onClick={() => setPreviewMode(false)}
          >
            편집
          </button>
          <button
            type="button"
            aria-controls="article-editor-preview"
            aria-pressed={previewMode}
            onClick={() => setPreviewMode(true)}
          >
            미리보기
          </button>
        </div>
        <span>
          {article?.origin === "automation"
            ? "자동 수집 초안 · 내용 검수 후 공개해 주세요"
            : article?.status === "published"
              ? "게시 중인 글은 저장 즉시 공개 내용에 반영돼요"
              : "Markdown · 초안 변경은 저장 후에도 비공개예요"}
        </span>
      </div>

      <div
        className={`${styles.editorContent} ${previewMode ? styles.previewMode : ""}`}
      >
        <section
          id="article-editor-form"
          className={styles.formPanel}
          aria-label="아티클 편집"
        >
          <label className={styles.field}>
            <span>
              제목 <small>{form.title.length}/120</small>
            </span>
            <input
              value={form.title}
              maxLength={120}
              placeholder="반려견 보호자가 궁금해할 이야기를 적어주세요"
              onChange={(event) => update("title", event.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span>주소 slug</span>
            <div className={styles.slugInput}>
              <code>/articles/</code>
              <input
                value={form.slug}
                maxLength={100}
                placeholder="dog-walking-signals"
                spellCheck={false}
                onChange={(event) =>
                  update(
                    "slug",
                    event.target.value.toLowerCase().replace(/\s+/g, "-"),
                  )
                }
              />
            </div>
          </label>
          <label className={styles.field}>
            <span>
              한 줄 소개 <small>{form.summary.length}/240</small>
            </span>
            <textarea
              value={form.summary}
              maxLength={240}
              rows={2}
              placeholder="목록과 검색 결과에 보여줄 짧은 설명"
              onChange={(event) => update("summary", event.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span>태그</span>
            <input
              value={form.tags}
              placeholder="행동 이해, 산책 팁, 건강"
              onChange={(event) => update("tags", event.target.value)}
            />
            <small>쉼표나 줄바꿈으로 나눠 입력해요. 최대 12개.</small>
          </label>
          <label className={styles.field}>
            <span>본문 Markdown</span>
            <textarea
              className={styles.markdownInput}
              value={form.body}
              maxLength={30_000}
              spellCheck
              placeholder={
                "## 소제목\n\n본문을 적어주세요.\n\n- 기억할 점\n- 함께 시도할 방법"
              }
              onChange={(event) => update("body", event.target.value)}
            />
            <small>
              {form.body.length.toLocaleString("ko-KR")}/30,000자 · 이미지
              파일은 지원하지 않아요.
            </small>
          </label>
          {fieldError && (
            <p className={styles.errorMessage} role="alert">
              {fieldError}
            </p>
          )}
        </section>

        <section
          id="article-editor-preview"
          className={styles.previewPanel}
          aria-label="아티클 미리보기"
        >
          <div className={styles.previewTopline}>
            <span>PREVIEW</span>
            <span>PUBLIC ARTICLE</span>
          </div>
          <div className={styles.previewArticle}>
            <p className={styles.previewKicker}>PAWPROOF FIELD NOTE</p>
            <div className={styles.previewTags}>
              {form.tags
                .split(/[\n,]/)
                .map((tag) => tag.trim().replace(/^#/, ""))
                .filter(Boolean)
                .map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
            </div>
            <h2>{form.title || "아티클 제목이 여기에 보여요"}</h2>
            <p className={styles.previewSummary}>
              {form.summary || "한 줄 소개가 이 자리에 들어갑니다."}
            </p>
            <MarkdownContent
              body={
                form.body ||
                "본문을 입력하면 여기에 미리보기가 표시됩니다.\n\n## 소제목은 이렇게 보여요\n\n짧은 문단과 목록을 함께 확인할 수 있어요."
              }
              className={`${styles.previewBody} article-markdown`}
            />
          </div>
        </section>
      </div>

      <footer className={styles.editorActions}>
        <div className={styles.actionFeedback}>
          {message && <p role="status">{message}</p>}
          {article && (
            <span>
              {statusLabels[article.status]}
              {article.publishedAt
                ? ` · ${new Date(article.publishedAt).toLocaleDateString("ko-KR")}`
                : ""}
            </span>
          )}
        </div>
        <div className={styles.actionButtons}>
          {article && (
            <button
              className={styles.dangerAction}
              type="button"
              disabled={busy}
              onClick={() => void deleteArticle()}
            >
              영구 삭제
            </button>
          )}
          {article && status === "published" && (
            <button
              className={styles.secondaryAction}
              type="button"
              disabled={busy || statusDirty}
              onClick={() => void changeArticleStatus("draft")}
            >
              초안으로 되돌리기
            </button>
          )}
          {article && status !== "archived" && (
            <button
              className={styles.secondaryAction}
              type="button"
              disabled={busy || statusDirty}
              onClick={() => void changeArticleStatus("archived")}
            >
              보관
            </button>
          )}
          {article && status === "archived" && (
            <button
              className={styles.secondaryAction}
              type="button"
              disabled={busy || statusDirty}
              onClick={() => void changeArticleStatus("draft")}
            >
              초안으로 복귀
            </button>
          )}
          <button
            className={styles.primaryAction}
            type="button"
            disabled={busy}
            onClick={() => void saveArticle()}
          >
            {save.isPending
              ? "저장 중…"
              : article?.status === "published"
                ? "게시 내용 저장"
                : "초안 저장"}
          </button>
          {article && status === "draft" && (
            <button
              className={styles.publishAction}
              type="button"
              disabled={busy || statusDirty}
              onClick={() => void changeArticleStatus("published")}
            >
              {changeStatus.isPending ? "게시 중…" : "검수 완료 · 공개하기"}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
