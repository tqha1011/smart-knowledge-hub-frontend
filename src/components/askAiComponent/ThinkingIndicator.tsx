import { motion } from "framer-motion";

const DOT_DELAYS = [0, 0.15, 0.3];

// Shown in place of the assistant bubble while waiting on
// createSession/sendMessage — same bubble shell as AssistantMessageBubble
// so it reads as "the assistant is about to reply here", not a generic
// spinner.
export function ThinkingIndicator() {
  return (
    <div className="mr-auto w-fit max-w-[85%]">
      <div className="bg-surface-sunken flex items-center gap-1 rounded-lg rounded-tl-sm px-3 py-2.5">
        {DOT_DELAYS.map((delay) => (
          <motion.span
            key={delay}
            className="bg-ink-muted size-1.5 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              ease: "easeInOut",
              delay,
            }}
          />
        ))}
      </div>
    </div>
  );
}
