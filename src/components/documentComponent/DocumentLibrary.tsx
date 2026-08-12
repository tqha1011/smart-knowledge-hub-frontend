// src/components/documentComponent/DocumentLibrary.tsx
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";
import { CategoryFilterChips } from "./CategoryFilterChips";
import { DocumentTable } from "./DocumentTable";
import { NeedsAttentionList } from "./NeedsAttentionList";
import { DocumentDetailPanel } from "./DocumentDetailPanel";
import { DocumentFormPanel } from "./DocumentFormPanel";
import { mockDocumentCitations } from "../shell/shellMockData";
import type {
  DocumentSummary,
  DocumentUpdateInput,
  KnowledgeGapItem,
  NewDocumentInput,
  Space,
} from "../../types";

export type DocumentLibraryTab = "all" | "needs-attention";

interface DocumentLibraryProps {
  space: Space;
  /** isAdmin || Editor-in-this-Space — gates Upload, row actions, gap actions. */
  canManage: boolean;
  activeTab: DocumentLibraryTab;
  onTabChange: (tab: DocumentLibraryTab) => void;
  documents: DocumentSummary[];
  onDeleteDocument: (documentId: string) => void;
  onCreateDocument: (input: NewDocumentInput) => void;
  onUpdateDocument: (documentId: string, updates: DocumentUpdateInput) => void;
  knowledgeGaps: KnowledgeGapItem[];
  onResolveGap: (id: string) => void;
  onIgnoreGap: (id: string) => void;
}

// Page structure per spec: title + subtitle + Upload button, tabs, category
// chips (table view only), then either the document table or the
// knowledge-gap queue. Row clicks open the Document detail panel. Upload
// and "Edit details" both open the shared Upload/Edit form panel — Upload
// in create mode, Edit details in edit mode for whichever document the
// detail panel had open (closing the detail panel first, not stacking two
// overlays).
export function DocumentLibrary({
  space,
  canManage,
  activeTab,
  onTabChange,
  documents,
  onDeleteDocument,
  onCreateDocument,
  onUpdateDocument,
  knowledgeGaps,
  onResolveGap,
  onIgnoreGap,
}: DocumentLibraryProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [selectedDocument, setSelectedDocument] =
    useState<DocumentSummary | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);

  const [isFormPanelOpen, setIsFormPanelOpen] = useState(false);
  const [formPanelDocument, setFormPanelDocument] =
    useState<DocumentSummary | null>(null);

  const categories = Array.from(
    new Set(documents.map((doc) => doc.category)),
  ).sort();
  const filteredDocuments = activeCategory
    ? documents.filter((doc) => doc.category === activeCategory)
    : documents;

  const citationsForSelected = selectedDocument
    ? mockDocumentCitations.filter(
        (citation) => citation.documentId === selectedDocument.id,
      )
    : [];

  const handleOpenDocument = (doc: DocumentSummary) => {
    setSelectedDocument(doc);
    setIsDetailPanelOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailPanelOpen(false);
  };

  const handleOpenFile = () => {
    toast.info("Opening the file isn't wired to a backend yet.");
  };

  const handleOpenUploadPanel = () => {
    setFormPanelDocument(null);
    setIsFormPanelOpen(true);
  };

  const handleEditDetails = () => {
    setIsDetailPanelOpen(false);
    setFormPanelDocument(selectedDocument);
    setIsFormPanelOpen(true);
  };

  const handleCloseFormPanel = () => {
    setIsFormPanelOpen(false);
  };

  const handleReplaceFile = () => {
    toast.info("Replace file isn't built yet.");
  };

  const handleDeleteDocument = (documentId: string) => {
    onDeleteDocument(documentId);
    setIsDetailPanelOpen(false);
  };

  // Clear the active category filter on a successful create/update so the
  // mutated document is guaranteed visible — otherwise a stale filter can
  // hide a just-created doc, or leave an edited doc's old category with no
  // matching documents (a misleading "empty" table).
  const handleFormCreate = (input: NewDocumentInput) => {
    onCreateDocument(input);
    setActiveCategory(null);
  };

  const handleFormUpdate = (
    documentId: string,
    updates: DocumentUpdateInput,
  ) => {
    onUpdateDocument(documentId, updates);
    setActiveCategory(null);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-ink text-3xl font-semibold">
            Documents
          </h1>
          <p className="text-ink-muted mt-1 text-sm">
            {space.name} · {documents.length} document
            {documents.length === 1 ? "" : "s"} · {knowledgeGaps.length} need
            attention
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={handleOpenUploadPanel}
            className="bg-accent flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white"
          >
            <Plus size={16} />
            Upload document
          </button>
        )}
      </div>

      <div className="border-border mb-4 flex gap-1 border-b">
        {(
          [
            { key: "all", label: "All documents" },
            { key: "needs-attention", label: "Needs attention" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onTabChange(key)}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold ${
              activeTab === key
                ? "border-accent text-accent"
                : "text-ink-muted hover:text-ink border-transparent"
            }`}
          >
            {label}
            {key === "needs-attention" && knowledgeGaps.length > 0 && (
              <span className="bg-warn-bg text-warn-fg rounded-full px-1.5 py-0.5 font-mono text-[11px] font-medium">
                {knowledgeGaps.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "all" && categories.length > 0 && (
        <div className="mb-4">
          <CategoryFilterChips
            categories={categories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />
        </div>
      )}

      {activeTab === "all" ? (
        <DocumentTable
          documents={filteredDocuments}
          onOpenDocument={handleOpenDocument}
          canManage={canManage}
        />
      ) : (
        <NeedsAttentionList
          items={knowledgeGaps}
          canManage={canManage}
          onResolve={onResolveGap}
          onIgnore={onIgnoreGap}
        />
      )}

      <DocumentDetailPanel
        document={selectedDocument}
        isOpen={isDetailPanelOpen}
        space={space}
        canManage={canManage}
        citations={citationsForSelected}
        onClose={handleCloseDetail}
        onOpenFile={handleOpenFile}
        onEditDetails={handleEditDetails}
        onReplaceFile={handleReplaceFile}
        onDelete={handleDeleteDocument}
      />

      <DocumentFormPanel
        isOpen={isFormPanelOpen}
        document={formPanelDocument}
        categories={categories}
        onClose={handleCloseFormPanel}
        onCreate={handleFormCreate}
        onUpdate={handleFormUpdate}
      />
    </div>
  );
}
