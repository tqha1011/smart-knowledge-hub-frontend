# Upload/Edit Document Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Upload document panel isn't built yet." / "Edit document panel isn't built yet." toast stubs with the real shared Upload/Edit form panel, per `docs/superpowers/specs/2026-08-05-knowledge-portal-ui-design.md` § "Upload / Edit document panel": one slide-over form backing two entry points ("Upload document" from the Document Library, "Edit details" from the Document detail panel), with mode tabs (Upload file / Write content) shown only for new uploads, shared fields (name, category, description), and a read-only status badge shown only in Edit mode.

**Architecture:** One orchestrating component, `DocumentFormPanel`, follows the same floating slide-over pattern already established by `AskAiStubPanel`/`DocumentDetailPanel` (`fixed inset-0` wrapper, backdrop button, `motion.div` sliding in from the right, `AnimatePresence`), at 480px instead of the Detail panel's 420px — a deliberate width choice: this panel holds a dropzone/editor plus three more fields, so it needs more room than a read-only metadata panel. Two small, reusable, non-stubbed subcomponents back the two content modes: `FileDropzone` (real drag-and-drop + click-to-browse using the browser's File API — no backend is needed to read a file's name/size/type client-side) and `MarkdownContentEditor` (a monospace textarea with a small formatting toolbar that edits the selection in place). Whether `document` is null decides everything: null means Upload/create mode (mode tabs + dropzone/editor visible, no status badge, "Upload" submit label); non-null means Edit mode (no mode tabs, no dropzone/editor — file content isn't editable through this form, that's the separate, still out-of-scope "Replace file" action — status badge visible, "Save changes" submit label, fields pre-filled from the document).

Data ownership follows the pattern the Document detail panel plan already established: `PortalShell` owns the `documents` list (so a create/update survives a Documents → Users & Roles → Documents nav round-trip, same reasoning as why `documents`/`knowledgeGaps` already live there instead of in `DocumentLibrary`). `DocumentLibrary` gains two new local state fields (`isFormPanelOpen`, `formPanelDocument`) purely for which-panel-is-open UI state, and forwards submissions up through two new `PortalShell` props (`onCreateDocument`, `onUpdateDocument`) that do the actual list mutation plus a success toast — mirroring exactly how `onDeleteDocument` already works. Clicking "Edit details" in the Document detail panel closes that panel and opens the form panel in Edit mode for the same document, rather than stacking two overlays; closing the form panel (Cancel/X/backdrop/successful submit) always returns to the plain table, not back into the detail panel — a deliberate simplification, not a spec requirement either way.

