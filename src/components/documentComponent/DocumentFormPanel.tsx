// src/components/documentComponent/DocumentFormPanel.tsx
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import type {
  CategoryDto,
  DocumentDetailsDto,
  DocumentPermission,
  DocumentVisibility,
  UserDataSpaceDto,
} from "../../types";
import { STATUS_BADGE, fileTypeFromFileName } from "./documentDisplay";
import { FileDropzone } from "./FileDropzone";
import { MarkdownContentEditor } from "./MarkdownContentEditor";
import { usePanelDismiss } from "../common/usePanelDismiss";
import { categoryService } from "../../services/categoryService";
import { documentService } from "../../services/documentService";
import { knowledgeSpaceService } from "../../services/spaceService";
import { toErrorMessage } from "../../shared/handleApiError";
import type { ApiErrorResponse } from "../../types/commonType/apiResponse";

// Sentinel option value for "create a new category inline" in the
// category <select> — distinct from any real categoryPublicId.
const NEW_CATEGORY_VALUE = "__new__";

interface PermissionEntry {
  userPublicId: string;
  email: string;
  permission: DocumentPermission;
}

interface DocumentFormPanelProps {
  isOpen: boolean;
  /** Non-null = Edit mode (pre-fills from this document, no mode tabs, shows the status badge). Null = Upload/create mode. */
  document: DocumentDetailsDto | null;
  spacePublicId: string;
  /** Existing categories in the current Space, offered in the category dropdown. */
  categories: CategoryDto[];
  onClose: () => void;
  /** Called after a successful create/update so the parent can refetch the list. */
  onSaved: () => void;
}

// Floating slide-over panel (480px, right-aligned — wider than the 420px
// Document detail panel since this one holds a dropzone/editor plus three
// more fields), same pattern as DocumentDetailPanel/AskAiPanel. One
// shared form backs two entry points per spec: "Upload document" (from
// Document Library) and "Edit document details" (from the Document detail
// panel's "Edit details" action) — title, submit label, and which fields
// render swap based on whether `document` is null.
export function DocumentFormPanel({
  isOpen,
  document,
  spacePublicId,
  categories,
  onClose,
  onSaved,
}: DocumentFormPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <DocumentFormPanelBody
          document={document}
          spacePublicId={spacePublicId}
          categories={categories}
          onClose={onClose}
          onSaved={onSaved}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
    </AnimatePresence>
  );
}

interface DocumentFormPanelBodyProps {
  document: DocumentDetailsDto | null;
  spacePublicId: string;
  categories: CategoryDto[];
  onClose: () => void;
  onSaved: () => void;
  prefersReducedMotion: boolean | null;
}

