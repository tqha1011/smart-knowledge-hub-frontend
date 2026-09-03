import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { ChatSessionListData } from "../../types";
import { formatRelativeDate } from "../../shared/textFormat";

interface ChatSessionListProps {
  sessions: ChatSessionListData[];
  isLoading: boolean;
  onSelect: (session: ChatSessionListData) => void;
  onDelete: (session: ChatSessionListData) => void;
}

// Chat history view inside the Ask AI panel's list mode — one row per past
// session (title, last-updated), with an inline delete confirm matching
// UserDetailPanel/DocumentDetailPanel's Cancel/Confirm pattern, scaled down
// to fit a list row instead of a full panel footer.
export function ChatSessionList({
  sessions,
  isLoading,
  onSelect,
  onDelete,
}: ChatSessionListProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="text-ink-muted flex min-h-48 items-center justify-center text-center text-sm">
        Loading chats…
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="border-border text-ink-muted flex min-h-48 items-center justify-center rounded-lg border border-dashed text-center text-sm">
        No past chats yet.
      </div>
    );
  }

  return (
    <ul className="divide-border border-border divide-y overflow-hidden rounded-lg border">
      {sessions.map((session) => (
        <li
          key={session.publicId}
          className="flex items-center gap-2 px-3 py-2.5"
        >
          {confirmingId === session.publicId ? (
            <div className="flex flex-1 items-center justify-between gap-2">
              <span className="text-ink-muted text-xs">Delete this chat?</span>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => setConfirmingId(null)}
                  className="border-border text-ink hover:bg-surface-sunken rounded-md border px-2 py-1 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingId(null);
                    onDelete(session);
                  }}
                  className="bg-warn-bg text-warn-fg rounded-md px-2 py-1 text-xs font-semibold"
                >
                  Confirm
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onSelect(session)}
                className="hover:bg-surface-sunken flex min-w-0 flex-1 flex-col items-start rounded-md px-2 py-1 text-left"
              >
                <span className="text-ink w-full truncate text-sm font-medium">
                  {session.title}
                </span>
                <span className="text-ink-muted text-xs">
                  {formatRelativeDate(session.updatedAt)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmingId(session.publicId)}
                aria-label={`Delete "${session.title}"`}
                className="text-ink-muted hover:bg-surface-sunken flex size-8 shrink-0 items-center justify-center rounded-md"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
