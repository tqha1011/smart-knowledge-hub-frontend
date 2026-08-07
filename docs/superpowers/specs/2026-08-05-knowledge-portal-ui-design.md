# Smart Internal Knowledge Portal — UI Design

## Overview

The repo (`WorkSync frontend` scaffolding) is being repurposed for a new product: **Smart Internal Knowledge Portal**, an internal knowledge-management system with an integrated RAG Assistant that answers employee questions from internal documents, with source citations.

This spec covers the **visual design and UI structure** for six pieces validated interactively in a brainstorming session (mockups iterated in the visual companion, approved section by section):

1. Portal shell (navigation, responsive behavior)
2. Document Library page
3. Document detail panel
4. Upload / Edit document panel
5. RAG Assistant ("Ask AI") panel
6. Login and Set-password (invite acceptance) screens

Out of scope for this spec (separate sub-projects, to be brainstormed later): Users & Roles admin page, Space management (create/edit a Space), the aggregate feedback dashboard view, and per-question command-palette shortcuts.

Note: the previous `CLAUDE.md` / `DESIGN.md` (describing a kanban product, "WorkSync") were deleted from the working tree — this spec's design system replaces them; a follow-up task should rewrite `CLAUDE.md`/`DESIGN.md` to describe the actual product once implementation starts.

## Roles & permissions

Two permission layers, not just one flat role:

- **Global role** — `Admin`, `Editor`, `Employee`.
- **Per-Space role** (`SpaceMembership.role`) — a user's effective permissions in a given Space can differ from their global role (e.g. Editor in Space A, Employee/viewer-only in Space B).

Effective behavior:

- **Employee**: read-only — view Spaces they're a member of, search, ask the RAG Assistant, submit feedback on answers.
- **Editor** (per Space): upload/edit/delete documents in that Space, resolve that Space's knowledge-gap queue (unanswered questions).
- **Admin** (global): everything Editor can do in every Space, plus manage users, manage Spaces, assign per-Space roles, and view the aggregate dashboard.

**Space** = a knowledge workspace scoped to a department or content group (e.g. Engineering, HR, Sales). A user can belong to multiple Spaces with different roles in each. The shell must include a Space switcher since both content and permissions change per Space.

The shell nav is designed against the **Admin** view (fullest nav — includes "Users & Roles"); Employee/Editor see the same structure minus the Admin-only section.

## Design tokens

**Aesthetic direction:** modern/approachable (not enterprise-serious, not minimal-editorial). Free color palette (no existing brand constraint). UI copy in **English**. Both **light and dark** mode required from the start.

### Color

| Token                                               | Light                                            | Dark                                             | Use                                    |
| --------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------ | -------------------------------------- |
| `--bg`                                              | `#FAF8F4`                                        | `#14161B`                                        | page background                        |
| `--surface`                                         | `#FFFFFF`                                        | `#1B1E26`                                        | cards, panels, table                   |
| `--surface-sunken`                                  | `#F1EEE7`                                        | `#0F1116`                                        | inputs, filter chips, inactive fills   |
| `--border`                                          | `#ECE8DE`                                        | `#2A2E38`                                        | hairlines                              |
| `--ink`                                             | `#1C2033`                                        | `#EDEBE4`                                        | primary text                           |
| `--ink-muted`                                       | `#6E6A5F`                                        | `#9CA3AF`                                        | secondary text                         |
| `--accent` (Assistant / active state)               | `#0E8F82` (teal)                                 | `#35C9B8`                                        | Ask AI, active nav, primary buttons    |
| `--accent-soft`                                     | `#E3F3F0`                                        | `#16302D`                                        | accent backgrounds                     |
| `--citation-bg` / `--citation-fg` (amber)           | `#FBF0DC` / `#B8860B`                            | `#2B2415` / `#E3A64A`                            | citation chips                         |
| `--warn-bg` / `--warn-fg`                           | `#FDEAEA` / `#C0392B`                            | `#331A1A` / `#E38080`                            | knowledge-gap / needs-attention counts |
| `--avatar-bg` / `--avatar-fg`                       | `#1C2033` / `#FFFFFF`                            | `#EDEBE4` / `#14161B`                            | avatar chips                           |
| `--status-ready-bg` / `--status-ready-fg` (green)   | `#E7F5EC` / `#2F7D5B`                            | `#1B2E22` / `#5FBE8A`                            | document processing status: Ready      |
| `--status-processing-bg` / `--status-processing-fg` | same values as `--citation-bg` / `--citation-fg` | same values as `--citation-bg` / `--citation-fg` | document processing status: Processing |
| `--status-failed-bg` / `--status-failed-fg`         | same values as `--warn-bg` / `--warn-fg`         | same values as `--warn-bg` / `--warn-fg`         | document processing status: Failed     |

