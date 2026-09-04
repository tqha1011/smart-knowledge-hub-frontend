import { Check } from "lucide-react";
import type { UnansweredQuestionData } from "../../types";

interface NeedsAttentionListProps {
  items: UnansweredQuestionData[];
  /** Employee is read-only here — no Resolve action. */
  canManage: boolean;
  onOpenResolve: (item: UnansweredQuestionData) => void;
}

// The knowledge-gap queue: questions the RAG Assistant (Ask AI panel)
// couldn't confidently answer. Deliberately a separate list from answer
// feedback per spec — the two are never merged here.
export function NeedsAttentionList({
  items,
  canManage,
  onOpenResolve,
}: NeedsAttentionListProps) {
  if (items.length === 0) {
    return (
      <div className="border-border text-ink-muted flex min-h-48 items-center justify-center rounded-lg border border-dashed text-center text-sm">
        Nothing needs attention right now.
      </div>
    );
  }

  return (
    <ul className="divide-border border-border divide-y overflow-hidden rounded-lg border">
      {items.map((item) => (
        <li
          key={item.publicId}
          className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-ink text-sm font-medium">{item.question}</p>
            <p className="text-ink-muted mt-0.5 text-xs">{item.reason}</p>
          </div>
          {canManage && (
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => onOpenResolve(item)}
                className="bg-accent flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-white"
              >
                <Check size={13} />
                Resolve
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
