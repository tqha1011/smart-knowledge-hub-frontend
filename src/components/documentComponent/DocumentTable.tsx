import { MoreHorizontal } from "lucide-react";
import type { DocumentSummary } from "../../types";
import {
  FILE_TYPE_ICON,
  formatRelativeDate,
  splitDocumentName,
} from "./documentDisplay";

interface DocumentTableProps {
  documents: DocumentSummary[];
  onOpenDocument: (doc: DocumentSummary) => void;
  /** isAdmin || Editor-in-this-Space — gates the row (⋯) action menu. */
  canManage: boolean;
}

// List/table view (spec: chosen over a card grid so category/owner/date/
// citation-count stay scannable and comparable at volume). Responsive
// column dropping — Updated by first, then Type and Category together —
// instead of horizontal scroll, per spec.
export function DocumentTable({
  documents,
  onOpenDocument,
  canManage,
}: DocumentTableProps) {
  if (documents.length === 0) {
    return (
      <div className="border-border text-ink-muted flex min-h-48 items-center justify-center rounded-lg border border-dashed text-center text-sm">
        No documents in this space yet.
      </div>
    );
  }

  return (
    <div className="border-border overflow-hidden rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-sunken text-ink-muted text-xs">
          <tr>
            <th className="px-4 py-2.5 font-medium">Name</th>
            <th className="hidden px-4 py-2.5 font-medium sm:table-cell">
              Type
            </th>
            <th className="hidden px-4 py-2.5 font-medium sm:table-cell">
              Category
            </th>
            <th className="hidden px-4 py-2.5 font-medium lg:table-cell">
              Updated by
            </th>
            <th className="px-4 py-2.5 font-medium">Updated</th>
            <th className="px-4 py-2.5 font-medium">Cited</th>
            <th className="px-2 py-2.5">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {documents.map((doc) => {
            const Icon = FILE_TYPE_ICON[doc.fileType];
            const { baseName, extension } = splitDocumentName(doc.name);
            return (
              <tr key={doc.id} className="hover:bg-surface-sunken">
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onOpenDocument(doc)}
                    title={doc.name}
                    className="text-ink flex min-w-0 items-center gap-2 text-left font-medium"
                  >
                    <Icon size={16} className="text-ink-muted shrink-0" />
                    <span className="truncate">{baseName}</span>
                  </button>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span className="text-ink-muted font-mono text-xs whitespace-nowrap">
                    {extension}
                  </span>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span className="bg-surface-sunken text-ink-muted rounded-md px-2 py-1 text-xs font-medium">
                    {doc.category}
                  </span>
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="bg-avatar-bg text-avatar-fg flex size-6 items-center justify-center rounded-full text-[10px] font-semibold">
                      {doc.updatedBy.avatarInitials}
                    </span>
                    <span className="text-ink-muted truncate">
                      {doc.updatedBy.name}
                    </span>
                  </div>
                </td>
                <td className="text-ink-muted px-4 py-3 whitespace-nowrap">
                  {formatRelativeDate(doc.updatedAt)}
                </td>
                <td className="px-4 py-3">
                  <span className="bg-citation-bg text-citation-fg rounded-full px-2 py-0.5 font-mono text-xs font-medium">
                    {doc.citationCount}
                  </span>
                </td>
                <td className="px-2 py-3">
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => onOpenDocument(doc)}
                      aria-label={`Actions for ${doc.name}`}
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