The "Replace file" action in the Document detail panel stays a toast stub after this plan — it is not part of this spec section (the spec's Upload/Edit panel section never mentions it; it's a separate action listed only in the Document detail panel's own spec section) and replacing an existing document's file content is out of scope here.

**Tech Stack:** React 19, TypeScript 6 (bundler mode, `verbatimModuleSyntax`), Tailwind v4 (`@theme` tokens from `src/index.css`, including the already-defined `--color-status-ready-bg/fg`, `--color-status-processing-bg/fg`, `--color-status-failed-bg/fg` tokens this plan is the first to actually use), `framer-motion` (established slide-over pattern), `lucide-react` icons, `react-toastify` for stub actions, validation errors, and success toasts, the browser's native File API (`File`, `FileList`, drag-and-drop events — no upload dependency needed, nothing is actually sent anywhere). No test runner is configured in this repo — verification is `npm run lint` + `npm run build`, plus careful code-tracing in place of manual browser testing (**no browser is available in this environment** — same constraint documented in the two prior plans for this app).

## Global Constraints

- TypeScript `verbatimModuleSyntax` is on — type-only imports must use `import type { X } from '...'`.
- `noUnusedLocals` / `noUnusedParameters` / `erasableSyntaxOnly` are enforced by `npm run build` — no enums, no parameter properties, no dead locals. ESLint here has **no `argsIgnorePattern`**, so an unused parameter can't be suppressed with an underscore prefix — just don't declare parameters you don't use.
- Components are PascalCase exports; DTO/shared types live in `src/types` and are re-exported through `src/types/index.ts`.
- Tailwind classes are written inline, matching existing components — no new global CSS.
- No real backend exists yet — components read/write mock data via plain imports/local state (matches the existing `mockDocuments` pattern), not a `services/` HTTP call. Nothing this plan builds actually uploads a file anywhere; the File API is used only to read a chosen file's `name`/`size` client-side.
- `npm run lint` does not type-check; `npm run build` (`tsc -b && vite build`) is the real gate and must pass after every task.
- Husky's pre-commit hook runs `eslint --fix` + `prettier` on staged files automatically on `git commit` — expect it to reformat slightly; re-stage if it does.
- Commit subjects need a 10-character minimum (commitlint, conventional format `<type>: <description>`).
- Hooks (`useState`, `useReducedMotion`, etc.) must never be called after an early-return guard (`react-hooks/rules-of-hooks`) — relevant if touching `PortalShell.tsx`, which already has this constraint documented inline for its existing `knowledgeGaps`/`documents` state.
- Validate obvious client-side constraints before treating a submission as valid (`.claude/api-forms-errors.md`): empty required fields, unsupported file types, oversized files. Show errors via `react-toastify`, not silent failures. Avoid duplicate toasts for the same action — each action's toast is owned by exactly one place in the call chain (validation toasts live where the check happens; the final success toast lives in `PortalShell`, matching the `onDeleteDocument` precedent).
- **No browser is available in this sandbox.** Any step that would normally say "click the dropzone and confirm the panel opens" instead means: read the JSX/state wiring carefully and confirm by tracing props/handlers and TypeScript's control-flow narrowing, not by running the dev server in a browser.

---

## Task 1: DocumentStatus type, DocumentSummary fields, form-submission DTOs

**Files:**

- Modify: `src/types/commonType/document.ts`
- Modify: `src/types/index.ts`

**Interfaces:**

- Produces: `DocumentStatus = "processing" | "ready" | "failed"`; `DocumentSummary` gains `description: string` and `status: DocumentStatus`; `NewDocumentInput { name: string; category: string; description: string; fileType: DocumentFileType; fileSizeBytes: number }`; `DocumentUpdateInput { name: string; category: string; description: string }`. All exported from `src/types`.

- [ ] **Step 1: Extend `document.ts`**

Replace the full contents of `src/types/commonType/document.ts` with:

```ts
export interface DocumentAuthor {
  name: string;
  avatarInitials: string;
}

export type DocumentFileType = "pdf" | "docx" | "markdown";

export type DocumentStatus = "processing" | "ready" | "failed";

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
}

// Payload submitted by the Upload/Edit panel when editing an existing
// document's details (Edit entry point, from the Document detail panel's
// "Edit details" action). File content/type is not editable here — that's
// the separate, still-stubbed "Replace file" action.
export interface DocumentUpdateInput {
  name: string;
  category: string;
  description: string;
}
```

- [ ] **Step 2: Export the new types from the barrel**

In `src/types/index.ts`, change:

```ts
export type {
  DocumentAuthor,
  DocumentFileType,
  DocumentSummary,
  KnowledgeGapItem,
  DocumentCitation,
} from "./commonType/document";
```

to:

```ts
export type {
  DocumentAuthor,
  DocumentFileType,
  DocumentStatus,
  DocumentSummary,
  KnowledgeGapItem,
  DocumentCitation,
  NewDocumentInput,
  DocumentUpdateInput,
} from "./commonType/document";
```

- [ ] **Step 3: Type-check**

Run: `npm run build`
Expected: FAILS — `shellMockData.ts`'s 7 `mockDocuments` entries are now missing the two new required fields (`description`, `status`). This is expected; Task 2 fixes it. Confirm the failure is exactly that (missing `description`/`status` on `DocumentSummary` in `shellMockData.ts`), not something else.

- [ ] **Step 4: Commit**

```bash
git add src/types/commonType/document.ts src/types/index.ts
git commit -m "feat: add DocumentStatus and document form DTOs"
```

---

## Task 2: Backfill mock document status and description

**Files:**

- Modify: `src/components/shell/shellMockData.ts`

**Interfaces:**

- Consumes: `DocumentStatus` from Task 1.
- No new exports — this task only adds two fields to each existing `mockDocuments` entry.

All 7 existing documents get `status: "ready"` — not a placeholder choice: each of them already has a nonzero `citationCount` (they've already been cited by the Assistant), which is only possible for a document that finished indexing, so `"ready"` is the only status consistent with the rest of their mock data. `description` is a short, realistic one-liner per document.

- [ ] **Step 1: Add `description` and `status` to every `mockDocuments` entry**

In `src/components/shell/shellMockData.ts`, replace the `mockDocuments` array (from `// MOCK: stand-in for \`GET /spaces/:spaceId/documents\`.`through its closing`];`) with:

```ts
// MOCK: stand-in for `GET /spaces/:spaceId/documents`.
export const mockDocuments: DocumentSummary[] = [
  {
    id: "doc-1",
    spaceId: "engineering",
    name: "API Design Guidelines.pdf",
    fileType: "pdf",
    category: "Architecture",
    description:
      "Guidelines for designing consistent, versioned REST APIs across services.",
    status: "ready",
    updatedBy: { name: "Priya Nair", avatarInitials: "PN" },
    updatedAt: "2026-08-05T10:00:00Z",
    fileSizeBytes: 842432,
    citationCount: countCitations("doc-1"),
  },
  {
    id: "doc-2",
    spaceId: "engineering",
    name: "Incident Response Runbook.md",
    fileType: "markdown",
    category: "Runbook",
    description:
      "Step-by-step runbook for triaging and resolving production incidents.",
    status: "ready",
    updatedBy: { name: "Alex Rivera", avatarInitials: "AR" },
    updatedAt: "2026-07-28T10:00:00Z",
    fileSizeBytes: 128540,
    citationCount: countCitations("doc-2"),
  },
  {
    id: "doc-3",
    spaceId: "engineering",
    name: "Onboarding Checklist.docx",
    fileType: "docx",
    category: "Onboarding",
    description:
      "Checklist covering account setup and first-week tasks for new engineers.",
    status: "ready",
    updatedBy: { name: "Priya Nair", avatarInitials: "PN" },
    updatedAt: "2026-06-14T10:00:00Z",
    fileSizeBytes: 305152,
    citationCount: countCitations("doc-3"),
  },
  {
    id: "doc-4",
    spaceId: "engineering",
    name: "Deployment Pipeline Overview.pdf",
    fileType: "pdf",
    category: "Architecture",
    description:
      "Overview of the CI/CD pipeline stages from build to production rollout.",
    status: "ready",
    updatedBy: { name: "Sam Ortiz", avatarInitials: "SO" },
    updatedAt: "2026-08-09T10:00:00Z",
    fileSizeBytes: 1887436,
    citationCount: countCitations("doc-4"),
  },
  {
    id: "doc-5",
    spaceId: "hr",
    name: "Time Off Policy.pdf",
    fileType: "pdf",
    category: "Policy",
    description:
      "Company policy on paid time off accrual, requests, and rollover.",
    status: "ready",
    updatedBy: { name: "Jordan Lee", avatarInitials: "JL" },
    updatedAt: "2026-07-01T10:00:00Z",
    fileSizeBytes: 412672,
    citationCount: countCitations("doc-5"),
  },
  {
    id: "doc-6",
    spaceId: "hr",
    name: "New Hire Onboarding.docx",
    fileType: "docx",
    category: "Onboarding",
    description:
      "Paperwork and setup steps new hires complete before their start date.",
    status: "ready",
    updatedBy: { name: "Jordan Lee", avatarInitials: "JL" },
    updatedAt: "2026-08-02T10:00:00Z",
    fileSizeBytes: 256000,
    citationCount: countCitations("doc-6"),
  },
  {
    id: "doc-7",
    spaceId: "sales",
    name: "Pricing Playbook.pdf",
    fileType: "pdf",
    category: "Playbook",
    description:
      "Standard pricing, discount tiers, and negotiation guidance for sales.",
    status: "ready",
    updatedBy: { name: "Morgan Diaz", avatarInitials: "MD" },
    updatedAt: "2026-08-10T10:00:00Z",
    fileSizeBytes: 2202009,
    citationCount: countCitations("doc-7"),
  },
];
```

Nothing else in the file changes — `mockDocumentCitations`, `countCitations`, `countDocuments`, `mockSpaceStats`, and `mockKnowledgeGaps` stay exactly as they are.

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/shell/shellMockData.ts
git commit -m "feat: backfill mock document status and description"
```

---

## Task 3: Status badge and upload-validation helpers

**Files:**

- Modify: `src/components/documentComponent/documentDisplay.ts`

**Interfaces:**

- Consumes: `DocumentStatus` from Task 1.
- Produces: `STATUS_BADGE: Record<DocumentStatus, { label: string; className: string }>`, `MAX_UPLOAD_FILE_SIZE_BYTES: number`, `fileTypeFromFileName(fileName: string): DocumentFileType | null` — all exported, consumed by Task 4 (`fileTypeFromFileName`, `MAX_UPLOAD_FILE_SIZE_BYTES`) and Task 6 (`STATUS_BADGE`, `fileTypeFromFileName`).

- [ ] **Step 1: Add the new helpers**

Replace the full contents of `src/components/documentComponent/documentDisplay.ts` with:

```ts
import { File, FileCode, FileText } from "lucide-react";
import type { DocumentFileType, DocumentStatus } from "../../types";

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

// Label + Tailwind class pair for each document processing status, shown
// as a read-only badge next to the Upload/Edit panel's title in Edit mode.
// Uses the design tokens already defined in src/index.css for exactly this
// purpose (--color-status-ready-bg/fg etc.) — this is the first plan to
// actually reference them.
export const STATUS_BADGE: Record<
  DocumentStatus,
  { label: string; className: string }
> = {
  processing: {
    label: "Processing",
    className: "bg-status-processing-bg text-status-processing-fg",
  },
  ready: {
    label: "Ready",
    className: "bg-status-ready-bg text-status-ready-fg",
  },
  failed: {
    label: "Failed",
    className: "bg-status-failed-bg text-status-failed-fg",
  },
};

// Spec's stated upload limit for the "Upload file" dropzone.
export const MAX_UPLOAD_FILE_SIZE_BYTES = 25 * 1024 * 1024;

const FILE_EXTENSION_TYPE: Record<string, DocumentFileType> = {
  pdf: "pdf",
  docx: "docx",
  md: "markdown",
  markdown: "markdown",
};

// Derives a DocumentFileType from a file name's extension, or null if the
// extension isn't one of the three types this app accepts for upload.
export function fileTypeFromFileName(
  fileName: string,
): DocumentFileType | null {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (!extension) return null;
  return FILE_EXTENSION_TYPE[extension] ?? null;
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npm run build && npm run lint`
Expected: both succeed. These new exports have no consumers yet (Tasks 4 and 6 add them), so nothing else in the app changes.

- [ ] **Step 3: Commit**

```bash
git add src/components/documentComponent/documentDisplay.ts
git commit -m "feat: add status badge and upload-validation helpers"
```

---

## Task 4: FileDropzone component

**Files:**

- Create: `src/components/documentComponent/FileDropzone.tsx`

**Interfaces:**

- Consumes: `fileTypeFromFileName`, `formatFileSize`, `MAX_UPLOAD_FILE_SIZE_BYTES` from Task 3's `documentDisplay.ts`.
- Produces: `FileDropzone` component with props `{ selectedFile: File | null; onFileSelect: (file: File) => void }` — consumed by Task 6's `DocumentFormPanel`.

`File` here is the browser's built-in DOM type (from `lib.dom.d.ts`), not something this task defines — do not import anything named `File` from another module into this file, or it will shadow the global type and break the `selectedFile: File | null` prop type. This is exactly why the component imports lucide-react's file icon under the alias `FileGlyph` below instead of its default export name `File`.

Validation (file type from its extension, size ≤ 25MB) happens inside this component and shows a `toast.error` on rejection — it's a self-contained client-side check, matching this project's "validate obvious client-side constraints" convention (`.claude/api-forms-errors.md`). It does not call `onFileSelect` for a rejected file.

- [ ] **Step 1: Write the component**

```tsx
// src/components/documentComponent/FileDropzone.tsx
import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { File as FileGlyph, Upload } from "lucide-react";
import { toast } from "react-toastify";
import {
  MAX_UPLOAD_FILE_SIZE_BYTES,
  fileTypeFromFileName,
  formatFileSize,
} from "./documentDisplay";

interface FileDropzoneProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
}

// Dropzone for the Upload/Edit panel's "Upload file" mode. Accepts
// PDF/DOCX/Markdown up to 25MB (spec's stated limits) via drag-and-drop or
// click-to-browse. No backend is involved — the File API gives real
// name/size/type data client-side, so this is a genuine interaction, not a
// stub.
export function FileDropzone({
  selectedFile,
  onFileSelect,
}: FileDropzoneProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = (file: File) => {
    if (!fileTypeFromFileName(file.name)) {
      toast.error("Only PDF, DOCX, or Markdown files are supported.");
      return;
    }
    if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
      toast.error("File is larger than 25MB.");
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    const file = event.dataTransfer.files[0];
    if (file) validateAndSelect(file);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) validateAndSelect(file);
    event.target.value = "";
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center text-sm transition-colors ${
          isDraggingOver
            ? "border-accent bg-accent-soft"
            : "border-border hover:bg-surface-sunken"
        }`}
      >
        {selectedFile ? (
          <>
            <FileGlyph size={20} className="text-ink-muted" />
            <p className="text-ink font-medium">{selectedFile.name}</p>
            <p className="text-ink-muted text-xs">
              {formatFileSize(selectedFile.size)} · click to choose a different
              file
            </p>
          </>
        ) : (
          <>
            <Upload size={20} className="text-ink-muted" />
            <p className="text-ink font-medium">
              Drag and drop a file, or click to browse
            </p>
            <p className="text-ink-muted text-xs">
              PDF, DOCX, or Markdown, up to 25MB
            </p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.md,.markdown"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npm run build && npm run lint`
Expected: both succeed. No consumers yet (Task 6 wires this in).

- [ ] **Step 3: Trace the validation logic by hand (no browser available)**

Confirm by reading the code: a `.txt` file → `fileTypeFromFileName` returns `null` → rejected with a toast, `onFileSelect` never called. A 30MB `.pdf` → passes the type check, fails the size check → rejected with a different toast. A 2MB `.pdf` → passes both checks → `onFileSelect(file)` is called. The same `validateAndSelect` function backs both the drop handler and the click-to-browse `<input>` handler, so both paths get identical validation.

- [ ] **Step 4: Commit**

```bash
git add src/components/documentComponent/FileDropzone.tsx
git commit -m "feat: add FileDropzone component"
```

---

## Task 5: MarkdownContentEditor component

**Files:**

- Create: `src/components/documentComponent/MarkdownContentEditor.tsx`

**Interfaces:**

- Produces: `MarkdownContentEditor` component with props `{ value: string; onChange: (value: string) => void }` — consumed by Task 6's `DocumentFormPanel`.

This is the "Write content" mode's Markdown authoring surface: a monospace textarea plus a small formatting toolbar (bold, heading, list, code block) that edits the current selection in place, per spec. It's a controlled component — `value`/`onChange` are the only state it doesn't own itself; the caller owns the actual string.

- [ ] **Step 1: Write the component**

````tsx
// src/components/documentComponent/MarkdownContentEditor.tsx
import { useRef } from "react";
import { Bold, Code, Heading, List } from "lucide-react";

interface MarkdownContentEditorProps {
  value: string;
  onChange: (value: string) => void;
}

type ToolbarAction = "bold" | "heading" | "list" | "code";

// "Write content" mode's Markdown authoring surface: a monospace textarea
// plus a small formatting toolbar (bold, heading, list, code block) that
// edits the selected text in place, per spec. No underlying file — the
// typed content itself becomes the document (see DocumentFormPanel, which
// derives fileType "markdown" and a byte size from this string).
export function MarkdownContentEditor({
  value,
  onChange,
}: MarkdownContentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyInlineWrap = (marker: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    const selected = value.slice(selectionStart, selectionEnd);
    const next =
      value.slice(0, selectionStart) +
      marker +
      selected +
      marker +
      value.slice(selectionEnd);
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        selectionStart + marker.length,
        selectionEnd + marker.length,
      );
    });
  };

  const applyLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart } = textarea;
    const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        selectionStart + prefix.length,
        selectionStart + prefix.length,
      );
    });
  };

  const applyCodeBlock = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    const selected = value.slice(selectionStart, selectionEnd);
    const next =
      value.slice(0, selectionStart) +
      "```\n" +
      selected +
      "\n```" +
      value.slice(selectionEnd);
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = selectionStart + 4 + selected.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const handleToolbarAction = (action: ToolbarAction) => {
    if (action === "bold") applyInlineWrap("**");
    if (action === "heading") applyLinePrefix("# ");
    if (action === "list") applyLinePrefix("- ");
    if (action === "code") applyCodeBlock();
  };

  return (
    <div>
      <div className="border-border bg-surface-sunken flex gap-1 rounded-t-md border border-b-0 p-1.5">
        <button
          type="button"
          onClick={() => handleToolbarAction("bold")}
          aria-label="Bold"
          className="text-ink-muted hover:bg-surface flex size-7 items-center justify-center rounded"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => handleToolbarAction("heading")}
          aria-label="Heading"
          className="text-ink-muted hover:bg-surface flex size-7 items-center justify-center rounded"
        >
          <Heading size={14} />
        </button>
        <button
          type="button"
          onClick={() => handleToolbarAction("list")}
          aria-label="List"
          className="text-ink-muted hover:bg-surface flex size-7 items-center justify-center rounded"
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onClick={() => handleToolbarAction("code")}
          aria-label="Code block"
          className="text-ink-muted hover:bg-surface flex size-7 items-center justify-center rounded"
        >
          <Code size={14} />
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={8}
        placeholder="Write the document content in Markdown…"
        className="border-border text-ink placeholder:text-ink-muted focus:border-accent w-full resize-y rounded-b-md border p-3 font-mono text-sm outline-none"
      />
    </div>
  );
}
````

