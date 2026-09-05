export interface DocumentAuthor {
  name: string;
  avatarInitials: string;
}

export type DocumentFileType = "PDF" | "DOCX" | "MD" | "TXT";

export type DocumentStatus = "Processing" | "Ready" | "Failed";

export type DocumentVisibility = "Public" | "Restricted";

export type DocumentPermission = "Read" | "Edit" | "Manage";

// Table row shape for the Document Library.
export interface DocumentSummary {
  id: string;
  spaceId: string;
  name: string;
  fileType: DocumentFileType;
  category: string;
  description: string;
  status: DocumentStatus;
  updatedBy: DocumentAuthor;
  /** ISO 8601 timestamp — formatted to a relative label in DocumentTable. */
  updatedAt: string;
  /** Raw file size in bytes — formatted to KB/MB in the Document detail panel. */
  fileSizeBytes: number;
  citationCount: number;
  visibility: DocumentVisibility;
  /** Emails allowed to view this document — only meaningful when visibility is "restricted"; empty when "public". */
  restrictedEmails: string[];
}

// One question the RAG Assistant has answered using a specific document.
// The Document detail panel's "Cited by the Assistant" list is built from
// these; a document's citationCount (shown in the Document Library table)
// is the sum of askedCount across its DocumentCitation entries, so the two
// can't drift out of sync (see shellMockData.ts's countCitations helper).
export interface DocumentCitation {
  id: string;
  documentId: string;
  question: string;
  askedCount: number;
  /** ISO 8601 timestamp of the most recent time this question was asked. */
  lastAskedAt: string;
}

// Payload submitted by the Upload/Edit panel when creating a brand-new
// document (Upload entry point). fileType/fileSizeBytes come from the
// chosen file (Upload file mode) or are derived client-side from the
// typed content (Write content mode) — see DocumentFormPanel.
export interface NewDocumentInput {
  name: string;
  category: string;
  description: string;
  fileType: DocumentFileType;
  fileSizeBytes: number;
  visibility: DocumentVisibility;
  restrictedEmails: string[];
}

// Payload submitted by the Upload/Edit panel when editing an existing
// document's details (Edit entry point, from the Document detail panel's
// "Edit details" action). File content/type is not editable here — that's
// the separate, still-stubbed "Replace file" action.
export interface DocumentUpdateInput {
  name?: string | null;
  content?: string | null;
  categoryPublicId?: string | null;
  description?: string | null;
  visibility?: DocumentVisibility | null;
}

export interface DocumentUploadUrlResponse {
  uploadUrl: string;
  storageKey: string;
  expiresAt: Date;
}

export interface DocumentUploadUrlRequest {
  fileName: string;
  contentType: string;
  fileSize: number;
}

export interface DocumentDownloadUrlResponse {
  downloadUrl: string;
}

export type DocumentDownloadDisposition = "inline" | "attachment";

export interface DocumentCreateRequest {
  name: string;
  description: string | null;
  content: string | null;
  categoryPublicId: string;
  storageKey: string; // get from upload url response
  visibility: DocumentVisibility;
}

export interface DocumentListItemDto {
  publicId: string;
  title: string;
  fileType: DocumentFileType;
  visibility: DocumentVisibility;
  lastUpdated: Date;
  category: {
    publicId: string;
    name: string;
  };
  updatedBy: {
    publicId: string;
    name: string;
    avatarUrl: string | null;
  };
  cited: number;
}

export interface DocumentDetailsDto {
  publicId: string;
  title: string;
  description: string | null;
  visibility: DocumentVisibility;
  status: DocumentStatus;
  fileType: DocumentFileType;
  fileSize: number;
  content: string;
  lastUpdated: Date;
  category: {
    publicId: string;
    name: string;
  };
  updatedBy: {
    publicId: string;
    name: string;
    avatarUrl: string | null;
  };
  citedQuestion: {
    publicId: string;
    name: string;
    lastAsked: Date;
  }[];

  permissions: {
    userPublicId: string;
    email: string;
    permission: DocumentPermission;
  }[];
}

export interface DocumentPermissionRequest {
  userPublicId: string;
  permission: DocumentPermission;
}

export interface DocumentPermissionRequestBody {
  permissions: DocumentPermissionRequest[];
}
