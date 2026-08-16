# Document Detail Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Document detail panel isn't built yet." toast stub in `DocumentLibrary` with the real floating slide-over panel, per `docs/superpowers/specs/2026-08-05-knowledge-portal-ui-design.md` § "Document detail panel": metadata + action row (Open/Download, Edit details, Replace file, Delete) + a "Cited by the Assistant" list, opened by clicking a row.

**Architecture:** One new presentational component, `DocumentDetailPanel`, follows the exact floating slide-over pattern already established by `AskAiStubPanel` (`fixed inset-0` wrapper, backdrop button, `motion.div` sliding in from the right, `AnimatePresence` for exit animation), but at the spec's 420px width instead of Ask AI's 440px. `DocumentLibrary` (the existing orchestrator) gains the state this panel needs: which document is selected, whether the panel is open, and — because Delete must actually remove a document — the document list itself becomes local state seeded from mock data instead of a derived `mockDocuments.filter(...)` expression. `Edit details`, `Replace file`, and `Open/Download` stay toast stubs (they depend on the Upload/Edit panel piece and on a real backend, neither of which exist yet), matching the existing stub pattern already used for the "Upload document" button. Two small display helpers (`formatRelativeDate`, `FILE_TYPE_ICON`) currently live inside `DocumentTable.tsx`; both the table and the new panel need them, so they move to a shared `documentDisplay.ts` module — this is a small refactor of existing code, not new functionality.