Teal is reserved for the Assistant and active/primary state — it's what signals "AI is here." Amber is reserved for citations and (via `--status-processing-*`) the "processing" document status — both read as "in progress, not final yet," so the reuse is semantic, not accidental. `--status-failed-*` deliberately mirrors `--warn-*` since a failed document is the same severity as a knowledge gap. `--status-ready-*` (green) is the only genuinely new pair — success/complete didn't have a token yet.

### Typography

- **Display** (`Fraunces`, serif, weight 500/600): portal wordmark, page titles (`Documents`, `Good morning, Admin`). Used sparingly — titles only, never body or UI chrome.
- **Body/UI** (`Manrope`, weight 400–700): all UI text — nav labels, buttons, table content, chat bubbles.
- **Utility/mono** (`IBM Plex Mono`, weight 400/500): citation chip numbers, knowledge-gap counts — anywhere a small precise numeral needs to read as data rather than prose.

### Layout

- Radius: 8–14px depending on component size (chips ~4-9px, cards/panels ~10-14px).
- The icon rail + sidebar combination is the base shell chrome (see below); content areas use a 24–32px outer padding on desktop, 14–18px on mobile.

### Signature element

Numbered **citation chips** (amber, monospace) — inline in Assistant answers and repeated next to each source in the sources list below the answer. They're the one recurring visual motif tying the Assistant's answers back to real documents, functioning like academic footnotes. This is justified as a numbered device (unlike generic `01/02/03` section markers) because citations are genuinely an ordered, referenced list, not decoration.

## Portal shell

**Structure:** persistent icon rail (56px, always visible on desktop) + expandable labeled sidebar (~200px) + main content area with a topbar (search, theme toggle, avatar).

Sidebar sections, top to bottom:

1. **Space switcher** — pill button at the top (colored dot + Space name + chevron).
2. **Knowledge** eyebrow — `Documents`, `Needs attention` (with a count badge once knowledge gaps exist).
3. **Assistant** eyebrow — `Ask AI` (teal text, small pulse dot signaling availability). Clicking it opens the floating panel (see below) — it does not navigate away.
4. **Admin** eyebrow (Admin only) — `Users & Roles`.

**Responsive behavior** (verified by resizing a real browser window, not device frames):

- **≥ 980px**: full rail + sidebar.
- **< 980px**: sidebar hides; rail remains; content area drops to 2-column grids where relevant.
- **< 640px**: rail also hides. Replaced by:
  - A **hamburger** button in the topbar opening the full nav (rail + sidebar content) as a fixed-position overlay drawer with a backdrop.
  - A **bottom tab bar** (fixed, 60px, thumb-reachable) with the primary destinations: Documents, Ask AI, Admin (role-dependent), Menu.
- Tables drop lower-priority columns first (Updated by, then Category) rather than horizontal-scrolling or shrinking illegibly.
- The Ask AI floating panel goes full-width on mobile instead of a fixed 440px.

Both light and dark mode use the same structure; only the token values swap (see Color table).

