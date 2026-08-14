import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import type { FeedbackVote } from "../../types";

interface FeedbackRowProps {
  vote: FeedbackVote;
  onSubmit: (vote: "helpful" | "not-helpful", comment?: string) => void;
}

// Feedback row under every assistant answer, per spec: 👍 submits
// immediately (no comment needed); 👎 reveals an optional comment
// textarea + "Send feedback" button, and only that button actually
// submits the down-vote. Once a vote lands, the row collapses to a
// short acknowledgement instead of showing the buttons again.
export function FeedbackRow({ vote, onSubmit }: FeedbackRowProps) {
  // Deliberately local, not lifted to AskAiPanel: an in-progress
  // (unsubmitted) feedback comment is lost if the panel closes before
  // "Send feedback" is clicked. Accepted limitation — the alternative
  // (keying draft state by message id one level up) adds real complexity
  // for an edge case narrower than the panel's core "conversation
  // survives close/reopen" guarantee.
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [comment, setComment] = useState("");

  if (vote) {
    return (
      <p className="text-ink-muted mt-2 text-xs">
        {vote === "helpful"
          ? "Thanks for the feedback!"
          : "Thanks — feedback sent."}
      </p>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSubmit("helpful")}
          aria-label="Helpful"
          className="text-ink-muted hover:bg-surface-sunken flex size-7 items-center justify-center rounded-md"
        >
          <ThumbsUp size={14} />
        </button>
        <button
          type="button"
          onClick={() => setIsCommentOpen(true)}
          aria-label="Not helpful"
          className="text-ink-muted hover:bg-surface-sunken flex size-7 items-center justify-center rounded-md"
        >
          <ThumbsDown size={14} />
        </button>
      </div>
      {isCommentOpen && (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="What could be improved? (optional)"
            rows={2}
            className="border-border text-ink placeholder:text-ink-muted focus:border-accent w-full resize-y rounded-md border px-2 py-1.5 text-xs outline-none"
          />
          <button
            type="button"
            onClick={() => onSubmit("not-helpful", comment.trim() || undefined)}
            className="bg-accent self-start rounded-md px-2.5 py-1.5 text-xs font-semibold text-white"
          >
            Send feedback
          </button>
        </div>
      )}
    </div>
  );
}
