import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { AskAiCitation, AssistantChatMessage } from "../../types";
import { CitationChip } from "./CitationChip";
import { FeedbackRow } from "./FeedbackRow";
import { MarkdownMessage } from "../common/MarkdownMessage";

interface AssistantMessageBubbleProps {
  message: AssistantChatMessage;
  onFeedback: (
    messageId: string,
    vote: "helpful" | "not-helpful",
    comment?: string,
  ) => void;
}

// Collapsed height for a long answer, in px — roughly 7-8 lines at
// text-sm/leading-relaxed. Answers shorter than this never show the
// expand/collapse control at all.
const COLLAPSED_HEIGHT_PX = 180;

// Left-aligned, neutral bubble for assistant answers. The backend doesn't
// mark where in the answer text a source applies (no inline citation
// markers in `content`), so citations render as a trailing numbered list —
// chip + document title + excerpt — rather than inline chips at the exact
// claim they support. A low-confidence answer has no citations to list.
export function AssistantMessageBubble({
  message,
  onFeedback,
}: AssistantMessageBubbleProps) {
  const { answer } = message;
  const contentRef = useRef<HTMLDivElement>(null);
  const [naturalHeight, setNaturalHeight] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Measures the answer's true rendered height once (not gated behind
  // `isOverflowing`, so the very first measurement always sees the
  // unclipped content) — re-measures only if the answer text itself
  // changes, since toggling isExpanded doesn't change the natural height.
  useLayoutEffect(() => {
    if (contentRef.current) {
      setNaturalHeight(contentRef.current.scrollHeight);
    }
  }, [answer.text]);

  const isOverflowing =
    naturalHeight !== null && naturalHeight > COLLAPSED_HEIGHT_PX;

  return (
    <div className="mr-auto w-fit max-w-[85%]">
      <div className="bg-surface-sunken text-ink rounded-lg rounded-tl-sm px-3 py-2 text-sm">
        <div
          ref={contentRef}
          className="relative overflow-hidden transition-[max-height] duration-300 ease-in-out"
          style={{
            maxHeight: isOverflowing
              ? isExpanded
                ? (naturalHeight ?? undefined)
                : COLLAPSED_HEIGHT_PX
              : undefined,
          }}
        >
          <MarkdownMessage text={answer.text} />
          {isOverflowing && !isExpanded && (
            <div className="from-surface-sunken pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t to-transparent" />
          )}
        </div>
        {isOverflowing && (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="text-accent mt-1 flex items-center gap-1 text-xs font-semibold"
          >
            {isExpanded ? "Show less" : "Show more"}
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
        {answer.citations.length > 0 && (
          <ul className="border-border mt-2 flex flex-col gap-1.5 border-t pt-2">
            {answer.citations.map((citation: AskAiCitation) => (
              <li key={citation.chipNumber} className="text-xs">
                <div className="flex items-center gap-1.5">
                  <CitationChip number={citation.chipNumber} />
                  <span className="text-ink font-medium">
                    {citation.documentTitle}
                  </span>
                </div>
                {citation.excerpt && (
                  <p className="text-ink-muted mt-0.5 pl-5 italic">
                    “{citation.excerpt}”
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <FeedbackRow
        vote={message.feedback}
        onSubmit={(vote, comment) => onFeedback(message.id, vote, comment)}
      />
    </div>
  );
}
