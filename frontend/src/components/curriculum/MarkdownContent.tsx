import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface Props {
  content: string;
}

export function MarkdownContent({ content }: Props) {
  return (
    <div
      className="prose prose-invert max-w-none"
      style={
        {
          "--tw-prose-body": "var(--text-primary)",
          "--tw-prose-headings": "var(--text-primary)",
          "--tw-prose-links": "var(--accent)",
          "--tw-prose-bold": "var(--text-primary)",
          "--tw-prose-code": "var(--accent)",
          "--tw-prose-pre-bg": "var(--bg-surface)",
          "--tw-prose-bullets": "var(--text-tertiary)",
          "--tw-prose-counters": "var(--text-secondary)",
          "--tw-prose-quote-borders": "var(--accent)",
        } as React.CSSProperties
      }
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
