import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "react-toastify";
import { useIsPresent } from "framer-motion";
import { documentService } from "../../services/documentService";
import { toErrorMessage } from "../../shared/handleApiError";
import type { ApiErrorResponse } from "../../types/commonType/apiResponse";
import type { TrashDocumentDto } from "../../types";
import { useResource } from "../common/useResource";
import { ResourceState } from "../common/ResourceState";
import { Pagination } from "../common/Pagination";
import { Button } from "../common/Button";
import {
  FILE_TYPE_ICON,
  FILE_TYPE_LABEL,
  STATUS_BADGE,
} from "./documentDisplay";

interface TrashDocumentListProps {
  spacePublicId: string;
  enabled: boolean;
  refreshSignal: number;
  onRestored: () => void;
  isCurrentSpace: () => boolean;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function TrashDate({ value }: { value: string }) {
  return <time dateTime={value}>{dateFormatter.format(new Date(value))}</time>;
}

// Kept mounted within its Space so tab switches preserve pagination and
// in-flight mutations. The resource only loads when Trash is first opened.
export function TrashDocumentList({
  spacePublicId,
  enabled,
  refreshSignal,
  onRestored,
  isCurrentSpace,
}: TrashDocumentListProps) {
  const [pageNumber, setPageNumber] = useState(1);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const mutationPending = useRef(false);
  const active = useRef(false);
  const isPresent = useIsPresent();
  useEffect(() => {
    active.current = isPresent;
    return () => {
      active.current = false;
    };
  }, [spacePublicId, isPresent]);

  const loader = useCallback(
    () => documentService.getTrashDocuments(spacePublicId, pageNumber, 20),
    [spacePublicId, pageNumber],
  );
  const resource = useResource(
    `trash:${spacePublicId}:${pageNumber}`,
    loader,
    refreshSignal,
    enabled,
  );
  const pagination = resource.data;
  useEffect(() => {
    if (!pagination) return;
    const lastPage = Math.max(1, pagination.totalPages);
    if (pageNumber <= lastPage) return;
    let current = true;
    void Promise.resolve().then(() => {
      if (current) setPageNumber(lastPage);
    });
    return () => {
      current = false;
    };
  }, [pagination, pageNumber]);

  const handleRestore = async (document: TrashDocumentDto) => {
    if (
      mutationPending.current ||
      resource.isLoading ||
      !enabled ||
      !isCurrentSpace()
    )
      return;
    mutationPending.current = true;
    setRestoringId(document.publicId);
    setMutationError(null);
    try {
      const restored = await documentService.restoreDocument(
        spacePublicId,
        document.publicId,
      );
      if (!active.current || !isCurrentSpace()) return;
      toast.success(
        restored.status === "Failed"
          ? "Document restored. Open it in All documents to retry processing."
          : "Document restored.",
      );
      onRestored();
      await resource.reload();
    } catch (error) {
      if (!active.current || !isCurrentSpace()) return;
      const apiError = error as ApiErrorResponse;
      setMutationError(toErrorMessage(apiError));
      if ([404, 409, 410].includes(apiError.statusCode))
        await resource.reload();
    } finally {
      mutationPending.current = false;
      if (active.current && isCurrentSpace()) setRestoringId(null);
    }
  };

  return (
    <div
      hidden={!enabled}
      role="tabpanel"
      id="library-view-trash"
      aria-labelledby="library-tab-trash"
    >
      <p className="text-ink-muted mb-4 text-sm">
        Restore documents before the deadline shown in your local time.
      </p>
      {mutationError && (
        <p
          role="alert"
          className="bg-warn-bg text-warn-fg mb-3 rounded-md px-4 py-3 text-sm break-words"
        >
          {mutationError}
        </p>
      )}
      <ResourceState
        isLoading={resource.isLoading}
        hasData={pagination !== null}
        error={resource.error}
        onRetry={() => {
          if (!mutationPending.current) void resource.reload();
        }}
      >
        {pagination?.items.length === 0 ? (
          <div className="border-border text-ink-muted flex min-h-48 items-center justify-center rounded-lg border border-dashed p-6 text-sm">
            Trash is empty.
          </div>
        ) : (
          <ul className="divide-border border-border bg-surface divide-y rounded-lg border">
            {pagination?.items.map((document) => {
              const Icon = FILE_TYPE_ICON[document.fileType];
              return (
                <li
                  key={document.publicId}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-ink flex items-start gap-2 font-semibold">
                      <Icon
                        size={18}
                        aria-hidden="true"
                        className="text-ink-muted mt-0.5 shrink-0"
                      />
                      <span className="min-w-0 break-words">
                        {document.title}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-ink-muted">
                        {FILE_TYPE_LABEL[document.fileType]}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${STATUS_BADGE[document.status].className}`}
                      >
                        {STATUS_BADGE[document.status].label}
                      </span>
                      <span className="bg-surface-sunken text-ink-muted rounded-full px-2 py-0.5 font-medium">
                        {document.visibility}
                      </span>
                    </div>
                    <dl className="mt-3 grid gap-2 text-sm lg:grid-cols-2">
                      <div className="text-ink-muted">
                        <dt className="inline">Deleted: </dt>
                        <dd className="inline">
                          <TrashDate value={document.deletedAt} />
                        </dd>
                      </div>
                      <div className="text-ink">
                        <dt className="inline font-semibold">
                          Restore before:{" "}
                        </dt>
                        <dd className="inline">
                          <TrashDate value={document.purgeAfter} />
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <Button
                    onClick={() => void handleRestore(document)}
                    disabled={restoringId !== null || resource.isLoading}
                    aria-label={`Restore ${document.title}`}
                    className="bg-accent-soft text-accent flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold sm:self-center"
                  >
                    <RotateCcw size={16} aria-hidden="true" />
                    {restoringId === document.publicId
                      ? "Restoring…"
                      : "Restore"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        {pagination && (
          <Pagination
            pageNumber={pagination.currentPage}
            totalPages={pagination.totalPages}
            hasPrevious={pagination.hasPrevious}
            hasNext={pagination.hasNext}
            disabled={restoringId !== null || resource.isLoading}
            onPageChange={setPageNumber}
          />
        )}
      </ResourceState>
    </div>
  );
}
