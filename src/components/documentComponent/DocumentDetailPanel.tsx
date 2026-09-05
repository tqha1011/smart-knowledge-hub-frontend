import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Download, Lock, Pencil, RefreshCw, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import type { DocumentDetailsDto, Space } from "../../types";
import {
  FILE_TYPE_ICON,
  FILE_TYPE_LABEL,
  STATUS_BADGE,
  formatFileSize,
  formatRelativeDate,
  initialsFromName,
} from "./documentDisplay";
import { usePanelDismiss } from "../common/usePanelDismiss";
import { MarkdownMessage } from "../common/MarkdownMessage";
import { documentService } from "../../services/documentService";
import { toErrorMessage } from "../../shared/handleApiError";
import type { ApiErrorResponse } from "../../types/commonType/apiResponse";

interface DocumentDetailPanelProps {
  documentPublicId: string | null;
  isOpen: boolean;
  space: Space;
  /** isAdmin || Editor-in-this-Space — gates Edit details / Replace file / Delete. */
  canManage: boolean;
  onClose: () => void;
  onEditDetails: (document: DocumentDetailsDto) => void;
  onReplaceFile: (document: DocumentDetailsDto) => void;
}

// Floating slide-over panel (420px, right-aligned), same pattern as
// AskAiPanel — dims/blurs the page behind it, closes back to exactly
// where the user was. Metadata + actions only, no embedded file preview
// (spec deliberately defers a PDF/doc viewer) and no version history.
export function DocumentDetailPanel({
  documentPublicId,
  isOpen,
  space,
  canManage,
  onClose,
  onEditDetails,
  onReplaceFile,
}: DocumentDetailPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && documentPublicId && (
        <DocumentDetailPanelBody
          documentPublicId={documentPublicId}
          space={space}
          canManage={canManage}
          onClose={onClose}
          onEditDetails={onEditDetails}
          onReplaceFile={onReplaceFile}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
    </AnimatePresence>
  );
}

interface DocumentDetailPanelBodyProps {
  documentPublicId: string;
  space: Space;
  canManage: boolean;
  onClose: () => void;
  onEditDetails: (document: DocumentDetailsDto) => void;
  onReplaceFile: (document: DocumentDetailsDto) => void;
  prefersReducedMotion: boolean | null;
}

// Split out from DocumentDetailPanel so it only mounts while `isOpen` is
// true — its own useEffect fetches fresh detail on every open instead of
// relying on a stale object passed down from a list row (the list only
// carries DocumentListItemDto, which lacks content/status/permissions).
function DocumentDetailPanelBody({
  documentPublicId,
  space,
  canManage,
  onClose,
  onEditDetails,
  onReplaceFile,
  prefersReducedMotion,
}: DocumentDetailPanelBodyProps) {
  const [document, setDocument] = useState<DocumentDetailsDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const panelRef = usePanelDismiss(true, onClose);

  useEffect(() => {
    let cancelled = false;
    documentService
      .getDocumentDetails(documentPublicId, space.id)
      .then((detail) => {
        if (!cancelled) setDocument(detail);
      })
      .catch((error: ApiErrorResponse) => {
        if (!cancelled) toast.error(toErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [documentPublicId, space.id]);

  const handleOpenFile = () => {
    const newTab = window.open("", "_blank");
    if (newTab) newTab.opener = null;
    documentService
      .getDownloadUrl(documentPublicId, space.id, "inline")
      .then((url) => {
        if (newTab) {
          newTab.location.href = url;
        } else {
          toast.error("Popup blocked. Allow popups for this site to download.");
        }
      })
      .catch((error) => {
        newTab?.close();
        toast.error(toErrorMessage(error as ApiErrorResponse));
      });
  };

  const handleDelete = () => {
    toast.info("Deleting documents isn't available yet.");
    setIsConfirmingDelete(false);
  };

  if (isLoading || !document) {
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
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.22,
            ease: "easeOut",
          }}
          className="bg-surface text-ink-muted absolute inset-y-0 right-0 flex w-full max-w-[420px] items-center justify-center p-5 text-sm shadow-lg"
        >
          Loading…
        </motion.div>
      </div>
    );
  }

  const FileIcon = FILE_TYPE_ICON[document.fileType];

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
        aria-label={`${document.title} details`}
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
              {document.title}
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

        {document.description && (
          <p className="text-ink-muted mb-4 text-sm">{document.description}</p>
        )}

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
            <dt className="text-ink-muted text-xs">Status</dt>
            <dd className="mt-0.5">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_BADGE[document.status].className}`}
              >
                {STATUS_BADGE[document.status].label}
              </span>
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
              {formatFileSize(document.fileSize)}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted text-xs">Updated</dt>
            <dd className="text-ink mt-0.5 font-medium">
              {formatRelativeDate(document.lastUpdated)}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted text-xs">Visibility</dt>
            <dd className="text-ink mt-0.5 flex items-center gap-1 font-medium">
              {document.visibility === "Restricted" && (
                <Lock size={12} className="text-ink-muted" />
              )}
              {document.visibility}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-ink-muted text-xs">Updated by</dt>
            <dd className="mt-1 flex items-center gap-2">
              {document.updatedBy.avatarUrl ? (
                <img
                  src={document.updatedBy.avatarUrl}
                  alt=""
                  className="size-6 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="bg-avatar-bg text-avatar-fg flex size-6 items-center justify-center rounded-full text-[10px] font-semibold">
                  {initialsFromName(document.updatedBy.name)}
                </span>
              )}
              <span className="text-ink font-medium">
                {document.updatedBy.name}
              </span>
            </dd>
          </div>
        </dl>

        {document.visibility === "Restricted" && (
          <div className="mt-4">
            <p className="text-ink-muted text-xs">Visible to</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {document.permissions.map((permission) => (
                <span
                  key={permission.userPublicId}
                  className="bg-surface-sunken text-ink rounded-full px-2 py-0.5 text-xs font-medium"
                >
                  {permission.email} · {permission.permission}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleOpenFile}
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
                  onClick={() => onEditDetails(document)}
                  className="border-border text-ink hover:bg-surface-sunken flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold"
                >
                  <Pencil size={14} />
                  Edit details
                </button>
                <button
                  type="button"
                  onClick={() => onReplaceFile(document)}
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
                    onClick={handleDelete}
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
          {document.citedQuestion.length === 0 ? (
            <div className="border-border text-ink-muted mt-2 flex min-h-24 items-center justify-center rounded-lg border border-dashed text-center text-sm">
              Not cited by the Assistant yet.
            </div>
          ) : (
            <ul className="divide-border border-border mt-2 divide-y overflow-hidden rounded-lg border">
              {document.citedQuestion.map((citation) => (
                <li key={citation.publicId} className="px-3 py-2.5">
                  <MarkdownMessage
                    text={citation.name}
                    className="text-ink text-sm font-medium"
                  />
                  <p className="text-ink-muted mt-0.5 font-mono text-xs">
                    Last asked {formatRelativeDate(citation.lastAsked)}
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
