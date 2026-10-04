import { Lock, MoreHorizontal } from "lucide-react";
import { Button } from "../common/Button";
import type { DocumentListItemDto } from "../../types";
import {
  FILE_TYPE_BADGE_CLASS,
  FILE_TYPE_ICON,
  STATUS_BADGE,
  formatRelativeDate,
  initialsFromName,
  splitDocumentName,
} from "./documentDisplay";

interface DocumentTableProps {
  documents: DocumentListItemDto[];
  onOpenDocument: (doc: DocumentListItemDto) => void;
  /** isAdmin || Editor-in-this-Space — gates the row (⋯) action menu. */
  canManage: boolean;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
}

// List/table view (spec: chosen over a card grid so category/owner/date/
// citation-count stay scannable and comparable at volume). Responsive
// column dropping — Updated by first, then Type and Category together —
// instead of horizontal scroll, per spec.
export function DocumentTable({
  documents,
  onOpenDocument,
  canManage,
  emptyMessage = "No documents in this space yet.",
  emptyActionLabel,
  onEmptyAction,
}: DocumentTableProps) {
  if (documents.length === 0) {
    return (
      <div className="border-border text-ink-muted flex min-h-48 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-6 text-center text-sm">
        <p>{emptyMessage}</p>
        {onEmptyAction && (
          <Button
            onClick={onEmptyAction}
            className="bg-accent text-on-accent rounded-sm px-4 py-2 font-semibold"
          >
            {emptyActionLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="border-border bg-surface overflow-hidden rounded-lg border">
      <table className="w-full table-fixed text-left text-sm">
        <thead className="bg-surface-sunken text-ink-muted text-xs">
          <tr>
            <th className="px-4 py-2.5 font-medium">Name</th>
            <th className="hidden w-16 px-3 py-3 font-medium sm:table-cell">
              Type
            </th>
            <th className="hidden w-28 px-3 py-3 font-medium sm:table-cell">
              Status
            </th>
            <th className="shell:table-cell hidden w-28 px-3 py-3 font-medium">
              Category
            </th>
            <th className="hidden w-36 px-3 py-3 font-medium xl:table-cell">
              Updated by
            </th>
            <th className="hidden w-28 px-4 py-3 font-medium xl:table-cell">
              Updated
            </th>
            <th className="hidden w-16 px-3 py-3 font-medium sm:table-cell">
              Cited
            </th>
            <th className="w-14 px-2 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {documents.map((doc) => {
            const Icon = FILE_TYPE_ICON[doc.fileType];
            const { baseName, extension } = splitDocumentName(doc.title);
            return (
              <tr key={doc.publicId} className="hover:bg-surface-sunken">
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onOpenDocument(doc)}
                    title={doc.title}
                    className="text-ink flex w-full min-w-0 items-center gap-2 text-left font-medium"
                  >
                    <Icon size={16} className="text-ink-muted shrink-0" />
                    <span className="truncate">{baseName}</span>
                    {doc.visibility === "Restricted" && (
                      <Lock
                        size={12}
                        className="text-ink-muted shrink-0"
                        role="img"
                        aria-label="Restricted access"
                      />
                    )}
                  </button>
                </td>
                <td className="hidden px-3 py-3 sm:table-cell">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${FILE_TYPE_BADGE_CLASS[doc.fileType]}`}
                  >
                    {extension}
                  </span>
                </td>
                <td className="hidden px-3 py-3 sm:table-cell">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_BADGE[doc.status].className}`}
                  >
                    {STATUS_BADGE[doc.status].label}
                  </span>
                </td>
                <td className="shell:table-cell hidden px-3 py-3">
                  <span
                    title={doc.category.name}
                    className="bg-surface-sunken text-ink-muted inline-block max-w-full truncate rounded-md px-2 py-1 align-middle text-xs font-medium"
                  >
                    {doc.category.name}
                  </span>
                </td>
                <td className="hidden px-3 py-3 xl:table-cell">
                  <div className="flex min-w-0 items-center gap-2">
                    {doc.updatedBy.avatarUrl ? (
                      <img
                        src={doc.updatedBy.avatarUrl}
                        alt=""
                        className="size-6 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="bg-avatar-bg text-avatar-fg flex size-6 items-center justify-center rounded-full text-[10px] font-semibold">
                        {initialsFromName(doc.updatedBy.name)}
                      </span>
                    )}
                    <span className="text-ink-muted truncate">
                      {doc.updatedBy.name}
                    </span>
                  </div>
                </td>
                <td className="text-ink-muted hidden px-3 py-3 xl:table-cell">
                  {formatRelativeDate(doc.lastUpdated)}
                </td>
                <td className="hidden px-3 py-3 sm:table-cell">
                  <span className="bg-citation-bg text-citation-fg rounded-full px-2 py-0.5 text-xs font-medium">
                    {doc.cited}
                  </span>
                </td>
                <td className="px-2 py-3">
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => onOpenDocument(doc)}
                      aria-label={`Actions for ${doc.title}`}
                      className="text-ink-muted hover:bg-surface flex size-8 items-center justify-center rounded-md"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
