import { Check, X } from "lucide-react";
import type { KnowledgeGapItem } from "../../types";

interface NeedsAttentionListProps {
  items: KnowledgeGapItem[];
  /** Employee is read-only here — no Mark resolved / Ignore actions. */
  canManage: boolean;
  onResolve: (id: string) => void;
  onIgnore: (id: string) => void;
}

// The knowledge-gap queue: questions the RAG Assistant (Ask AI panel)
// couldn't confidently answer. Deliberately a separate list from answer
// feedback per spec — the two are never merged here.
export function NeedsAttentionList({
  items,
  canManage,
  onResolve,
  onIgnore,
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
          key={item.id}
          className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-ink text-sm font-medium">{item.question}</p>
            <p className="text-ink-muted mt-0.5 font-mono text-xs">
              Asked {item.askedCount} time{item.askedCount === 1 ? "" : "s"}
            </p>
          </div>
          {canManage && (
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => onResolve(item.id)}
                className="bg-status-ready-bg text-status-ready-fg flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold"
              >
                <Check size={13} />
                Mark resolved
              </button>
              <button
                type="button"
                onClick={() => onIgnore(item.id)}
                className="text-ink-muted hover:bg-surface-sunken flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold"
              >
                <X size={13} />
                Ignore
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
