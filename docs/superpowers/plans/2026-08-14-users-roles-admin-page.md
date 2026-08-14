# Users & Roles Admin Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Users & Roles admin page — the 7th and last piece of `docs/superpowers/specs/2026-08-05-knowledge-portal-ui-design.md`: an Admin-only, org-wide people list (list/table, same shape as Document Library) plus a User detail slide-over (System-wide Admin toggle + editable Space memberships + destructive Remove) and an Invite people slide-over (a stack of independently-configured person cards). Replaces the `"Users & Roles admin UI is spec piece 7 — not built yet"` placeholder in `PortalShell.tsx`.

**Also in scope (explicitly requested, not incidental):** extract a shared `usePanelDismiss` hook (Escape-to-close + Tab focus trap + return-focus-on-close) and retrofit it onto the four existing floating panels (`DocumentDetailPanel`, `DocumentFormPanel`, `AskAiPanelBody`, `CreateSpacePanel`), in addition to using it on the two new panels this plan adds. Three consecutive final-branch reviews (Document detail, Upload/Edit, Ask AI) independently flagged the same accessibility gap — none of this app's slide-over panels trap focus or close on Escape, so a keyboard-only user can Tab past a panel's controls into the nav/table behind its backdrop. Rather than shipping a fourth and fifth ungated panel and parking the finding a fourth time, this plan fixes it everywhere at once.

**Architecture:** A new `src/components/usersComponent/` directory (matching the existing `documentComponent`/`askAiComponent` convention): `UsersRolesPage` (owns local UI state — selected row, which panel is open — the same shape as `DocumentLibrary`), `UsersTable` (list/table, presentational), `UserDetailPanel` (slide-over, Panel+Body split like `DocumentDetailPanel`), `InvitePeoplePanel` (slide-over, Panel+Body split, a stack of person cards). The `users` array itself is **not** owned by `UsersRolesPage` — like `documents`/`knowledgeGaps`, it's lifted into `PortalShell`, because `UsersRolesPage` unmounts whenever the Admin navigates to a sibling nav item (`activeNavKey` conditionally renders it), and an edit/remove made here must not be silently undone on the next unmount/remount round-trip — the exact bug class the Document detail panel's final review caught and fixed for `documents`.

A new `src/components/common/usePanelDismiss.ts` hook returns a ref to attach to a panel's outer `motion.div` and wires Escape/Tab/return-focus behavior via a `document`-level keydown listener scoped to that ref's subtree. It's added once and then wired into six panels total: the four existing ones (a small, mechanical retrofit — attach the ref, add `role="dialog"`/`aria-modal`/`aria-label` where missing) and the two new ones this plan builds.

**Scope boundaries, decided up front so no task re-litigates them:**

- No real backend — `users` is mock data (`mockOrgUsers`, new in `shellMockData.ts`), same as every other list in this app.
- Editing a user's own Admin/membership row here does not live-update `mockCurrentUser` or the current session's own permissions — same category of accepted mock limitation as `CreateSpacePanel` mutating `mockCurrentUser.memberships` as a side-channel elsewhere in this codebase; not a new limitation this plan introduces.
- Inviting people creates `status: "invited"` `OrgUser` rows directly (no separate pending-invite list/email-sending mock) — good enough to demonstrate the Active/Invited distinction the spec asks for, without inventing an unrequested second data model.
- No self-demotion guard (e.g. "can't remove your own Admin access") — the spec doesn't call this out, and this is a single-Admin-persona mock app with no real session-permission coupling to protect.
- The row action menu (⋯) opens the same detail panel as clicking the row — the spec doesn't describe a richer per-row menu, and `DocumentTable`'s ⋯ button already establishes this exact "same action, two entry points" precedent.

