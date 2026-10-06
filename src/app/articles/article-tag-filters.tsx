"use client";

import Link from "next/link";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import type { PublishedArticleTag } from "../../application/ports/article-repository";
import styles from "./articles.module.css";

const VISIBLE_TAG_LIMIT = 5;

export function ArticleTagFilters({
  tags,
  selectedTag,
}: {
  tags: PublishedArticleTag[];
  selectedTag?: string;
}) {
  const visibleTags = tags.slice(0, VISIBLE_TAG_LIMIT);
  const selectedTagIsVisible = visibleTags.some(
    (item) => item.tag === selectedTag,
  );
  const selectedTagDetails = tags.find((item) => item.tag === selectedTag);
  const hasMoreTags = tags.length > visibleTags.length;
  const displayedTags =
    selectedTagDetails && !selectedTagIsVisible
      ? [...visibleTags, selectedTagDetails]
      : visibleTags;

  return (
    <nav className={styles.tagBar} aria-label="아티클 태그">
      <Link
        href="/articles"
        className={!selectedTag ? styles.activeTag : undefined}
        aria-current={!selectedTag ? "page" : undefined}
      >
        전체 글
      </Link>
      {displayedTags.map(({ tag, count }) => (
        <Link
          key={tag}
          href={`/articles?tag=${encodeURIComponent(tag)}`}
          className={selectedTag === tag ? styles.activeTag : undefined}
          aria-current={selectedTag === tag ? "page" : undefined}
        >
          <span>{tag}</span>
          <span className={styles.tagCount}>{count}편</span>
        </Link>
      ))}
      {hasMoreTags && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className={styles.moreTags}>
              태그 더 보기 <span aria-hidden="true">＋</span>
            </Button>
          </DialogTrigger>
          <DialogContent className={styles.tagDialog}>
            <div className={styles.tagDialogHeader}>
              <div>
                <DialogTitle className={styles.tagDialogTitle}>
                  태그로 이야기 찾기
                </DialogTitle>
                <DialogDescription className={styles.tagDialogDescription}>
                  아티클이 많은 태그부터 보여드려요. 태그를 선택하면 해당 글을
                  모아볼 수 있습니다.
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <Button variant="ghost" className={styles.tagDialogClose}>
                  닫기
                </Button>
              </DialogClose>
            </div>
            <nav
              className={styles.tagDialogOptions}
              aria-label="전체 태그 목록"
            >
              <DialogClose asChild>
                <Link
                  href="/articles"
                  className={styles.tagDialogOption}
                  aria-current={!selectedTag ? "page" : undefined}
                >
                  <span>전체 글</span>
                </Link>
              </DialogClose>
              {tags.map(({ tag, count }) => (
                <DialogClose asChild key={tag}>
                  <Link
                    href={`/articles?tag=${encodeURIComponent(tag)}`}
                    className={styles.tagDialogOption}
                    aria-current={selectedTag === tag ? "page" : undefined}
                  >
                    <span>{tag}</span>
                    <span className={styles.tagDialogCount}>{count}편</span>
                  </Link>
                </DialogClose>
              ))}
            </nav>
          </DialogContent>
        </Dialog>
      )}
    </nav>
  );
}
