import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { X, Plus } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { toast } from "react-toastify";
import {
  knowledgeSpaceService,
  knowledgeSpaceTypeService,
} from "../../services/spaceService";
import { CreateSpaceTypeModal } from "./CreateSpaceTypeModal";
import { usePanelDismiss } from "../common/usePanelDismiss";
import { toErrorMessage } from "../../shared/handleApiError";
import type { SpaceType } from "../../types";
import type { ApiErrorResponse } from "../../types/commonType/apiResponse";

interface CreateSpacePanelProps {
  isOpen: boolean;
  onClose: () => void;
  // createSpace returns no usable body — this just signals the parent to
  // refetch its Space list, it doesn't hand back the created Space.
  onCreated: () => void;
}

// Slide-over panel — same 420px right-aligned pattern the spec defines for
// Document detail / Users & Roles, reused here even though Space creation
// itself is a documented non-goal of that spec.
export function CreateSpacePanel({
  isOpen,
  onClose,
  onCreated,
}: CreateSpacePanelProps) {
  const prefersReducedMotion = useReducedMotion();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [typeId, setTypeId] = useState("");
  const [types, setTypes] = useState<SpaceType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTypes = async () => {
    setIsLoadingTypes(true);
    try {
      const data = await knowledgeSpaceTypeService.getListTypes();
      setTypes(data);
      return data;
    } finally {
      setIsLoadingTypes(false);
    }
  };

  useEffect(() => {
    if (!isOpen || types.length > 0) return;
    let isActive = true;
    knowledgeSpaceTypeService.getListTypes().then((data) => {
      if (!isActive) return;
      setTypes(data);
      setIsLoadingTypes(false);
    });
    return () => {
      isActive = false;
    };
  }, [isOpen, types.length]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setTypeId("");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const panelRef = usePanelDismiss(isOpen, handleClose, isTypeModalOpen);

  // The create-type endpoint returns no body, so re-fetch the list and
  // select the just-created type by the name we sent it.
  const handleTypeCreated = async (typeName: string) => {
    const data = await loadTypes();
    const created = data?.find((type) => type.name === typeName);
    if (created) setTypeId(created.publicId);
    setIsTypeModalOpen(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Enter a space name.");
      return;
    }
    if (!typeId) {
      setError("Choose a space type.");
      return;
    }

    setIsSubmitting(true);
    try {
      await knowledgeSpaceService.createSpace({
        name: name.trim(),
        description: description.trim() || null,
        typePublicId: typeId,
      });
      toast.success(`${name.trim()} space created.`);
      onCreated();
      resetForm();
      onClose();
    } catch (submitError) {
      setError(toErrorMessage(submitError as ApiErrorResponse));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-40 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
              onClick={handleClose}
              className="bg-ink/40 absolute inset-0 backdrop-blur-sm"
            />
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Create space"
              initial={{ x: prefersReducedMotion ? 0 : "100%" }}
              animate={{ x: 0 }}
              exit={{ x: prefersReducedMotion ? 0 : "100%" }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.22,
                ease: "easeOut",
              }}
              className="border-border bg-surface relative flex h-full w-full max-w-[420px] flex-col overflow-y-auto border-l p-6 shadow-lg"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-ink text-xl font-semibold">
                  Create space
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

              <form
                onSubmit={handleSubmit}
                className="flex flex-1 flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="space-name"
                    className="text-ink text-sm font-medium"
                  >
                    Space name
                  </label>
                  <input
                    id="space-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Marketing"
                    className="border-border bg-surface-sunken text-ink placeholder:text-ink-muted focus:border-accent w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="space-description"
                    className="text-ink text-sm font-medium"
                  >
                    Description
                  </label>
                  <textarea
                    id="space-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="What is this space for?"
                    rows={3}
                    className="border-border bg-surface-sunken text-ink placeholder:text-ink-muted focus:border-accent w-full resize-none rounded-md border px-3 py-2.5 text-sm focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="space-type"
                      className="text-ink text-sm font-medium"
                    >
                      Type
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsTypeModalOpen(true)}
                      className="text-accent flex items-center gap-1 text-xs font-semibold"
                    >
                      <Plus size={12} />
                      Create new type
                    </button>
                  </div>
                  <select
                    id="space-type"
                    value={typeId}
                    onChange={(event) => setTypeId(event.target.value)}
                    disabled={isLoadingTypes}
                    className="border-border bg-surface-sunken text-ink focus:border-accent w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none disabled:opacity-60"
                  >
                    <option value="" disabled>
                      {isLoadingTypes ? "Loading types..." : "Select a type"}
                    </option>
                    {types.map((type) => (
                      <option key={type.publicId} value={type.publicId}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                {error && <p className="text-warn-fg text-xs">{error}</p>}

                <div className="mt-auto flex justify-end gap-2 pt-4">
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
                    className="bg-accent rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {isSubmitting ? "Creating..." : "Create space"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CreateSpaceTypeModal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        onCreated={handleTypeCreated}
      />
    </>
  );
}