**Tech Stack:** React 19, TypeScript 6 (bundler mode, `verbatimModuleSyntax`), Tailwind v4 (`@theme` tokens — reuses `--color-status-ready-*`/`--color-status-processing-*` for the Active/Invited status badge, same semantic reuse the spec's Design Tokens section describes for document status), `framer-motion` (established slide-over pattern), `lucide-react` icons, `react-toastify`. No test runner is configured in this repo — verification is `npm run lint` + `npm run build`, plus careful code-tracing in place of manual browser testing (**no browser is available in this environment** — same constraint documented in the four prior plans for this app).

**Spec:** `docs/superpowers/specs/2026-08-05-knowledge-portal-ui-design.md`, § "Users & Roles admin page" (also relevant: § "Roles & permissions", § "Portal shell").

## Global Constraints

- TypeScript `verbatimModuleSyntax` is on — type-only imports must use `import type { X } from '...'`.
- `noUnusedLocals` / `noUnusedParameters` / `erasableSyntaxOnly` are enforced by `npm run build` — no enums, no parameter properties, no dead locals. ESLint here has **no `argsIgnorePattern`**, so an unused parameter can't be suppressed with an underscore prefix — just don't declare parameters you don't use.
- Components are PascalCase exports; DTO/shared types live in `src/types` and are re-exported through `src/types/index.ts`.
- Tailwind classes are written inline, matching existing components — no new global CSS.
- No real backend exists yet — everything here is mock data / local component state, not a `services/` HTTP call.
- `npm run lint` does not type-check; `npm run build` (`tsc -b && vite build`) is the real gate and must pass after every task.
- Husky's pre-commit hook runs `eslint --fix` + `prettier` on staged files automatically on `git commit` — expect it to reformat slightly; re-stage if it does.
- Commit subjects need a 10-character minimum (commitlint, conventional format `<type>: <description>`).
- Hooks (`useState`, `useReducedMotion`, `useEffect`, etc.) must never be called after an early-return guard (`react-hooks/rules-of-hooks`) — relevant if touching `PortalShell.tsx`, which already documents this constraint inline for its existing lifted state.
- **No browser is available in this sandbox.** Any step that would normally say "click the toggle and confirm it flips" instead means: read the JSX/state wiring carefully and confirm by tracing props/handlers, not by running the dev server in a browser.

---

## Task 1: Users & Roles types

**Files:**

- Modify: `src/types/commonType/user.ts`
- Modify: `src/types/index.ts`

**Interfaces:**

- Produces: `UserStatus = "active" | "invited"`, `OrgUser { id, name, email, avatarInitials, isAdmin, status, memberships }`, `UserAccessUpdate { isAdmin, memberships }`, `InviteCandidate { email, spaceId, role }` — all exported from `src/types`.

- [ ] **Step 1: Extend the type file**

Replace the full contents of `src/types/commonType/user.ts` with:

```ts
import type { SpaceMembership, SpaceRole } from "./space";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  /** The only true global role — a system-wide flag, not tied to any Space. */
  isAdmin: boolean;
  memberships: SpaceMembership[];
}

export type UserStatus = "active" | "invited";

// A row in the Users & Roles admin list — org-wide, not Space-scoped.
// Distinct from CurrentUser (the logged-in session's own identity) even
// though the shapes overlap; mockOrgUsers derives the current user's own
// row from mockCurrentUser's fields rather than duplicating them (see
// shellMockData.ts), but editing that row here does not live-update the
// session's own mockCurrentUser — same "mock, no real backend" limitation
// as the rest of this app's admin actions.
export interface OrgUser {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  isAdmin: boolean;
  status: UserStatus;
  memberships: SpaceMembership[];
}

// Payload submitted by the User detail panel's Save action.
export interface UserAccessUpdate {
  isAdmin: boolean;
  memberships: SpaceMembership[];
}

// One person-card's worth of input from the Invite panel — exactly one
// Space + one role per invitee, per spec (no per-person repeat-add; only
// the panel-level "+ Add another person" repeats).
export interface InviteCandidate {
  email: string;
  spaceId: string;
  role: SpaceRole;
}
```

- [ ] **Step 2: Update the barrel export**

In `src/types/index.ts`, replace:

```ts
export type { CurrentUser } from "./commonType/user";
```

with:

```ts
export type {
  CurrentUser,
  OrgUser,
  UserStatus,
  UserAccessUpdate,
  InviteCandidate,
} from "./commonType/user";
```

- [ ] **Step 3: Type-check**

Run: `npm run build`
Expected: succeeds (no consumers yet).

- [ ] **Step 4: Commit**

```bash
git add src/types/commonType/user.ts src/types/index.ts
git commit -m "feat: add Users & Roles admin types"
```

---

## Task 2: Mock organization users data

**Files:**

- Modify: `src/components/shell/shellMockData.ts`

**Interfaces:**

- Consumes: `OrgUser` from Task 1; existing `mockCurrentUser`, `mockSpaces` in this file.
- Produces: `mockOrgUsers: OrgUser[]` — consumed by Task 9's `PortalShell`.

- [ ] **Step 1: Add the `OrgUser` import**

In `src/components/shell/shellMockData.ts`, change the top import block from:

```ts
import type {
  CurrentUser,
  DocumentCitation,
  DocumentSummary,
  KnowledgeGapItem,
  Space,
} from "../../types";
```

to:

```ts
import type {
  CurrentUser,
  DocumentCitation,
  DocumentSummary,
  KnowledgeGapItem,
  OrgUser,
  Space,
} from "../../types";
```

- [ ] **Step 2: Add `mockOrgUsers`**

Immediately after the existing `mockCurrentUser` block (right before the `mockDocumentCitations` comment/declaration), insert:

```ts
// MOCK: stand-in for `GET /admin/users` (Users & Roles admin list) — every
// person across the org, not Space-scoped. The first entry mirrors
// mockCurrentUser's own fields (not duplicated by hand) so the two can't
// drift out of sync, matching the countCitations/countDocuments derivation
// pattern used elsewhere in this file. Names/initials for u2–u5 reuse the
// same people already appearing as document authors below (Priya Nair,
// Sam Ortiz, Jordan Lee, Morgan Diaz), so the two mock datasets read as one
// consistent org rather than disconnected examples.
export const mockOrgUsers: OrgUser[] = [
  {
    id: mockCurrentUser.id,
    name: mockCurrentUser.name,
    email: mockCurrentUser.email,
    avatarInitials: mockCurrentUser.avatarInitials,
    isAdmin: mockCurrentUser.isAdmin,
    status: "active",
    memberships: mockCurrentUser.memberships,
  },
  {
    id: "u2",
    name: "Priya Nair",
    email: "priya@company.com",
    avatarInitials: "PN",
    isAdmin: false,
    status: "active",
    memberships: [{ space: mockSpaces[0], role: "Editor" }],
  },
  {
    id: "u3",
    name: "Sam Ortiz",
    email: "sam@company.com",
    avatarInitials: "SO",
    isAdmin: false,
    status: "active",
    memberships: [{ space: mockSpaces[0], role: "Editor" }],
  },
  {
    id: "u4",
    name: "Jordan Lee",
    email: "jordan@company.com",
    avatarInitials: "JL",
    isAdmin: false,
    status: "active",
    memberships: [{ space: mockSpaces[1], role: "Editor" }],
  },
  {
    id: "u5",
    name: "Morgan Diaz",
    email: "morgan@company.com",
    avatarInitials: "MD",
    isAdmin: false,
    status: "active",
    memberships: [{ space: mockSpaces[2], role: "Editor" }],
  },
  {
    id: "u6",
    name: "Casey Kim",
    email: "casey@company.com",
    avatarInitials: "CK",
    isAdmin: false,
    status: "active",
    memberships: [{ space: mockSpaces[1], role: "Employee" }],
  },
  {
    id: "u7",
    name: "Taylor Brooks",
    email: "taylor@company.com",
    avatarInitials: "TB",
    isAdmin: false,
    status: "invited",
    memberships: [{ space: mockSpaces[2], role: "Employee" }],
  },
];
```

- [ ] **Step 3: Type-check and lint**

Run: `npm run build && npm run lint`
Expected: both succeed. No consumers yet.

- [ ] **Step 4: Commit**

```bash
git add src/components/shell/shellMockData.ts
git commit -m "feat: add mock organization users data"
```

---

## Task 3: `usePanelDismiss` shared hook

**Files:**

- Create: `src/components/common/usePanelDismiss.ts`

**Interfaces:**

- Produces: `usePanelDismiss(isOpen: boolean, onClose: () => void): RefObject<HTMLDivElement | null>` — consumed by Task 4 (retrofit) and Tasks 6/7 (new panels).

This hook is deliberately generic over two different panel lifecycles already present in this codebase: (a) a fresh `*Body` component that only mounts while its parent's `isOpen` is true (`DocumentDetailPanelBody`, `DocumentFormPanelBody`, `AskAiPanelBody`, and this plan's new `UserDetailPanelBody`/`InvitePeoplePanelBody`) — these pass a literal `true`, since from the `Body`'s own perspective it only ever exists while open; and (b) a single component that stays mounted across opens/closes and toggles a real boolean (`CreateSpacePanel`). Both work correctly because the effect keys off `isOpen` transitions, not mount/unmount.

- [ ] **Step 1: Write the hook**

```ts
// src/components/common/usePanelDismiss.ts
import { useEffect, useRef } from "react";
import type { RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Escape-to-close + a Tab focus trap + return-focus-on-close for a floating
// slide-over panel. Attach the returned ref to the panel's outer
// (bordered/animated) element — the one that should also carry
// role="dialog" aria-modal="true" aria-label="...".
//
// `isOpen` drives an effect that engages on the false→true transition and
// disengages on true→false (cleanup also always runs on unmount
// regardless of dependency changes, so a component that mounts already
// "open" and later unmounts — rather than toggling isOpen to false first —
// still restores focus correctly).
//
// `onClose` is read through a ref rather than being a dependency, so a new
// function identity on every parent re-render (e.g. an inline arrow
// function passed as a prop) doesn't retrigger the effect and re-steal
// focus to the panel's first focusable element on every keystroke.
export function usePanelDismiss(
  isOpen: boolean,
  onClose: () => void,
): RefObject<HTMLDivElement | null> {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const getFocusable = () =>
      panel
        ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        : [];

    getFocusable()[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  return panelRef;
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npm run build && npm run lint`
Expected: both succeed. No consumers yet.

