import { useResource } from "../common/useResource";
import { LoadError } from "../common/ResourceState";
import { Button } from "../common/Button";
import { backdropMotion, panelMotion } from "../../shared/motion";
import { useCallback, useEffect, useRef, useState } from "react";
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
import type { ApiErrorResponse } from "../../types/commonType/apiResponse";
import type { SpaceListItemDto } from "../../types/commonType/space";

interface SpaceFormPanelProps {
  isOpen: boolean;
  space: SpaceListItemDto | null;
  onClose: () => void;
  // Both mutations return a message, so the parent refetches its list.
  onSaved: () => void;
}

export function SpaceFormPanel({ isOpen, ...props }: SpaceFormPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && <SpaceFormPanelBody {...props} />}
    </AnimatePresence>
  );
}

// The parent keys each opening separately, including reopening during exit.
// Draft state and in-flight callbacks therefore belong to exactly one session.
function SpaceFormPanelBody({
  space,
  onClose,
  onSaved,
}: Omit<SpaceFormPanelProps, "isOpen">) {
  const prefersReducedMotion = useReducedMotion();
  const [name, setName] = useState(space?.name ?? "");
  const [description, setDescription] = useState(space?.description ?? "");
  const [typeId, setTypeId] = useState(space?.typePublicId ?? "");
  const typesLoader = useCallback(
    () => knowledgeSpaceTypeService.getListTypes(),
    [],
  );
  const typesResource = useResource("space-types", typesLoader);
  const types = typesResource.data ?? [];
  const isLoadingTypes = typesResource.isLoading;
  const loadTypes = typesResource.reload;
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  const handleClose = () => {
    if (!activeRef.current) return;
    activeRef.current = false;
    setIsTypeModalOpen(false);
    onClose();
  };

  const panelRef = usePanelDismiss(true, handleClose, isTypeModalOpen);

  // The create-type endpoint returns no body, so re-fetch the list and
  // select the just-created type by the name we sent it.
  const handleTypeCreated = async (typeName: string) => {
    if (!activeRef.current) return;
    const data = await loadTypes();
    if (!activeRef.current) return;
    const created = data?.find((type) => type.name === typeName);
    if (created) setTypeId(created.publicId);
    setIsTypeModalOpen(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submittingRef.current || !activeRef.current) return;
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter a space name.");
      return;
    }
    if (trimmedName.length > 100) {
      setError("Space name must be 100 characters or fewer.");
      return;
    }
    if (description.length > 500) {
      setError("Description must be 500 characters or fewer.");
      return;
    }
    if (!typeId) {
      setError("Choose a space type.");
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const payload = {
        name: trimmedName,
        description: description.trim() || null,
        typePublicId: typeId,
      };
      if (space) {
        await knowledgeSpaceService.updateSpace(space.publicId, payload);
      } else {
        await knowledgeSpaceService.createSpace(payload);
      }
      toast.success(
        space
          ? `${trimmedName} space updated.`
          : `${trimmedName} space created.`,
      );
      onSaved();
      // A dismissed request still refreshes the list and reports success,
      // but must never close a later panel or change its draft.
      if (activeRef.current) handleClose();
    } catch (submitError) {
      if (activeRef.current) {
        setError(toErrorMessage(submitError as ApiErrorResponse));
        submittingRef.current = false;
      }
    } finally {
      if (activeRef.current) setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-end">
        <motion.div
          {...backdropMotion(prefersReducedMotion)}
          onClick={handleClose}
          className="absolute inset-0 bg-black/40"
        />
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={space ? "Edit space" : "Create space"}
          {...panelMotion(prefersReducedMotion)}
          className="border-border bg-surface relative flex h-full w-full flex-col overflow-y-auto border-l p-6 shadow-lg sm:max-w-[420px]"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-ink text-xl font-semibold">
              {space ? "Edit space" : "Create space"}
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
            aria-busy={isSubmitting}
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
                disabled={isSubmitting}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Marketing"
                className="border-border bg-surface-sunken text-ink placeholder:text-ink-muted focus:border-accent w-full rounded-md border px-3 py-2.5 text-sm disabled:opacity-60"
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
                disabled={isSubmitting}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What is this space for?"
                rows={3}
                className="border-border bg-surface-sunken text-ink placeholder:text-ink-muted focus:border-accent w-full resize-none rounded-md border px-3 py-2.5 text-sm disabled:opacity-60"
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
                  disabled={isSubmitting}
                  className="text-accent flex items-center gap-1 text-xs font-semibold disabled:opacity-60"
                >
                  <Plus size={12} />
                  Create new type
                </button>
              </div>
              {typesResource.error && (
                <LoadError
                  message={typesResource.error}
                  onRetry={() => void loadTypes()}
                  isLoading={isLoadingTypes || isSubmitting}
                />
              )}
              <select
                id="space-type"
                value={typeId}
                onChange={(event) => setTypeId(event.target.value)}
                disabled={isLoadingTypes || isSubmitting}
                className="border-border bg-surface-sunken text-ink focus:border-accent w-full rounded-md border px-3 py-2.5 text-sm disabled:opacity-60"
              >
                <option value="" disabled>
                  {isLoadingTypes ? "Loading types..." : "Select a type"}
                </option>
                {space?.typePublicId &&
                  !types.some(
                    (type) => type.publicId === space.typePublicId,
                  ) && (
                    <option value={space.typePublicId}>{space.typeName}</option>
                  )}
                {types.map((type) => (
                  <option key={type.publicId} value={type.publicId}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p role="alert" className="text-warn-fg text-sm">
                {error}
              </p>
            )}

            <div className="mt-auto flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="text-ink hover:bg-surface-sunken rounded-md px-3 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-accent text-on-accent rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {isSubmitting
                  ? space
                    ? "Saving..."
                    : "Creating..."
                  : space
                    ? "Save changes"
                    : "Create space"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>

      <CreateSpaceTypeModal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        onCreated={handleTypeCreated}
      />
    </>
  );
}
