// src/components/documentComponent/ReplaceFilePanel.tsx
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { FileDropzone } from "./FileDropzone";
import { FILE_TYPE_LABEL } from "./documentDisplay";
import { usePanelDismiss } from "../common/usePanelDismiss";
import { documentService } from "../../services/documentService";
import { toErrorMessage } from "../../shared/handleApiError";
import type { DocumentDetailsDto } from "../../types";
import type { ApiErrorResponse } from "../../types/commonType/apiResponse";

interface ReplaceFilePanelProps {
  isOpen: boolean;
  document: DocumentDetailsDto | null;
  spacePublicId: string;
  onClose: () => void;
  onReplaced: () => void;
}

// Floating slide-over panel (420px, right-aligned), same pattern as
// AddMemberPanel. Narrow single-purpose action separate from
// DocumentFormPanel's create/edit-details modes — it only needs a file
// picker, not categories/visibility/permissions.
export function ReplaceFilePanel({
  isOpen,
  document,
  spacePublicId,
  onClose,
  onReplaced,
}: ReplaceFilePanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && document && (
        <ReplaceFilePanelBody
          document={document}
          spacePublicId={spacePublicId}
          onClose={onClose}
          onReplaced={onReplaced}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
    </AnimatePresence>
  );
}

interface ReplaceFilePanelBodyProps {
  document: DocumentDetailsDto;
  spacePublicId: string;
  onClose: () => void;
  onReplaced: () => void;
  prefersReducedMotion: boolean | null;
}

// Split out from ReplaceFilePanel so it only mounts while `isOpen` is true
// — the file picker always starts fresh (no selected file) per open, same
// as AddMemberPanelBody resets its cards per open.
function ReplaceFilePanelBody({
  document,
  spacePublicId,
  onClose,
  onReplaced,
  prefersReducedMotion,
}: ReplaceFilePanelBodyProps) {
  const panelRef = usePanelDismiss(true, onClose);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error("Choose a file to replace it with.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { uploadUrl, storageKey } = await documentService.getUploadUrl(
        spacePublicId,
        {
          fileName: selectedFile.name,
          contentType: selectedFile.type,
          fileSize: selectedFile.size,
        },
      );
      await documentService.uploadFileToStorage(
        uploadUrl,
        selectedFile,
        selectedFile.type,
      );
      await documentService.updateDocument(spacePublicId, document.publicId, {
        name: selectedFile.name,
        storageKey,
      });
      toast.success("File replaced — reprocessing now.");
      onReplaced();
      onClose();
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
        aria-label="Close replace file panel"
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
        aria-label="Replace file"
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
            Replace file
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close replace file panel"
            className="text-ink-muted hover:bg-surface-sunken flex size-9 shrink-0 items-center justify-center rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-ink-muted mb-1 text-xs">Current file</p>
        <p className="text-ink mb-4 text-sm font-medium">
          {document.title} · {FILE_TYPE_LABEL[document.fileType]}
        </p>

        <FileDropzone
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
        />

        <p className="text-ink-muted mt-3 text-xs">
          Replacing the file re-processes the document — its status goes back to
          Processing until the new content is indexed.
        </p>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedFile}
          className="bg-accent mt-5 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? "Replacing…" : "Replace file"}
        </button>
      </motion.div>
    </div>
  );
}
