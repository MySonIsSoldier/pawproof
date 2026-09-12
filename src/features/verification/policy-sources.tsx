import type { Policy } from "../../domain/policies/types";
import { Disclosure } from "../../components/ui/accordion";

function sourceLink(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" &&
      [
        "api.visitkorea.or.kr",
        "korean.visitkorea.or.kr",
        "www.data.go.kr",
        "reserve.insiseol.or.kr",
      ].includes(parsed.hostname)
      ? url
      : null;
  } catch {
    return null;
  }
}

export function PolicySources({ policy }: { policy: Policy }) {
  if (!policy.sources?.length) return null;
  return (
    <section aria-label="출처별 보완 자료">
      <h3>출처별 보완 자료</h3>
      <p className="field-caption">
        자료를 읽은 날짜와 업체가 규정을 확인한 날짜는 달라요. 연간 목록의
        조건은 변경될 수 있어요.
      </p>
      {policy.sources.map((source, index) => (
        <div className="source-meta" key={`${source.label}-${index}`}>
          <strong>{source.label}</strong>
          <p>자료 수정·발행: {source.publishedAt || "제공되지 않음"}</p>
          <p>자료 조회·열람: {source.accessedAt}</p>
          {source.phone && (
            <p>
              문의 연락처: {source.phone}
              {/^\d[\d-]{7,20}$/.test(source.phone) && (
                <>
                  {" "}
                  · <a href={`tel:${source.phone}`}>전화하기</a>
                </>
              )}
            </p>
          )}
          {sourceLink(source.url) && (
            <a href={sourceLink(source.url)!} target="_blank" rel="noreferrer">
              원본 제공처 ↗
            </a>
          )}
          <Disclosure className="raw-source" title="이 출처의 원문">
            <pre>{source.raw || "제공되지 않음"}</pre>
          </Disclosure>
        </div>
      ))}
      {policy.notices?.map((notice) => (
        <div
          className="source-meta"
          key={`${notice.sourceUrl}-${notice.startDate}`}
        >
          <strong>{notice.sourceLabel}</strong>
          <p>
            적용 기간: {notice.startDate} ~ {notice.endDate}
          </p>
          <blockquote>{notice.quote}</blockquote>
          <p>공지 열람: {notice.checkedAt}</p>
          {sourceLink(notice.sourceUrl) && (
            <a href={notice.sourceUrl} target="_blank" rel="noreferrer">
              휴장 공지 확인 ↗
            </a>
          )}
        </div>
      ))}
    </section>
  );
}