- [ ] **Step 2: Type-check and lint**

Run: `npm run build && npm run lint`
Expected: both succeed. No consumers yet (Task 6 wires this in).

- [ ] **Step 3: Trace the toolbar logic by hand (no browser available)**

Confirm by reading the code: `applyInlineWrap("**")` slices `value` at the current selection and re-inserts it wrapped in `**` on both sides — with no selection (`selectionStart === selectionEnd`), this still works, it just inserts an empty `****` with the cursor left between the two pairs of asterisks (`setSelectionRange` places both ends at `selectionStart + marker.length` — since `selected` is `""`, this the mid-point). `applyLinePrefix` finds the start of the current line via `lastIndexOf("\n", selectionStart - 1) + 1` (correctly returns `0` when the cursor is on the first line, since `lastIndexOf` returns `-1` there and `-1 + 1 = 0`) and inserts the prefix there regardless of where in the line the cursor sits.

- [ ] **Step 4: Commit**

```bash
git add src/components/documentComponent/MarkdownContentEditor.tsx
git commit -m "feat: add MarkdownContentEditor component"
```

---

## Task 6: DocumentFormPanel component

**Files:**

- Create: `src/components/documentComponent/DocumentFormPanel.tsx`

**Interfaces:**

- Consumes: `STATUS_BADGE`, `fileTypeFromFileName` from Task 3's `documentDisplay.ts`; `FileDropzone` from Task 4; `MarkdownContentEditor` from Task 5; `DocumentSummary`, `DocumentUpdateInput`, `NewDocumentInput` types.
- Produces: `DocumentFormPanel` component with props `{ isOpen: boolean; document: DocumentSummary | null; categories: string[]; onClose: () => void; onCreate: (input: NewDocumentInput) => void; onUpdate: (documentId: string, updates: DocumentUpdateInput) => void }` — consumed by Task 7's `DocumentLibrary`.

