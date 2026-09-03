// src/components/documentComponent/ResolveQuestionPanel.tsx
import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { usePanelDismiss } from "../common/usePanelDismiss";
import { MarkdownContentEditor } from "./MarkdownContentEditor";
import { unansweredQuestionService } from "../../services/unansweredQuestion";
import { toErrorMessage } from "../../shared/handleApiError";
import type { UnansweredQuestionData } from "../../types";
import type { ApiErrorResponse } from "../../types/commonType/apiResponse";

interface ResolveQuestionPanelProps {
  isOpen: boolean;
  question: UnansweredQuestionData | null;
  spacePublicId: string;
  onClose: () => void;
  /** Called after a successful resolve so the parent can refetch the queue. */
  onResolved: () => void;
}

// Floating slide-over panel (420px, right-aligned), same pattern as
// DocumentDetailPanel — writing the answer here is what marks the
// question resolved, so there's no separate one-click "Resolve" action.
export function ResolveQuestionPanel({
  isOpen,
  question,
  spacePublicId,
  onClose,
  onResolved,
}: ResolveQuestionPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && question && (
        <ResolveQuestionPanelBody
          question={question}
          spacePublicId={spacePublicId}
          onClose={onClose}
          onResolved={onResolved}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
    </AnimatePresence>
  );
}

interface ResolveQuestionPanelBodyProps {
  question: UnansweredQuestionData;
  spacePublicId: string;
  onClose: () => void;
  onResolved: () => void;
  prefersReducedMotion: boolean | null;
}

// Split out from ResolveQuestionPanel so this only mounts while `isOpen`
// is true — the answer field always starts blank on each open, same as
// DocumentFormPanelBody resets its fields per open.
function ResolveQuestionPanelBody({
  question,
  spacePublicId,
  onClose,
  onResolved,
  prefersReducedMotion,
}: ResolveQuestionPanelBodyProps) {
  const panelRef = usePanelDismiss(true, onClose);
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Guards against a double-submit landing during the ~220ms exit
  // animation after onClose() (AnimatePresence keeps the panel mounted and
  // interactive while it exits).
  const hasSubmittedRef = useRef(false);

  const handleSubmit = async () => {
    if (hasSubmittedRef.current) return;
    if (!answer.trim()) {
      toast.error("Write an answer before resolving.");
      return;
    }

    hasSubmittedRef.current = true;
    setIsSubmitting(true);
    try {
      await unansweredQuestionService.markResolve(
        spacePublicId,
        question.publicId,
        { answer: answer.trim() },
      );
      toast.success("Question resolved.");
      onResolved();
      onClose();
    } catch (error) {
      toast.error(toErrorMessage(error as ApiErrorResponse));
      hasSubmittedRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40">
      <motion.button
        type="button"
        aria-label="Close resolve panel"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        className="bg-ink/40 absolute inset-0 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Resolve question"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.22,
          ease: "easeOut",
        }}
        className="bg-surface absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col overflow-y-auto p-5 shadow-lg"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="font-display text-ink text-lg font-semibold">
            Resolve question
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close resolve panel"
            className="text-ink-muted hover:bg-surface-sunken flex size-9 shrink-0 items-center justify-center rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-ink text-sm font-medium">{question.question}</p>
          <p className="text-ink-muted mt-0.5 text-xs">{question.reason}</p>
        </div>

        <div>
          <label className="text-ink-muted text-xs font-medium">Answer</label>
          <div className="mt-1">
            <MarkdownContentEditor value={answer} onChange={setAnswer} />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-accent mt-5 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? "Resolving…" : "Resolve"}
        </button>
      </motion.div>
    </div>
  );
}
