// src/components/usersComponent/AddMemberPanel.tsx
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { toast } from "react-toastify";
import { usePanelDismiss } from "../common/usePanelDismiss";
import { knowledgeSpaceMemberService } from "../../services/spaceService";
import { toErrorMessage } from "../../shared/handleApiError";
import type { SpaceRole } from "../../types";
import type { ApiErrorResponse } from "../../types/commonType/apiResponse";

interface AddMemberPanelProps {
  isOpen: boolean;
  spacePublicId: string;
  onClose: () => void;
  onAdded: () => void;
}

// Floating slide-over panel (420px, right-aligned), same pattern as
// CreateSpacePanel/UserDetailPanel. Adds existing users to this Space by
// their publicId — there's no org-wide user search yet, so this takes a
// raw id rather than an email-based invite/lookup.
export function AddMemberPanel({
  isOpen,
  spacePublicId,
  onClose,
  onAdded,
}: AddMemberPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <AddMemberPanelBody
          spacePublicId={spacePublicId}
          onClose={onClose}
          onAdded={onAdded}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
    </AnimatePresence>
  );
}

interface AddMemberPanelBodyProps {
  spacePublicId: string;
  onClose: () => void;
  onAdded: () => void;
  prefersReducedMotion: boolean | null;
}

interface MemberDraft {
  key: string;
  userPublicId: string;
  role: SpaceRole;
}

let cardKeyCounter = 0;
function nextCardKey(): string {
  cardKeyCounter += 1;
  return `card-${cardKeyCounter}`;
}

function makeBlankCard(): MemberDraft {
  return { key: nextCardKey(), userPublicId: "", role: "Viewer" };
}

// Split out from AddMemberPanel so this only mounts while `isOpen` is true
// — the card stack always starts fresh at one blank card per open, same as
// DocumentFormPanelBody resets its fields per open.
function AddMemberPanelBody({
  spacePublicId,
  onClose,
  onAdded,
  prefersReducedMotion,
}: AddMemberPanelBodyProps) {
  const panelRef = usePanelDismiss(true, onClose);
  const [cards, setCards] = useState<MemberDraft[]>(() => [makeBlankCard()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCard = () => {
    setCards((prev) => [...prev, makeBlankCard()]);
  };

  const handleRemoveCard = (key: string) => {
    setCards((prev) =>
      prev.length > 1 ? prev.filter((c) => c.key !== key) : prev,
    );
  };

  const handleIdChange = (key: string, userPublicId: string) => {
    setCards((prev) =>
      prev.map((c) => (c.key === key ? { ...c, userPublicId } : c)),
    );
  };

  const handleRoleChange = (key: string, role: SpaceRole) => {
    setCards((prev) => prev.map((c) => (c.key === key ? { ...c, role } : c)));
  };

  const handleSubmit = async () => {
    const trimmed = cards.map((card) => ({
      ...card,
      userPublicId: card.userPublicId.trim(),
    }));
    const invalid = trimmed.find((card) => !card.userPublicId);
    if (invalid) {
      toast.error("Enter a user ID for every person.");
      return;
    }

    setIsSubmitting(true);
    try {
      await knowledgeSpaceMemberService.addMembers(spacePublicId, {
        members: trimmed.map((card) => ({
          publicId: card.userPublicId,
          role: card.role,
        })),
      });
      toast.success(
        `Added ${trimmed.length} member${trimmed.length === 1 ? "" : "s"}.`,
      );
      onAdded();
    } catch (error) {
      toast.error(toErrorMessage(error as ApiErrorResponse));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40">
      <motion.button
        type="button"
        aria-label="Close add member panel"
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
        aria-label="Add member"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.22,
          ease: "easeOut",
        }}
        className="bg-surface absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col overflow-y-auto p-5 shadow-lg"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="font-display text-ink text-lg font-semibold">
            Add member
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add member panel"
            className="text-ink-muted hover:bg-surface-sunken flex size-9 shrink-0 items-center justify-center rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {cards.map((card, index) => (
            <div key={card.key} className="border-border rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-ink-muted text-xs font-medium">
                  Person {index + 1}
                </p>
                {cards.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCard(card.key)}
                    aria-label={`Remove person ${index + 1}`}
                    className="text-ink-muted hover:bg-surface-sunken flex size-6 items-center justify-center rounded-md"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <input
                type="text"
                value={card.userPublicId}
                onChange={(event) =>
                  handleIdChange(card.key, event.target.value)
                }
                placeholder="User ID"
                className="border-border text-ink placeholder:text-ink-muted focus:border-accent mb-2 w-full rounded-md border px-3 py-2 text-sm outline-none"
              />
              <select
                value={card.role}
                onChange={(event) =>
                  handleRoleChange(card.key, event.target.value as SpaceRole)
                }
                className="border-border text-ink focus:border-accent w-full rounded-md border px-2 py-1.5 text-sm outline-none"
              >
                <option value="Owner">Owner</option>
                <option value="Editor">Editor</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddCard}
          className="text-accent mt-3 flex items-center gap-1 self-start text-xs font-semibold"
        >
          <Plus size={12} />
          Add another person
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-accent mt-5 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting
            ? "Adding…"
            : `Add ${cards.length} member${cards.length === 1 ? "" : "s"}`}
        </button>
      </motion.div>
    </div>
  );
}