- [ ] **Step 3: Trace the focus-trap and Escape logic by hand (no browser available)**

Confirm by reading the code: the effect's dependency array is `[isOpen]` only — `onClose` is captured via `onCloseRef`, updated every render via the plain assignment `onCloseRef.current = onClose` (which runs on every render, not just when the effect re-fires), so `handleKeyDown`'s closure always calls the _latest_ `onClose` even though the listener itself was attached once. On `Escape`, `event.preventDefault()` runs before calling `onCloseRef.current()` — the panel's own close handler decides what "close" means (e.g. `DocumentDetailPanel`'s `onClose` vs `CreateSpacePanel`'s `handleClose`, which also resets its form). On `Tab` at the last focusable element (`document.activeElement === last`, and not `event.shiftKey`), it wraps to `first`; on `Shift+Tab` at the first element, it wraps to `last` — both call `event.preventDefault()` first so the browser's native tab order never actually leaves the panel. If the panel has zero focusable elements (shouldn't happen — every panel has at least a close button — but defensively handled), `getFocusable().length === 0` short-circuits before touching `first`/`last`, avoiding an out-of-bounds access. On cleanup (panel closes or unmounts), `previouslyFocused?.focus()` returns focus to whatever had it before the panel opened (e.g. the row button in `DocumentTable` that opened the detail panel) — matching the spec's "closes back to exactly where the user was."

- [ ] **Step 4: Commit**

```bash
git add src/components/common/usePanelDismiss.ts
git commit -m "feat: add usePanelDismiss focus-trap hook"
```

---

## Task 4: Retrofit `usePanelDismiss` onto the four existing panels

**Files:**

- Modify: `src/components/documentComponent/DocumentDetailPanel.tsx`
- Modify: `src/components/documentComponent/DocumentFormPanel.tsx`
- Modify: `src/components/askAiComponent/AskAiPanelBody.tsx`
- Modify: `src/components/spaceComponent/CreateSpacePanel.tsx`

**Interfaces:**

- Consumes: `usePanelDismiss` from Task 3.
- Produces: no new exports — same public props/behavior for all four components, only their internal a11y wiring changes.

These four edits are mechanically identical in shape (import the hook, call it, attach the returned ref + `role="dialog"`/`aria-modal="true"`/`aria-label` to the panel's outer `motion.div`), which is why they're one task — a reviewer would accept or reject this retrofit as a whole, not panel-by-panel.

- [ ] **Step 1: `DocumentDetailPanelBody`**

In `src/components/documentComponent/DocumentDetailPanel.tsx`, add the import:

```ts
import { usePanelDismiss } from "../common/usePanelDismiss";
```

Inside `DocumentDetailPanelBody`, right after the existing `const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);` line, add:

```ts
const panelRef = usePanelDismiss(true, onClose);
```

Change the panel's outer `motion.div` from:

```tsx
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
```

to:

```tsx
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${document.name} details`}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.22,
          ease: "easeOut",
        }}
        className="bg-surface absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col overflow-y-auto p-5 shadow-lg"
      >
```

- [ ] **Step 2: `DocumentFormPanelBody`**

In `src/components/documentComponent/DocumentFormPanel.tsx`, add the import:

```ts
import { usePanelDismiss } from "../common/usePanelDismiss";
```

Inside `DocumentFormPanelBody`, right after the existing `const hasSubmittedRef = useRef(false);` line, add:

```ts
const panelRef = usePanelDismiss(true, onClose);
```

Change the panel's outer `motion.div` from:

```tsx
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
```

to:

```tsx
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
```

- [ ] **Step 3: `AskAiPanelBody`**

In `src/components/askAiComponent/AskAiPanelBody.tsx`, add the import:

```ts
import { usePanelDismiss } from "../common/usePanelDismiss";
```

Inside `AskAiPanelBody`, right after the existing `const threadEndRef = useRef<HTMLDivElement>(null);` line, add:

```ts
const panelRef = usePanelDismiss(true, onClose);
```

Change the panel's outer `motion.div` from:

```tsx
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.22,
          ease: "easeOut",
        }}
        className="bg-surface absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col p-5 shadow-lg"
      >
```

to:

```tsx
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Ask AI"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.22,
          ease: "easeOut",
        }}
        className="bg-surface absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col p-5 shadow-lg"
      >
```

- [ ] **Step 4: `CreateSpacePanel`**

Unlike the other three, `CreateSpacePanel` doesn't split into a separate `*Body` component — it stays mounted across opens/closes and its dialog markup is gated by `{isOpen && (...)}` inside the same component. It also already has `role="dialog"`/`aria-modal="true"`/`aria-label="Create space"` on its outer `motion.div`, so this edit only adds the ref (with a real `isOpen`, not a literal `true`, since this component doesn't unmount when closed).

In `src/components/spaceComponent/CreateSpacePanel.tsx`, add the import:

```ts
import { usePanelDismiss } from "../common/usePanelDismiss";
```

Right after the existing `const prefersReducedMotion = useReducedMotion();` line, add:

```ts
const panelRef = usePanelDismiss(isOpen, handleClose);
```

Note this line must come after `handleClose` is defined further down in the function — since `handleClose` is a `const` (not hoisted), move this new line to immediately after the existing `const handleClose = () => { ... };` block instead (i.e., after `resetForm`/`handleClose`/`handleTypeCreated` are all declared, before `handleSubmit`). Concretely, insert it right after:

```ts
const handleClose = () => {
  resetForm();
  onClose();
};
```

so it reads:

```ts
const handleClose = () => {
  resetForm();
  onClose();
};

const panelRef = usePanelDismiss(isOpen, handleClose);
```

Change the panel's outer `motion.div` from:

```tsx
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Create space"
              initial={{ x: prefersReducedMotion ? 0 : "100%" }}
```

to:

```tsx
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Create space"
              initial={{ x: prefersReducedMotion ? 0 : "100%" }}