`document` decides the mode: `null` means Upload/create (mode tabs + `FileDropzone`/`MarkdownContentEditor` visible, no status badge, "Upload" submit label); non-null means Edit (no mode tabs, no dropzone/editor, status badge visible, "Save changes" submit label, fields pre-filled). This component owns its own submit-validation (required name/category, a chosen file or non-empty written content depending on mode) and shows `toast.error` on failure — it does not call `toast.success`; that's `PortalShell`'s job once the create/update actually lands in the document list (Task 7), matching the "one place owns each action's toast" rule.

- [ ] **Step 1: Write the component**

```tsx
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
```

- [ ] **Step 2: Type-check and lint**

Run: `npm run build && npm run lint`
Expected: both succeed. No consumers yet (Task 7 wires this in).

- [ ] **Step 3: Trace the two modes by hand (no browser available)**

Confirm by reading the code: with `document={null}`, the header shows "Upload document" with no badge, mode tabs render, the dropzone/editor swap based on `contentMode`, and the submit button reads "Upload"; submitting calls `onCreate` with a `NewDocumentInput` whose `fileType`/`fileSizeBytes` come from either the selected `File` or the typed Markdown's byte length. With `document={someDoc}`, the header shows "Edit document details" with a status badge matching `someDoc.status`, no mode tabs, no dropzone/editor, fields pre-filled from `someDoc`, and the submit button reads "Save changes"; submitting calls `onUpdate(someDoc.id, ...)` with only the three editable fields. Confirm `document.id`/`document.status` are read only inside branches where `document` has already been null-checked (the `{document && (...)}` badge, and the `if (document) { ... }` branch in `handleSubmit`) — TypeScript's control-flow narrowing requires checking the `document` variable itself, not a derived boolean, which is why this component never introduces an `isEditMode` boolean and checks `document` directly everywhere.

