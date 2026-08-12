export interface DocumentAuthor {
  name: string;
  avatarInitials: string;
}

export type DocumentFileType = "pdf" | "docx" | "markdown";

// Table row shape for the Document Library — no `status` field yet, since
// the design spec only shows the Processing/Ready/Failed badge in the
// Upload/Edit panel (a separate plan), not this table.
export interface DocumentSummary {
  id: string;
  spaceId: string;
  name: string;
  fileType: DocumentFileType;
  category: string;
  updatedBy: DocumentAuthor;
  /** ISO 8601 timestamp — formatted to a relative label in DocumentTable. */
  updatedAt: string;
  /** Raw file size in bytes — formatted to KB/MB in the Document detail panel. */
  fileSizeBytes: number;
  citationCount: number;
}

// A knowledge-gap queue item — logged automatically when the (not yet
// built) RAG Assistant has no confident source for a question.
export interface KnowledgeGapItem {
  id: string;
  spaceId: string;
  question: string;
  askedCount: number;
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
