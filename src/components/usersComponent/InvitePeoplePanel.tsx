// src/components/usersComponent/InvitePeoplePanel.tsx
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { toast } from "react-toastify";
import { usePanelDismiss } from "../common/usePanelDismiss";
import type { InviteCandidate, Space, SpaceRole } from "../../types";

interface InvitePeoplePanelProps {
  isOpen: boolean;
  allSpaces: Space[];
  onClose: () => void;
  onInvite: (candidates: InviteCandidate[]) => void;
}

// Floating slide-over panel (420px, right-aligned), same pattern as
// CreateSpacePanel/UserDetailPanel.
export function InvitePeoplePanel({
  isOpen,
  allSpaces,
  onClose,
  onInvite,
}: InvitePeoplePanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <InvitePeoplePanelBody
          allSpaces={allSpaces}
          onClose={onClose}
          onInvite={onInvite}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
    </AnimatePresence>
  );
}

interface InvitePeoplePanelBodyProps {
  allSpaces: Space[];
  onClose: () => void;
  onInvite: (candidates: InviteCandidate[]) => void;
  prefersReducedMotion: boolean | null;
}

interface PersonCardDraft {
  key: string;
  email: string;
  spaceId: string;
  role: SpaceRole;
}

let cardKeyCounter = 0;
function nextCardKey(): string {
  cardKeyCounter += 1;
  return `card-${cardKeyCounter}`;
}

function makeBlankCard(defaultSpaceId: string): PersonCardDraft {
  return {
    key: nextCardKey(),
    email: "",
    spaceId: defaultSpaceId,
    role: "Employee",
  };
}

// Split out from InvitePeoplePanel so this only mounts while `isOpen` is
// true — the card stack always starts fresh at one blank card per open,
// same as DocumentFormPanelBody resets its fields per open. Uses an
// ever-incrementing module-level counter (not Date.now()) for card keys,
// since two cards added via rapid clicks in the same millisecond would
// otherwise collide.
function InvitePeoplePanelBody({
  allSpaces,
  onClose,
  onInvite,
  prefersReducedMotion,
}: InvitePeoplePanelBodyProps) {
  const panelRef = usePanelDismiss(true, onClose);
  const defaultSpaceId = allSpaces[0]?.id ?? "";
  const [cards, setCards] = useState<PersonCardDraft[]>(() => [
    makeBlankCard(defaultSpaceId),
  ]);

  const handleAddCard = () => {
    setCards((prev) => [...prev, makeBlankCard(defaultSpaceId)]);
  };

  const handleRemoveCard = (key: string) => {
    setCards((prev) =>
      prev.length > 1 ? prev.filter((c) => c.key !== key) : prev,
    );
  };

  const handleEmailChange = (key: string, email: string) => {
    setCards((prev) => prev.map((c) => (c.key === key ? { ...c, email } : c)));
  };

  const handleSpaceChange = (key: string, spaceId: string) => {
    setCards((prev) =>
      prev.map((c) => (c.key === key ? { ...c, spaceId } : c)),
    );
  };

  const handleRoleChange = (key: string, role: SpaceRole) => {
    setCards((prev) => prev.map((c) => (c.key === key ? { ...c, role } : c)));
  };

  const handleSubmit = () => {
    const trimmed = cards.map((card) => ({
      ...card,
      email: card.email.trim(),
    }));
    const invalid = trimmed.find((card) => !card.email.includes("@"));
    if (invalid) {
      toast.error("Enter a valid email for every person.");
      return;
    }

    const candidates: InviteCandidate[] = trimmed.map((card) => ({
      email: card.email,
      spaceId: card.spaceId,
      role: card.role,
    }));
    onInvite(candidates);
  };

  return (
    <div className="fixed inset-0 z-40">
      <motion.button
        type="button"
        aria-label="Close invite panel"
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
        aria-label="Invite people"
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
            Invite people
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close invite panel"
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
                type="email"
                value={card.email}
                onChange={(event) =>
                  handleEmailChange(card.key, event.target.value)
                }
                placeholder="name@company.com"
                className="border-border text-ink placeholder:text-ink-muted focus:border-accent mb-2 w-full rounded-md border px-3 py-2 text-sm outline-none"
              />
              <div className="flex gap-2">
                <select
                  value={card.spaceId}
                  onChange={(event) =>
                    handleSpaceChange(card.key, event.target.value)
                  }
                  className="border-border text-ink focus:border-accent flex-1 rounded-md border px-2 py-1.5 text-sm outline-none"
                >
                  {allSpaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name}
                    </option>
                  ))}
                </select>
                <select
                  value={card.role}
                  onChange={(event) =>
                    handleRoleChange(card.key, event.target.value as SpaceRole)
                  }
                  className="border-border text-ink focus:border-accent rounded-md border px-2 py-1.5 text-sm outline-none"
                >
                  <option value="Editor">Editor</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>
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
          className="bg-accent mt-5 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white"
        >
          Send {cards.length} invite{cards.length === 1 ? "" : "s"}
        </button>
      </motion.div>
    </div>
  );
}