**Tech Stack:** React 19, TypeScript 6 (bundler mode, `verbatimModuleSyntax`), Tailwind v4 (`@theme` tokens from `src/index.css`), `framer-motion` (already used by `AskAiStubPanel`), `lucide-react` icons, `react-toastify` for stub actions and the real Delete confirmation toast. No test runner is configured in this repo — verification is `npm run lint` + `npm run build` (type-check), plus careful code-tracing in place of manual browser testing (**no browser is available in this environment** — Playwright MCP has no working Chromium/Chrome channel, and this was already worked around the same way for Document Library's Task 7).

## Global Constraints

- TypeScript `verbatimModuleSyntax` is on — type-only imports must use `import type { X } from '...'`.
- `noUnusedLocals` / `noUnusedParameters` / `erasableSyntaxOnly` are enforced by `npm run build` — no enums, no parameter properties, no dead locals. ESLint here has **no `argsIgnorePattern`**, so an unused parameter can't be suppressed with an underscore prefix either — just don't declare parameters you don't use.
- Components are PascalCase exports; DTO/shared types live in `src/types` and are re-exported through `src/types/index.ts`.
- Tailwind classes are written inline, matching existing components (`AskAiStubPanel.tsx`, `DocumentTable.tsx`, `NeedsAttentionList.tsx`) — no new global CSS.
- No real backend exists yet — components read/write mock data via plain imports/local state (matches the existing `mockDocuments` / `mockKnowledgeGaps` pattern in `shellMockData.ts`), not a `services/` HTTP call.
- `npm run lint` does not type-check; `npm run build` (`tsc -b && vite build`) is the real gate and must pass after every task.
- Husky's pre-commit hook runs `eslint --fix` + `prettier` on staged files automatically on `git commit` — expect it to reformat slightly; re-stage if it does.
- Commit subjects need a 10-character minimum (commitlint, conventional format `<type>: <description>`).
- Hooks (`useState`, `useReducedMotion`, etc.) must never be called after an early-return guard — a past task in this repo hit exactly this bug (`react-hooks/rules-of-hooks`). None of this plan's tasks add an early return before a hook, but keep it in mind if refactoring.
- **No browser is available in this sandbox.** Any step that would normally say "click the row and confirm the panel opens" instead means: read the JSX/state wiring carefully and confirm by tracing props/handlers, not by running the dev server in a browser.

---

## Task 1: DocumentCitation type and DocumentSummary.fileSizeBytes

**Files:**

- Modify: `src/types/commonType/document.ts`
- Modify: `src/types/index.ts`

**Interfaces:**

- Produces: `DocumentCitation { id: string; documentId: string; question: string; askedCount: number; lastAskedAt: string }`, and `DocumentSummary` gains `fileSizeBytes: number`. Both exported from `src/types`.

- [ ] **Step 1: Add `fileSizeBytes` to `DocumentSummary` and add the `DocumentCitation` type**

In `src/types/commonType/document.ts`, replace the full file contents with:

```ts
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
```

- [ ] **Step 2: Export `DocumentCitation` from the types barrel**

In `src/types/index.ts`, change:

```ts
export type {
  DocumentAuthor,
  DocumentFileType,
  DocumentSummary,
  KnowledgeGapItem,
} from "./commonType/document";
```

to:

```ts
export type {
  DocumentAuthor,
  DocumentFileType,
  DocumentSummary,
  KnowledgeGapItem,
  DocumentCitation,
} from "./commonType/document";
```

- [ ] **Step 3: Type-check**

Run: `npm run build`
Expected: FAILS — `shellMockData.ts`'s `mockDocuments` entries no longer satisfy `DocumentSummary` because they're missing the new required `fileSizeBytes` field. This is expected; Task 2 fixes it. Confirm the failure is exactly that (missing `fileSizeBytes`), not something else.

- [ ] **Step 4: Commit**

```bash
git add src/types/commonType/document.ts src/types/index.ts
git commit -m "feat: add DocumentCitation type and fileSizeBytes field"
```

---

## Task 2: Mock file sizes and citation data

**Files:**

- Modify: `src/components/shell/shellMockData.ts`

**Interfaces:**

- Consumes: `DocumentCitation` from Task 1.
- Produces: `mockDocumentCitations: DocumentCitation[]` (exported for Task 5 to import/filter). Each `mockDocuments[i].fileSizeBytes` is set. `mockDocuments[i].citationCount` becomes derived from `mockDocumentCitations` via a new `countCitations(documentId)` helper (same pattern as the existing `countDocuments(spaceId)` helper a few lines above it) instead of a hardcoded literal, so the table's citation count and the panel's citation list can never disagree — this is the same class of mock-consistency bug a previous review caught for `mockSpaceStats.documentCount`, being avoided proactively here.

- [ ] **Step 1: Add `fileSizeBytes` to every `mockDocuments` entry, add `mockDocumentCitations`, and derive `citationCount`**

In `src/components/shell/shellMockData.ts`, replace the `mockDocuments` array and everything from `function countDocuments` through the end of the file with:

```ts
// MOCK: stand-in for `GET /documents/:documentId/citations`. Backs the
// Document detail panel's "Cited by the Assistant" list. Each document's
// citationCount below is the sum of askedCount across its entries here.
// Declared before mockDocuments (not after) because mockDocuments calls
// countCitations() at module-evaluation time, and a `const` isn't
// initialized until its own declaration line runs — declaring it later
// would throw "Cannot access before initialization".
export const mockDocumentCitations: DocumentCitation[] = [
  {
    id: "cite-1",
    documentId: "doc-1",
    question: "What's the correct pagination pattern for list endpoints?",
    askedCount: 7,
    lastAskedAt: "2026-08-09T14:20:00Z",
  },
  {
    id: "cite-2",
    documentId: "doc-1",
    question: "How do we version breaking API changes?",
    askedCount: 5,
    lastAskedAt: "2026-08-06T11:05:00Z",
  },
  {
    id: "cite-3",
    documentId: "doc-2",
    question: "What's the escalation path when a Sev1 alert fires at night?",
    askedCount: 16,
    lastAskedAt: "2026-08-11T02:40:00Z",
  },
  {
    id: "cite-4",
    documentId: "doc-2",
    question: "How long do we wait before declaring an incident resolved?",
    askedCount: 11,
    lastAskedAt: "2026-08-07T16:15:00Z",
  },
  {
    id: "cite-5",
    documentId: "doc-3",
    question: "What do I need to set up on day one?",
    askedCount: 4,
    lastAskedAt: "2026-06-20T09:00:00Z",
  },
  {
    id: "cite-6",
    documentId: "doc-4",
    question: "How does the canary rollout stage work?",
    askedCount: 8,
    lastAskedAt: "2026-08-10T08:30:00Z",
  },
  {
    id: "cite-7",
    documentId: "doc-5",
    question: "How many PTO days do new hires accrue in year one?",
    askedCount: 9,
    lastAskedAt: "2026-07-30T10:00:00Z",
  },
  {
    id: "cite-8",
    documentId: "doc-5",
    question: "Can unused PTO roll over to the next year?",
    askedCount: 6,
    lastAskedAt: "2026-07-15T13:45:00Z",
  },
  {
    id: "cite-9",
    documentId: "doc-6",
    question: "What paperwork does a new hire need to complete before day one?",
    askedCount: 6,
    lastAskedAt: "2026-08-03T09:10:00Z",
  },
  {
    id: "cite-10",
    documentId: "doc-7",
    question: "What's the standard discount range for annual contracts?",
    askedCount: 12,
    lastAskedAt: "2026-08-11T15:00:00Z",
  },
  {
    id: "cite-11",
    documentId: "doc-7",
    question: "How do we price add-on seats mid-contract?",
    askedCount: 7,
    lastAskedAt: "2026-08-05T12:20:00Z",
  },
];

function countCitations(documentId: string): number {
  return mockDocumentCitations
    .filter((citation) => citation.documentId === documentId)
    .reduce((sum, citation) => sum + citation.askedCount, 0);
}

// MOCK: stand-in for `GET /spaces/:spaceId/documents`.
export const mockDocuments: DocumentSummary[] = [
  {
    id: "doc-1",
    spaceId: "engineering",
    name: "API Design Guidelines.pdf",
    fileType: "pdf",
    category: "Architecture",
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
    updatedBy: { name: "Morgan Diaz", avatarInitials: "MD" },
    updatedAt: "2026-08-10T10:00:00Z",
    fileSizeBytes: 2202009,
    citationCount: countCitations("doc-7"),
  },
];

function countDocuments(spaceId: string): number {
  return mockDocuments.filter((doc) => doc.spaceId === spaceId).length;
}

// MOCK: per-space stats shown on the Spaces overview cards — stands in for
// whatever summary endpoint would back that grid. documentCount is derived
// from mockDocuments so the two can't drift out of sync.
export const mockSpaceStats: Record<
  string,
  { documentCount: number; needsAttentionCount: number }
> = {
  engineering: {
    documentCount: countDocuments("engineering"),
    needsAttentionCount: 3,
  },
  hr: { documentCount: countDocuments("hr"), needsAttentionCount: 0 },
  sales: {
    documentCount: countDocuments("sales"),
    needsAttentionCount: 1,
  },
};

// MOCK: stand-in for `GET /spaces/:spaceId/knowledge-gaps`. Counts per
// spaceId intentionally match mockSpaceStats[spaceId].needsAttentionCount.
export const mockKnowledgeGaps: KnowledgeGapItem[] = [
  {
    id: "gap-1",
    spaceId: "engineering",
    question: "What's our rollback procedure for a failed production deploy?",
    askedCount: 5,
  },
  {
    id: "gap-2",
    spaceId: "engineering",
    question: "Who owns the on-call rotation for the payments service?",
    askedCount: 2,
  },
  {
    id: "gap-3",
    spaceId: "engineering",
    question: "What's the retention policy for staging database snapshots?",
    askedCount: 1,
  },
  {
    id: "gap-4",
    spaceId: "sales",
    question: "What discount approval is needed for multi-year contracts?",
    askedCount: 1,
  },
];
```

Note: `mockDocumentCitations` is declared _before_ `mockDocuments` in the code block above — this order matters and must be preserved. `mockDocuments`'s array literal calls `countCitations(...)` at module-evaluation time, which reads `mockDocumentCitations`; since `mockDocumentCitations` is a `const`, it isn't initialized until its own declaration line runs, so if it appeared after `mockDocuments` this would throw "Cannot access 'mockDocumentCitations' before initialization" at import time. `countCitations` itself can safely stay a `function` declaration below the data it depends on (function declarations are hoisted, so being called from within `mockDocuments`'s literal above its own textual position is fine) — this mirrors the existing `countDocuments` pattern already working in this file today.

Also update the `import type` at the top of the file to include `DocumentCitation`:

```ts
import type {
  CurrentUser,
  DocumentCitation,
  DocumentSummary,
  KnowledgeGapItem,
  Space,
} from "../../types";
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Sanity-check the citation sums by hand**

Confirm each document's `citationCount` (now computed) still matches what it was hardcoded to before this task: doc-1 = 12 (7+5), doc-2 = 27 (16+11), doc-3 = 4, doc-4 = 8, doc-5 = 15 (9+6), doc-6 = 6, doc-7 = 19 (12+7). This means the Document Library table and its subtitle count don't visibly change from this task — only the Document detail panel (Task 5) will expose the new per-question breakdown.

- [ ] **Step 4: Commit**

```bash
git add src/components/shell/shellMockData.ts
git commit -m "feat: add mock file sizes and document citations"
```

---

## Task 3: Shared document-display helpers

**Files:**

- Create: `src/components/documentComponent/documentDisplay.ts`
- Modify: `src/components/documentComponent/DocumentTable.tsx`

**Interfaces:**

- Produces: `FILE_TYPE_ICON: Record<DocumentFileType, typeof FileText>`, `FILE_TYPE_LABEL: Record<DocumentFileType, string>`, `formatRelativeDate(iso: string): string`, `formatFileSize(bytes: number): string` — all exported from `documentDisplay.ts`, consumed by both `DocumentTable.tsx` (Step 2 below) and `DocumentDetailPanel.tsx` (Task 4).

This task is a pure refactor of existing, already-working code (`FILE_TYPE_ICON` and `formatRelativeDate` currently live inline in `DocumentTable.tsx`) plus two new small helpers the detail panel needs. No behavior change to `DocumentTable`.

- [ ] **Step 1: Create the shared helpers module**

```ts
// src/components/documentComponent/documentDisplay.ts
import { File, FileCode, FileText } from "lucide-react";
import type { DocumentFileType } from "../../types";

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
```

- [ ] **Step 2: Update `DocumentTable.tsx` to use the shared helpers instead of its own copies**

In `src/components/documentComponent/DocumentTable.tsx`, replace the top of the file (imports through the end of the `formatRelativeDate` function, i.e. everything before `// List/table view`) with:

```tsx
import { MoreHorizontal } from "lucide-react";
import type { DocumentSummary } from "../../types";
import { FILE_TYPE_ICON, formatRelativeDate } from "./documentDisplay";

interface DocumentTableProps {
  documents: DocumentSummary[];
  onOpenDocument: (doc: DocumentSummary) => void;
  /** isAdmin || Editor-in-this-Space — gates the row (⋯) action menu. */
  canManage: boolean;
}
```

The rest of the file (from `// List/table view` down, i.e. the `DocumentTable` function body) is unchanged — it already references `FILE_TYPE_ICON` and `formatRelativeDate` by name, which now resolve to the imported versions instead of local ones.

- [ ] **Step 3: Type-check and lint**

Run: `npm run build && npm run lint`
Expected: both succeed. `DocumentTable.tsx` should have no remaining local `FILE_TYPE_ICON` const or `formatRelativeDate` function — confirm with `grep -n "FILE_TYPE_ICON\|function formatRelativeDate" src/components/documentComponent/DocumentTable.tsx`, which should only show the import line.

- [ ] **Step 4: Commit**

```bash
git add src/components/documentComponent/documentDisplay.ts src/components/documentComponent/DocumentTable.tsx
git commit -m "refactor: extract shared document display helpers"
```

---

> **Addendum (2026-08-16):** `DocumentSummary` later gained a `description` field (see `2026-08-12-upload-edit-document-panel.md`, Task 2). `DocumentDetailPanel` was updated to render it as a short paragraph under the title, above the metadata `dl` — not shown when empty. The Task 4 code sample below predates that change and is left as-is (a log of what was built at the time); see the current `DocumentDetailPanel.tsx` for the live version. Spec updated to match in `docs/superpowers/specs/2026-08-05-knowledge-portal-ui-design.md` § "Document detail panel".

## Task 4: DocumentDetailPanel component

**Files:**

- Create: `src/components/documentComponent/DocumentDetailPanel.tsx`

**Interfaces:**

- Consumes: `FILE_TYPE_ICON`, `FILE_TYPE_LABEL`, `formatRelativeDate`, `formatFileSize` from Task 3's `documentDisplay.ts`; `DocumentCitation`, `DocumentSummary`, `Space` types.
- Produces: `DocumentDetailPanel` component with props `{ document: DocumentSummary | null; isOpen: boolean; space: Space; canManage: boolean; citations: DocumentCitation[]; onClose: () => void; onOpenFile: () => void; onEditDetails: () => void; onReplaceFile: () => void; onDelete: (documentId: string) => void }` — consumed by Task 5's `DocumentLibrary`.

This component is purely presentational: every action (`onClose`, `onOpenFile`, `onEditDetails`, `onReplaceFile`, `onDelete`) is a callback prop. It doesn't call `toast` or mutate any state itself — `DocumentLibrary` (Task 5) owns all of that, matching how `DocumentTable`/`NeedsAttentionList` already bubble actions up via props rather than handling them inline.

`document` can be `null` (before any row has ever been clicked) or a stale reference to the last-opened document after the panel has closed — the `isOpen && document` guard means stale data is never rendered, only ever held onto so the exit animation has something to show while it plays.

- [ ] **Step 1: Write the component**

```tsx
// src/components/documentComponent/DocumentDetailPanel.tsx
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Download, Pencil, RefreshCw, Trash2, X } from "lucide-react";
import type { DocumentCitation, DocumentSummary, Space } from "../../types";
import {
  FILE_TYPE_ICON,
  FILE_TYPE_LABEL,
  formatFileSize,
  formatRelativeDate,
} from "./documentDisplay";

interface DocumentDetailPanelProps {
  document: DocumentSummary | null;
  isOpen: boolean;
  space: Space;
  /** isAdmin || Editor-in-this-Space — gates Edit details / Replace file / Delete. */
  canManage: boolean;
  citations: DocumentCitation[];
  onClose: () => void;
  onOpenFile: () => void;
  onEditDetails: () => void;
  onReplaceFile: () => void;
  onDelete: (documentId: string) => void;
}

// Floating slide-over panel (420px, right-aligned), same pattern as
// AskAiStubPanel — dims/blurs the page behind it, closes back to exactly
// where the user was. Metadata + actions only, no embedded file preview
// (spec deliberately defers a PDF/doc viewer) and no version history.
export function DocumentDetailPanel({
  document,
  isOpen,
  space,
  canManage,
  citations,
  onClose,
  onOpenFile,
  onEditDetails,
  onReplaceFile,
  onDelete,
}: DocumentDetailPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && document && (
        <DocumentDetailPanelBody
          document={document}
          space={space}
          canManage={canManage}
          citations={citations}
          onClose={onClose}
          onOpenFile={onOpenFile}
          onEditDetails={onEditDetails}
          onReplaceFile={onReplaceFile}
          onDelete={onDelete}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
    </AnimatePresence>
  );
}

interface DocumentDetailPanelBodyProps {
  document: DocumentSummary;
  space: Space;
  canManage: boolean;
  citations: DocumentCitation[];
  onClose: () => void;
  onOpenFile: () => void;
  onEditDetails: () => void;
  onReplaceFile: () => void;
  onDelete: (documentId: string) => void;
  prefersReducedMotion: boolean | null;
}

// Split out from DocumentDetailPanel so `document` is narrowed to
// non-null via props typing instead of needing a `document!` assertion
// or an inline IIFE everywhere it's read below.
function DocumentDetailPanelBody({
  document,
  space,
  canManage,
  citations,
  onClose,
  onOpenFile,
  onEditDetails,
  onReplaceFile,
  onDelete,
  prefersReducedMotion,
}: DocumentDetailPanelBodyProps) {
  const FileIcon = FILE_TYPE_ICON[document.fileType];

  return (
    <div className="fixed inset-0 z-40">
      <motion.button
        type="button"
        aria-label="Close document details"
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
        className="bg-surface absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col overflow-y-auto p-5 shadow-lg"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2">
            <FileIcon size={18} className="text-ink-muted mt-0.5 shrink-0" />
            <h2 className="font-display text-ink truncate text-lg font-semibold">
              {document.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close document details"
            className="text-ink-muted hover:bg-surface-sunken flex size-9 shrink-0 items-center justify-center rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-ink-muted text-xs">Space</dt>
            <dd className="text-ink mt-0.5 flex items-center gap-1.5 font-medium">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: space.colorDot }}
              />
              {space.name}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted text-xs">File type</dt>
            <dd className="text-ink mt-0.5 font-medium">
              {FILE_TYPE_LABEL[document.fileType]}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted text-xs">File size</dt>
            <dd className="text-ink mt-0.5 font-medium">
              {formatFileSize(document.fileSizeBytes)}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted text-xs">Updated</dt>
            <dd className="text-ink mt-0.5 font-medium">
              {formatRelativeDate(document.updatedAt)}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-ink-muted text-xs">Updated by</dt>
            <dd className="mt-1 flex items-center gap-2">
              <span className="bg-avatar-bg text-avatar-fg flex size-6 items-center justify-center rounded-full text-[10px] font-semibold">
                {document.updatedBy.avatarInitials}
              </span>
              <span className="text-ink font-medium">
                {document.updatedBy.name}
              </span>
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onOpenFile}
            className="bg-accent flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white"
          >
            <Download size={15} />
            Open / Download
          </button>
          {canManage && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onEditDetails}
                  className="border-border text-ink hover:bg-surface-sunken flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold"
                >
                  <Pencil size={14} />
                  Edit details
                </button>
                <button
                  type="button"
                  onClick={onReplaceFile}
                  className="border-border text-ink hover:bg-surface-sunken flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold"
                >
                  <RefreshCw size={14} />
                  Replace file
                </button>
              </div>
              <button
                type="button"
                onClick={() => onDelete(document.id)}
                className="bg-warn-bg text-warn-fg mt-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-ink text-sm font-semibold">
            Cited by the Assistant
          </h3>
          {citations.length === 0 ? (
            <div className="border-border text-ink-muted mt-2 flex min-h-24 items-center justify-center rounded-lg border border-dashed text-center text-sm">
              Not cited by the Assistant yet.
            </div>
          ) : (
            <ul className="divide-border border-border mt-2 divide-y overflow-hidden rounded-lg border">
              {citations.map((citation) => (
                <li key={citation.id} className="px-3 py-2.5">
                  <p className="text-ink text-sm font-medium">
                    {citation.question}
                  </p>
                  <p className="text-ink-muted mt-0.5 font-mono text-xs">
                    Asked {citation.askedCount} time
                    {citation.askedCount === 1 ? "" : "s"} · Last asked{" "}
                    {formatRelativeDate(citation.lastAskedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npm run build && npm run lint`
Expected: both succeed. This component has no consumers yet (Task 5 wires it up), so nothing else in the app changes.

- [ ] **Step 3: Trace the permission gating by hand (no browser available)**

Confirm by reading the code above: when `canManage` is `false`, the JSX between `{canManage && (` and the matching `)}` — the `Edit details` / `Replace file` two-button row and the `Delete` button — does not render, leaving only the `Open / Download` primary button and the read-only "Cited by the Assistant" list. This matches the spec's Employee-vs-Editor/Admin split exactly.

- [ ] **Step 4: Commit**

```bash
git add src/components/documentComponent/DocumentDetailPanel.tsx
git commit -m "feat: add DocumentDetailPanel component"
```

---

## Task 5: Wire the panel into DocumentLibrary

**Files:**

- Modify: `src/components/documentComponent/DocumentLibrary.tsx`

**Interfaces:**

- Consumes: `DocumentDetailPanel` from Task 4; `mockDocumentCitations` from Task 2.
- Produces: no new exports — `DocumentLibrary`'s existing props (`space`, `canManage`, `activeTab`, `onTabChange`, `knowledgeGaps`, `onResolveGap`, `onIgnoreGap`) are unchanged from the outside; `PortalShell.tsx` needs no changes.

Two behavior changes inside `DocumentLibrary`:

1. `documents` becomes local `useState` (seeded once from `mockDocuments` filtered by `space.id`) instead of a plain derived `const`, because Delete needs to actually remove an entry. This mirrors how `PortalShell` already made `knowledgeGaps` local state for the same reason (see `PortalShell.tsx`'s `knowledgeGaps` `useState`). `DocumentLibrary` is remounted whenever the user switches Spaces (Space switching navigates to a new `/spaces/:spaceId` URL, which remounts the whole `PortalShell` subtree via its router key — same reasoning already documented on `PortalShell`'s `knowledgeGaps` state), so seeding once at mount from `space.id` is safe.
2. The row-click handler (`handleOpenDocument`, currently a toast stub) instead opens the new panel; three new handlers back the panel's other actions.

- [ ] **Step 1: Replace the full file contents**

```tsx
// src/components/documentComponent/DocumentLibrary.tsx
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";
import { CategoryFilterChips } from "./CategoryFilterChips";
import { DocumentTable } from "./DocumentTable";
import { NeedsAttentionList } from "./NeedsAttentionList";
import { DocumentDetailPanel } from "./DocumentDetailPanel";
import { mockDocuments, mockDocumentCitations } from "../shell/shellMockData";
import type { DocumentSummary, KnowledgeGapItem, Space } from "../../types";

export type DocumentLibraryTab = "all" | "needs-attention";

interface DocumentLibraryProps {
  space: Space;
  /** isAdmin || Editor-in-this-Space — gates Upload, row actions, gap actions. */
  canManage: boolean;
  activeTab: DocumentLibraryTab;
  onTabChange: (tab: DocumentLibraryTab) => void;
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
  knowledgeGaps,
  onResolveGap,
  onIgnoreGap,
}: DocumentLibraryProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Local state (not a derived const) because Delete below needs to
  // actually remove an entry. Seeded once at mount — Space switches
  // remount this whole component via PortalShell's router key, same
  // reasoning as PortalShell's own knowledgeGaps state.
  const [documents, setDocuments] = useState<DocumentSummary[]>(() =>
    mockDocuments.filter((doc) => doc.spaceId === space.id),
  );

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
    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    setIsDetailPanelOpen(false);
    toast.success("Document deleted.");
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
```

- [ ] **Step 2: Type-check and lint**

Run: `npm run build && npm run lint`
Expected: both succeed.

- [ ] **Step 3: Trace the full click-through by hand (no browser available)**

Read the code and confirm each of these chains holds:

- Clicking a document's Name button in `DocumentTable` calls `onOpenDocument(doc)` (existing prop, unchanged) → `DocumentLibrary`'s `handleOpenDocument` → sets `selectedDocument` and `isDetailPanelOpen(true)` → `DocumentDetailPanel` receives `isOpen={true}` and a non-null `document`, so it renders.
- Clicking the ⋯ button (only rendered when `canManage`) calls the same `onOpenDocument(doc)` — same panel opens, permission gating inside the panel itself (not the trigger) is what limits what an Employee can do once it's open.
- Clicking Delete inside the panel calls `onDelete(document.id)` → `handleDeleteDocument` → removes the doc from `documents` state, closes the panel, toasts success. Because `documents` is now local state (not the shared `mockDocuments` import), this mutation is scoped to this mounted `DocumentLibrary` instance and doesn't corrupt `mockDocuments` for other Spaces or a future remount.
- Closing the panel (backdrop click or the X button) calls `onClose` → `handleCloseDetail` → `isDetailPanelOpen` becomes `false`; `selectedDocument` is deliberately left as-is (not nulled) so the exit animation still has data to render while it plays.

- [ ] **Step 4: Commit**

```bash
git add src/components/documentComponent/DocumentLibrary.tsx
git commit -m "feat: wire DocumentDetailPanel into DocumentLibrary"
```
