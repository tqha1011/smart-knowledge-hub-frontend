import { File, FileCode, FileText } from "lucide-react";
import type { DocumentFileType } from "../../types";

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
