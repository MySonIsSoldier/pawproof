import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownContent({
  body,
  className,
}: {
  body: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ alt }) => (
            <span className="article-image-omitted">
              {alt || "이미지는 현재 지원하지 않습니다."}
            </span>
          ),
          a: ({ children, ...props }) => (
            <a {...props} rel="nofollow noopener noreferrer">
              {children}
            </a>
          ),
          table: ({ children, ...props }) => (
            <div className="article-table-wrap">
              <table {...props}>{children}</table>
            </div>
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