- [ ] **Step 4: Commit**

```bash
git add src/components/documentComponent/DocumentFormPanel.tsx
git commit -m "feat: add DocumentFormPanel component"
```

---

## Task 7: Wire the form panel into DocumentLibrary and PortalShell

**Files:**

- Modify: `src/components/documentComponent/DocumentLibrary.tsx`
- Modify: `src/components/shell/PortalShell.tsx`

**Interfaces:**

- Consumes: `DocumentFormPanel` from Task 6; `NewDocumentInput`, `DocumentUpdateInput` types from Task 1.
- Produces: no new exports — `DocumentLibrary`'s props interface gains two new required props (`onCreateDocument`, `onUpdateDocument`); `PortalShell` is the only caller and is updated in the same task so nothing is left broken in between.

- [ ] **Step 1: Replace the full contents of `DocumentLibrary.tsx`**

```tsx
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
// knowledge-gap queue. Row clicks open the Document detail panel; Upload
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
        onCreate={onCreateDocument}
        onUpdate={onUpdateDocument}
      />
    </div>
  );
}
```

- [ ] **Step 2: Update `PortalShell.tsx`**

In `src/components/shell/PortalShell.tsx`, change the type-only import (currently `import type { DocumentSummary, KnowledgeGapItem, Space } from "../../types";`) to:

