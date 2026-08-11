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