// Mirrors DocumentDetailPanelBody's split: this component only mounts
// while `isOpen` is true, so every field's `useState` initializer re-runs
// fresh on each open — editing document A, closing, then editing document
// B (or opening a fresh Upload) never leaks stale form state between them.
function DocumentFormPanelBody({
  document,
  spacePublicId,
  categories,
  onClose,
  onSaved,
  prefersReducedMotion,
}: DocumentFormPanelBodyProps) {
  const [name, setName] = useState(document?.title ?? "");
  const [categoryPublicId, setCategoryPublicId] = useState(
    document?.category.publicId ?? "",
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [description, setDescription] = useState(document?.description ?? "");
  const [visibility, setVisibility] = useState<DocumentVisibility>(
    document?.visibility ?? "Public",
  );
  const [permissions, setPermissions] = useState<PermissionEntry[]>(
    document?.permissions ?? [],
  );
  const [spaceMembers, setSpaceMembers] = useState<UserDataSpaceDto[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [contentMode, setContentMode] = useState<"upload" | "write">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [markdownContent, setMarkdownContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Guards against a double-submit landing during the ~220ms exit
  // animation after onClose() (AnimatePresence keeps the panel mounted and
  // interactive while it exits). Set only after validation passes, so a
  // failed validation attempt never permanently locks out a resubmit.
  const hasSubmittedRef = useRef(false);
  const panelRef = usePanelDismiss(true, onClose);

  // People picker for "Visible to" — fetched once per panel open, only
  // used if the user switches to Restricted.
  useEffect(() => {
    knowledgeSpaceService
      .getListUser(spacePublicId)
      .then((response) => setSpaceMembers(response.items))
      .catch((error: ApiErrorResponse) => toast.error(toErrorMessage(error)));
  }, [spacePublicId]);

  const availableMembers = spaceMembers.filter(
    (member) => !permissions.some((p) => p.userPublicId === member.publicId),
  );

  const handleAddMember = (memberPublicId: string) => {
    const member = spaceMembers.find((m) => m.publicId === memberPublicId);
    if (!member) return;
    setPermissions((prev) => [
      ...prev,
      {
        userPublicId: member.publicId,
        email: member.email,
        permission: "Read",
      },
    ]);
    setSelectedMemberId("");
  };

  const handleChangePermissionLevel = (
    userPublicId: string,
    permission: DocumentPermission,
  ) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.userPublicId === userPublicId ? { ...p, permission } : p,
      ),
    );
  };

  const handleRemoveMember = (userPublicId: string) => {
    setPermissions((prev) =>
      prev.filter((p) => p.userPublicId !== userPublicId),
    );
  };

  // Resolves the category picked in the dropdown to a real categoryPublicId,
  // creating it first via the API if the user chose "+ Create new category".
  const resolveCategoryPublicId = async (): Promise<string> => {
    if (categoryPublicId !== NEW_CATEGORY_VALUE) return categoryPublicId;
    const created = await categoryService.createCategory(spacePublicId, {
      name: newCategoryName.trim(),
    });
    return created.publicId;
  };

  const handleSubmit = async () => {
    if (hasSubmittedRef.current) return;

    if (!name.trim()) {
      toast.error("Document name is required.");
      return;
    }
    if (!categoryPublicId) {
      toast.error("Category is required.");
      return;
    }
    if (categoryPublicId === NEW_CATEGORY_VALUE && !newCategoryName.trim()) {
      toast.error("Enter a name for the new category.");
      return;
    }
    if (visibility === "Restricted" && permissions.length === 0) {
      toast.error("Add at least one person for restricted access.");
      return;
    }
    if (!document && contentMode === "upload" && !selectedFile) {
      toast.error("Choose a file to upload.");
      return;
    }
    if (!document && contentMode === "upload" && selectedFile) {
      const fileType = fileTypeFromFileName(selectedFile.name);
      if (!fileType) {
        toast.error("Only PDF, DOCX, or Markdown files are supported.");
        return;
      }
    }
    if (!document && contentMode === "write" && !markdownContent.trim()) {
      toast.error("Write some content before uploading.");
      return;
    }

    hasSubmittedRef.current = true;
    setIsSubmitting(true);
    try {
      const resolvedCategoryPublicId = await resolveCategoryPublicId();
      const permissionRequest = permissions.map((p) => ({
        userPublicId: p.userPublicId,
        permission: p.permission,
      }));

      if (document) {
        await documentService.updateDocument(spacePublicId, document.publicId, {
          name: name.trim(),
          description: description.trim() || null,
          categoryPublicId: resolvedCategoryPublicId,
          visibility,
        });
        if (visibility === "Restricted") {
          await documentService.updateDocumentPermission(
            spacePublicId,
            document.publicId,
            permissionRequest,
          );
        }
        toast.success("Document details updated.");
      } else {
        const fileName =
          contentMode === "upload"
            ? selectedFile!.name
            : /\.(md|markdown)$/i.test(name.trim())
              ? name.trim()
              : `${name.trim()}.md`;
        const contentType =
          contentMode === "upload" ? selectedFile!.type : "text/markdown";
        const fileSize =
          contentMode === "upload"
            ? selectedFile!.size
            : new Blob([markdownContent]).size;

        const { uploadUrl, storageKey } = await documentService.getUploadUrl(
          spacePublicId,
          { fileName, contentType, fileSize },
        );
        await documentService.uploadFileToStorage(
          uploadUrl,
          contentMode === "upload"
            ? selectedFile!
            : new Blob([markdownContent]),
          contentType,
        );

        const created = await documentService.createDocument(spacePublicId, {
          name: name.trim(),
          description: description.trim() || null,
          content: contentMode === "write" ? markdownContent : null,
          categoryPublicId: resolvedCategoryPublicId,
          storageKey,
          visibility,
        });

        if (visibility === "Restricted" && permissionRequest.length > 0) {
          await documentService.grantDocumentPermissions(
            spacePublicId,
            created.publicId,
            permissionRequest,
          );
        }
        toast.success("Document uploaded.");
      }
      onSaved();
      onClose();
    } catch (error) {
      toast.error(toErrorMessage(error as ApiErrorResponse));
      hasSubmittedRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
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
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={document ? "Edit document details" : "Upload document"}
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
            <select
              id="document-category"
              value={categoryPublicId}
              onChange={(event) => setCategoryPublicId(event.target.value)}
              className="border-border text-ink focus:border-accent mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none"
            >
              <option value="" disabled>
                Select a category
              </option>
              {categories.map((option) => (
                <option key={option.publicId} value={option.publicId}>
                  {option.name}
                </option>
              ))}
              <option value={NEW_CATEGORY_VALUE}>+ Create new category…</option>
            </select>
            {categoryPublicId === NEW_CATEGORY_VALUE && (
              <input
                type="text"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="New category name"
                className="border-border text-ink placeholder:text-ink-muted focus:border-accent mt-2 w-full rounded-md border px-3 py-2 text-sm outline-none"
              />
            )}
          </div>
          <div>
            <span className="text-ink-muted text-xs font-medium">
              Visibility
            </span>
            <div className="mt-1 flex gap-1.5">
              {(["Public", "Restricted"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setVisibility(option)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold ${
                    visibility === option
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border text-ink-muted hover:bg-surface-sunken"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {visibility === "Restricted" && (
              <div className="mt-2">
                <span className="text-ink-muted text-xs font-medium">
                  Visible to
                </span>
                <div className="mt-1 flex flex-col gap-1.5">
                  {permissions.map((p) => (
                    <div
                      key={p.userPublicId}
                      className="border-border flex items-center gap-2 rounded-md border px-2 py-1.5"
                    >
                      <span className="text-ink flex-1 truncate text-sm">
                        {p.email}
                      </span>
                      <select
                        value={p.permission}
                        onChange={(event) =>
                          handleChangePermissionLevel(
                            p.userPublicId,
                            event.target.value as DocumentPermission,
                          )
                        }
                        className="border-border text-ink rounded-md border px-1.5 py-1 text-xs outline-none"
                      >
                        <option value="Read">Read</option>
                        <option value="Edit">Edit</option>
                        <option value="Manage">Manage</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(p.userPublicId)}
                        aria-label={`Remove ${p.email}`}
                        className="text-ink-muted hover:bg-surface-sunken flex size-6 items-center justify-center rounded-full"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <select
                    value={selectedMemberId}
                    onChange={(event) => handleAddMember(event.target.value)}
                    className="border-border text-ink-muted mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none"
                  >
                    <option value="" disabled>
                      Add a person…
                    </option>
                    {availableMembers.map((member) => (
                      <option key={member.publicId} value={member.publicId}>
                        {member.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
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
          disabled={isSubmitting}
          className="bg-accent mt-5 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : document ? "Save changes" : "Upload"}
        </button>
      </motion.div>
    </div>
  );
}