```ts
import type {
  DocumentSummary,
  DocumentUpdateInput,
  KnowledgeGapItem,
  NewDocumentInput,
  Space,
} from "../../types";
```

Immediately after the existing `handleDeleteDocument` function (the block reading `const handleDeleteDocument = (documentId: string) => { setDocuments((prev) => prev.filter((doc) => doc.id !== documentId)); toast.success("Document deleted."); };`), add:

```ts
const handleCreateDocument = (input: NewDocumentInput) => {
  const newDocument: DocumentSummary = {
    id: `doc-${Date.now()}`,
    spaceId: selectedSpace.id,
    name: input.name,
    fileType: input.fileType,
    category: input.category,
    description: input.description,
    status: "processing",
    updatedBy: {
      name: currentUser.name,
      avatarInitials: currentUser.avatarInitials,
    },
    updatedAt: new Date().toISOString(),
    fileSizeBytes: input.fileSizeBytes,
    citationCount: 0,
  };
  setDocuments((prev) => [newDocument, ...prev]);
  toast.success("Document uploaded.");
};

const handleUpdateDocument = (
  documentId: string,
  updates: DocumentUpdateInput,
) => {
  setDocuments((prev) =>
    prev.map((doc) =>
      doc.id === documentId
        ? {
            ...doc,
            name: updates.name,
            category: updates.category,
            description: updates.description,
            updatedBy: {
              name: currentUser.name,
              avatarInitials: currentUser.avatarInitials,
            },
            updatedAt: new Date().toISOString(),
          }
        : doc,
    ),
  );
  toast.success("Document details updated.");
};
```