```

- [ ] **Step 5: Type-check and lint**

Run: `npm run build && npm run lint`
Expected: both succeed.

- [ ] **Step 6: Trace each retrofit by hand (no browser available)**

Confirm by reading the code, per file:

- `DocumentDetailPanelBody`/`DocumentFormPanelBody`/`AskAiPanelBody`: each passes a literal `true` as `usePanelDismiss`'s `isOpen` argument. Since these components only exist for as long as their parent's `{isOpen && <XBody .../>}` conditional renders them, the effect inside the hook engages once on this component's mount (isOpen starts `true` and never changes for the component's lifetime) and its cleanup runs once on unmount (when the parent flips to `isOpen={false}` and `AnimatePresence` removes it) — correctly trapping focus and restoring it exactly once per open/close cycle, with no risk of a stale `isOpen=false` skipping the trap on mount.
- `CreateSpacePanel`: `usePanelDismiss(isOpen, handleClose)` is called unconditionally on every render (satisfying the rules-of-hooks — it's never inside the `{isOpen && (...)}` JSX block, only the dialog _markup_ is), so the hook itself observes the real `isOpen` transitions: opening engages the trap, closing (via backdrop click, X button, or now also Escape) calls `handleClose` — which still runs `resetForm()` before `onClose()`, so Escape-driven closes reset the form fields exactly like every other close path already did before this task.
- All four: `aria-label` is either static (`"Ask AI"`, `"Create space"`) or references data only available once the panel is actually rendering (`document.name`, `document ? "..." : "..."`) — confirm none of these four labels can read `undefined`/`null` at the point they're evaluated (e.g. `DocumentDetailPanelBody` only renders when its parent's `document` prop is non-null, per `DocumentDetailPanel`'s own `{isOpen && document && (...)}` gate).

- [ ] **Step 7: Commit**

```bash
git add src/components/documentComponent/DocumentDetailPanel.tsx src/components/documentComponent/DocumentFormPanel.tsx src/components/askAiComponent/AskAiPanelBody.tsx src/components/spaceComponent/CreateSpacePanel.tsx
git commit -m "fix: add focus trap and Escape-to-close to floating panels"
```

---

## Task 5: `UsersTable` component

**Files:**

- Create: `src/components/usersComponent/UsersTable.tsx`

**Interfaces:**

- Consumes: `OrgUser`, `UserStatus` types from Task 1.
- Produces: `UsersTable` component with props `{ users: OrgUser[]; onOpenUser: (user: OrgUser) => void }` — consumed by Task 8's `UsersRolesPage`.

- [ ] **Step 1: Write the component**

```tsx
// src/components/usersComponent/UsersTable.tsx
import { MoreHorizontal } from "lucide-react";
import type { OrgUser, UserStatus } from "../../types";

interface UsersTableProps {
  users: OrgUser[];
  onOpenUser: (user: OrgUser) => void;
}

// Reuses the same status-token pairs the Document Library's processing
// badge does (Active = --status-ready-*, "done/good"; Invited =
// --status-processing-*, "in progress, not final yet") — the same
// semantic reuse the spec's Design Tokens section describes.
const STATUS_BADGE: Record<UserStatus, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-status-ready-bg text-status-ready-fg",
  },
  invited: {
    label: "Invited",
    className: "bg-status-processing-bg text-status-processing-fg",
  },
};

