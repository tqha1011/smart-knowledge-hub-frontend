// src/components/documentComponent/DocumentLibrary.tsx
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";
import { CategoryFilterChips } from "./CategoryFilterChips";
import { DocumentTable } from "./DocumentTable";
import { NeedsAttentionList } from "./NeedsAttentionList";
import { DocumentDetailPanel } from "./DocumentDetailPanel";
import { DocumentFormPanel } from "./DocumentFormPanel";
import { ResolveQuestionPanel } from "./ResolveQuestionPanel";
import { Pagination } from "../common/Pagination";
import { documentService } from "../../services/documentService";
import { categoryService } from "../../services/categoryService";
import { toErrorMessage } from "../../shared/handleApiError";
import type {
  CategoryDto,
  DocumentDetailsDto,
  DocumentListItemDto,
  Space,
  UnansweredQuestionData,
} from "../../types";
import type { ApiErrorResponse } from "../../types/commonType/apiResponse";

export type DocumentLibraryTab = "all" | "needs-attention";

interface DocumentLibraryProps {
  space: Space;
  /** isAdmin || Editor-in-this-Space — gates Upload, row actions, gap actions. */
  canManage: boolean;
  activeTab: DocumentLibraryTab;
  onTabChange: (tab: DocumentLibraryTab) => void;
  knowledgeGaps: UnansweredQuestionData[];
  /** Called after a question is resolved so the parent can refetch the queue (it also owns the sidebar/rail badge counts). */
  onGapsChanged: () => void;
  /** Bumped by the parent after the Assistant answers a question — triggers a refetch of the current page so a newly-cited document's count stays fresh. */
  refreshSignal: number;
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
  knowledgeGaps,
  onGapsChanged,
  refreshSignal,
}: DocumentLibraryProps) {
  const spacePublicId = space.id;

  const [documents, setDocuments] = useState<DocumentListItemDto[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    hasPrevious: false,
    hasNext: false,
  });
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);

  const [isFormPanelOpen, setIsFormPanelOpen] = useState(false);
  const [formPanelDocument, setFormPanelDocument] =
    useState<DocumentDetailsDto | null>(null);

  const [isResolvePanelOpen, setIsResolvePanelOpen] = useState(false);
  const [questionToResolve, setQuestionToResolve] =
    useState<UnansweredQuestionData | null>(null);

  // Reusable for the post-save refetch (called from an event handler, not
  // an effect) — the mount fetch below is written inline instead of
  // calling these, since calling a setState-bearing function from inside
  // an effect body trips react-hooks/set-state-in-effect.
  const loadDocuments = useCallback(
    async (page: number) => {
      try {
        const response = await documentService.getListDocumentsForUser(
          spacePublicId,
          page,
        );
        setDocuments(response.items);
        setPagination({
          totalPages: response.totalPages,
          hasPrevious: response.hasPrevious,
          hasNext: response.hasNext,
        });
      } catch (error) {
        toast.error(toErrorMessage(error as ApiErrorResponse));
      }
    },
    [spacePublicId],
  );

  const loadCategories = useCallback(async () => {
    try {
      const response = await categoryService.getListCategory(spacePublicId);
      setCategories(response);
    } catch (error) {
      toast.error(toErrorMessage(error as ApiErrorResponse));
    }
  }, [spacePublicId]);

  useEffect(() => {
    let isActive = true;
    documentService
      .getListDocumentsForUser(spacePublicId, pageNumber)
      .then((response) => {
        if (isActive) {
          setDocuments(response.items);
          setPagination({
            totalPages: response.totalPages,
            hasPrevious: response.hasPrevious,
            hasNext: response.hasNext,
          });
        }
      })
      .catch((error: ApiErrorResponse) => {
        if (isActive) toast.error(toErrorMessage(error));
      });
    return () => {
      isActive = false;
    };
  }, [spacePublicId, pageNumber, refreshSignal]);

  useEffect(() => {
    let isActive = true;
    categoryService
      .getListCategory(spacePublicId)
      .then((response) => {
        if (isActive) setCategories(response);
      })
      .catch((error: ApiErrorResponse) => {
        if (isActive) toast.error(toErrorMessage(error));
      });
    return () => {
      isActive = false;
    };
  }, [spacePublicId]);

  const categoryNames = Array.from(
    new Set(categories.map((category) => category.name)),
  ).sort();
  const filteredDocuments = activeCategory
    ? documents.filter((doc) => doc.category.name === activeCategory)
    : documents;

  const handleOpenDocument = (doc: DocumentListItemDto) => {
    setSelectedDocumentId(doc.publicId);
    setIsDetailPanelOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailPanelOpen(false);
  };

  const handleOpenUploadPanel = () => {
    setFormPanelDocument(null);
    setIsFormPanelOpen(true);
  };

  const handleEditDetails = (detail: DocumentDetailsDto) => {
    setIsDetailPanelOpen(false);
    setFormPanelDocument(detail);
    setIsFormPanelOpen(true);
  };

  const handleCloseFormPanel = () => {
    setIsFormPanelOpen(false);
  };

  // Clear the active category filter on a successful create/update so the
  // mutated document is guaranteed visible — otherwise a stale filter can
  // hide a just-created doc, or leave an edited doc's old category with no
  // matching documents (a misleading "empty" table).
  const handleFormSaved = () => {
    setPageNumber(1);
    loadDocuments(1);
    loadCategories();
    setActiveCategory(null);
  };

  const handleOpenResolve = (item: UnansweredQuestionData) => {
    setQuestionToResolve(item);
    setIsResolvePanelOpen(true);
  };

  const handleCloseResolvePanel = () => {
    setIsResolvePanelOpen(false);
  };

  const handleResolved = () => {
    setIsResolvePanelOpen(false);
    onGapsChanged();
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

      {activeTab === "all" && categoryNames.length > 0 && (
        <div className="mb-4">
          <CategoryFilterChips
            categories={categoryNames}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />
        </div>
      )}

      {activeTab === "all" ? (
        <>
          <DocumentTable
            documents={filteredDocuments}
            onOpenDocument={handleOpenDocument}
            canManage={canManage}
          />
          <Pagination
            pageNumber={pageNumber}
            totalPages={pagination.totalPages}
            hasPrevious={pagination.hasPrevious}
            hasNext={pagination.hasNext}
            onPageChange={setPageNumber}
          />
        </>
      ) : (
        <NeedsAttentionList
          items={knowledgeGaps}
          canManage={canManage}
          onOpenResolve={handleOpenResolve}
        />
      )}

      <DocumentDetailPanel
        documentPublicId={selectedDocumentId}
        isOpen={isDetailPanelOpen}
        space={space}
        canManage={canManage}
        onClose={handleCloseDetail}
        onEditDetails={handleEditDetails}
      />

      <DocumentFormPanel
        isOpen={isFormPanelOpen}
        document={formPanelDocument}
        spacePublicId={spacePublicId}
        categories={categories}
        onClose={handleCloseFormPanel}
        onSaved={handleFormSaved}
      />

      <ResolveQuestionPanel
        isOpen={isResolvePanelOpen}
        question={questionToResolve}
        spacePublicId={spacePublicId}
        onClose={handleCloseResolvePanel}
        onResolved={handleResolved}
      />
    </div>
  );
}
