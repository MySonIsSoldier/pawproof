"use client";
import Link from "next/link";
import { useState } from "react";
import { AdminArticleRequestError } from "./admin-api";
import { useAdminArticles } from "./use-admin-articles";
import styles from "./articles-admin.module.css";

const statusLabels = {
  draft: "검수 대기",
  published: "게시 중",
  archived: "보관함",
} as const;
type Filter = "all" | keyof typeof statusLabels;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

function errorMessage(error: unknown) {
  if (error instanceof AdminArticleRequestError && error.status === 403)
    return "지정된 Google 계정만 아티클 관리 기능을 사용할 수 있어요.";
  if (error instanceof AdminArticleRequestError && error.status === 503)
    return "관리자 기능을 아직 사용할 수 없어요. 잠시 후 다시 시도해 주세요.";
  return error instanceof AdminArticleRequestError
    ? error.message
    : "아티클을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.";
}

export function AdminArticleList() {
  const [cursor, setCursor] = useState<string | undefined>();
  const [cursorHistory, setCursorHistory] = useState<Array<string | undefined>>(
    [],
  );
  const { list } = useAdminArticles(cursor);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const articles = list.data?.articles ?? [];
  const counts = {
    all: articles.length,
    draft: articles.filter((article) => article.status === "draft").length,
    published: articles.filter((article) => article.status === "published")
      .length,
    archived: articles.filter((article) => article.status === "archived")
      .length,
  };
  const filtered = articles.filter((article) => {
    const statusMatches = filter === "all" || article.status === filter;
    const text = `${article.title} ${article.slug} ${article.tags.join(" ")}`;
    return (
      statusMatches &&
      text
        .toLocaleLowerCase("ko-KR")
        .includes(query.trim().toLocaleLowerCase("ko-KR"))
    );
  });

  return (
    <div className={styles.adminPage}>
      <header className={styles.adminHero}>
        <div>
          <p className={styles.eyebrow}>PAWPROOF EDITORIAL · PRIVATE DESK</p>
          <h1>아티클 책상</h1>
          <p>검수하고, 고치고, 준비가 된 글만 공개해요.</p>
        </div>
        <Link className={styles.primaryAction} href="/admin/articles/new">
          <span aria-hidden="true">＋</span> 새 아티클
        </Link>
      </header>

      {list.isPending && (
        <p className={styles.stateMessage} role="status">
          아티클 목록을 여는 중이에요…
        </p>
      )}
      {list.error && (
        <p className={styles.errorMessage} role="alert">
          {errorMessage(list.error)}
        </p>
      )}
      {!list.isPending && !list.error && (
        <>
          <div className={styles.listTools}>
            <div className={styles.filters} aria-label="아티클 상태 필터">
              {(["all", "draft", "published", "archived"] as const).map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    className={
                      filter === item ? styles.selectedFilter : undefined
                    }
                    aria-pressed={filter === item}
                    onClick={() => setFilter(item)}
                  >
                    {item === "all" ? "전체" : statusLabels[item]}{" "}
                    <span>{counts[item]}</span>
                  </button>
                ),
              )}
            </div>
            <label className={styles.searchBox}>
              <span aria-hidden="true">⌕</span>
              <input
                aria-label="아티클 검색"
                placeholder="제목, slug, 태그 검색"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>
          <p className={styles.filterHint}>
            최근 수정한 글부터 25개씩 보여줘요. 상태 필터와 검색은 현재 페이지에
            적용됩니다.
          </p>
          {filtered.length === 0 ? (
            <section className={styles.emptyState}>
              <span>아직 비어 있어요</span>
              <h2>
                {articles.length
                  ? "검색 결과가 없어요."
                  : "첫 글을 준비해 볼까요?"}
              </h2>
              <p>
                {articles.length
                  ? "다른 검색어를 입력해 주세요."
                  : "직접 작성하거나 예약 작업으로 초안을 보내면 이곳에서 검수할 수 있어요."}
              </p>
              {!articles.length && (
                <Link href="/admin/articles/new">첫 아티클 작성하기 ↗</Link>
              )}
            </section>
          ) : (
            <section className={styles.articleList} aria-label="아티클 목록">
              {filtered.map((article, index) => (
                <article className={styles.articleRow} key={article.id}>
                  <span className={styles.rowNumber}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className={styles.rowMain}>
                    <div className={styles.rowMeta}>
                      <span
                        className={`${styles.status} ${styles[article.status]}`}
                      >
                        {statusLabels[article.status]}
                      </span>
                      <span>
                        {article.origin === "automation"
                          ? "자동 수집 초안"
                          : "직접 작성"}
                      </span>
                      <time dateTime={article.updatedAt}>
                        수정 {formatDate(article.updatedAt)}
                      </time>
                    </div>
                    <h2>
                      <Link href={`/admin/articles/${article.id}`}>
                        {article.title}
                      </Link>
                    </h2>
                    <p className={styles.rowSummary}>{article.summary}</p>
                    <div className={styles.rowTags}>
                      <code>/{article.slug}</code>
                      {article.tags.map((tag) => (
                        <span key={tag}>#{tag}</span>
                      ))}
                    </div>
                  </div>
                  <Link
                    className={styles.rowOpen}
                    href={`/admin/articles/${article.id}`}
                    aria-label={`${article.title} 편집`}
                  >
                    열기 <span aria-hidden="true">↗</span>
                  </Link>
                </article>
              ))}
            </section>
          )}
          {(cursorHistory.length > 0 || list.data?.nextCursor) && (
            <nav className={styles.pagination} aria-label="아티클 목록 페이지">
              <button
                type="button"
                disabled={cursorHistory.length === 0 || list.isFetching}
                onClick={() => {
                  const previous = cursorHistory.at(-1);
                  setCursor(previous);
                  setCursorHistory((history) => history.slice(0, -1));
                }}
              >
                ← 이전
              </button>
              <span>{cursorHistory.length + 1} 페이지</span>
              <button
                type="button"
                disabled={!list.data?.nextCursor || list.isFetching}
                onClick={() => {
                  const next = list.data?.nextCursor;
                  if (!next) return;
                  setCursorHistory((history) => [...history, cursor]);
                  setCursor(next);
                }}
              >
                다음 →
              </button>
            </nav>
          )}
          <div className={styles.listFooter}>
            <span>
              현재 페이지 {articles.length}개 글 · 비공개 글은 관리자에게만
              보여요
            </span>
            <button
              type="button"
              onClick={() => void list.refetch()}
              disabled={list.isFetching}
            >
              {list.isFetching ? "새로고침 중…" : "목록 새로고침 ↻"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