## Document Library

**View type: list/table**, chosen over a card/grid because the page needs to support scanning and comparing metadata (category, owner, update date, citation count) across potentially large document sets — a grid is more decorative but slower to scan at volume.

**Page structure:**

- Title row: `Documents` (Fraunces) + subtitle (`{Space name} · {count} documents · {n} need attention`) + primary "Upload document" button (Editor/Admin only; hidden for Employee).
- **Tabs**: `All documents` | `Needs attention` (badge = knowledge-gap count).
- Category filter chips (pill-style, single active state) above the table — filters within the current Space.
- **Table columns**: Name (file-type icon + title), Category (tag), Updated by (avatar + name), Updated (relative date), Cited (citation-count chip), row action menu (⋯).

**"Needs attention" tab** = the knowledge-gap queue: unanswered/low-confidence questions logged automatically when the RAG Assistant can't find a confident source (see below). Each item shows the question text, how many times it's been asked, and two actions: **Mark resolved** / **Ignore**. This is deliberately a separate, distinct list from answer feedback (see Feedback, below) — the two are not merged.

**Permissions on this page:**

- Employee: read/search only, no Upload button, no row actions, no Needs-attention tab actions.
- Editor: full access within Spaces where they hold the Editor role.
- Admin: full access everywhere, plus sees Users & Roles in the shell.

## Document detail panel

**Form factor: floating slide-over panel** (420px, right-aligned), same pattern as the Ask AI panel — opened by clicking a row in the Document Library table, dims/blurs the table behind it, closes back to exactly where the user was.

**Metadata + actions only — no embedded file preview.** The panel shows Space, file type/size, updated-by, and updated-date in a 2-column grid, then an action row: **Open/Download** (primary — opens the original file in a new tab/app), **Edit details**, **Replace file**, **Delete** (danger-styled). Opening the actual file content is delegated to the browser/OS, not rendered inline — keeps the panel simple and avoids building a PDF/doc viewer for this pass.

**"Cited by the Assistant"** section below the actions: a list of the questions the RAG Assistant has answered using this document, each showing the question text, how many times it's been asked, and when it was last asked. This reuses the same underlying citation-tracking data as the Document Library's "Cited" column count — this panel is where that count becomes a real list.

No version history in this pass (considered and deliberately deferred — not required for the MVP).

**Permissions:** action row (Edit/Replace/Delete) only renders for Editor (in Spaces where they hold that role) and Admin; Employee sees metadata, the citation list, and Open/Download only. Employee never sees this panel's edit form (below) at all — only Editor/Admin can open it.

## Upload / Edit document panel

