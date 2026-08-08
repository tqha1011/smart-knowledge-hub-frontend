import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Sparkles, X } from "lucide-react";

interface AskAiStubPanelProps {
  isOpen: boolean;
  onClose: () => void;
  spaceCount: number;
}

// Floating slide-over panel (440px, right-aligned, dims/blurs the page
// behind it) — this only proves the shell's entry point wires up correctly.
// The actual thread/composer/citations are spec piece 5 ("RAG Assistant"),
// a separate build; this stub is a placeholder so the panel isn't empty JS.
export function AskAiStubPanel({
  isOpen,
  onClose,
  spaceCount,
}: AskAiStubPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
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
            <div className="mb-1 flex items-start justify-between">
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

            <div className="border-border text-ink-muted mt-6 flex flex-1 items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm">
              Thread, citations, and feedback UI are spec piece 5 — not built
              yet. This panel only demonstrates that the shell opens it without
              navigating away.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
