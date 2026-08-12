import { File, FileCode, FileText } from "lucide-react";
import type { DocumentFileType, DocumentStatus } from "../../types";

export const FILE_TYPE_ICON: Record<DocumentFileType, typeof FileText> = {
  pdf: FileText,
  docx: File,
  markdown: FileCode,
};

export const FILE_TYPE_LABEL: Record<DocumentFileType, string> = {
  pdf: "PDF",
  docx: "Word document",
  markdown: "Markdown",
};

export function formatRelativeDate(iso: string): string {
  const diffDays = Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
}

// Formats a raw byte count as a human-readable KB/MB label for the
// Document detail panel's file-size field.
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Label + Tailwind class pair for each document processing status, shown
// as a read-only badge next to the Upload/Edit panel's title in Edit mode.
// Uses the design tokens already defined in src/index.css for exactly this
// purpose (--color-status-ready-bg/fg etc.) — this is the first plan to
// actually reference them.
export const STATUS_BADGE: Record<
  DocumentStatus,
  { label: string; className: string }
> = {
  processing: {
    label: "Processing",
    className: "bg-status-processing-bg text-status-processing-fg",
  },
  ready: {
    label: "Ready",
    className: "bg-status-ready-bg text-status-ready-fg",
  },
  failed: {
    label: "Failed",
    className: "bg-status-failed-bg text-status-failed-fg",
  },
};

// Spec's stated upload limit for the "Upload file" dropzone.
export const MAX_UPLOAD_FILE_SIZE_BYTES = 25 * 1024 * 1024;

const FILE_EXTENSION_TYPE: Record<string, DocumentFileType> = {
  pdf: "pdf",
  docx: "docx",
  md: "markdown",
  markdown: "markdown",
};

// Derives a DocumentFileType from a file name's extension, or null if the
// extension isn't one of the three types this app accepts for upload.
export function fileTypeFromFileName(
  fileName: string,
): DocumentFileType | null {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (!extension) return null;
  return FILE_EXTENSION_TYPE[extension] ?? null;
}
