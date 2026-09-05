import { useState } from "react";
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

// How many citations show by default — collapsed behind a "Show N more
// sources" toggle beyond this. Count-based rather than height-based since
// citation excerpts vary in length; a fixed item count is more predictable.
const VISIBLE_CITATIONS_COUNT = 2;

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
  const [showAllCitations, setShowAllCitations] = useState(false);

  const visibleCitations = showAllCitations
    ? answer.citations
    : answer.citations.slice(0, VISIBLE_CITATIONS_COUNT);
  const hiddenCitationsCount =
    answer.citations.length - VISIBLE_CITATIONS_COUNT;

  return (
    <div className="mr-auto w-fit max-w-[85%]">
      <div className="bg-surface-sunken text-ink rounded-lg rounded-tl-sm px-3 py-2 text-sm">
        <MarkdownMessage text={answer.text} />
        {answer.citations.length > 0 && (
          <ul className="border-border mt-2 flex flex-col gap-1.5 border-t pt-2">
            {visibleCitations.map((citation: AskAiCitation) => (
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
        {hiddenCitationsCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAllCitations((prev) => !prev)}
            className="text-accent mt-1.5 flex items-center gap-1 text-xs font-semibold"
          >
            {showAllCitations
              ? "Show less"
              : `Show ${hiddenCitationsCount} more source${hiddenCitationsCount === 1 ? "" : "s"}`}
            {showAllCitations ? (
              <ChevronUp size={13} />
            ) : (
              <ChevronDown size={13} />
            )}
          </button>
        )}
      </div>
      <FeedbackRow
        vote={message.feedback}
        onSubmit={(vote, comment) => onFeedback(message.id, vote, comment)}
      />
    </div>
  );
}
