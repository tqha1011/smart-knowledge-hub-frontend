import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownMessageProps {
  text: string;
}

// No @tailwindcss/typography plugin in this project, so each element is
// styled explicitly against the app's design tokens rather than via a
// `prose` class.
const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="whitespace-pre-wrap not-last:mb-2">{children}</p>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-accent underline underline-offset-2"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="my-1 list-disc space-y-0.5 pl-5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-1 list-decimal space-y-0.5 pl-5">{children}</ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  h1: ({ children }) => (
    <h3 className="font-display mt-1 mb-1 text-base font-semibold">
      {children}
    </h3>
  ),
  h2: ({ children }) => (
    <h3 className="font-display mt-1 mb-1 text-base font-semibold">
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h4 className="mt-1 mb-1 text-sm font-semibold">{children}</h4>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-border text-ink-muted my-1 border-l-2 pl-2 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-border my-2" />,
  code: ({ children, className }) =>
    className?.includes("language-") ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="bg-border/40 rounded px-1 py-0.5 font-mono text-[0.85em]">
        {children}
      </code>
    ),
  pre: ({ children }) => (
    <pre className="border-border bg-surface my-2 overflow-x-auto rounded-md border p-2 font-mono text-xs">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="border-border w-full border-collapse text-xs">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-border border px-2 py-1 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-border border px-2 py-1">{children}</td>
  ),
};

// Assistant answers can come back as Markdown (headings, lists, code,
// tables, links) — rendered here instead of as a plain <p> of raw text.
// react-markdown doesn't render raw HTML unless rehype-raw is added, so
// this stays safe against HTML/script injection from the response text
// without needing a separate sanitizer.
export function MarkdownMessage({ text }: MarkdownMessageProps) {
  return (
    <div className="text-sm leading-relaxed *:first:mt-0 *:last:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
