import { File, FileCode, FileText } from "lucide-react";
import type { DocumentFileType, DocumentStatus } from "../../types";

export const FILE_TYPE_ICON: Record<DocumentFileType, typeof FileText> = {
  PDF: FileText,
  DOCX: File,
  MD: FileCode,
  TXT: FileText,
};

export const FILE_TYPE_LABEL: Record<DocumentFileType, string> = {
  PDF: "PDF",
  DOCX: "Word document",
  MD: "Markdown",
  TXT: "Text",
};

// Color-codes the Type column so the three file types are distinguishable
// at a glance, not just by icon shape. Uses the --color-filetype-* tokens
// from src/index.css (same bg/fg pill pattern as STATUS_BADGE below).
export const FILE_TYPE_BADGE_CLASS: Record<DocumentFileType, string> = {
  PDF: "bg-filetype-pdf-bg text-filetype-pdf-fg",
  DOCX: "bg-filetype-docx-bg text-filetype-docx-fg",
  MD: "bg-filetype-markdown-bg text-filetype-markdown-fg",
  TXT: "bg-filetype-txt-bg text-filetype-txt-fg",
};

// Splits a document's display name at its last "." so the Document
// Library table can show the base name and file extension in separate
// columns (Name / Type) instead of repeating the extension in both.
export function splitDocumentName(name: string): {
  baseName: string;
  extension: string;
} {
  const lastDotIndex = name.lastIndexOf(".");
  if (lastDotIndex <= 0) {
    return { baseName: name, extension: "" };
  }
  return {
    baseName: name.slice(0, lastDotIndex),
    extension: name.slice(lastDotIndex + 1).toUpperCase(),
  };
}

export function formatRelativeDate(input: string | Date): string {
  const diffDays = Math.floor(
    (Date.now() - new Date(input).getTime()) / (1000 * 60 * 60 * 24),
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
  Processing: {
    label: "Processing",
    className: "bg-status-processing-bg text-status-processing-fg",
  },
  Ready: {
    label: "Ready",
    className: "bg-status-ready-bg text-status-ready-fg",
  },
  Failed: {
    label: "Failed",
    className: "bg-status-failed-bg text-status-failed-fg",
  },
};

// Spec's stated upload limit for the "Upload file" dropzone.
export const MAX_UPLOAD_FILE_SIZE_BYTES = 25 * 1024 * 1024;

const FILE_EXTENSION_TYPE: Record<string, DocumentFileType> = {
  pdf: "PDF",
  docx: "DOCX",
  txt: "TXT",
  md: "MD",
  markdown: "MD",
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

// Falls back to initials from a real name when a user has no avatarUrl —
// first + last initial, or the first two letters for a single-word name.
export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
