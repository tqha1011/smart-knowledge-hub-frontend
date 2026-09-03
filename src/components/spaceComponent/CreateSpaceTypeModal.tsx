import { useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { knowledgeSpaceTypeService } from "../../services/spaceService";
import { toErrorMessage } from "../../shared/handleApiError";
import type { ApiErrorResponse } from "../../types/commonType/apiResponse";

interface CreateSpaceTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  // The create endpoint returns no body (201 only) — hand back the typed
  // name so the parent can refetch the type list and reselect it by name.
  onCreated: (typeName: string) => void;
}

// Small centered dialog nested on top of CreateSpacePanel — deliberately not
// another slide-over, so it reads as a quick side-step rather than a second
// full panel stacking on the first.
export function CreateSpaceTypeModal({
  isOpen,
  onClose,
  onCreated,
}: CreateSpaceTypeModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setName("");
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Enter a type name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const trimmedName = name.trim();
      await knowledgeSpaceTypeService.createType({ name: trimmedName });
      setName("");
      onCreated(trimmedName);
    } catch (submitError) {
      setError(toErrorMessage(submitError as ApiErrorResponse));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
            onClick={handleClose}
            className="bg-ink/40 absolute inset-0 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Create new type"
            initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.96 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
            className="border-border bg-surface relative w-full max-w-sm rounded-lg border p-5 shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-ink text-lg font-semibold">
                New type
              </h2>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="text-ink-muted hover:bg-surface-sunken flex size-8 items-center justify-center rounded-md"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="space-type-name"
                  className="text-ink text-sm font-medium"
                >
                  Type name
                </label>
                <input
                  id="space-type-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Working group"
                  className={`border-border bg-surface-sunken text-ink placeholder:text-ink-muted focus:border-accent w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none ${
                    error ? "border-warn-fg" : ""
                  }`}
                />
                {error && <p className="text-warn-fg text-xs">{error}</p>}
              </div>

              <div className="mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-ink hover:bg-surface-sunken rounded-md px-3 py-2 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-accent rounded-md px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSubmitting ? "Creating..." : "Create type"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
