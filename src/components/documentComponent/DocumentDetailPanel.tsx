import { useResource } from "../common/useResource";
import { ResourceState } from "../common/ResourceState";
import { Button } from "../common/Button";
import { backdropMotion, panelMotion } from "../../shared/motion";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
} from "framer-motion";
import {
  Download,
  FileText,
  Lock,
  Pencil,
  RefreshCw,
  RotateCw,
  Trash2,
  X,
} from "lucide-react";
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
  /** Existing upload/edit permissions. Delete and restore use Space membership. */
  canManage: boolean;
  canDeleteAndRestore: boolean;
  sessionId: number;
  onDeleted: () => void;
  isCurrentSpace: () => boolean;
  onClose: () => void;
  onEditDetails: (document: DocumentDetailsDto) => void;
  onReplaceFile: (document: DocumentDetailsDto) => void;
  /** Called after a retry request succeeds so the parent can refetch the list (row status moves out of Failed). */
  onRetried: () => void;
  /** Bumped by the parent on a realtime status update for this document, so an already-open panel picks up the new status without the user closing/reopening it. */
  refreshSignal?: number;
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
  canDeleteAndRestore,
  sessionId,
  onDeleted,
  isCurrentSpace,
  onClose,
  onEditDetails,
  onReplaceFile,
  onRetried,
  refreshSignal,
}: DocumentDetailPanelProps) {
  const prefersReducedMotion = useReducedMotion();
  const mutationPending = useRef(false);
  const [isMutating, setIsMutating] = useState(false);
  const beginMutation = () => {
    if (mutationPending.current) return false;
    mutationPending.current = true;
    setIsMutating(true);
    return true;
  };
  const endMutation = () => {
    mutationPending.current = false;
    setIsMutating(false);
  };

  return (
    <AnimatePresence>
      {isOpen && documentPublicId && (
        <DocumentDetailPanelBody
          key={`${space.id}:${documentPublicId}:${sessionId}`}
          documentPublicId={documentPublicId}
          space={space}
          canManage={canManage}
          canDeleteAndRestore={canDeleteAndRestore}
          onDeleted={onDeleted}
          isCurrentSpace={isCurrentSpace}
          isMutating={isMutating}
          beginMutation={beginMutation}
          endMutation={endMutation}
          onClose={onClose}
          onEditDetails={onEditDetails}
          onReplaceFile={onReplaceFile}
          onRetried={onRetried}
          refreshSignal={refreshSignal}
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
  canDeleteAndRestore: boolean;
  onDeleted: () => void;
  isCurrentSpace: () => boolean;
  isMutating: boolean;
  beginMutation: () => boolean;
  endMutation: () => void;
  onClose: () => void;
  onEditDetails: (document: DocumentDetailsDto) => void;
  onReplaceFile: (document: DocumentDetailsDto) => void;
  onRetried: () => void;
  refreshSignal?: number;
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
  canDeleteAndRestore,
  onDeleted,
  isCurrentSpace,
  isMutating,
  beginMutation,
  endMutation,
  onClose,
  onEditDetails,
  onReplaceFile,
  onRetried,
  refreshSignal,
  prefersReducedMotion,
}: DocumentDetailPanelBodyProps) {
  const detailLoader = useCallback(
    () => documentService.getDocumentDetails(documentPublicId, space.id),
    [documentPublicId, space.id],
  );
  const detailResource = useResource(
    `detail:${space.id}:${documentPublicId}`,
    detailLoader,
    refreshSignal,
  );
  const document = detailResource.data;
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const isPresent = useIsPresent();
  const active = useRef(false);
  useEffect(() => {
    active.current = isPresent;
    return () => {
      active.current = false;
    };
  }, [isPresent]);
  const panelRef = usePanelDismiss(true, onClose, false, () =>
    window.document.getElementById("library-tab-all"),
  );

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

  const handleDelete = async () => {
    if (
      !canDeleteAndRestore ||
      !active.current ||
      !isCurrentSpace() ||
      !beginMutation()
    )
      return;
    setIsDeleting(true);
    setMutationError(null);
    try {
      await documentService.deleteDocument(space.id, documentPublicId);
      onDeleted();
    } catch (error) {
      if (active.current && isCurrentSpace())
        setMutationError(toErrorMessage(error as ApiErrorResponse));
    } finally {
      endMutation();
      if (active.current && isCurrentSpace()) setIsDeleting(false);
    }
  };

  const handleRetry = async () => {
    if (
      !(canManage || canDeleteAndRestore) ||
      !active.current ||
      !isCurrentSpace() ||
      !beginMutation()
    )
      return;
    setIsRetrying(true);
    setMutationError(null);
    try {
      await documentService.retryIngestionDocument(space.id, documentPublicId);
      if (active.current && isCurrentSpace()) {
        toast.success("Retry started. Reprocessing this document.");
        void detailResource.reload();
      }
      onRetried();
    } catch (error) {
      if (active.current && isCurrentSpace())
        setMutationError(toErrorMessage(error as ApiErrorResponse));
    } finally {
      endMutation();
      if (active.current && isCurrentSpace()) setIsRetrying(false);
    }
  };

  const FileIcon = document ? FILE_TYPE_ICON[document.fileType] : FileText;

  return (
    <div className="fixed inset-0 z-40">
      <motion.button
        type="button"
        aria-label="Close document details"
        {...backdropMotion(prefersReducedMotion)}
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={document ? `${document.title} details` : "Document details"}
        {...panelMotion(prefersReducedMotion)}
        className="overlay-panel bg-surface absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col overflow-y-auto p-5 shadow-lg"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2">
            <FileIcon size={18} className="text-ink-muted mt-0.5 shrink-0" />
            <h2 className="font-display text-ink text-xl font-semibold break-words">
              {document?.title ?? "Document details"}
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

        <ResourceState
          isLoading={detailResource.isLoading}
          hasData={document !== null}
          error={detailResource.error}
          onRetry={detailResource.reload}
          kind="detail"
        >
          {document && (
            <>
              {document.description && (
                <p className="text-ink-muted mb-4 text-sm">
                  {document.description}
                </p>
              )}

              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-ink-muted text-xs">Space</dt>
                  <dd className="text-ink mt-0.5 flex items-center gap-1.5 font-medium">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: space.colorDot }}
                    />
                    <span className="min-w-0 break-words">{space.name}</span>
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
                  <dt className="text-ink-muted text-xs">Category</dt>
                  <dd className="text-ink mt-0.5 font-medium break-words">
                    {document.category.name}
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
                <Button
                  type="button"
                  onClick={handleOpenFile}
                  disabled={isMutating}
                  className="bg-accent text-on-accent flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold"
                >
                  <Download size={15} />
                  Open / Download
                </Button>
                {(canManage || canDeleteAndRestore) &&
                  document.status === "Failed" && (
                    <button
                      type="button"
                      onClick={handleRetry}
                      disabled={isMutating}
                      className="bg-warn-bg text-warn-fg flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold disabled:opacity-60"
                    >
                      <RotateCw
                        size={14}
                        className={isRetrying ? "animate-spin" : undefined}
                      />
                      {isRetrying ? "Retrying…" : "Retry processing"}
                    </button>
                  )}
                {canManage && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onEditDetails(document)}
                        disabled={isMutating}
                        className="border-border text-ink hover:bg-surface-sunken flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold"
                      >
                        <Pencil size={14} />
                        Edit details
                      </button>
                      <button
                        type="button"
                        onClick={() => onReplaceFile(document)}
                        disabled={isMutating}
                        className="border-border text-ink hover:bg-surface-sunken flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold"
                      >
                        <RefreshCw size={14} />
                        Replace file
                      </button>
                    </div>
                  </>
                )}
                {mutationError && (
                  <p
                    role="alert"
                    className="bg-warn-bg text-warn-fg rounded-md px-3 py-2 text-sm break-words"
                  >
                    {mutationError}
                  </p>
                )}
                {canDeleteAndRestore && (
                  <>
                    {isConfirmingDelete ? (
                      <div className="mt-1 space-y-3">
                        <p className="text-ink-muted text-sm">
                          Move this document to Trash? You can restore it before
                          the restore deadline shown in Trash.
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setIsConfirmingDelete(false)}
                            disabled={isMutating}
                            className="border-border text-ink hover:bg-surface-sunken flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isMutating}
                            className="bg-warn-bg text-warn-fg flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold"
                          >
                            <Trash2 size={14} />
                            {isDeleting ? "Deleting…" : "Confirm delete"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(true)}
                        disabled={isMutating}
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
                        <p className="text-ink-muted mt-0.5 text-xs">
                          Last asked {formatRelativeDate(citation.lastAsked)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </ResourceState>
      </motion.div>
    </div>
  );
}
