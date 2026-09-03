import type { AskAiCitation, AssistantChatMessage } from "../../types";
import { CitationChip } from "./CitationChip";
import { FeedbackRow } from "./FeedbackRow";

interface AssistantMessageBubbleProps {
  message: AssistantChatMessage;
  onFeedback: (
    messageId: string,
    vote: "helpful" | "not-helpful",
    comment?: string,
  ) => void;
}

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

  return (
    <div className="mr-auto w-fit max-w-[85%]">
      <div className="bg-surface-sunken text-ink rounded-lg rounded-tl-sm px-3 py-2 text-sm">
        <p className="whitespace-pre-wrap">{answer.text}</p>
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
