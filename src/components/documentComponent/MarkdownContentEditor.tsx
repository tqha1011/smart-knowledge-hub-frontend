// src/components/documentComponent/MarkdownContentEditor.tsx
import { useRef } from "react";
import { Bold, Code, Heading, List } from "lucide-react";

interface MarkdownContentEditorProps {
  value: string;
  onChange: (value: string) => void;
}

type ToolbarAction = "bold" | "heading" | "list" | "code";

// "Write content" mode's Markdown authoring surface: a monospace textarea
// plus a small formatting toolbar (bold, heading, list, code block) that
// edits the selected text in place, per spec. No underlying file — the
// typed content itself becomes the document (see DocumentFormPanel, which
// derives fileType "markdown" and a byte size from this string).
export function MarkdownContentEditor({
  value,
  onChange,
}: MarkdownContentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyInlineWrap = (marker: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    const selected = value.slice(selectionStart, selectionEnd);
    const next =
      value.slice(0, selectionStart) +
      marker +
      selected +
      marker +
      value.slice(selectionEnd);
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        selectionStart + marker.length,
        selectionEnd + marker.length,
      );
    });
  };

  const applyLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart } = textarea;
    const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        selectionStart + prefix.length,
        selectionStart + prefix.length,
      );
    });
  };

  const applyCodeBlock = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    const selected = value.slice(selectionStart, selectionEnd);
    const next =
      value.slice(0, selectionStart) +
      "```\n" +
      selected +
      "\n```" +
      value.slice(selectionEnd);
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = selectionStart + 4 + selected.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const handleToolbarAction = (action: ToolbarAction) => {
    if (action === "bold") applyInlineWrap("**");
    if (action === "heading") applyLinePrefix("# ");
    if (action === "list") applyLinePrefix("- ");
    if (action === "code") applyCodeBlock();
  };

  return (
    <div>
      <div className="border-border bg-surface-sunken flex gap-1 rounded-t-md border border-b-0 p-1.5">
        <button
          type="button"
          onClick={() => handleToolbarAction("bold")}
          aria-label="Bold"
          className="text-ink-muted hover:bg-surface flex size-7 items-center justify-center rounded"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => handleToolbarAction("heading")}
          aria-label="Heading"
          className="text-ink-muted hover:bg-surface flex size-7 items-center justify-center rounded"
        >
          <Heading size={14} />
        </button>
        <button
          type="button"
          onClick={() => handleToolbarAction("list")}
          aria-label="List"
          className="text-ink-muted hover:bg-surface flex size-7 items-center justify-center rounded"
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onClick={() => handleToolbarAction("code")}
          aria-label="Code block"
          className="text-ink-muted hover:bg-surface flex size-7 items-center justify-center rounded"
        >
          <Code size={14} />
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={8}
        placeholder="Write the document content in Markdown…"
        className="border-border text-ink placeholder:text-ink-muted focus:border-accent w-full resize-y rounded-b-md border p-3 font-mono text-sm outline-none"
      />
    </div>
  );
}
