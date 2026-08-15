import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Download, Pencil, RefreshCw, Trash2, X } from "lucide-react";
import type { DocumentCitation, DocumentSummary, Space } from "../../types";
import {
  FILE_TYPE_ICON,
  FILE_TYPE_LABEL,
  formatFileSize,
  formatRelativeDate,
} from "./documentDisplay";
import { usePanelDismiss } from "../common/usePanelDismiss";

interface DocumentDetailPanelProps {
  document: DocumentSummary | null;
  isOpen: boolean;
  space: Space;
  /** isAdmin || Editor-in-this-Space — gates Edit details / Replace file / Delete. */
  canManage: boolean;
  citations: DocumentCitation[];
  onClose: () => void;
  onOpenFile: () => void;
  onEditDetails: () => void;
  onReplaceFile: () => void;
  onDelete: (documentId: string) => void;
}

// Floating slide-over panel (420px, right-aligned), same pattern as
// AskAiPanel — dims/blurs the page behind it, closes back to exactly
// where the user was. Metadata + actions only, no embedded file preview
// (spec deliberately defers a PDF/doc viewer) and no version history.
export function DocumentDetailPanel({
  document,
  isOpen,
  space,
  canManage,
  citations,
  onClose,
  onOpenFile,
  onEditDetails,
  onReplaceFile,
  onDelete,
}: DocumentDetailPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && document && (
        <DocumentDetailPanelBody
          document={document}
          space={space}
          canManage={canManage}
          citations={citations}
          onClose={onClose}
          onOpenFile={onOpenFile}
          onEditDetails={onEditDetails}
          onReplaceFile={onReplaceFile}
          onDelete={onDelete}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
    </AnimatePresence>
  );
}

interface DocumentDetailPanelBodyProps {
  document: DocumentSummary;
  space: Space;
  canManage: boolean;
  citations: DocumentCitation[];
  onClose: () => void;
  onOpenFile: () => void;
  onEditDetails: () => void;
  onReplaceFile: () => void;
  onDelete: (documentId: string) => void;
  prefersReducedMotion: boolean | null;
}

// Split out from DocumentDetailPanel so `document` is narrowed to
// non-null via props typing instead of needing a `document!` assertion
// or an inline IIFE everywhere it's read below.
function DocumentDetailPanelBody({
  document,
  space,
  canManage,
  citations,
  onClose,
  onOpenFile,
  onEditDetails,
  onReplaceFile,
  onDelete,
  prefersReducedMotion,
}: DocumentDetailPanelBodyProps) {
  const FileIcon = FILE_TYPE_ICON[document.fileType];
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const panelRef = usePanelDismiss(true, onClose);

  return (
    <div className="fixed inset-0 z-40">
      <motion.button
        type="button"
        aria-label="Close document details"
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
        aria-label={`${document.name} details`}
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
          <div className="flex min-w-0 items-start gap-2">
            <FileIcon size={18} className="text-ink-muted mt-0.5 shrink-0" />
            <h2 className="font-display text-ink truncate text-lg font-semibold">
              {document.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close document details"
            className="text-ink-muted hover:bg-surface-sunken flex size-9 shrink-0 items-center justify-center rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-ink-muted text-xs">Space</dt>
            <dd className="text-ink mt-0.5 flex items-center gap-1.5 font-medium">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: space.colorDot }}
              />
              {space.name}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted text-xs">File type</dt>
            <dd className="text-ink mt-0.5 font-medium">
              {FILE_TYPE_LABEL[document.fileType]}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted text-xs">File size</dt>
            <dd className="text-ink mt-0.5 font-medium">
              {formatFileSize(document.fileSizeBytes)}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted text-xs">Updated</dt>
            <dd className="text-ink mt-0.5 font-medium">
              {formatRelativeDate(document.updatedAt)}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-ink-muted text-xs">Updated by</dt>
            <dd className="mt-1 flex items-center gap-2">
              <span className="bg-avatar-bg text-avatar-fg flex size-6 items-center justify-center rounded-full text-[10px] font-semibold">
                {document.updatedBy.avatarInitials}
              </span>
              <span className="text-ink font-medium">
                {document.updatedBy.name}
              </span>
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onOpenFile}
            className="bg-accent flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white"
          >
            <Download size={15} />
            Open / Download
          </button>
          {canManage && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onEditDetails}
                  className="border-border text-ink hover:bg-surface-sunken flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold"
                >
                  <Pencil size={14} />
                  Edit details
                </button>
                <button
                  type="button"
                  onClick={onReplaceFile}
                  className="border-border text-ink hover:bg-surface-sunken flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold"
                >
                  <RefreshCw size={14} />
                  Replace file
                </button>
              </div>
              {isConfirmingDelete ? (
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="border-border text-ink hover:bg-surface-sunken flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(document.id)}
                    className="bg-warn-bg text-warn-fg flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold"
                  >
                    <Trash2 size={14} />
                    Confirm delete
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="bg-warn-bg text-warn-fg mt-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
            </>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-ink text-sm font-semibold">
            Cited by the Assistant
          </h3>
          {citations.length === 0 ? (
            <div className="border-border text-ink-muted mt-2 flex min-h-24 items-center justify-center rounded-lg border border-dashed text-center text-sm">
              Not cited by the Assistant yet.
            </div>
          ) : (
            <ul className="divide-border border-border mt-2 divide-y overflow-hidden rounded-lg border">
              {citations.map((citation) => (
                <li key={citation.id} className="px-3 py-2.5">
                  <p className="text-ink text-sm font-medium">
                    {citation.question}
                  </p>
                  <p className="text-ink-muted mt-0.5 font-mono text-xs">
                    Last asked {formatRelativeDate(citation.lastAskedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
}
