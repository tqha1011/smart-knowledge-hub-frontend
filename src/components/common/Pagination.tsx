import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  pageNumber: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({
  pageNumber,
  totalPages,
  hasPrevious,
  hasNext,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between">
      <button
        type="button"
        disabled={!hasPrevious}
        onClick={() => onPageChange(pageNumber - 1)}
        className="text-ink-muted hover:bg-surface-sunken flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium disabled:opacity-40"
      >
        <ChevronLeft size={14} />
        Previous
      </button>
      <span className="text-ink-muted text-xs">
        Page {pageNumber} of {totalPages}
      </span>
      <button
        type="button"
        disabled={!hasNext}
        onClick={() => onPageChange(pageNumber + 1)}
        className="text-ink-muted hover:bg-surface-sunken flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium disabled:opacity-40"
      >
        Next
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