A brand-new document starts with `status: "processing"` — this matches the spec's "a brand-new upload has no badge yet (nothing to show until processing starts after submit)": the badge has nothing to show while the document doesn't exist yet (mid-form), and the moment it's created, indexing begins, so its status is `"processing"` from that point on. There is no backend to progress it further in this mock app, so it stays `"processing"` unless a future piece adds that simulation — that's expected, not a bug.

Then, in the `<DocumentLibrary ... />` JSX (inside `<main>`), add the two new props alongside the existing `onDeleteDocument={handleDeleteDocument}` line:

```tsx
onDeleteDocument = { handleDeleteDocument };
onCreateDocument = { handleCreateDocument };
onUpdateDocument = { handleUpdateDocument };
```

- [ ] **Step 3: Type-check and lint**

Run: `npm run build && npm run lint`
Expected: both succeed.

- [ ] **Step 4: Trace the full click-through by hand (no browser available)**

Confirm by reading the code:

- Clicking "Upload document" (only rendered when `canManage`) calls `handleOpenUploadPanel` → `formPanelDocument` becomes `null`, `isFormPanelOpen` becomes `true` → `DocumentFormPanel` renders in create mode.
- Filling the form and clicking "Upload" calls `handleSubmit` inside `DocumentFormPanelBody`, which (with `document === null`) validates, then calls the `onCreate` prop → traces up to `DocumentLibrary`'s `onCreateDocument` prop → traces up to `PortalShell`'s `handleCreateDocument` → appends a new `DocumentSummary` (with `status: "processing"`, `citationCount: 0`) to the front of `documents` state and toasts success. The panel closes itself via its own `onClose()` call at the end of `handleSubmit`.
- Opening a document's detail panel, then clicking "Edit details" (only rendered when `canManage`, inside `DocumentDetailPanel`) calls `handleEditDetails` → closes the detail panel (`setIsDetailPanelOpen(false)`), sets `formPanelDocument` to the same `selectedDocument`, opens the form panel → `DocumentFormPanel` renders in edit mode, pre-filled from that document, showing its status badge.
- Editing fields and clicking "Save changes" calls `onUpdate(document.id, {...})` → traces up to `PortalShell`'s `handleUpdateDocument` → maps over `documents`, replacing the matching entry's `name`/`category`/`description`/`updatedBy`/`updatedAt`, leaving `status`/`citationCount`/`fileType`/`fileSizeBytes` untouched → toasts success.
- The new `documents` list (post-create or post-update) survives a Documents → Users & Roles → Documents nav round-trip for the same reason Delete already does: `documents` state lives in `PortalShell`, which never unmounts on a nav-key change — only the conditionally-rendered `DocumentLibrary` does.
- `PortalShell`'s existing `<DocumentLibrary ... />` call already needs no other changes — every other prop it currently passes (`space`, `canManage`, `activeTab`, `onTabChange`, `documents`, `onDeleteDocument`, `knowledgeGaps`, `onResolveGap`, `onIgnoreGap`) keeps the same name and type, only two new ones are added.

