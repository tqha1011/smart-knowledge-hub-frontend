# Document Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `PortalShell` placeholder for the "Documents" and "Needs attention" nav destinations with the real Document Library UI: a filterable/tabbed document table plus the knowledge-gap queue, per `docs/superpowers/specs/2026-08-05-knowledge-portal-ui-design.md` § "Document Library".

**Architecture:** One orchestrating component (`DocumentLibrary`) owns tab/filter UI state and renders two presentational children (`DocumentTable`, `NeedsAttentionList`) plus a shared `CategoryFilterChips`. `PortalShell` keeps owning the knowledge-gap **data** (lifted state, not just UI state) because the gap count also feeds the sidebar/rail/mobile-drawer badges — those are siblings of `DocumentLibrary`, not ancestors, so the count can't live inside `DocumentLibrary` alone. Documents themselves aren't mutated by this plan (no create/delete yet — that's the Upload/Edit and Detail panel pieces), so they can be derived local state inside `DocumentLibrary`.

**Tech Stack:** React 19, TypeScript 6 (bundler mode, `verbatimModuleSyntax`), Tailwind v4 (`@theme` tokens from `src/index.css`), `lucide-react` icons, `react-toastify` for stub/empty actions. No test runner is configured in this repo — verification is `npm run lint` + `npm run build` (type-check) + manual check in the running dev server, not automated tests.

## Global Constraints

- TypeScript `verbatimModuleSyntax` is on — type-only imports must use `import type { X } from '...'`.
- `noUnusedLocals` / `noUnusedParameters` / `erasableSyntaxOnly` are enforced by `npm run build` — no enums, no parameter properties, no dead locals.
- Components are PascalCase exports; DTO/shared types live in `src/types` and end with `Dto` where they represent a request payload.
- Tailwind classes are written inline, matching existing components (`CreateSpacePanel.tsx`, `AuthCard.tsx`) — no new global CSS.
- Do not call `axios` directly; there is no real backend for this feature yet, so components read mock data via plain imports/props (matches the existing `mockCurrentUser` / `mockSpaces` pattern in `shellMockData.ts`), not a `services/` HTTP call.
- `npm run lint` does not type-check; `npm run build` (`tsc -b && vite build`) is the real gate and must pass after every task.
- Husky's pre-commit hook runs `eslint --fix` + `prettier` on staged files automatically on `git commit` — expect it to reformat slightly; re-stage if it does.
- Commit subjects need a 10-character minimum (commitlint, conventional format `<type>: <description>`).

---

## Task 1: Document and knowledge-gap types

**Files:**

- Create: `src/types/commonType/document.ts`
- Modify: `src/types/index.ts`

**Interfaces:**

- Produces: `DocumentAuthor { name: string; avatarInitials: string }`, `DocumentFileType = "pdf" | "docx" | "markdown"`, `DocumentSummary { id, spaceId, name, fileType: DocumentFileType, category: string, updatedBy: DocumentAuthor, updatedAt: string, citationCount: number }`, `KnowledgeGapItem { id, spaceId, question, askedCount: number }` — all exported from `src/types`.

- [ ] **Step 1: Create the type file**

```ts
// src/types/commonType/document.ts

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
```

- [ ] **Step 2: Export the new types from the barrel**

In `src/types/index.ts`, add:

```ts
export type {
  DocumentAuthor,
  DocumentFileType,
  DocumentSummary,
  KnowledgeGapItem,
} from "./commonType/document";
```

- [ ] **Step 3: Type-check**

Run: `npm run build`
Expected: succeeds (new file has no consumers yet, so nothing else changes).

- [ ] **Step 4: Commit**

```bash
git add src/types/commonType/document.ts src/types/index.ts
git commit -m "feat: add Document and KnowledgeGap types"
```

---

## Task 2: Mock documents and knowledge gaps

**Files:**

- Modify: `src/components/shell/shellMockData.ts`

**Interfaces:**

- Consumes: `DocumentSummary`, `KnowledgeGapItem` from Task 1.
- Produces: `mockDocuments: DocumentSummary[]`, `mockKnowledgeGaps: KnowledgeGapItem[]` — both exported for Task 3/6/7 to import. Per-space `mockKnowledgeGaps` counts must match the existing `mockSpaceStats[spaceId].needsAttentionCount` values (`engineering: 3, hr: 0, sales: 1`) so the two mocks don't visibly disagree.

- [ ] **Step 1: Add the mock arrays**

In `src/components/shell/shellMockData.ts`, add the import and two new exports (keep the existing `mockSpaces`/`mockCurrentUser`/`mockNeedsAttentionCount`/`mockSpaceStats` as-is for this step):

```ts
import type {
  CurrentUser,
  DocumentSummary,
  KnowledgeGapItem,
  Space,
  SpaceType,
} from "../../types";

// ...(existing mockSpaceTypes / spaceColorPalette / mockSpaces / mockCurrentUser unchanged)...

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
    citationCount: 12,
  },
  {
    id: "doc-2",
    spaceId: "engineering",
    name: "Incident Response Runbook.md",
    fileType: "markdown",
    category: "Runbook",
    updatedBy: { name: "Alex Rivera", avatarInitials: "AR" },
    updatedAt: "2026-07-28T10:00:00Z",
    citationCount: 27,
  },
  {
    id: "doc-3",
    spaceId: "engineering",
    name: "Onboarding Checklist.docx",
    fileType: "docx",
    category: "Onboarding",
    updatedBy: { name: "Priya Nair", avatarInitials: "PN" },
    updatedAt: "2026-06-14T10:00:00Z",
    citationCount: 4,
  },
  {
    id: "doc-4",
    spaceId: "engineering",
    name: "Deployment Pipeline Overview.pdf",
    fileType: "pdf",
    category: "Architecture",
    updatedBy: { name: "Sam Ortiz", avatarInitials: "SO" },
    updatedAt: "2026-08-09T10:00:00Z",
    citationCount: 8,
  },
  {
    id: "doc-5",
    spaceId: "hr",
    name: "Time Off Policy.pdf",
    fileType: "pdf",
    category: "Policy",
    updatedBy: { name: "Jordan Lee", avatarInitials: "JL" },
    updatedAt: "2026-07-01T10:00:00Z",
    citationCount: 15,
  },
  {
    id: "doc-6",
    spaceId: "hr",
    name: "New Hire Onboarding.docx",
    fileType: "docx",
    category: "Onboarding",
    updatedBy: { name: "Jordan Lee", avatarInitials: "JL" },
    updatedAt: "2026-08-02T10:00:00Z",
    citationCount: 6,
  },
  {
    id: "doc-7",
    spaceId: "sales",
    name: "Pricing Playbook.pdf",
    fileType: "pdf",
    category: "Playbook",
    updatedBy: { name: "Morgan Diaz", avatarInitials: "MD" },
    updatedAt: "2026-08-10T10:00:00Z",
    citationCount: 19,
  },
];

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

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/shell/shellMockData.ts
git commit -m "feat: add mock documents and knowledge gaps"
```

---

## Task 3: `CategoryFilterChips` component

**Files:**

- Create: `src/components/documentComponent/CategoryFilterChips.tsx`

**Interfaces:**

- Consumes: nothing beyond React/props.
- Produces: `CategoryFilterChips({ categories, activeCategory, onSelect }: { categories: string[]; activeCategory: string | null; onSelect: (category: string | null) => void })` — `activeCategory: null` means the "All" chip is active. Consumed by Task 6.

- [ ] **Step 1: Create the component**

```tsx
// src/components/documentComponent/CategoryFilterChips.tsx

interface CategoryFilterChipsProps {
  categories: string[];
  /** `null` = the "All" chip is active. */
  activeCategory: string | null;
  onSelect: (category: string | null) => void;
}

// Pill-style, single active state — filters the Document Library table
// within the current Space. Only rendered above the "All documents" tab.
export function CategoryFilterChips({
  categories,
  activeCategory,
  onSelect,
}: CategoryFilterChipsProps) {
  const chipClass = (isActive: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold ${
      isActive
        ? "bg-accent text-white"
        : "bg-surface-sunken text-ink-muted hover:text-ink"
    }`;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={chipClass(activeCategory === null)}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onSelect(category)}
          className={chipClass(activeCategory === category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: succeeds (unused-but-exported component is fine; nothing imports it yet).

- [ ] **Step 3: Commit**

```bash
git add src/components/documentComponent/CategoryFilterChips.tsx
git commit -m "feat: add CategoryFilterChips component"
```

---

## Task 4: `DocumentTable` component

**Files:**

- Create: `src/components/documentComponent/DocumentTable.tsx`

**Interfaces:**

- Consumes: `DocumentSummary` from Task 1.
- Produces: `DocumentTable({ documents, onOpenDocument }: { documents: DocumentSummary[]; onOpenDocument: (doc: DocumentSummary) => void })`. Consumed by Task 6. `onOpenDocument` stands in for the not-yet-built Document detail panel — Task 6 wires it to a stub toast, not this component (keeps this component free of toast/UI-feedback concerns).

- [ ] **Step 1: Create the component**

```tsx
// src/components/documentComponent/DocumentTable.tsx

import { File, FileCode, FileText, MoreHorizontal } from "lucide-react";
import type { DocumentFileType, DocumentSummary } from "../../types";

interface DocumentTableProps {
  documents: DocumentSummary[];
  onOpenDocument: (doc: DocumentSummary) => void;
}

const FILE_TYPE_ICON: Record<DocumentFileType, typeof FileText> = {
  pdf: FileText,
  docx: File,
  markdown: FileCode,
};

function formatRelativeDate(iso: string): string {
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

// List/table view (spec: chosen over a card grid so category/owner/date/
// citation-count stay scannable and comparable at volume). Responsive
// column dropping — Updated by first, then Category — instead of
// horizontal scroll, per spec.
export function DocumentTable({
  documents,
  onOpenDocument,
}: DocumentTableProps) {
  if (documents.length === 0) {
    return (
      <div className="border-border text-ink-muted flex min-h-48 items-center justify-center rounded-lg border border-dashed text-center text-sm">
        No documents in this space yet.
      </div>
    );
  }

  return (
    <div className="border-border overflow-hidden rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-sunken text-ink-muted text-xs">
          <tr>
            <th className="px-4 py-2.5 font-medium">Name</th>
            <th className="hidden px-4 py-2.5 font-medium sm:table-cell">
              Category
            </th>
            <th className="hidden px-4 py-2.5 font-medium lg:table-cell">
              Updated by
            </th>
            <th className="px-4 py-2.5 font-medium">Updated</th>
            <th className="px-4 py-2.5 font-medium">Cited</th>
            <th className="px-2 py-2.5">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {documents.map((doc) => {
            const Icon = FILE_TYPE_ICON[doc.fileType];
            return (
              <tr key={doc.id} className="hover:bg-surface-sunken">
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onOpenDocument(doc)}
                    className="text-ink flex items-center gap-2 text-left font-medium"
                  >
                    <Icon size={16} className="text-ink-muted shrink-0" />
                    <span className="truncate">{doc.name}</span>
                  </button>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span className="bg-surface-sunken text-ink-muted rounded-md px-2 py-1 text-xs font-medium">
                    {doc.category}
                  </span>
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <div className="flex items-center gap-2">
                    <span className="bg-avatar-bg text-avatar-fg flex size-6 items-center justify-center rounded-full text-[10px] font-semibold">
                      {doc.updatedBy.avatarInitials}
                    </span>
                    <span className="text-ink-muted truncate">
                      {doc.updatedBy.name}
                    </span>
                  </div>
                </td>
                <td className="text-ink-muted px-4 py-3 whitespace-nowrap">
                  {formatRelativeDate(doc.updatedAt)}
                </td>
                <td className="px-4 py-3">
                  <span className="bg-citation-bg text-citation-fg rounded-full px-2 py-0.5 font-mono text-xs font-medium">
                    {doc.citationCount}
                  </span>
                </td>
                <td className="px-2 py-3">
                  <button
                    type="button"
                    onClick={() => onOpenDocument(doc)}
                    aria-label={`Actions for ${doc.name}`}
                    className="text-ink-muted hover:bg-surface flex size-8 items-center justify-center rounded-md"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/documentComponent/DocumentTable.tsx
git commit -m "feat: add DocumentTable component"
```

---

## Task 5: `NeedsAttentionList` component

**Files:**

- Create: `src/components/documentComponent/NeedsAttentionList.tsx`

**Interfaces:**

- Consumes: `KnowledgeGapItem` from Task 1.
- Produces: `NeedsAttentionList({ items, canManage, onResolve, onIgnore }: { items: KnowledgeGapItem[]; canManage: boolean; onResolve: (id: string) => void; onIgnore: (id: string) => void })`. Consumed by Task 6. `onResolve`/`onIgnore` are real actions (not stubs) — Task 6/7 wire them to remove the item from the lifted `knowledgeGaps` state in `PortalShell`.

- [ ] **Step 1: Create the component**

```tsx
// src/components/documentComponent/NeedsAttentionList.tsx

import { Check, X } from "lucide-react";
import type { KnowledgeGapItem } from "../../types";

interface NeedsAttentionListProps {
  items: KnowledgeGapItem[];
  /** Employee is read-only here — no Mark resolved / Ignore actions. */
  canManage: boolean;
  onResolve: (id: string) => void;
  onIgnore: (id: string) => void;
}

// The knowledge-gap queue: questions the (not yet built) RAG Assistant
// couldn't confidently answer. Deliberately a separate list from answer
// feedback (thumbs up/down) per spec — the two are never merged here.
export function NeedsAttentionList({
  items,
  canManage,
  onResolve,
  onIgnore,
}: NeedsAttentionListProps) {
  if (items.length === 0) {
    return (
      <div className="border-border text-ink-muted flex min-h-48 items-center justify-center rounded-lg border border-dashed text-center text-sm">
        Nothing needs attention right now.
      </div>
    );
  }

  return (
    <ul className="divide-border border-border divide-y overflow-hidden rounded-lg border">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-ink text-sm font-medium">{item.question}</p>
            <p className="text-ink-muted mt-0.5 font-mono text-xs">
              Asked {item.askedCount} time{item.askedCount === 1 ? "" : "s"}
            </p>
          </div>
          {canManage && (
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => onResolve(item.id)}
                className="bg-status-ready-bg text-status-ready-fg flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold"
              >
                <Check size={13} />
                Mark resolved
              </button>
              <button
                type="button"
                onClick={() => onIgnore(item.id)}
                className="text-ink-muted hover:bg-surface-sunken flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold"
              >
                <X size={13} />
                Ignore
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/documentComponent/NeedsAttentionList.tsx
git commit -m "feat: add NeedsAttentionList component"
```

---

## Task 6: `DocumentLibrary` orchestrator component

**Files:**

- Create: `src/components/documentComponent/DocumentLibrary.tsx`

**Interfaces:**

- Consumes: `CategoryFilterChips` (Task 3), `DocumentTable` (Task 4), `NeedsAttentionList` (Task 5), `mockDocuments` (Task 2), `Space`/`DocumentSummary`/`KnowledgeGapItem` types.
- Produces: `DocumentLibrary({ space, canManage, activeTab, onTabChange, knowledgeGaps, onResolveGap, onIgnoreGap }: DocumentLibraryProps)` — the single component `PortalShell` (Task 7) renders in place of its current documents/needs-attention placeholder. `activeTab`/`onTabChange` are controlled from the parent so the sidebar/rail nav highlighting and the in-page tabs never disagree (single source of truth lives in `PortalShell`'s existing `activeNavKey` state).

- [ ] **Step 1: Create the component**

```tsx
// src/components/documentComponent/DocumentLibrary.tsx

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";
import { CategoryFilterChips } from "./CategoryFilterChips";
import { DocumentTable } from "./DocumentTable";
import { NeedsAttentionList } from "./NeedsAttentionList";
import { mockDocuments } from "../shell/shellMockData";
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
// knowledge-gap queue. Document creation/edit/detail are separate pieces
// (Upload/Edit panel, Document detail panel) — not built yet, so the
// actions that would open them are toast stubs here.
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

  const documents = mockDocuments.filter((doc) => doc.spaceId === space.id);
  const categories = Array.from(
    new Set(documents.map((doc) => doc.category)),
  ).sort();
  const filteredDocuments = activeCategory
    ? documents.filter((doc) => doc.category === activeCategory)
    : documents;

  const handleOpenDocument = (_doc: DocumentSummary) => {
    toast.info("Document detail panel isn't built yet.");
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
        />
      ) : (
        <NeedsAttentionList
          items={knowledgeGaps}
          canManage={canManage}
          onResolve={onResolveGap}
          onIgnore={onIgnoreGap}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/documentComponent/DocumentLibrary.tsx
git commit -m "feat: add DocumentLibrary orchestrator component"
```

---

## Task 7: Wire `DocumentLibrary` into `PortalShell`

**Files:**

- Modify: `src/components/shell/PortalShell.tsx`

**Interfaces:**

- Consumes: `DocumentLibrary` (Task 6), `mockKnowledgeGaps` (Task 2).
- Produces: `PortalShell`'s `needsAttentionCount` is now derived from real per-space data instead of the flat `mockNeedsAttentionCount` mock.

- [ ] **Step 1: Replace the `mockNeedsAttentionCount` import and add gap state**

In `src/components/shell/PortalShell.tsx`, change:

```ts
import { mockCurrentUser, mockNeedsAttentionCount } from "./shellMockData";
```

to:

```ts
import { mockCurrentUser, mockKnowledgeGaps } from "./shellMockData";
import { DocumentLibrary } from "../documentComponent/DocumentLibrary";
import type { DocumentLibraryTab } from "../documentComponent/DocumentLibrary";
import type { KnowledgeGapItem } from "../../types";
```

Directly below the existing `const selectedSpace = membership.space;` line, add:

```ts
// Lifted here (not into DocumentLibrary) because the gap count also
// feeds the sidebar/rail/mobile-drawer badges, which are siblings of
// DocumentLibrary, not descendants. A fresh PortalShell mount (Space
// switches remount this component via the router key) reseeds from mock
// data, same pattern as mockCurrentUser elsewhere in this codebase.
const [knowledgeGaps, setKnowledgeGaps] = useState<KnowledgeGapItem[]>(() =>
  mockKnowledgeGaps.filter((gap) => gap.spaceId === selectedSpace.id),
);
const needsAttentionCount = knowledgeGaps.length;

const canManageDocuments = currentUser.isAdmin || membership.role === "Editor";

const handleResolveGap = (id: string) => {
  setKnowledgeGaps((prev) => prev.filter((gap) => gap.id !== id));
  toast.success("Marked resolved.");
};

const handleIgnoreGap = (id: string) => {
  setKnowledgeGaps((prev) => prev.filter((gap) => gap.id !== id));
  toast.info("Question ignored.");
};

const handleLibraryTabChange = (tab: DocumentLibraryTab) => {
  setActiveNavKey(tab === "needs-attention" ? "needs-attention" : "documents");
};
```

Add the `toast` import at the top alongside the existing imports:

```ts
import { toast } from "react-toastify";
```

- [ ] **Step 2: Replace every remaining `mockNeedsAttentionCount` reference**

`PortalShell.tsx` currently passes `mockNeedsAttentionCount` to `IconRail`, `Sidebar`, and `MobileNavDrawer` (three call sites). Replace all three with `needsAttentionCount` (the derived value from Step 1) — same prop name on each child, only the source changes.

- [ ] **Step 3: Replace the placeholder `<main>` content**

Replace this block:

```tsx
{
  /* Main content area — placeholder pane standing in for the routed page */
}
<main className="flex-1 overflow-y-auto p-6 pb-24 sm:pb-6">
  <p className="text-ink-muted mb-1 font-mono text-xs tracking-wide uppercase">
    {/* MOCK: subtitle format follows the spec's "{Space} · ..." pattern, count is a stand-in */}
    {selectedSpace.name} · placeholder content
  </p>
  <h1 className="font-display text-ink text-3xl font-semibold">
    {NAV_PAGE_TITLE[activeNavKey]}
  </h1>
  <div className="border-border text-ink-muted mt-6 flex min-h-64 items-center justify-center rounded-lg border border-dashed text-center text-sm">
    {activeNavKey === "documents" &&
      "Document Library UI is spec piece 2 — not built yet."}
    {activeNavKey === "needs-attention" &&
      "Needs attention (knowledge-gap queue) UI is spec piece 2 — not built yet."}
    {activeNavKey === "users-roles" &&
      "Users & Roles admin UI is spec piece 7 — not built yet."}
  </div>
</main>;
```

with:

```tsx
{
  /* Main content area */
}
<main className="flex-1 overflow-y-auto p-6 pb-24 sm:pb-6">
  {(activeNavKey === "documents" || activeNavKey === "needs-attention") && (
    <DocumentLibrary
      space={selectedSpace}
      canManage={canManageDocuments}
      activeTab={activeNavKey === "needs-attention" ? "needs-attention" : "all"}
      onTabChange={handleLibraryTabChange}
      knowledgeGaps={knowledgeGaps}
      onResolveGap={handleResolveGap}
      onIgnoreGap={handleIgnoreGap}
    />
  )}
  {activeNavKey === "users-roles" && (
    <>
      <p className="text-ink-muted mb-1 font-mono text-xs tracking-wide uppercase">
        {selectedSpace.name} · placeholder content
      </p>
      <h1 className="font-display text-ink text-3xl font-semibold">
        {NAV_PAGE_TITLE[activeNavKey]}
      </h1>
      <div className="border-border text-ink-muted mt-6 flex min-h-64 items-center justify-center rounded-lg border border-dashed text-center text-sm">
        Users & Roles admin UI is spec piece 7 — not built yet.
      </div>
    </>
  )}
</main>;
```

`NAV_PAGE_TITLE` stays in the file (still used for the `users-roles` placeholder) — do not delete it.

- [ ] **Step 4: Type-check**

Run: `npm run build`
Expected: succeeds. If `NAV_PAGE_TITLE`'s `documents`/`needs-attention` entries are now unused-by-name that's fine — it's still a `Record<ShellNavKey, string>` covering all three keys and TypeScript won't flag unused object properties.

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 6: Manual check in the dev server**

Run: `npm run dev` (if not already running), then in a browser:

1. Log in (any email/password) → lands on `/spaces`.
2. Click into "Engineering" → Document Library shows 4 documents, category chips (`All`, `Architecture`, `Onboarding`, `Runbook`), and the "Needs attention" tab badge shows `3`.
3. Click a category chip → table filters to that category only.
4. Click the "Needs attention" tab (or its sidebar/rail nav item) → both stay in sync; the 3 queued questions show with "Mark resolved"/"Ignore" buttons (Editor role in this Space).
5. Click "Mark resolved" on one → item disappears, sidebar/rail badge count drops to 2, toast confirms.
6. Click a document row or its "⋯" menu → toast "Document detail panel isn't built yet."
7. Click "Upload document" → toast "Upload document panel isn't built yet."
8. Resize the window below ~1024px → "Updated by" column disappears; below ~640px → "Category" column also disappears, table stays readable without horizontal scroll.

- [ ] **Step 7: Commit**

```bash
git add src/components/shell/PortalShell.tsx
git commit -m "feat: wire DocumentLibrary into PortalShell"
```

---

## Self-Review Notes

- **Spec coverage:** Tabs ✓ (Task 6), category chips ✓ (Task 3/6), table columns + responsive column-dropping ✓ (Task 4), Needs-attention queue with Mark resolved/Ignore ✓ (Task 5/7), permission gating (Employee read-only, Editor/Admin full) ✓ (`canManage` threaded through from Task 7), title/subtitle format ✓ (Task 6). Document detail panel, Upload/Edit panel, and their row-menu actions are explicitly out of scope for this plan (separate spec pieces) — stubbed with toasts, matching the existing `spacesOverviewPage.tsx` stub convention.
- **Type consistency:** `DocumentLibraryTab` is defined once in `DocumentLibrary.tsx` and imported by `PortalShell.tsx` (Task 7) rather than redefined — confirmed the type name and its two string values (`"all"`, `"needs-attention"`) match everywhere they're used.
- **No placeholders:** every step above has full, real code — no TODOs left for the implementer to fill in.
