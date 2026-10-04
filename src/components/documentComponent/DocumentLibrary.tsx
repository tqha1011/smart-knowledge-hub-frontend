import { toast } from "react-toastify";
import { motion, useReducedMotion } from "framer-motion";
import { fadeMotion, indicatorTransition } from "../../shared/motion";
import { useResource } from "../common/useResource";
import { ResourceState, LoadError } from "../common/ResourceState";
import { Button } from "../common/Button";
// src/components/documentComponent/DocumentLibrary.tsx
import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { CategoryFilterChips } from "./CategoryFilterChips";
import { DocumentTable } from "./DocumentTable";
import { NeedsAttentionList } from "./NeedsAttentionList";
import { DocumentDetailPanel } from "./DocumentDetailPanel";
import { DocumentFormPanel } from "./DocumentFormPanel";
import { ReplaceFilePanel } from "./ReplaceFilePanel";
import { ResolveQuestionPanel } from "./ResolveQuestionPanel";
import { Pagination } from "../common/Pagination";
import { useDocumentStatusUpdates } from "../common/useDocumentStatusUpdates";
import { documentService } from "../../services/documentService";
import { categoryService } from "../../services/categoryService";
import type {
  DocumentDetailsDto,
  DocumentListItemDto,
  DocumentStatusUpdatedPayload,
  Space,
  UnansweredQuestionData,
} from "../../types";

export type DocumentLibraryTab = "all" | "needs-attention";

