import type { ReactNode } from "react";
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

// Splits an answer's text on "{{N}}" citation markers and replaces each
// one with a numbered CitationChip, rendering plain text in between.
function renderAnswerText(text: string): ReactNode[] {
  const parts = text.split(/(\{\{\d+\}\})/g);
  return parts.map((part, index) => {
    const match = part.match(/^\{\{(\d+)\}\}$/);
    if (!match) return <span key={index}>{part}</span>;
    return <CitationChip key={index} number={Number(match[1])} />;
  });
}

// Left-aligned, neutral bubble for assistant answers, per spec: inline
// numbered citation chips at the exact claim they support, a sources list
// underneath repeating each chip number + document title + Space badge
// (multi-Space search means every citation must show its Space), and a
// feedback row. A low-confidence answer has no citations to list.
export function AssistantMessageBubble({
  message,
  onFeedback,
}: AssistantMessageBubbleProps) {
  const { answer } = message;

  return (
    <div className="mr-auto max-w-[85%]">
      <div className="bg-surface-sunken text-ink rounded-lg rounded-tl-sm px-3 py-2 text-sm">
        <p>{renderAnswerText(answer.text)}</p>
        {answer.citations.length > 0 && (
          <ul className="border-border mt-2 flex flex-col gap-1 border-t pt-2">
            {answer.citations.map((citation: AskAiCitation) => (
              <li
                key={citation.chipNumber}
                className="flex items-center gap-1.5 text-xs"
              >
                <CitationChip number={citation.chipNumber} />
                <span className="text-ink font-medium">
                  {citation.documentTitle}
                </span>
                <span className="bg-surface text-ink-muted rounded-full px-1.5 py-0.5">
                  {citation.spaceName}
                </span>
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
