import { motion, useReducedMotion } from "framer-motion";

const DOT_DELAYS = [0, 0.15, 0.3];

// Shown in place of the assistant bubble while waiting on
// createSession/sendMessage — same bubble shell as AssistantMessageBubble
// so it reads as "the assistant is about to reply here", not a generic
// spinner.
export function ThinkingIndicator() {
  const reduced = useReducedMotion();
  return (
    <div
      role="status"
      aria-label="Thinking…"
      className="mr-auto w-fit max-w-[85%]"
    >
      <div className="bg-surface-sunken flex items-center gap-1 rounded-lg rounded-tl-sm px-3 py-2.5">
        <span className="text-ink-muted mr-2 text-xs">Thinking…</span>
        {DOT_DELAYS.map((delay) => (
          <motion.span
            key={delay}
            aria-hidden="true"
            className="bg-ink-muted size-1.5 rounded-full"
            animate={reduced ? { opacity: 1 } : { opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 0.9,
              repeat: reduced ? 0 : Infinity,
              ease: "easeInOut",
              delay,
            }}
          />
        ))}
      </div>
    </div>
  );
}
