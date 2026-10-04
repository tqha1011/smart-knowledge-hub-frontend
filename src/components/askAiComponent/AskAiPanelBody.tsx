import { fadeMotion } from "../../shared/motion";
import { ResourceState } from "../common/ResourceState";
import { Button } from "../common/Button";
import { backdropMotion, panelMotion } from "../../shared/motion";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { History, Plus, Send, Sparkles, X } from "lucide-react";
import type { ChatMessage, ChatSessionListData } from "../../types";
import { UserMessageBubble } from "./UserMessageBubble";
import { AssistantMessageBubble } from "./AssistantMessageBubble";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { ChatSessionList } from "./ChatSessionList";
import { usePanelDismiss } from "../common/usePanelDismiss";

interface AskAiPanelBodyProps {
  viewMode: "conversation" | "list";
  messages: ChatMessage[];
  inputValue: string;
  isSending: boolean;
  isLoadingSession: boolean;
  sessions: ChatSessionListData[];
  isLoadingSessions: boolean;
  sessionsLoaded: boolean;
  sessionsError: string | null;
  sessionError: string | null;
  onRetrySessions: () => void;
  onRetrySession: () => void;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onFeedback: (
    messageId: string,
    vote: "helpful" | "not-helpful",
    comment?: string,
  ) => void;
  onClose: () => void;
  onOpenHistory: () => void;
  onNewChat: () => void;
  onSelectSession: (session: ChatSessionListData) => void;
  onDeleteSession: (session: ChatSessionListData) => void;
  spaceName: string;
  prefersReducedMotion: boolean | null;
}

// Floating slide-over panel's visual chrome (440px, right-aligned), same
// pattern as DocumentDetailPanel/DocumentFormPanel. Unlike those two
// document panels, this component owns no conversation or session
// state itself — AskAiPanel keeps it alive across close/reopen by never
// unmounting it; only this chrome mounts/unmounts per open. Toggles
// between a session-history list and the active conversation, both
// inside the same 440px chrome rather than widening the panel for a
// persistent sidebar.
export function AskAiPanelBody({
  viewMode,
  messages,
  inputValue,
  isSending,
  isLoadingSession,
  sessions,
  isLoadingSessions,
  sessionsLoaded,
  sessionsError,
  sessionError,
  onRetrySessions,
  onRetrySession,
  onInputChange,
  onSend,
  onFeedback,
  onClose,
  onOpenHistory,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  spaceName,
  prefersReducedMotion,
}: AskAiPanelBodyProps) {
  const threadEndRef = useRef<HTMLDivElement>(null);
  const panelRef = usePanelDismiss(true, onClose);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({
      behavior: "auto",
    });
  }, [messages.length, isSending, prefersReducedMotion]);

  return (
    <div className="fixed inset-0 z-40">
      <motion.button
        type="button"
        aria-label="Close Ask AI panel"
        {...backdropMotion(prefersReducedMotion)}
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Ask AI"
        {...panelMotion(prefersReducedMotion)}
        className="overlay-panel bg-surface absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col p-5 shadow-lg"
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-display text-ink flex items-center gap-2 text-xl font-semibold">
              <Sparkles size={18} className="text-accent" />
              Ask AI
            </h2>
            <p className="text-ink-muted text-xs break-words">
              Searching {spaceName}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onOpenHistory}
              disabled={isSending}
              aria-label="View chat history"
              className="text-ink-muted hover:bg-surface-sunken flex size-9 items-center justify-center rounded-md"
            >
              <History size={18} />
            </button>
            <button
              type="button"
              onClick={onNewChat}
              disabled={isSending}
              aria-label="New chat"
              className="text-ink-muted hover:bg-surface-sunken flex size-9 items-center justify-center rounded-md"
            >
              <Plus size={18} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Ask AI panel"
              className="text-ink-muted hover:bg-surface-sunken flex size-9 items-center justify-center rounded-md"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="flex-1 overflow-y-auto py-2">
            <ResourceState
              isLoading={isLoadingSessions}
              hasData={sessionsLoaded}
              error={sessionsError}
              onRetry={onRetrySessions}
            >
              <ChatSessionList
                sessions={sessions}
                onSelect={onSelectSession}
                onDelete={onDeleteSession}
              />
            </ResourceState>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto py-2">
              <ResourceState
                isLoading={isLoadingSession}
                hasData={!isLoadingSession && !sessionError}
                error={sessionError}
                onRetry={onRetrySession}
                kind="detail"
              >
                {messages.length === 0 && !isSending && (
                  <div className="text-ink-muted flex min-h-48 items-center justify-center p-4 text-center text-sm">
                    Ask a question about a document in this space.
                  </div>
                )}
                <AnimatePresence initial={false}>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      {...fadeMotion(prefersReducedMotion)}
                    >
                      {message.role === "user" ? (
                        <UserMessageBubble message={message} />
                      ) : (
                        <AssistantMessageBubble
                          message={message}
                          onFeedback={onFeedback}
                        />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isSending && <ThinkingIndicator />}
              </ResourceState>
              {messages.length > 0 && <div ref={threadEndRef} />}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                onSend();
              }}
              className="mt-3 flex gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(event) => onInputChange(event.target.value)}
                placeholder="Ask a question…"
                aria-label="Question"
                disabled={
                  isSending || isLoadingSession || Boolean(sessionError)
                }
                className="border-border text-ink placeholder:text-ink-muted focus:border-accent min-w-0 flex-1 rounded-md border px-3 py-2 text-sm outline-none disabled:opacity-60"
              />
              <Button
                type="submit"
                disabled={
                  !inputValue.trim() ||
                  isSending ||
                  isLoadingSession ||
                  Boolean(sessionError)
                }
                aria-label="Send"
                className="bg-accent text-on-accent flex size-10 shrink-0 items-center justify-center rounded-md disabled:opacity-50"
              >
                <Send size={16} />
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
