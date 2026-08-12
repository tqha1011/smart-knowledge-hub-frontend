// src/components/documentComponent/DocumentFormPanel.tsx
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import type {
  DocumentSummary,
  DocumentUpdateInput,
  NewDocumentInput,
} from "../../types";
import { STATUS_BADGE, fileTypeFromFileName } from "./documentDisplay";
import { FileDropzone } from "./FileDropzone";
import { MarkdownContentEditor } from "./MarkdownContentEditor";

interface DocumentFormPanelProps {
  isOpen: boolean;
  /** Non-null = Edit mode (pre-fills from this document, no mode tabs, shows the status badge). Null = Upload/create mode. */
  document: DocumentSummary | null;
  /** Existing categories in the current Space, offered as datalist suggestions. */
  categories: string[];
  onClose: () => void;
  onCreate: (input: NewDocumentInput) => void;
  onUpdate: (documentId: string, updates: DocumentUpdateInput) => void;
}

// Floating slide-over panel (480px, right-aligned — wider than the 420px
// Document detail panel since this one holds a dropzone/editor plus three
// more fields), same pattern as DocumentDetailPanel/AskAiStubPanel. One
// shared form backs two entry points per spec: "Upload document" (from
// Document Library) and "Edit document details" (from the Document detail
// panel's "Edit details" action) — title, submit label, and which fields
// render swap based on whether `document` is null.
export function DocumentFormPanel({
  isOpen,
  document,
  categories,
  onClose,
  onCreate,
  onUpdate,
}: DocumentFormPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <DocumentFormPanelBody
          document={document}
          categories={categories}
          onClose={onClose}
          onCreate={onCreate}
          onUpdate={onUpdate}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
    </AnimatePresence>
  );
}

interface DocumentFormPanelBodyProps {
  document: DocumentSummary | null;
  categories: string[];
  onClose: () => void;
  onCreate: (input: NewDocumentInput) => void;
  onUpdate: (documentId: string, updates: DocumentUpdateInput) => void;
  prefersReducedMotion: boolean | null;
}

// Mirrors DocumentDetailPanelBody's split: this component only mounts
// while `isOpen` is true, so every field's `useState` initializer re-runs
// fresh on each open — editing document A, closing, then editing document
// B (or opening a fresh Upload) never leaks stale form state between them.
function DocumentFormPanelBody({
  document,
  categories,
  onClose,
  onCreate,
  onUpdate,
  prefersReducedMotion,
}: DocumentFormPanelBodyProps) {
  const [name, setName] = useState(document?.name ?? "");
  const [category, setCategory] = useState(document?.category ?? "");
  const [description, setDescription] = useState(document?.description ?? "");
  const [contentMode, setContentMode] = useState<"upload" | "write">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [markdownContent, setMarkdownContent] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Document name is required.");
      return;
    }
    if (!category.trim()) {
      toast.error("Category is required.");
      return;
    }

    if (document) {
      onUpdate(document.id, {
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
      });
      onClose();
      return;
    }

    if (contentMode === "upload") {
      if (!selectedFile) {
        toast.error("Choose a file to upload.");
        return;
      }
      const fileType = fileTypeFromFileName(selectedFile.name);
      if (!fileType) {
        toast.error("Only PDF, DOCX, or Markdown files are supported.");
        return;
      }
      onCreate({
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        fileType,
        fileSizeBytes: selectedFile.size,
      });
    } else {
      if (!markdownContent.trim()) {
        toast.error("Write some content before uploading.");
        return;
      }
      onCreate({
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        fileType: "markdown",
        fileSizeBytes: new Blob([markdownContent]).size,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40">
      <motion.button
        type="button"
        aria-label="Close document form"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        className="bg-ink/40 absolute inset-0 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.22,
          ease: "easeOut",
        }}
        className="bg-surface absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col overflow-y-auto p-5 shadow-lg"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="font-display text-ink truncate text-lg font-semibold">
              {document ? "Edit document details" : "Upload document"}
            </h2>
            {document && (
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[11px] font-medium ${STATUS_BADGE[document.status].className}`}
              >
                {STATUS_BADGE[document.status].label}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close document form"
            className="text-ink-muted hover:bg-surface-sunken flex size-9 shrink-0 items-center justify-center rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        {!document && (
          <div className="border-border mb-4 flex gap-1 border-b">
            {(["upload", "write"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setContentMode(mode)}
                className={`border-b-2 px-3 py-2 text-sm font-semibold ${
                  contentMode === mode
                    ? "border-accent text-accent"
                    : "text-ink-muted hover:text-ink border-transparent"
                }`}
              >
                {mode === "upload" ? "Upload file" : "Write content"}
              </button>
            ))}
          </div>
        )}

        {!document &&
          (contentMode === "upload" ? (
            <FileDropzone
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
            />
          ) : (
            <MarkdownContentEditor
              value={markdownContent}
              onChange={setMarkdownContent}
            />
          ))}

        <div className="mt-5 flex flex-col gap-3">
          <div>
            <label
              htmlFor="document-name"
              className="text-ink-muted text-xs font-medium"
            >
              Document name
            </label>
            <input
              id="document-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Q3 Roadmap.pdf"
              className="border-border text-ink placeholder:text-ink-muted focus:border-accent mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="document-category"
              className="text-ink-muted text-xs font-medium"
            >
              Category
            </label>
            <input
              id="document-category"
              list="document-category-options"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="e.g. Architecture"
              className="border-border text-ink placeholder:text-ink-muted focus:border-accent mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none"
            />
            <datalist id="document-category-options">
              {categories.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
          <div>
            <label
              htmlFor="document-description"
              className="text-ink-muted text-xs font-medium"
            >
              Description
            </label>
            <textarea
              id="document-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Short summary of what this document covers…"
              className="border-border text-ink placeholder:text-ink-muted focus:border-accent mt-1 w-full resize-y rounded-md border px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="bg-accent mt-5 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white"
        >
          {document ? "Save changes" : "Upload"}
        </button>
      </motion.div>
    </div>
  );
}