// Org-wide people list (not Space-scoped), per spec. Same list/table shape
// as DocumentTable: a name/avatar button and a trailing ⋯ button both open
// the same row's detail panel — there's only one row action in this pass,
// so both controls are equivalent entry points to it.
export function UsersTable({ users, onOpenUser }: UsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="border-border text-ink-muted flex min-h-48 items-center justify-center rounded-lg border border-dashed text-center text-sm">
        No one has been invited yet.
      </div>
    );
  }

  return (
    <div className="border-border overflow-hidden rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-sunken text-ink-muted text-xs">
          <tr>
            <th className="px-4 py-2.5 font-medium">Person</th>
            <th className="hidden px-4 py-2.5 font-medium sm:table-cell">
              Admin
            </th>
            <th className="hidden px-4 py-2.5 font-medium lg:table-cell">
              Spaces
            </th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-2 py-2.5">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-surface-sunken">
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onOpenUser(user)}
                  className="flex min-w-0 items-center gap-2 text-left"
                >
                  <span className="bg-avatar-bg text-avatar-fg flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                    {user.avatarInitials}
                  </span>
                  <span className="min-w-0">
                    <span className="text-ink block truncate font-medium">
                      {user.name}
                    </span>
                    <span className="text-ink-muted block truncate text-xs">
                      {user.email}
                    </span>
                  </span>
                </button>
              </td>
              <td className="hidden px-4 py-3 sm:table-cell">
                {user.isAdmin && (
                  <span className="bg-accent-soft text-accent rounded-full px-2 py-0.5 text-xs font-medium">
                    Admin
                  </span>
                )}
              </td>
              <td className="hidden px-4 py-3 lg:table-cell">
                <div className="flex flex-wrap gap-1">
                  {user.memberships.map((membership) => (
                    <span
                      key={membership.space.id}
                      className="bg-surface-sunken text-ink-muted rounded-full px-2 py-0.5 text-xs font-medium"
                    >
                      {membership.space.name} · {membership.role}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[user.status].className}`}
                >
                  {STATUS_BADGE[user.status].label}
                </span>
              </td>
              <td className="px-2 py-3">
                <button
                  type="button"
                  onClick={() => onOpenUser(user)}
                  aria-label={`Actions for ${user.name}`}
                  className="text-ink-muted hover:bg-surface flex size-8 items-center justify-center rounded-md"
                >
                  <MoreHorizontal size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npm run build && npm run lint`
Expected: both succeed. No consumers yet.

- [ ] **Step 3: Trace the responsive column-dropping by hand (no browser available)**

Confirm by reading the code: `Person` and `Status` columns have no responsive class and are always visible; `Admin` uses `hidden sm:table-cell` (hidden below 640px); `Spaces` uses `hidden lg:table-cell` (hidden below `lg`, wider than `Admin`'s cutoff since chips take more horizontal room) — mirroring `DocumentTable`'s existing `Category` (`sm:table-cell`) / `Updated by` (`lg:table-cell`) breakpoints exactly. Confirm the empty-state branch returns before the `<table>` is ever rendered, so `users.length === 0` never produces a table with a `<thead>` and no rows.

- [ ] **Step 4: Commit**

```bash
git add src/components/usersComponent/UsersTable.tsx
git commit -m "feat: add UsersTable component"
```

---

## Task 6: `UserDetailPanel` component

**Files:**

- Create: `src/components/usersComponent/UserDetailPanel.tsx`

**Interfaces:**

- Consumes: `usePanelDismiss` from Task 3; `OrgUser`, `Space`, `SpaceRole`, `UserAccessUpdate` types from Task 1 / existing `src/types`.
- Produces: `UserDetailPanel` component with props `{ user: OrgUser | null; isOpen: boolean; allSpaces: Space[]; onClose: () => void; onSave: (userId: string, update: UserAccessUpdate) => void; onRemove: (userId: string) => void }` — consumed by Task 8's `UsersRolesPage`.

Per spec: avatar/name/email header, a System-wide Admin access toggle, an editable Space-memberships list (Space select + role select + remove per row, "+ Add space"), and a footer with a destructive Remove user action plus Cancel/Save. `onSave`/`onRemove` are called with the raw payload only — no toast, no `onClose()` call inside this component, matching `DocumentDetailPanelBody`'s existing convention where the _caller_ (here, Task 8's `UsersRolesPage`) closes the panel and the state owner (Task 9's `PortalShell`) shows the toast.

- [ ] **Step 1: Write the component**

```tsx
// src/components/usersComponent/UserDetailPanel.tsx
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus, Trash2, X } from "lucide-react";
import { usePanelDismiss } from "../common/usePanelDismiss";
import type { OrgUser, Space, SpaceRole, UserAccessUpdate } from "../../types";

interface UserDetailPanelProps {
  user: OrgUser | null;
  isOpen: boolean;
  allSpaces: Space[];
  onClose: () => void;
  onSave: (userId: string, update: UserAccessUpdate) => void;
  onRemove: (userId: string) => void;
}

// Floating slide-over panel (420px, right-aligned), same pattern as
// DocumentDetailPanel — dims/blurs the page behind it, closes back to
// exactly where the user was.
export function UserDetailPanel({
  user,
  isOpen,
  allSpaces,
  onClose,
  onSave,
  onRemove,
}: UserDetailPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && user && (
        <UserDetailPanelBody
          user={user}
          allSpaces={allSpaces}
          onClose={onClose}
          onSave={onSave}
          onRemove={onRemove}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
    </AnimatePresence>
  );
}

interface UserDetailPanelBodyProps {
  user: OrgUser;
  allSpaces: Space[];
  onClose: () => void;
  onSave: (userId: string, update: UserAccessUpdate) => void;
  onRemove: (userId: string) => void;
  prefersReducedMotion: boolean | null;
}

interface MembershipDraft {
  key: string;
  spaceId: string;
  role: SpaceRole;
}

// Split out from UserDetailPanel so this only mounts while `isOpen` is
// true — every field's local state re-initializes fresh from `user` on
// each open, same as DocumentFormPanelBody.
function UserDetailPanelBody({
  user,
  allSpaces,
  onClose,
  onSave,
  onRemove,
  prefersReducedMotion,
}: UserDetailPanelBodyProps) {
  const panelRef = usePanelDismiss(true, onClose);
  const [isAdminEdit, setIsAdminEdit] = useState(user.isAdmin);
  const [memberships, setMemberships] = useState<MembershipDraft[]>(() =>
    user.memberships.map((m) => ({
      key: m.space.id,
      spaceId: m.space.id,
      role: m.role,
    })),
  );
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);

  const usedSpaceIds = new Set(memberships.map((m) => m.spaceId));
  const unassignedSpaces = allSpaces.filter((s) => !usedSpaceIds.has(s.id));

  const handleAddSpace = () => {
    const nextSpace = unassignedSpaces[0];
    if (!nextSpace) return;
    setMemberships((prev) => [
      ...prev,
      {
        key: `${nextSpace.id}-${Date.now()}`,
        spaceId: nextSpace.id,
        role: "Employee",
      },
    ]);
  };

  const handleRemoveMembership = (key: string) => {
    setMemberships((prev) => prev.filter((m) => m.key !== key));
  };

  const handleMembershipSpaceChange = (key: string, spaceId: string) => {
    setMemberships((prev) =>
      prev.map((m) => (m.key === key ? { ...m, spaceId } : m)),
    );
  };

  const handleMembershipRoleChange = (key: string, role: SpaceRole) => {
    setMemberships((prev) =>
      prev.map((m) => (m.key === key ? { ...m, role } : m)),
    );
  };

  // Spaces available to a given row's own select: every space not already
  // used by ANOTHER row, plus this row's own current space (so its current
  // selection stays visible in its own dropdown) — prevents two rows from
  // ever pointing at the same Space.
  const availableSpacesForRow = (rowKey: string) =>
    allSpaces.filter((s) => {
      const usedByOtherRow = memberships.some(
        (m) => m.key !== rowKey && m.spaceId === s.id,
      );
      return !usedByOtherRow;
    });

  const handleSave = () => {
    const resolvedMemberships = memberships
      .map((draft) => {
        const space = allSpaces.find((s) => s.id === draft.spaceId);
        return space ? { space, role: draft.role } : null;
      })
      .filter((m): m is { space: Space; role: SpaceRole } => m !== null);

    onSave(user.id, { isAdmin: isAdminEdit, memberships: resolvedMemberships });
  };

  return (
    <div className="fixed inset-0 z-40">
      <motion.button
        type="button"
        aria-label="Close user details"
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
        aria-label={`${user.name} details`}
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
          <div className="flex min-w-0 items-center gap-3">
            <span className="bg-avatar-bg text-avatar-fg flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
              {user.avatarInitials}
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-ink truncate text-lg font-semibold">
                {user.name}
              </h2>
              <p className="text-ink-muted truncate text-xs">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close user details"
            className="text-ink-muted hover:bg-surface-sunken flex size-9 shrink-0 items-center justify-center rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-border flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-ink text-sm font-semibold">
              System-wide Admin access
            </p>
            <p className="text-ink-muted text-xs">
              Everything an Editor can do, in every Space.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isAdminEdit}
            onClick={() => setIsAdminEdit((prev) => !prev)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              isAdminEdit ? "bg-accent" : "bg-surface-sunken"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform ${
                isAdminEdit ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-ink text-sm font-semibold">
              Space memberships
            </h3>
            {unassignedSpaces.length > 0 && (
              <button
                type="button"
                onClick={handleAddSpace}
                className="text-accent flex items-center gap-1 text-xs font-semibold"
              >
                <Plus size={12} />
                Add space
              </button>
            )}
          </div>
          {memberships.length === 0 ? (
            <div className="border-border text-ink-muted flex min-h-16 items-center justify-center rounded-lg border border-dashed text-center text-sm">
              No Space memberships.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {memberships.map((membership) => (
                <div key={membership.key} className="flex items-center gap-2">
                  <select
                    value={membership.spaceId}
                    onChange={(event) =>
                      handleMembershipSpaceChange(
                        membership.key,
                        event.target.value,
                      )
                    }
                    className="border-border text-ink focus:border-accent flex-1 rounded-md border px-2 py-1.5 text-sm outline-none"
                  >
                    {availableSpacesForRow(membership.key).map((space) => (
                      <option key={space.id} value={space.id}>
                        {space.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={membership.role}
                    onChange={(event) =>
                      handleMembershipRoleChange(
                        membership.key,
                        event.target.value as SpaceRole,
                      )
                    }
                    className="border-border text-ink focus:border-accent rounded-md border px-2 py-1.5 text-sm outline-none"
                  >
                    <option value="Editor">Editor</option>
                    <option value="Employee">Employee</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveMembership(membership.key)}
                    aria-label="Remove space membership"
                    className="text-ink-muted hover:bg-surface-sunken flex size-8 shrink-0 items-center justify-center rounded-md"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-6">
          {isConfirmingRemove ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmingRemove(false)}
                className="border-border text-ink hover:bg-surface-sunken flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onRemove(user.id)}
                className="bg-warn-bg text-warn-fg flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold"
              >
                <Trash2 size={14} />
                Confirm remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingRemove(true)}
              className="bg-warn-bg text-warn-fg flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold"
            >
              <Trash2 size={14} />
              Remove user
            </button>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-ink hover:bg-surface-sunken rounded-md px-3 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="bg-accent rounded-md px-4 py-2 text-sm font-semibold text-white"
            >
              Save
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npm run build && npm run lint`
Expected: both succeed. No consumers yet.

- [ ] **Step 3: Trace the membership-editing and remove-confirm flows by hand (no browser available)**

Confirm by reading the code: `memberships` initializes once (lazy `useState` initializer) from `user.memberships`, keyed by each row's _original_ `space.id` (stable identity even after the row's own `spaceId` is later changed via its select). `availableSpacesForRow` excludes any Space used by a _different_ row (`m.key !== rowKey`) but always includes the row's own current `spaceId`, so changing row A's Space to one row B already has isn't offered as an option in row A's dropdown — duplicate memberships are structurally prevented, not just discouraged. `handleAddSpace` no-ops (returns without changing state) when `unassignedSpaces` is empty, and the "+ Add space" button itself is only rendered when `unassignedSpaces.length > 0`, so the no-op path is unreachable via the UI — defensive but consistent with `FeedbackRow`'s similar "guard shown and enforced in two places" pattern elsewhere in this codebase. `handleSave` filters out any draft row whose `spaceId` no longer resolves to a real `Space` in `allSpaces` (defensive — shouldn't happen given the dropdown only ever offers real Space ids) before calling `onSave`; it does not call `onClose()` or show a toast itself — confirm `UserDetailPanel`'s two callers (Task 8) are responsible for both, matching `DocumentDetailPanelBody`'s Delete button, which likewise calls `onDelete(document.id)` directly with no `onClose()`/toast inside itself.

- [ ] **Step 4: Commit**

```bash
git add src/components/usersComponent/UserDetailPanel.tsx
git commit -m "feat: add UserDetailPanel component"
```

---

## Task 7: `InvitePeoplePanel` component

**Files:**

- Create: `src/components/usersComponent/InvitePeoplePanel.tsx`

**Interfaces:**

- Consumes: `usePanelDismiss` from Task 3; `InviteCandidate`, `Space`, `SpaceRole` types from Task 1 / existing `src/types`.
- Produces: `InvitePeoplePanel` component with props `{ isOpen: boolean; allSpaces: Space[]; onClose: () => void; onInvite: (candidates: InviteCandidate[]) => void }` — consumed by Task 8's `UsersRolesPage`.

Per spec: a stack of person cards, each with its own Email field and a single Space + role pair; "+ Add another person" appends a card (removable except when it's the only one left); the submit button reflects the count. No "grant Admin" control here, per spec.

- [ ] **Step 1: Write the component**

```tsx
// src/components/usersComponent/InvitePeoplePanel.tsx
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { toast } from "react-toastify";
import { usePanelDismiss } from "../common/usePanelDismiss";
import type { InviteCandidate, Space, SpaceRole } from "../../types";

interface InvitePeoplePanelProps {
  isOpen: boolean;
  allSpaces: Space[];
  onClose: () => void;
  onInvite: (candidates: InviteCandidate[]) => void;
}

// Floating slide-over panel (420px, right-aligned), same pattern as
// CreateSpacePanel/UserDetailPanel.
export function InvitePeoplePanel({
  isOpen,
  allSpaces,
  onClose,
  onInvite,
}: InvitePeoplePanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <InvitePeoplePanelBody
          allSpaces={allSpaces}
          onClose={onClose}
          onInvite={onInvite}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
    </AnimatePresence>
  );
}

interface InvitePeoplePanelBodyProps {
  allSpaces: Space[];
  onClose: () => void;
  onInvite: (candidates: InviteCandidate[]) => void;
  prefersReducedMotion: boolean | null;
}

interface PersonCardDraft {
  key: string;
  email: string;
  spaceId: string;
  role: SpaceRole;
}

let cardKeyCounter = 0;
function nextCardKey(): string {
  cardKeyCounter += 1;
  return `card-${cardKeyCounter}`;
}

function makeBlankCard(defaultSpaceId: string): PersonCardDraft {
  return {
    key: nextCardKey(),
    email: "",
    spaceId: defaultSpaceId,
    role: "Employee",
  };
}

// Split out from InvitePeoplePanel so this only mounts while `isOpen` is
// true — the card stack always starts fresh at one blank card per open,
// same as DocumentFormPanelBody resets its fields per open. Uses an
// ever-incrementing module-level counter (not Date.now()) for card keys,
// since two cards added via rapid clicks in the same millisecond would
// otherwise collide.
function InvitePeoplePanelBody({
  allSpaces,
  onClose,
  onInvite,
  prefersReducedMotion,
}: InvitePeoplePanelBodyProps) {
  const panelRef = usePanelDismiss(true, onClose);
  const defaultSpaceId = allSpaces[0]?.id ?? "";
  const [cards, setCards] = useState<PersonCardDraft[]>(() => [
    makeBlankCard(defaultSpaceId),
  ]);

  const handleAddCard = () => {
    setCards((prev) => [...prev, makeBlankCard(defaultSpaceId)]);
  };

  const handleRemoveCard = (key: string) => {
    setCards((prev) =>
      prev.length > 1 ? prev.filter((c) => c.key !== key) : prev,
    );
  };

  const handleEmailChange = (key: string, email: string) => {
    setCards((prev) => prev.map((c) => (c.key === key ? { ...c, email } : c)));
  };

  const handleSpaceChange = (key: string, spaceId: string) => {
    setCards((prev) =>
      prev.map((c) => (c.key === key ? { ...c, spaceId } : c)),
    );
  };

  const handleRoleChange = (key: string, role: SpaceRole) => {
    setCards((prev) => prev.map((c) => (c.key === key ? { ...c, role } : c)));
  };

  const handleSubmit = () => {
    const trimmed = cards.map((card) => ({
      ...card,
      email: card.email.trim(),
    }));
    const invalid = trimmed.find((card) => !card.email.includes("@"));
    if (invalid) {
      toast.error("Enter a valid email for every person.");
      return;
    }

    const candidates: InviteCandidate[] = trimmed.map((card) => ({
      email: card.email,
      spaceId: card.spaceId,
      role: card.role,
    }));
    onInvite(candidates);
  };

  return (
    <div className="fixed inset-0 z-40">
      <motion.button
        type="button"
        aria-label="Close invite panel"
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
        aria-label="Invite people"
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
          <h2 className="font-display text-ink text-lg font-semibold">
            Invite people
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close invite panel"
            className="text-ink-muted hover:bg-surface-sunken flex size-9 shrink-0 items-center justify-center rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {cards.map((card, index) => (
            <div key={card.key} className="border-border rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-ink-muted text-xs font-medium">
                  Person {index + 1}
                </p>
                {cards.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCard(card.key)}
                    aria-label={`Remove person ${index + 1}`}
                    className="text-ink-muted hover:bg-surface-sunken flex size-6 items-center justify-center rounded-md"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <input
                type="email"
                value={card.email}
                onChange={(event) =>
                  handleEmailChange(card.key, event.target.value)
                }
                placeholder="name@company.com"
                className="border-border text-ink placeholder:text-ink-muted focus:border-accent mb-2 w-full rounded-md border px-3 py-2 text-sm outline-none"
              />
              <div className="flex gap-2">
                <select
                  value={card.spaceId}
                  onChange={(event) =>
                    handleSpaceChange(card.key, event.target.value)
                  }
                  className="border-border text-ink focus:border-accent flex-1 rounded-md border px-2 py-1.5 text-sm outline-none"
                >
                  {allSpaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name}
                    </option>
                  ))}
                </select>
                <select
                  value={card.role}
                  onChange={(event) =>
                    handleRoleChange(card.key, event.target.value as SpaceRole)
                  }
                  className="border-border text-ink focus:border-accent rounded-md border px-2 py-1.5 text-sm outline-none"
                >
                  <option value="Editor">Editor</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddCard}
          className="text-accent mt-3 flex items-center gap-1 self-start text-xs font-semibold"
        >
          <Plus size={12} />
          Add another person
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          className="bg-accent mt-5 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white"
        >
          Send {cards.length} invite{cards.length === 1 ? "" : "s"}
        </button>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npm run build && npm run lint`
Expected: both succeed. No consumers yet.

- [ ] **Step 3: Trace the card add/remove/validate flow by hand (no browser available)**

Confirm by reading the code: `cards` starts as a single `makeBlankCard(defaultSpaceId)` array (lazy initializer, so `nextCardKey()` only runs once per mount, not per render). `handleRemoveCard` is a no-op when `prev.length === 1` (returns `prev` unchanged) — and the remove button itself is only rendered when `cards.length > 1`, so, like `UserDetailPanelBody`'s `handleAddSpace`, the guard is enforced in two places but only one is reachable via the UI. `handleSubmit` builds a `trimmed` array first, then searches it (not the original `cards`) for the first entry whose trimmed email lacks `"@"` — so a submission with a leading/trailing-whitespace-only email like `"  "` correctly fails validation (trims to `""`, which doesn't include `"@"`), and a valid email surrounded by whitespace like `" a@b.com "` correctly passes (trims to `"a@b.com"` before either the validation check or the final `candidates` mapping — the same trimmed value is used for both, not re-derived twice). Confirm `onInvite(candidates)` is called with no `onClose()`/toast inside this component, mirroring Task 6's `UserDetailPanel` and the codebase-wide convention that a *Panel's own submit logic only validates+forwards, while its caller closes the panel and its caller's caller toasts.

- [ ] **Step 4: Commit**

```bash
git add src/components/usersComponent/InvitePeoplePanel.tsx
git commit -m "feat: add InvitePeoplePanel component"
```

---

## Task 8: `UsersRolesPage` (assembly)

**Files:**

- Create: `src/components/usersComponent/UsersRolesPage.tsx`

**Interfaces:**

- Consumes: `UsersTable` from Task 5, `UserDetailPanel` from Task 6, `InvitePeoplePanel` from Task 7; `OrgUser`, `Space`, `UserAccessUpdate`, `InviteCandidate` types.
- Produces: `UsersRolesPage` component with props `{ users: OrgUser[]; allSpaces: Space[]; onUpdateUserAccess: (userId: string, update: UserAccessUpdate) => void; onRemoveUser: (userId: string) => void; onInvitePeople: (candidates: InviteCandidate[]) => void }` — consumed by Task 9's `PortalShell`.

- [ ] **Step 1: Write the component**

```tsx
// src/components/usersComponent/UsersRolesPage.tsx
import { useState } from "react";
import { Plus } from "lucide-react";
import { UsersTable } from "./UsersTable";
import { UserDetailPanel } from "./UserDetailPanel";
import { InvitePeoplePanel } from "./InvitePeoplePanel";
import type {
  InviteCandidate,
  OrgUser,
  Space,
  UserAccessUpdate,
} from "../../types";

interface UsersRolesPageProps {
  users: OrgUser[];
  allSpaces: Space[];
  onUpdateUserAccess: (userId: string, update: UserAccessUpdate) => void;
  onRemoveUser: (userId: string) => void;
  onInvitePeople: (candidates: InviteCandidate[]) => void;
}

// Admin-only org-wide list page + two slide-over panels, same page shape
// as DocumentLibrary: this component owns only local UI state (which row
// is selected, which panel is open) — the `users` array itself is lifted
// to PortalShell (see PortalShell.tsx), not owned here, for the same
// reason `documents` is: this page unmounts whenever the Admin navigates
// to a sibling nav item, so an edit/remove made here must not be silently
// undone on the next unmount/remount round-trip.
export function UsersRolesPage({
  users,
  allSpaces,
  onUpdateUserAccess,
  onRemoveUser,
  onInvitePeople,
}: UsersRolesPageProps) {
  const [selectedUser, setSelectedUser] = useState<OrgUser | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isInvitePanelOpen, setIsInvitePanelOpen] = useState(false);

  const handleOpenUser = (user: OrgUser) => {
    setSelectedUser(user);
    setIsDetailPanelOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailPanelOpen(false);
  };

  const handleSaveAccess = (userId: string, update: UserAccessUpdate) => {
    onUpdateUserAccess(userId, update);
    setIsDetailPanelOpen(false);
  };

  const handleRemove = (userId: string) => {
    onRemoveUser(userId);
    setIsDetailPanelOpen(false);
  };

  const handleInvite = (candidates: InviteCandidate[]) => {
    onInvitePeople(candidates);
    setIsInvitePanelOpen(false);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-ink text-3xl font-semibold">
            Users & Roles
          </h1>
          <p className="text-ink-muted mt-1 text-sm">
            {users.length} {users.length === 1 ? "person" : "people"} across the
            organization
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsInvitePanelOpen(true)}
          className="bg-accent flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white"
        >
          <Plus size={16} />
          Invite people
        </button>
      </div>

      <UsersTable users={users} onOpenUser={handleOpenUser} />

      <UserDetailPanel
        user={selectedUser}
        isOpen={isDetailPanelOpen}
        allSpaces={allSpaces}
        onClose={handleCloseDetail}
        onSave={handleSaveAccess}
        onRemove={handleRemove}
      />

      <InvitePeoplePanel
        isOpen={isInvitePanelOpen}
        allSpaces={allSpaces}
        onClose={() => setIsInvitePanelOpen(false)}
        onInvite={handleInvite}
      />
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npm run build && npm run lint`
Expected: both succeed. No consumers yet.

- [ ] **Step 3: Trace the state-lifecycle wiring by hand (no browser available)**

Confirm by reading the code: `selectedUser`/`isDetailPanelOpen`/`isInvitePanelOpen` are the only state this component owns — `users` is a prop, never copied into local state, so `UsersRolesPage` can never go stale relative to whatever `PortalShell` (Task 9) passes down. `handleSaveAccess`/`handleRemove` both call the corresponding `on*` prop _and_ close the detail panel (`setIsDetailPanelOpen(false)`) — this mirrors `DocumentLibrary.handleDeleteDocument`'s exact two-step shape (`onDeleteDocument(documentId); setIsDetailPanelOpen(false);`). `handleInvite` similarly forwards then closes the invite panel. None of these three handlers call `toast` — confirm Task 9's `PortalShell` handlers are the ones that do, so a save/remove/invite produces exactly one toast, not zero or two (the "avoid duplicate toasts for the same action" rule from `.claude/api-forms-errors.md`).

- [ ] **Step 4: Commit**

```bash
git add src/components/usersComponent/UsersRolesPage.tsx
git commit -m "feat: add UsersRolesPage component"
```

---

## Task 9: Wire `UsersRolesPage` into `PortalShell`

**Files:**

- Modify: `src/components/shell/PortalShell.tsx`

**Interfaces:**

- Consumes: `UsersRolesPage` from Task 8; `mockOrgUsers` from Task 2; `mockSpaces` (already exists in `shellMockData.ts`).
- Produces: no new exports.

- [ ] **Step 1: Update imports**

In `src/components/shell/PortalShell.tsx`, change:

```ts
import {
  mockCurrentUser,
  mockDocuments,
  mockKnowledgeGaps,
} from "./shellMockData";
import { DocumentLibrary } from "../documentComponent/DocumentLibrary";
import type { DocumentLibraryTab } from "../documentComponent/DocumentLibrary";
import { PageTransition } from "../common/PageTransition";
import type {
  DocumentSummary,
  DocumentUpdateInput,
  KnowledgeGapItem,
  NewDocumentInput,
  Space,
} from "../../types";
```

to:

```ts
import {
  mockCurrentUser,
  mockDocuments,
  mockKnowledgeGaps,
  mockOrgUsers,
  mockSpaces,
} from "./shellMockData";
import { DocumentLibrary } from "../documentComponent/DocumentLibrary";
import type { DocumentLibraryTab } from "../documentComponent/DocumentLibrary";
import { UsersRolesPage } from "../usersComponent/UsersRolesPage";
import { PageTransition } from "../common/PageTransition";
import type {
  DocumentSummary,
  DocumentUpdateInput,
  InviteCandidate,
  KnowledgeGapItem,
  NewDocumentInput,
  OrgUser,
  Space,
  UserAccessUpdate,
} from "../../types";
```

- [ ] **Step 2: Remove the now-dead `NAV_PAGE_TITLE` placeholder title map**

`NAV_PAGE_TITLE` is only ever read inside the placeholder block this task deletes in Step 5 — once that block is gone, this constant becomes an unused local and `noUnusedLocals` fails `npm run build`. Delete it entirely:

```ts
const NAV_PAGE_TITLE: Record<ShellNavKey, string> = {
  documents: "Documents",
  "needs-attention": "Needs attention",
  "users-roles": "Users & Roles",
};
```

(`ShellNavKey` remains imported and used elsewhere in the file, e.g. `useState<ShellNavKey>`.)

- [ ] **Step 3: Lift `users` state**

Immediately after the existing `documents` state block (right after `const [documents, setDocuments] = useState<DocumentSummary[]>(...)`, before the `if (!membership)` guard — same hooks-before-early-return constraint the surrounding comments already document), add:

```ts
// Same lifted-state pattern as documents/knowledgeGaps above: users is
// org-wide (not filtered by Space), but UsersRolesPage is still
// conditionally rendered (unmounts on nav switch), so it must live here
// to survive that round-trip.
const [users, setUsers] = useState<OrgUser[]>(() => mockOrgUsers);
```

- [ ] **Step 4: Add the three handlers**

Immediately after the existing `handleUpdateDocument` function (right before `handleLibraryTabChange`), add:

```ts
const handleUpdateUserAccess = (userId: string, update: UserAccessUpdate) => {
  setUsers((prev) =>
    prev.map((user) =>
      user.id === userId
        ? { ...user, isAdmin: update.isAdmin, memberships: update.memberships }
        : user,
    ),
  );
  toast.success("User access updated.");
};

const handleRemoveUser = (userId: string) => {
  setUsers((prev) => prev.filter((user) => user.id !== userId));
  toast.success("User removed.");
};

const handleInvitePeople = (candidates: InviteCandidate[]) => {
  setUsers((prev) => [
    ...prev,
    ...candidates.map((candidate, index) => {
      const space = mockSpaces.find((s) => s.id === candidate.spaceId);
      return {
        id: `user-${Date.now()}-${index}`,
        name: candidate.email.split("@")[0],
        email: candidate.email,
        avatarInitials: candidate.email.slice(0, 2).toUpperCase(),
        isAdmin: false,
        status: "invited" as const,
        memberships: space ? [{ space, role: candidate.role }] : [],
      };
    }),
  ]);
  toast.success(
    `Sent ${candidates.length} invite${candidates.length === 1 ? "" : "s"}.`,
  );
};
```

- [ ] **Step 5: Replace the placeholder render**

Replace:

```tsx
{
  activeNavKey === "users-roles" && (
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
  );
}
```

with:

```tsx
{
  activeNavKey === "users-roles" && (
    <UsersRolesPage
      users={users}
      allSpaces={mockSpaces}
      onUpdateUserAccess={handleUpdateUserAccess}
      onRemoveUser={handleRemoveUser}
      onInvitePeople={handleInvitePeople}
    />
  );
}
```

- [ ] **Step 6: Type-check and lint**

Run: `npm run build && npm run lint`
Expected: both succeed. Confirm there is no remaining reference to `NAV_PAGE_TITLE` anywhere in `src/` — `grep -rn "NAV_PAGE_TITLE" src` should return nothing.

- [ ] **Step 7: Trace the full flow by hand (no browser available)**

Confirm by reading the code:

- Clicking the "Users & Roles" nav item (rail icon, sidebar row, or mobile drawer/bottom-tab equivalent — all already wired to `setActiveNavKey("users-roles")` before this task, unchanged) renders `UsersRolesPage` with `users` (7 seeded people) and `allSpaces={mockSpaces}` (all 3 Spaces org-wide, not just `currentUser`'s own memberships — this is deliberately different from `accessibleSpaceIds` used elsewhere, since an Admin managing another person's access needs to grant _any_ Space, not only ones they personally belong to).
- Opening a row's detail panel, flipping the Admin toggle, and clicking Save calls `handleSaveAccess` (Task 8) → `onUpdateUserAccess` → `handleUpdateUserAccess` here, which replaces that one user's `isAdmin`/`memberships` in `users` state (via `.map`, leaving every other user untouched) and shows exactly one toast — then `UsersRolesPage` closes the panel.
- Removing a user (confirm flow) removes them from `users` via `.filter` and shows one toast; the removed user's row disappears from `UsersTable` on the next render since `users` is passed straight through as a prop, no separate copy to keep in sync.
- Submitting the Invite panel with 2 valid person cards calls `handleInvitePeople` with a 2-element `InviteCandidate[]`, appending 2 new `status: "invited"` `OrgUser` rows (email-derived `name`/`avatarInitials` — good enough for a mock invite flow with no real name field) and showing one toast pluralized correctly ("Sent 2 invites.").
- Navigating away to Documents and back to Users & Roles remounts `UsersRolesPage` (its own `selectedUser`/panel-open state resets, which is fine — no panel should still be open after a nav switch) but `users` itself does NOT reset, since it lives in `PortalShell`, one level above the conditional — confirming this task actually closes the "state lost on unmount/remount" gap class rather than re-introducing a sixth instance of it.
- A Space switch (different route, remounts `PortalShell` entirely) does reset `users` back to `mockOrgUsers` — same accepted, pre-existing limitation `documents`/`knowledgeGaps` already have (see the Ask AI plan's Architecture note), not a new one.

- [ ] **Step 8: Commit**

```bash
git add src/components/shell/PortalShell.tsx
git commit -m "feat: wire Users & Roles admin page into PortalShell"
```
