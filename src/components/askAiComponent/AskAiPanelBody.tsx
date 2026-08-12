import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, X } from "lucide-react";
import type { ChatMessage } from "../../types";
import { UserMessageBubble } from "./UserMessageBubble";
import { AssistantMessageBubble } from "./AssistantMessageBubble";

interface AskAiPanelBodyProps {
  messages: ChatMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onFeedback: (
    messageId: string,
    vote: "helpful" | "not-helpful",
    comment?: string,
  ) => void;
  onClose: () => void;
  spaceCount: number;
  prefersReducedMotion: boolean | null;
}

// Floating slide-over panel's visual chrome (440px, right-aligned), same
// pattern as DocumentDetailPanel/DocumentFormPanel. Unlike those two
// document panels, this component owns no conversation state
// itself — AskAiPanel (Task 6) keeps `messages` alive across close/reopen
// by never unmounting it; only this chrome mounts/unmounts per open.
export function AskAiPanelBody({
  messages,
  inputValue,
  onInputChange,
  onSend,
  onFeedback,
  onClose,
  spaceCount,
  prefersReducedMotion,
}: AskAiPanelBodyProps) {
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [messages.length, prefersReducedMotion]);

  return (
    <div className="fixed inset-0 z-40">
      <motion.button
        type="button"
        aria-label="Close Ask AI panel"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        className="bg-ink/40 absolute inset-0 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.22,
          ease: "easeOut",
        }}
        className="bg-surface absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col p-5 shadow-lg"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="font-display text-ink flex items-center gap-2 text-xl font-semibold">
              <Sparkles size={18} className="text-accent" />
              Ask AI
            </h2>
            {/* MOCK: space count comes from mockCurrentUser.memberships.length */}
            <p className="text-ink-muted text-sm">
              Searching across {spaceCount} spaces you have access to
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Ask AI panel"
            className="text-ink-muted hover:bg-surface-sunken flex size-9 shrink-0 items-center justify-center rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto py-2">
          {messages.length === 0 ? (
            <div className="text-ink-muted flex h-full items-center justify-center text-center text-sm">
              Ask a question about any document you have access to.
            </div>
          ) : (
            messages.map((message) =>
              message.role === "user" ? (
                <UserMessageBubble key={message.id} message={message} />
              ) : (
                <AssistantMessageBubble
                  key={message.id}
                  message={message}
                  onFeedback={onFeedback}
                />
              ),
            )
          )}
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
            className="border-border text-ink placeholder:text-ink-muted focus:border-accent flex-1 rounded-md border px-3 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            aria-label="Send"
            className="bg-accent flex size-10 shrink-0 items-center justify-center rounded-md text-white disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
