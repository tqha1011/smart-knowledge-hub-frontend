import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";
import { CategoryFilterChips } from "./CategoryFilterChips";
import { DocumentTable } from "./DocumentTable";
import { NeedsAttentionList } from "./NeedsAttentionList";
import { DocumentDetailPanel } from "./DocumentDetailPanel";
import { mockDocumentCitations } from "../shell/shellMockData";
import type { DocumentSummary, KnowledgeGapItem, Space } from "../../types";

export type DocumentLibraryTab = "all" | "needs-attention";

interface DocumentLibraryProps {
  space: Space;
  /** isAdmin || Editor-in-this-Space — gates Upload, row actions, gap actions. */
  canManage: boolean;
  activeTab: DocumentLibraryTab;
  onTabChange: (tab: DocumentLibraryTab) => void;
  documents: DocumentSummary[];
  onDeleteDocument: (documentId: string) => void;
  knowledgeGaps: KnowledgeGapItem[];
  onResolveGap: (id: string) => void;
  onIgnoreGap: (id: string) => void;
}

// Page structure per spec: title + subtitle + Upload button, tabs, category
// chips (table view only), then either the document table or the
// knowledge-gap queue. Row clicks open the Document detail panel (this
// piece). Document creation/edit are a separate piece (Upload/Edit panel)
// not built yet, so the actions that would open that panel are toast stubs.
export function DocumentLibrary({
  space,
  canManage,
  activeTab,
  onTabChange,
  documents,
  onDeleteDocument,
  knowledgeGaps,
  onResolveGap,
  onIgnoreGap,
}: DocumentLibraryProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [selectedDocument, setSelectedDocument] =
    useState<DocumentSummary | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);

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

  const handleEditDetails = () => {
    toast.info("Edit document panel isn't built yet.");
  };

  const handleReplaceFile = () => {
    toast.info("Replace file isn't built yet.");
  };

  const handleDeleteDocument = (documentId: string) => {
    onDeleteDocument(documentId);
    setIsDetailPanelOpen(false);
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
            onClick={() => toast.info("Upload document panel isn't built yet.")}
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
    </div>
  );
}