- [ ] **Step 5: Commit**

```bash
git add src/components/documentComponent/DocumentLibrary.tsx src/components/shell/PortalShell.tsx
git commit -m "feat: wire DocumentFormPanel into DocumentLibrary"
```

---

## Task 8: Document visibility (Public/Restricted)

**Added after this plan's original 7 tasks shipped** — not in the original design spec's Upload/Edit panel section. A document gets a `visibility` of `"public"` or `"restricted"`; restricted documents carry a `restrictedEmails: string[]` allowlist. No real backend enforcement — this only adds the data field plus UI to set and display it, same scope boundary as "Replace file" staying a stub.

**Files:**

- Modified: `src/types/commonType/document.ts`, `src/types/index.ts`
- Modified: `src/components/shell/shellMockData.ts` (7 mock documents backfilled; `doc-4` set to `restricted` as a demo case)
- Modified: `src/components/documentComponent/documentDisplay.ts` (added `isValidEmail`)
- Created: `src/components/documentComponent/EmailTagInput.tsx`
- Modified: `src/components/documentComponent/DocumentFormPanel.tsx` (Visibility toggle + conditional `EmailTagInput`, submit validation requiring ≥1 email when restricted)
- Modified: `src/components/documentComponent/DocumentDetailPanel.tsx` (read-only Visibility field + "Visible to" email list)
- Modified: `src/components/documentComponent/DocumentTable.tsx` (lock icon next to the name for restricted documents)
- Modified: `src/components/shell/PortalShell.tsx` (`handleCreateDocument`/`handleUpdateDocument` carry the two new fields)

- [x] **Step 1: Extend types** — `DocumentVisibility = "public" | "restricted"`; `DocumentSummary`, `NewDocumentInput`, `DocumentUpdateInput` gain `visibility` and `restrictedEmails: string[]`.
- [x] **Step 2: Backfill mock data** — all 7 documents get `visibility`/`restrictedEmails`; `doc-4` restricted with two sample emails as a demo case.
- [x] **Step 3: `isValidEmail` helper** — loose but real email-shape regex in `documentDisplay.ts`, used by `EmailTagInput`.
- [x] **Step 4: `EmailTagInput` component** — chip-style email list; Enter/comma commits the draft after validating shape and rejecting duplicates (`toast.error` on either); Backspace on an empty draft removes the last chip; each chip has its own remove button.
- [x] **Step 5: Wire into `DocumentFormPanel`** — Visibility field (two-button toggle) placed after Category, before Description; `EmailTagInput` renders only when Restricted is selected; submit blocks with `toast.error` when Restricted has zero emails; both `onCreate` payloads (upload/write) and `onUpdate` carry `visibility`/`restrictedEmails`.
- [x] **Step 6: Show in `DocumentDetailPanel`** — read-only "Visibility" field (with a lock glyph when restricted) in the metadata grid; a "Visible to" email-chip list renders below the grid when restricted.
- [x] **Step 7: Lock icon in `DocumentTable`** — a small lock icon renders next to the document name when `visibility === "restricted"`.
- [x] **Step 8: Wire `PortalShell`** — `handleCreateDocument` copies `input.visibility`/`input.restrictedEmails` onto the new `DocumentSummary`; `handleUpdateDocument` copies `updates.visibility`/`updates.restrictedEmails` onto the matched document.
- [x] **Step 9: Type-check and lint** — `npm run build && npm run lint`, both pass.