interface DocumentLibraryProps {
  space: Space;
  /** isAdmin || Editor-in-this-Space — gates Upload, row actions, gap actions. */
  canManage: boolean;
  searchQuery: string;
  searchRevision: number;
  onClearSearch: () => void;
  activeTab: DocumentLibraryTab;
  onTabChange: (tab: DocumentLibraryTab) => void;
  knowledgeGaps: UnansweredQuestionData[];
  knowledgeGapsLoading: boolean;
  knowledgeGapsError: string | null;
  knowledgeGapsLoaded: boolean;
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
  searchQuery,
  searchRevision,
  onClearSearch,
  activeTab,
  onTabChange,
  knowledgeGaps,
  knowledgeGapsLoading,
  knowledgeGapsError,
  knowledgeGapsLoaded,
  onGapsChanged,
  refreshSignal,
}: DocumentLibraryProps) {
  const spacePublicId = space.id;

  const reduced = useReducedMotion();
  // A new search (including resubmitting it) starts at page one immediately.
  // Keep pagination keyed to the search instead of briefly fetching its old page.
  const listKey = JSON.stringify([spacePublicId, searchQuery, searchRevision]);
  const [pageState, setPageState] = useState({ key: listKey, page: 1 });
  const pageNumber = pageState.key === listKey ? pageState.page : 1;
  const setPageNumber = (page: number) => setPageState({ key: listKey, page });
  const documentsLoader = useCallback(
    async () =>
      searchQuery
        ? documentService.searchDocumentsForUser(
            spacePublicId,
            searchQuery,
            pageNumber,
          )
        : documentService.getListDocumentsForUser(spacePublicId, pageNumber),
    [spacePublicId, pageNumber, searchQuery],
  );
  const documentsResource = useResource(
    `documents:${listKey}:${pageNumber}`,
    documentsLoader,
    refreshSignal,
  );
  const documents = documentsResource.data?.items ?? [];
  const pagination = documentsResource.data ?? {
    totalPages: 1,
    hasPrevious: false,
    hasNext: false,
  };
  const categoriesLoader = useCallback(
    () => categoryService.getListCategory(spacePublicId),
    [spacePublicId],
  );
  const categoriesResource = useResource(
    `categories:${spacePublicId}`,
    categoriesLoader,
  );
  const categories = categoriesResource.data ?? [];
  const loadCategories = categoriesResource.reload;
  const reloadDocuments = documentsResource.reload;
  const loadDocuments = useCallback(
    (page: number) => {
      if (page !== pageNumber) setPageState({ key: listKey, page });
      else void reloadDocuments();
    },
    [listKey, pageNumber, reloadDocuments],
  );
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  // Bumped on a realtime status update for the currently-open document, so
  // DocumentDetailPanel refetches instead of showing a stale status badge.
  const [detailRefreshSignal, setDetailRefreshSignal] = useState(0);

  const [isFormPanelOpen, setIsFormPanelOpen] = useState(false);
  const [formPanelDocument, setFormPanelDocument] =
    useState<DocumentDetailsDto | null>(null);

  const [isReplacePanelOpen, setIsReplacePanelOpen] = useState(false);
  const [replaceDocument, setReplaceDocument] =
    useState<DocumentDetailsDto | null>(null);

  const [isResolvePanelOpen, setIsResolvePanelOpen] = useState(false);
  const [questionToResolve, setQuestionToResolve] =
    useState<UnansweredQuestionData | null>(null);

  // Ignores events for other Spaces — the socket also delivers updates for
  // every other Space the user belongs to, not just the one open here.
  const handleDocumentStatusUpdate = useCallback(
    (payload: DocumentStatusUpdatedPayload) => {
      if (payload.knowledgeSpacePublicId !== spacePublicId) return;

      if (payload.status === "Ready") {
        toast.success(`"${payload.fileName}" is ready.`);
      } else {
        toast.error(`"${payload.fileName}" failed to process.`);
      }

      loadDocuments(pageNumber);
      if (payload.documentPublicId === selectedDocumentId) {
        setDetailRefreshSignal((signal) => signal + 1);
      }
    },
    [spacePublicId, pageNumber, selectedDocumentId, loadDocuments],
  );
  useDocumentStatusUpdates(handleDocumentStatusUpdate);

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

  const handleReplaceFile = (detail: DocumentDetailsDto) => {
    setIsDetailPanelOpen(false);
    setReplaceDocument(detail);
    setIsReplacePanelOpen(true);
  };

  const handleCloseReplacePanel = () => {
    setIsReplacePanelOpen(false);
  };

  const handleReplaced = () => {
    setIsReplacePanelOpen(false);
    loadDocuments(pageNumber);
  };

  // Panel stays open on retry (unlike replace/edit) so the user can watch
  // the status badge move from Failed to Processing without losing place.
  const handleRetried = () => {
    loadDocuments(pageNumber);
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
        <div className="max-w-full min-w-0 break-words">
          <h1 className="font-display text-ink text-3xl font-semibold">
            Documents
          </h1>
          <p className="text-ink-muted mt-1 text-sm">
            {space.name}
            {documentsResource.data &&
              ` · ${documents.length} documents on this page`}
            {knowledgeGapsLoaded && ` · ${knowledgeGaps.length} need attention`}
          </p>
        </div>
        {canManage && (
          <Button
            type="button"
            onClick={handleOpenUploadPanel}
            className="bg-accent text-on-accent flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold"
          >
            <Plus size={16} />
            Upload document
          </Button>
        )}
      </div>

      <div
        role="tablist"
        aria-label="Document views"
        className="border-border mb-4 flex gap-1 border-b"
      >
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
            role="tab"
            id={`library-tab-${key}`}
            aria-controls={`library-view-${key}`}
            aria-selected={activeTab === key}
            tabIndex={activeTab === key ? 0 : -1}
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              )
                return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? "all"
                  : event.key === "End"
                    ? "needs-attention"
                    : key === "all"
                      ? "needs-attention"
                      : "all";
              onTabChange(next);
              event.currentTarget.parentElement
                ?.querySelector<HTMLButtonElement>(`#library-tab-${next}`)
                ?.focus();
            }}
            className={`relative flex items-center gap-1.5 px-3 py-3 text-sm font-semibold ${
              activeTab === key
                ? "text-accent"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {activeTab === key && (
              <motion.span
                aria-hidden="true"
                layoutId={reduced ? undefined : "library-tab-indicator"}
                transition={indicatorTransition(reduced)}
                className="bg-accent absolute inset-x-0 bottom-0 h-0.5"
              />
            )}
            {label}
            {key === "needs-attention" && knowledgeGaps.length > 0 && (
              <span className="bg-warn-bg text-warn-fg rounded-full px-1.5 py-0.5 text-xs font-medium">
                {knowledgeGaps.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        {...fadeMotion(reduced)}
        role="tabpanel"
        id={`library-view-${activeTab}`}
        aria-labelledby={`library-tab-${activeTab}`}
      >
        {activeTab === "all" && searchQuery && (
          <p role="status" className="text-ink-muted mb-4 text-sm break-words">
            Results for{" "}
            <span className="text-ink font-semibold">“{searchQuery}”</span>
          </p>
        )}
        {activeTab === "all" && categoriesResource.error && (
          <div className="mb-4">
            <LoadError
              message={categoriesResource.error}
              onRetry={loadCategories}
              isLoading={categoriesResource.isLoading}
            />
          </div>
        )}
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
          <ResourceState
            isLoading={documentsResource.isLoading}
            hasData={documentsResource.data !== null}
            error={documentsResource.error}
            onRetry={documentsResource.reload}
          >
            <DocumentTable
              documents={filteredDocuments}
              onOpenDocument={handleOpenDocument}
              canManage={canManage}
              emptyMessage={
                activeCategory
                  ? "No documents match this category on this page."
                  : searchQuery
                    ? "No documents match this name. Try another search."
                    : canManage
                      ? "Upload a document to make it available in this space."
                      : "No documents yet. Contact a space manager to add one."
              }
              onEmptyAction={
                activeCategory
                  ? () => setActiveCategory(null)
                  : searchQuery
                    ? onClearSearch
                    : canManage
                      ? handleOpenUploadPanel
                      : undefined
              }
              emptyActionLabel={
                activeCategory
                  ? "Clear filter"
                  : searchQuery
                    ? "Clear search"
                    : "Upload document"
              }
            />
            <Pagination
              pageNumber={pageNumber}
              totalPages={pagination.totalPages}
              hasPrevious={pagination.hasPrevious}
              hasNext={pagination.hasNext}
              onPageChange={setPageNumber}
            />
          </ResourceState>
        ) : (
          <ResourceState
            isLoading={knowledgeGapsLoading}
            hasData={knowledgeGapsLoaded}
            error={knowledgeGapsError}
            onRetry={onGapsChanged}
          >
            <NeedsAttentionList
              items={knowledgeGaps}
              canManage={canManage}
              onOpenResolve={handleOpenResolve}
            />
          </ResourceState>
        )}
      </motion.div>

      <DocumentDetailPanel
        documentPublicId={selectedDocumentId}
        isOpen={isDetailPanelOpen}
        space={space}
        canManage={canManage}
        onClose={handleCloseDetail}
        onEditDetails={handleEditDetails}
        onReplaceFile={handleReplaceFile}
        onRetried={handleRetried}
        refreshSignal={detailRefreshSignal}
      />

      <DocumentFormPanel
        isOpen={isFormPanelOpen}
        document={formPanelDocument}
        spacePublicId={spacePublicId}
        categories={categories}
        onClose={handleCloseFormPanel}
        onSaved={handleFormSaved}
      />

      <ReplaceFilePanel
        isOpen={isReplacePanelOpen}
        document={replaceDocument}
        spacePublicId={spacePublicId}
        onClose={handleCloseReplacePanel}
        onReplaced={handleReplaced}
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