**One shared form, two entry points**, same slide-over pattern as the rest of the app: "Upload document" (from the Document Library primary button) and "Edit document details" (from the document detail panel's "Edit details" action) render the same panel — title and submit-button label ("Upload" vs "Save changes") swap based on entry point.

**Two content modes when creating a new document** (tabs at the top of the panel, only shown for new uploads — an existing document's mode is fixed once created, so the tabs disappear in Edit):

- **Upload file** — a dropzone (drag-and-drop or click to browse; accepts PDF/DOCX/Markdown up to 25MB).
- **Write content** — a **Markdown** textarea (monospace, small formatting toolbar: bold, heading, list, code block) for authoring a document directly in the portal, wiki-style, with no underlying file.

**Shared fields below the mode-specific area:** Document name, Category (select), Description (short textarea).

**Status badge** (`Processing` / `Ready` / `Failed`, using the `--status-*` tokens): shown next to the panel title **only in Edit mode**, as a **read-only badge** — the system sets it automatically once RAG indexing runs; there is no dropdown or manual override. A brand-new upload has no badge yet (nothing to show until processing starts after submit).

**Permissions:** this panel is Editor (in Spaces where they hold that role) / Admin only, matching the Document Library's Upload button and the detail panel's Edit action.

## RAG Assistant ("Ask AI")

**Form factor: floating slide-over panel** (440px, right-aligned, dims/blurs the page behind it), not a dedicated full page. Opens from the "Ask AI" nav item or its mobile bottom-tab equivalent; the current page stays mounted behind it (visible when the panel closes), so a user can ask a question without losing their place in the Document Library or elsewhere.

**Scope:** answers are drawn from **all Spaces the user has access to** (not just the currently selected Space) — this is more useful than a single-Space-scoped assistant, but requires every citation to show which Space it came from so multi-Space answers aren't confusing.

**Panel structure:**

- Header: "Ask AI" (Fraunces) + small scope line (`Searching across N spaces you have access to`) + close button.
- Scrollable thread: user messages (right-aligned, accent-filled bubble), assistant messages (left-aligned, neutral bubble).
- Assistant answers contain **inline numbered citation chips** (amber) at the exact claim they support, plus a **sources list** underneath — each source repeats its chip number, document title, and a Space badge.
- **Feedback row** under every assistant answer: 👍 / 👎, always visible. Clicking 👎 reveals an optional comment textarea + "Send feedback" button; 👍 needs no comment. Feedback is stored and surfaced only as an aggregate helpful/not-helpful ratio on the (future, out-of-scope) Admin dashboard — there is no per-item Editor review workflow for feedback in this MVP.
- When the Assistant has no confident source, it says so explicitly and the question is automatically logged into that Space's **Needs attention** knowledge-gap queue (the same queue Editors triage in Document Library) — this is a separate mechanism from thumbs-down feedback, not a merged one.
- Composer: single-line input + Send button, pinned to the bottom of the panel.

**Mobile:** panel becomes full-viewport width instead of a fixed 440px column.

## Login and Set-password screens

**No public self-registration.** Admin provisions accounts (and assigns Space roles) up front; there is no "Register" flow in the open-signup sense. Two separate full-screen routes instead:

- `/login` — returning users.
- `/set-password?token=...` — invite acceptance / first-time password setup, reached via a link Admin/the system sends after provisioning an account. **Not the same screen as Login** — a distinct route, shown standalone, never side-by-side with it in the real app (they were only shown together in one mockup for side-by-side review during brainstorming).

**Layout: centered card, minimal** (chosen over a split-screen brand panel) — logo/wordmark above a compact form on the plain `--bg` background, no side illustration panel. Simpler to build and identical across every screen size; the trade-off (no product-storytelling moment on entry) was accepted deliberately.

**Login fields:** email + password only (no SSO for now). Below the fields: a "Keep me signed in" checkbox and a "Forgot password?" link on the same row. Primary "Sign in" button. An error banner (amber-adjacent warn tokens) appears above the fields on failed login: "Incorrect email or password. Try again." Footer line for the no-self-registration reality: "No access yet? Contact your workspace admin."

**Set-password fields:** an **invite-context banner** above the form stating what the person is joining, e.g. "Joining **Engineering** space as **Editor**" (pulls from the invite token) — this is the one thing that makes the screen legible as "someone set this up for you," not a generic signup. Email field is pre-filled and disabled (from the invite token). New password + confirm password fields, with a hint below the password field ("At least 8 characters, one number"). Primary "Set password & continue" button.

Both screens reuse the shell's tokens (`--accent` teal for primary actions and links, `--warn-*` for the error banner, `--accent-soft` for the invite-context banner, Fraunces for the wordmark/heading, Manrope for everything else) — no new tokens needed.

## Non-goals for this spec

- Visual design for: Users & Roles admin page, Space creation/management, the feedback-ratio dashboard.
- An embedded in-app file viewer (PDF/doc rendering) — the document detail panel only links out to the original file.
- Real API/data integration — all mockups use static example content.
- Accessibility audit beyond baseline (visible focus states, reduced-motion respect) — not yet verified against this spec's components.
