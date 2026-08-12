# RAG Assistant ("Ask AI") Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `AskAiStubPanel` (a placeholder that only proves the shell opens the panel) with the real RAG Assistant panel, per `docs/superpowers/specs/2026-08-05-knowledge-portal-ui-design.md` § "RAG Assistant (\"Ask AI\")": a scrollable question/answer thread with inline numbered citation chips, a sources list per answer, per-answer thumbs-up/down feedback, automatic knowledge-gap logging when no confident source exists, and a bottom composer — all inside the existing 440px floating slide-over.

**Architecture:** A small component tree under a new `src/components/askAiComponent/` directory (matching the existing `documentComponent`/`authComponent` convention): `AskAiPanel` (owns the conversation state and the two mock "AI" side effects — answering and feedback), `AskAiPanelBody` (the visual chrome: header, scrollable thread, composer — split out purely so it can mount/unmount per open via `AnimatePresence`, the same pattern `DocumentDetailPanel`/`DocumentFormPanel` already use), `UserMessageBubble`/`AssistantMessageBubble` (one bubble type each), `CitationChip` (the shared numbered chip, used both inline in answer text and in the sources list), and `FeedbackRow` (the two-step 👍/👎 UI). A separate `mockAiKnowledgeBase.ts` module stands in for the RAG backend: a small canned keyword-matched Q&A table that cites real `mockDocuments` entries (reusing this app's actual document data, not synthetic examples) so the "same underlying citation-tracking data" relationship the spec describes for citations is genuinely visible, without a real model behind it.

**A deliberate departure from the Detail/Form panel pattern, worth calling out up front:** those two panels reset all their internal state on every open (by mounting a fresh `…Body` component each time `isOpen` flips true), which is correct for a per-item form/view. A chat thread is different — closing the Ask AI panel and reopening it should NOT erase the conversation, the same way closing a chat widget never erases your messages. So in this plan, `messages` state lives in `AskAiPanel` itself (which stays mounted for as long as `PortalShell` is mounted, regardless of `isOpen`), not inside the isOpen-gated `AskAiPanelBody`. Only the panel's visual chrome mounts/unmounts per open/close; the conversation survives close→reopen and is lost only when `PortalShell` itself remounts (a Space switch) — which is already true today for `isAskAiOpen` itself (switching Spaces already closes the panel before this plan), so this isn't a new limitation, just an extension of an existing one to the new `messages` state riding alongside it.

**Scope boundaries, decided up front so no task re-litigates them:**

- No artificial "thinking…" delay or typing indicator — the mock answer function is synchronous, matching every other mock interaction already in this codebase (file validation, form submission).
- Citing a document via Ask AI does **not** live-mutate `mockDocuments`/`mockDocumentCitations`'s `citationCount` — the spec only requires the data _model_ to be shared (which citing real document IDs already demonstrates), not that asking a question repeatedly inflates a real count with no backend to make that meaningful.
- Citations are not clickable (the spec only says the sources list "repeats its chip number, document title, and a Space badge" — no click-through interaction is described).
- Feedback comments are stored on the message (for realism) but never displayed anywhere else — the spec explicitly says the aggregate feedback dashboard is a future, out-of-scope piece.

**Tech Stack:** React 19, TypeScript 6 (bundler mode, `verbatimModuleSyntax`), Tailwind v4 (`@theme` tokens, including `--color-citation-bg/fg` used for the first time by something other than the Document Library's "Cited" chip), `framer-motion` (established slide-over pattern), `lucide-react` icons, `react-toastify` (used elsewhere in `PortalShell`, not newly needed by this panel itself — see Task 6). No test runner is configured in this repo — verification is `npm run lint` + `npm run build`, plus careful code-tracing in place of manual browser testing (**no browser is available in this environment** — same constraint documented in the three prior plans for this app).

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
- **No browser is available in this sandbox.** Any step that would normally say "type a question and confirm the answer appears" instead means: read the JSX/state wiring carefully and confirm by tracing props/handlers, not by running the dev server in a browser.

---

## Task 1: Ask AI types

**Files:**

- Create: `src/types/commonType/askAi.ts`
- Modify: `src/types/index.ts`

**Interfaces:**

- Produces: `AskAiCitation { chipNumber: number; documentId: string; documentTitle: string; spaceId: string; spaceName: string }`, `FeedbackVote = "helpful" | "not-helpful" | null`, `AssistantAnswer { text: string; citations: AskAiCitation[]; isLowConfidence: boolean }`, `UserChatMessage { id: string; role: "user"; question: string }`, `AssistantChatMessage { id: string; role: "assistant"; answer: AssistantAnswer; feedback: FeedbackVote; feedbackComment?: string }`, `ChatMessage = UserChatMessage | AssistantChatMessage` — all exported from `src/types`.

- [ ] **Step 1: Create the type file**

```ts
// src/types/commonType/askAi.ts

// A cited source shown inline (as a numbered chip) and repeated in the
// sources list below an assistant answer. Every citation carries its own
// Space, since answers can cite documents across every Space the user has
// access to, not just the currently selected one.
export interface AskAiCitation {
  chipNumber: number;
  documentId: string;
  documentTitle: string;
  spaceId: string;
  spaceName: string;
}

export type FeedbackVote = "helpful" | "not-helpful" | null;

// isLowConfidence=true means no confident source was found: `text` carries
// the "couldn't find a confident answer" copy, `citations` is empty, and
// the caller is responsible for logging a knowledge gap — a separate
// mechanism from thumbs-down feedback, per spec, not a merged one.
export interface AssistantAnswer {
  /** May contain inline citation markers like "{{1}}", replaced with citation chips at render time. */
  text: string;
  citations: AskAiCitation[];
  isLowConfidence: boolean;
}

export interface UserChatMessage {
  id: string;
  role: "user";
  question: string;
}

export interface AssistantChatMessage {
  id: string;
  role: "assistant";
  answer: AssistantAnswer;
  feedback: FeedbackVote;
  /** Optional comment attached to a thumbs-down vote. Stored for realism only — there is no aggregate feedback dashboard to surface it to in this MVP (explicitly out of scope per spec). */
  feedbackComment?: string;
}

// Discriminated on `role` so narrowing a ChatMessage to one variant gives
// the right fields (a UserChatMessage has no `feedback`; only an
// AssistantChatMessage does).
export type ChatMessage = UserChatMessage | AssistantChatMessage;
```

- [ ] **Step 2: Export the new types from the barrel**

In `src/types/index.ts`, add a new export block (after the existing `document` export block, before the `authType` export block):

```ts
export type {
  AskAiCitation,
  FeedbackVote,
  AssistantAnswer,
  UserChatMessage,
  AssistantChatMessage,
  ChatMessage,
} from "./commonType/askAi";
```

- [ ] **Step 3: Type-check**

Run: `npm run build`
Expected: succeeds (new file has no consumers yet, so nothing else changes).

- [ ] **Step 4: Commit**

```bash
git add src/types/commonType/askAi.ts src/types/index.ts
git commit -m "feat: add Ask AI chat message and citation types"
```

---

## Task 2: Mock AI knowledge base

**Files:**

- Create: `src/components/askAiComponent/mockAiKnowledgeBase.ts`

**Interfaces:**

- Consumes: `AskAiCitation`, `AssistantAnswer` from Task 1; `mockDocuments`, `mockSpaces` from `src/components/shell/shellMockData.ts` (both already exist).
- Produces: `findAnswer(question: string, accessibleSpaceIds: string[], currentSpaceName: string): AssistantAnswer` — consumed by Task 6's `AskAiPanel`.

This is the mock "RAG backend": a small canned keyword-matched table. Each entry's `documentIds` cite real `mockDocuments` entries (not synthetic examples), so the citations shown in the panel are genuinely backed by documents that already exist in the Document Library.

- [ ] **Step 1: Write the module**

```ts
// src/components/askAiComponent/mockAiKnowledgeBase.ts
import { mockDocuments, mockSpaces } from "../shell/shellMockData";
import type { AskAiCitation, AssistantAnswer } from "../../types";

interface AiAnswerEntry {
  keywords: string[];
  answerText: string;
  documentIds: string[];
}

// MOCK: stands in for a real RAG backend. Keyword-matches a question
// against a small canned knowledge base and cites real mockDocuments
// entries — deliberately does not mutate mockDocumentCitations'
// citationCount (see the plan's Architecture note): citing real document
// IDs already demonstrates the spec's "same underlying citation-tracking
// data" relationship without inflating a count that no backend tracks.
const mockAiAnswers: AiAnswerEntry[] = [
  {
    keywords: ["pagination", "api version", "breaking change", "versioning"],
    answerText:
      "For list endpoints, use cursor-based pagination with a next_cursor token rather than offset/limit — it stays stable as records are inserted or removed {{1}}. When introducing a breaking API change, ship it behind a new version prefix (e.g. /v2/) rather than mutating the existing contract, and give consumers a documented deprecation window {{1}}.",
    documentIds: ["doc-1"],
  },
  {
    keywords: [
      "incident",
      "escalation",
      "sev1",
      "outage",
      "on-call",
      "rollback",
    ],
    answerText:
      "If a Sev1 alert fires, page the on-call engineer first and open an incident channel within 5 minutes {{1}}. Don't declare an incident resolved until the error rate has stayed below threshold for a full monitoring window, not just the moment metrics first dip back down {{1}}.",
    documentIds: ["doc-2"],
  },
  {
    keywords: ["pto", "time off", "vacation", "leave", "rollover"],
    answerText:
      "New hires accrue PTO starting their first pay period, and up to 5 unused days can roll over into the next calendar year — anything beyond that is forfeited {{1}}.",
    documentIds: ["doc-5"],
  },
  {
    keywords: ["discount", "pricing", "contract", "annual", "multi-year"],
    answerText:
      "Standard annual contracts support up to a 15% discount without approval; anything deeper needs sales-leadership sign-off {{1}}. Add-on seats added mid-contract are prorated at the same per-seat rate as the original agreement {{1}}.",
    documentIds: ["doc-7"],
  },
];

// Returns a low-confidence AssistantAnswer (empty citations) when no
// keyword matches, OR when every cited document falls outside the
// accessible Space list — the caller (AskAiPanel) is responsible for
// logging a knowledge gap whenever isLowConfidence is true.
export function findAnswer(
  question: string,
  accessibleSpaceIds: string[],
  currentSpaceName: string,
): AssistantAnswer {
  const lowerQuestion = question.toLowerCase();
  const matchedEntry = mockAiAnswers.find((entry) =>
    entry.keywords.some((keyword) => lowerQuestion.includes(keyword)),
  );

  if (matchedEntry) {
    const citations: AskAiCitation[] = matchedEntry.documentIds
      .map((documentId, index) => {
        const document = mockDocuments.find((doc) => doc.id === documentId);
        if (!document || !accessibleSpaceIds.includes(document.spaceId)) {
          return null;
        }
        const space = mockSpaces.find((s) => s.id === document.spaceId);
        return {
          chipNumber: index + 1,
          documentId: document.id,
          documentTitle: document.name,
          spaceId: document.spaceId,
          spaceName: space?.name ?? document.spaceId,
        };
      })
      .filter((citation): citation is AskAiCitation => citation !== null);

    if (citations.length > 0) {
      return {
        text: matchedEntry.answerText,
        citations,
        isLowConfidence: false,
      };
    }
  }

  return {
    text: `I don't have a confident source for that yet — I've logged it to ${currentSpaceName}'s Needs attention queue so an editor can add coverage.`,
    citations: [],
    isLowConfidence: true,
  };
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npm run build && npm run lint`
Expected: both succeed. No consumers yet (Task 6 wires this in).

- [ ] **Step 3: Trace the matching logic by hand (no browser available)**

Confirm by reading the code: the question "What's our pagination pattern?" contains the substring "pagination" → matches the first entry → returns an answer citing `doc-1` ("API Design Guidelines.pdf", Engineering space). The question "What's for dinner?" matches no keyword → returns the low-confidence fallback with `isLowConfidence: true` and an empty `citations` array. Confirm the `accessibleSpaceIds` filter is real: if a caller passed an empty array, every citation would be filtered out (since no `document.spaceId` could ever be in an empty list), causing even a keyword match to fall through to the low-confidence branch — this is the intended defensive behavior for "the user doesn't actually have access to any Space that could answer this."

- [ ] **Step 4: Commit**

```bash
git add src/components/askAiComponent/mockAiKnowledgeBase.ts
git commit -m "feat: add mock Ask AI knowledge base"
```

---

## Task 3: CitationChip and FeedbackRow components

**Files:**

- Create: `src/components/askAiComponent/CitationChip.tsx`
- Create: `src/components/askAiComponent/FeedbackRow.tsx`

**Interfaces:**

- Consumes: `FeedbackVote` from Task 1 (`FeedbackRow` only).
- Produces: `CitationChip` component with props `{ number: number }`; `FeedbackRow` component with props `{ vote: FeedbackVote; onSubmit: (vote: "helpful" | "not-helpful", comment?: string) => void }`. Both consumed by Task 4's `AssistantMessageBubble`.

These are two small, independent presentational components with no dependency on each other — grouped into one task because both are simple, complete-code leaves that Task 4 needs, not because they're related.

- [ ] **Step 1: Write `CitationChip`**

```tsx
// src/components/askAiComponent/CitationChip.tsx
interface CitationChipProps {
  number: number;
}

// Numbered amber citation marker — the signature UI element for the RAG
// Assistant per spec: the same chip renders inline within an answer's text
// (at the exact claim it supports) and again in the sources list below,
// functioning like an academic footnote.
export function CitationChip({ number }: CitationChipProps) {
  return (
    <span className="bg-citation-bg text-citation-fg mx-0.5 inline-flex size-4 items-center justify-center rounded-full align-text-top font-mono text-[10px] font-semibold">
      {number}
    </span>
  );
}
```

- [ ] **Step 2: Write `FeedbackRow`**

```tsx
// src/components/askAiComponent/FeedbackRow.tsx
import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import type { FeedbackVote } from "../../types";

interface FeedbackRowProps {
  vote: FeedbackVote;
  onSubmit: (vote: "helpful" | "not-helpful", comment?: string) => void;
}

// Feedback row under every assistant answer, per spec: 👍 submits
// immediately (no comment needed); 👎 reveals an optional comment
// textarea + "Send feedback" button, and only that button actually
// submits the down-vote. Once a vote lands, the row collapses to a
// short acknowledgement instead of showing the buttons again.
export function FeedbackRow({ vote, onSubmit }: FeedbackRowProps) {
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [comment, setComment] = useState("");

  if (vote) {
    return (
      <p className="text-ink-muted mt-2 text-xs">
        {vote === "helpful"
          ? "Thanks for the feedback!"
          : "Thanks — feedback sent."}
      </p>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSubmit("helpful")}
          aria-label="Helpful"
          className="text-ink-muted hover:bg-surface-sunken flex size-7 items-center justify-center rounded-md"
        >
          <ThumbsUp size={14} />
        </button>
        <button
          type="button"
          onClick={() => setIsCommentOpen(true)}
          aria-label="Not helpful"
          className="text-ink-muted hover:bg-surface-sunken flex size-7 items-center justify-center rounded-md"
        >
          <ThumbsDown size={14} />
        </button>
      </div>
      {isCommentOpen && (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="What could be improved? (optional)"
            rows={2}
            className="border-border text-ink placeholder:text-ink-muted focus:border-accent w-full resize-y rounded-md border px-2 py-1.5 text-xs outline-none"
          />
          <button
            type="button"
            onClick={() => onSubmit("not-helpful", comment.trim() || undefined)}
            className="bg-accent self-start rounded-md px-2.5 py-1.5 text-xs font-semibold text-white"
          >
            Send feedback
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npm run build && npm run lint`
Expected: both succeed. No consumers yet (Task 4 wires these in).

- [ ] **Step 4: Trace the two-step feedback flow by hand (no browser available)**

Confirm by reading the code: clicking the 👍 button calls `onSubmit("helpful")` directly — no intermediate UI. Clicking the 👎 button only calls `setIsCommentOpen(true)`, revealing the textarea + "Send feedback" button; only clicking "Send feedback" calls `onSubmit("not-helpful", ...)`, with the comment passed as `undefined` (not an empty string) when the textarea was left blank, since `comment.trim() || undefined` collapses an empty/whitespace-only string to `undefined`. Confirm that once `vote` is non-null (a prop this component receives, not a local state it can flip itself), the function returns early and never shows the buttons/textarea again — the "submitted" transition happens because the _parent_ re-renders this component with a new `vote` value, not because of anything inside `FeedbackRow`.

- [ ] **Step 5: Commit**

```bash
git add src/components/askAiComponent/CitationChip.tsx src/components/askAiComponent/FeedbackRow.tsx
git commit -m "feat: add CitationChip and FeedbackRow components"
```

---

## Task 4: Message bubble components

**Files:**

- Create: `src/components/askAiComponent/UserMessageBubble.tsx`
- Create: `src/components/askAiComponent/AssistantMessageBubble.tsx`

**Interfaces:**

- Consumes: `CitationChip` and `FeedbackRow` from Task 3; `UserChatMessage`, `AssistantChatMessage`, `AskAiCitation` types from Task 1.
- Produces: `UserMessageBubble` component with props `{ message: UserChatMessage }`; `AssistantMessageBubble` component with props `{ message: AssistantChatMessage; onFeedback: (messageId: string, vote: "helpful" | "not-helpful", comment?: string) => void }`. Both consumed by Task 5's `AskAiPanelBody`.

- [ ] **Step 1: Write `UserMessageBubble`**

```tsx
// src/components/askAiComponent/UserMessageBubble.tsx
import type { UserChatMessage } from "../../types";

interface UserMessageBubbleProps {
  message: UserChatMessage;
}

// Right-aligned, accent-filled bubble for the user's own questions, per spec.
export function UserMessageBubble({ message }: UserMessageBubbleProps) {
  return (
    <div className="bg-accent ml-auto max-w-[80%] rounded-lg rounded-tr-sm px-3 py-2 text-sm text-white">
      {message.question}
    </div>
  );
}
```

- [ ] **Step 2: Write `AssistantMessageBubble`**

```tsx
// src/components/askAiComponent/AssistantMessageBubble.tsx
import type { ReactNode } from "react";
import type { AskAiCitation, AssistantChatMessage } from "../../types";
import { CitationChip } from "./CitationChip";
import { FeedbackRow } from "./FeedbackRow";

interface AssistantMessageBubbleProps {
  message: AssistantChatMessage;
  onFeedback: (
    messageId: string,
    vote: "helpful" | "not-helpful",
    comment?: string,
  ) => void;
}

// Splits an answer's text on "{{N}}" citation markers and replaces each
// one with a numbered CitationChip, rendering plain text in between.
function renderAnswerText(text: string): ReactNode[] {
  const parts = text.split(/(\{\{\d+\}\})/g);
  return parts.map((part, index) => {
    const match = part.match(/^\{\{(\d+)\}\}$/);
    if (!match) return <span key={index}>{part}</span>;
    return <CitationChip key={index} number={Number(match[1])} />;
  });
}

// Left-aligned, neutral bubble for assistant answers, per spec: inline
// numbered citation chips at the exact claim they support, a sources list
// underneath repeating each chip number + document title + Space badge
// (multi-Space search means every citation must show its Space), and a
// feedback row. A low-confidence answer has no citations to list.
export function AssistantMessageBubble({
  message,
  onFeedback,
}: AssistantMessageBubbleProps) {
  const { answer } = message;

  return (
    <div className="mr-auto max-w-[85%]">
      <div className="bg-surface-sunken text-ink rounded-lg rounded-tl-sm px-3 py-2 text-sm">
        <p>{renderAnswerText(answer.text)}</p>
        {answer.citations.length > 0 && (
          <ul className="border-border mt-2 flex flex-col gap-1 border-t pt-2">
            {answer.citations.map((citation: AskAiCitation) => (
              <li
                key={citation.chipNumber}
                className="flex items-center gap-1.5 text-xs"
              >
                <CitationChip number={citation.chipNumber} />
                <span className="text-ink font-medium">
                  {citation.documentTitle}
                </span>
                <span className="bg-surface text-ink-muted rounded-full px-1.5 py-0.5">
                  {citation.spaceName}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <FeedbackRow
        vote={message.feedback}
        onSubmit={(vote, comment) => onFeedback(message.id, vote, comment)}
      />
    </div>
  );
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npm run build && npm run lint`
Expected: both succeed. No consumers yet (Task 5 wires these in).

- [ ] **Step 4: Trace the citation-marker parsing by hand (no browser available)**

Confirm by reading `renderAnswerText`: for the text `"Use cursor pagination {{1}}. Version behind /v2/ {{1}}."`, `text.split(/(\{\{\d+\}\})/g)` (a capturing group, so the delimiters themselves are kept in the output array) produces `["Use cursor pagination ", "{{1}}", ". Version behind /v2/ ", "{{1}}", "."]` — five parts, alternating plain text and markers. Each part is tested against `/^\{\{(\d+)\}\}$/`: the plain-text parts don't match (rendered as `<span>`), the two `"{{1}}"` parts do match (rendered as `<CitationChip number={1} />` each) — so the same chip number can legitimately appear twice inline for two different claims from the same source, which is intentional, not a bug.

- [ ] **Step 5: Commit**

```bash
git add src/components/askAiComponent/UserMessageBubble.tsx src/components/askAiComponent/AssistantMessageBubble.tsx
git commit -m "feat: add Ask AI message bubble components"
```

---

## Task 5: AskAiPanelBody (visual chrome)

**Files:**

- Create: `src/components/askAiComponent/AskAiPanelBody.tsx`

**Interfaces:**

- Consumes: `UserMessageBubble`, `AssistantMessageBubble` from Task 4; `ChatMessage` type from Task 1.
- Produces: `AskAiPanelBody` component with props `{ messages: ChatMessage[]; inputValue: string; onInputChange: (value: string) => void; onSend: () => void; onFeedback: (messageId: string, vote: "helpful" | "not-helpful", comment?: string) => void; onClose: () => void; spaceCount: number; prefersReducedMotion: boolean | null }` — consumed by Task 6's `AskAiPanel`.

This component owns none of the conversation _state_ — it's the panel's visual chrome: header (title + scope line + close button, copied from the existing `AskAiStubPanel`), a scrollable thread that renders `messages` and auto-scrolls to the newest one, and a composer `<form>` at the bottom. It receives `messages`/`inputValue` as props and reports user actions (`onInputChange`, `onSend`, `onFeedback`, `onClose`) back up — the same "presentational, callbacks bubble up" shape as `DocumentTable`/`NeedsAttentionList`.

- [ ] **Step 1: Write the component**

```tsx
// src/components/askAiComponent/AskAiPanelBody.tsx
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, X } from "lucide-react";
import type { ChatMessage } from "../../types";
import { UserMessageBubble } from "./UserMessageBubble";
import { AssistantMessageBubble } from "./AssistantMessageBubble";

interface AskAiPanelBodyProps {
  messages: ChatMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onFeedback: (
    messageId: string,
    vote: "helpful" | "not-helpful",
    comment?: string,
  ) => void;
  onClose: () => void;
  spaceCount: number;
  prefersReducedMotion: boolean | null;
}

// Floating slide-over panel's visual chrome (440px, right-aligned), same
// pattern as AskAiStubPanel/DocumentDetailPanel/DocumentFormPanel. Unlike
// those two document panels, this component owns no conversation state
// itself — AskAiPanel (Task 6) keeps `messages` alive across close/reopen
// by never unmounting it; only this chrome mounts/unmounts per open.
export function AskAiPanelBody({
  messages,
  inputValue,
  onInputChange,
  onSend,
  onFeedback,
  onClose,
  spaceCount,
  prefersReducedMotion,
}: AskAiPanelBodyProps) {
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [messages.length, prefersReducedMotion]);

  return (
    <div className="fixed inset-0 z-40">
      <motion.button
        type="button"
        aria-label="Close Ask AI panel"
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
        className="bg-surface absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col p-5 shadow-lg"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="font-display text-ink flex items-center gap-2 text-xl font-semibold">
              <Sparkles size={18} className="text-accent" />
              Ask AI
            </h2>
            {/* MOCK: space count comes from mockCurrentUser.memberships.length */}
            <p className="text-ink-muted text-sm">
              Searching across {spaceCount} spaces you have access to
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Ask AI panel"
            className="text-ink-muted hover:bg-surface-sunken flex size-9 shrink-0 items-center justify-center rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto py-2">
          {messages.length === 0 ? (
            <div className="text-ink-muted flex h-full items-center justify-center text-center text-sm">
              Ask a question about any document you have access to.
            </div>
          ) : (
            messages.map((message) =>
              message.role === "user" ? (
                <UserMessageBubble key={message.id} message={message} />
              ) : (
                <AssistantMessageBubble
                  key={message.id}
                  message={message}
                  onFeedback={onFeedback}
                />
              ),
            )
          )}
          <div ref={threadEndRef} />
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSend();
          }}
          className="mt-3 flex gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="Ask a question…"
            className="border-border text-ink placeholder:text-ink-muted focus:border-accent flex-1 rounded-md border px-3 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            aria-label="Send"
            className="bg-accent flex size-10 shrink-0 items-center justify-center rounded-md text-white disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npm run build && npm run lint`
Expected: both succeed. No consumers yet (Task 6 wires this in).

- [ ] **Step 3: Trace the auto-scroll and submit wiring by hand (no browser available)**

Confirm by reading the code: the `useEffect` depends on `[messages.length, prefersReducedMotion]`, so it re-runs every time a message is added (not on every render — feedback-vote updates change a message's `feedback` field but not the array's length, so voting doesn't re-trigger a scroll-jump, which is correct — the user shouldn't get yanked back to the bottom just for clicking 👍 on an earlier answer). The composer is a real `<form>` with `onSubmit` calling `event.preventDefault()` then `onSend()`, so both pressing Enter in the input and clicking the Send button trigger the same path — not two divergent handlers. The Send button is `disabled` whenever `inputValue.trim()` is empty, so an empty/whitespace-only question can't be submitted via either path.

- [ ] **Step 4: Commit**

```bash
git add src/components/askAiComponent/AskAiPanelBody.tsx
git commit -m "feat: add AskAiPanelBody chrome component"
```

---

## Task 6: AskAiPanel (state and mock-answer wiring)

**Files:**

- Create: `src/components/askAiComponent/AskAiPanel.tsx`

**Interfaces:**

- Consumes: `AskAiPanelBody` from Task 5; `findAnswer` from Task 2; `ChatMessage`, `UserChatMessage`, `AssistantChatMessage` types from Task 1.
- Produces: `AskAiPanel` component with props `{ isOpen: boolean; onClose: () => void; spaceCount: number; accessibleSpaceIds: string[]; selectedSpaceName: string; onLogKnowledgeGap: (question: string) => void }` — consumed by Task 7's `PortalShell`.

This is the top-level component `PortalShell` will render instead of `AskAiStubPanel`. It owns `messages`/`inputValue` as its own `useState` (declared in `AskAiPanel`, not inside the `AnimatePresence`-gated body), calls `findAnswer` synchronously on submit, and — critically — calls `onLogKnowledgeGap` whenever the answer comes back low-confidence. It never calls `toast` itself; feedback acknowledgement is the inline text `FeedbackRow` already shows, and there's no other action here that warrants a toast (unlike Document create/delete, "sending a chat message" isn't the kind of action this codebase toasts for elsewhere — the panel's own UI is the feedback).

- [ ] **Step 1: Write the component**

```tsx
// src/components/askAiComponent/AskAiPanel.tsx
import { useState } from "react";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import type {
  AssistantChatMessage,
  ChatMessage,
  UserChatMessage,
} from "../../types";
import { findAnswer } from "./mockAiKnowledgeBase";
import { AskAiPanelBody } from "./AskAiPanelBody";

interface AskAiPanelProps {
  isOpen: boolean;
  onClose: () => void;
  spaceCount: number;
  /** Space ids the current user has access to — passed to findAnswer so citations never leak a document from a Space the user can't see. */
  accessibleSpaceIds: string[];
  /** Used only in the low-confidence answer's copy ("logged to {space}'s Needs attention queue"). */
  selectedSpaceName: string;
  onLogKnowledgeGap: (question: string) => void;
}

// Top-level Ask AI panel. Deliberately keeps `messages`/`inputValue` state
// here, one level above the isOpen-gated AskAiPanelBody — this component
// itself stays mounted for as long as PortalShell is mounted (see
// PortalShell.tsx, where it's rendered outside the nav-key-conditional
// <main> block, same as the panel it replaces), so closing and reopening
// the panel preserves the conversation. Only a Space switch (which
// remounts PortalShell entirely) resets it — already true today for
// isAskAiOpen itself, so this isn't a new limitation.
export function AskAiPanel({
  isOpen,
  onClose,
  spaceCount,
  accessibleSpaceIds,
  selectedSpaceName,
  onLogKnowledgeGap,
}: AskAiPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const prefersReducedMotion = useReducedMotion();

  const handleSend = () => {
    const question = inputValue.trim();
    if (!question) return;

    const userMessage: UserChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: "user",
      question,
    };

    const answer = findAnswer(question, accessibleSpaceIds, selectedSpaceName);
    const assistantMessage: AssistantChatMessage = {
      id: `msg-${Date.now()}-a`,
      role: "assistant",
      answer,
      feedback: null,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInputValue("");

    if (answer.isLowConfidence) {
      onLogKnowledgeGap(question);
    }
  };

  const handleFeedback = (
    messageId: string,
    vote: "helpful" | "not-helpful",
    comment?: string,
  ) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId && message.role === "assistant"
          ? { ...message, feedback: vote, feedbackComment: comment }
          : message,
      ),
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <AskAiPanelBody
          messages={messages}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSend={handleSend}
          onFeedback={handleFeedback}
          onClose={onClose}
          spaceCount={spaceCount}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npm run build && npm run lint`
Expected: both succeed. No consumers yet (Task 7 wires this in).

- [ ] **Step 3: Trace the send/gap-logging flow by hand (no browser available)**

Confirm by reading the code: `handleSend` builds the user message and immediately calls `findAnswer` synchronously (no `setTimeout`/loading state) — both the user's question and the assistant's reply are appended to `messages` in the same state update. When `answer.isLowConfidence` is `true`, `onLogKnowledgeGap(question)` fires — this happens exactly once per low-confidence question, not once per render, since it's inside the event handler, not an effect. Confirm `messages`/`inputValue` are declared in `AskAiPanel`, not in `AskAiPanelBody` — meaning `AnimatePresence`'s `{isOpen && <AskAiPanelBody .../>}` unmounting `AskAiPanelBody` on close does NOT clear the thread, since the thread's state lives one component higher, outside that conditional.

- [ ] **Step 4: Commit**

```bash
git add src/components/askAiComponent/AskAiPanel.tsx
git commit -m "feat: add AskAiPanel with mock answer and gap logging"
```

---

## Task 7: Wire AskAiPanel into PortalShell

**Files:**

- Modify: `src/components/shell/PortalShell.tsx`
- Delete: `src/components/shell/AskAiStubPanel.tsx`

**Interfaces:**

- Consumes: `AskAiPanel` from Task 6.
- Produces: no new exports — `PortalShell` has no external consumers of its own besides the router, so this task only needs internal correctness.

- [ ] **Step 1: Swap the import**

In `src/components/shell/PortalShell.tsx`, change:

```ts
import { AskAiStubPanel } from "./AskAiStubPanel";
```

to:

```ts
import { AskAiPanel } from "../askAiComponent/AskAiPanel";
```

- [ ] **Step 2: Add `accessibleSpaceIds` and `handleLogKnowledgeGap`**

Immediately after the existing `canManageDocuments` line (`const canManageDocuments = currentUser.isAdmin || membership.role === "Editor";`), add:

```ts
const accessibleSpaceIds = currentUser.memberships.map((m) => m.space.id);
```

Immediately after the existing `handleIgnoreGap` function (the block reading `const handleIgnoreGap = (id: string) => { setKnowledgeGaps((prev) => prev.filter((gap) => gap.id !== id)); toast.info("Question ignored."); };`), add:

```ts
const handleLogKnowledgeGap = (question: string) => {
  setKnowledgeGaps((prev) => {
    const existing = prev.find(
      (gap) => gap.question.toLowerCase() === question.toLowerCase(),
    );
    if (existing) {
      return prev.map((gap) =>
        gap.id === existing.id
          ? { ...gap, askedCount: gap.askedCount + 1 }
          : gap,
      );
    }
    return [
      ...prev,
      {
        id: `gap-${Date.now()}`,
        spaceId: selectedSpace.id,
        question,
        askedCount: 1,
      },
    ];
  });
};
```

This mirrors `handleCreateDocument`'s "append if new" shape, but also handles the case where the exact same question (case-insensitively) was already logged and is still sitting in the queue — re-asking it bumps `askedCount` instead of creating a duplicate entry, which matches how a real knowledge-gap tracker would behave and keeps `askedCount` meaningful.

- [ ] **Step 3: Replace the panel render**

Replace:

```tsx
{
  /* Ask AI floating panel stub — spec piece 5, chrome only */
}
<AskAiStubPanel
  isOpen={isAskAiOpen}
  onClose={() => setIsAskAiOpen(false)}
  spaceCount={currentUser.memberships.length}
/>;
```

with:

```tsx
{
  /* Ask AI floating panel — spec piece 5 */
}
<AskAiPanel
  isOpen={isAskAiOpen}
  onClose={() => setIsAskAiOpen(false)}
  spaceCount={currentUser.memberships.length}
  accessibleSpaceIds={accessibleSpaceIds}
  selectedSpaceName={selectedSpace.name}
  onLogKnowledgeGap={handleLogKnowledgeGap}
/>;
```

- [ ] **Step 4: Delete the stub file**

```bash
git rm src/components/shell/AskAiStubPanel.tsx
```

- [ ] **Step 5: Type-check and lint**

Run: `npm run build && npm run lint`
Expected: both succeed. Confirm there is no remaining reference to `AskAiStubPanel` anywhere in `src/` — `grep -rn "AskAiStubPanel" src` should return nothing.

- [ ] **Step 6: Trace the full flow by hand (no browser available)**

Confirm by reading the code:

- Clicking the "Ask AI" nav item / rail icon / bottom-tab icon toggles `isAskAiOpen` (unchanged wiring, already correct before this task) → `AskAiPanel` receives `isOpen={true}` → renders `AskAiPanelBody`.
- Typing a matched question (e.g. containing "pagination") and sending it produces a two-message exchange citing a real document from `mockDocuments`, with a Space badge matching that document's actual `spaceId` via `mockSpaces`.
- Typing an unmatched question produces the low-confidence reply AND calls `handleLogKnowledgeGap`, which either bumps an existing matching gap's `askedCount` or appends a new `KnowledgeGapItem` with `spaceId: selectedSpace.id` to `knowledgeGaps` state — the SAME `knowledgeGaps` state already feeding the sidebar/rail "Needs attention" badge and the Document Library's Needs-attention tab, so a logged gap is immediately visible there without any extra wiring.
- Closing the panel (X or backdrop) and reopening it (still the same Space) shows the same conversation — because `messages` lives in `AskAiPanel`, which `PortalShell` never unmounts on this toggle.
- Switching to a different Space navigates to a new URL, remounting `PortalShell` (and therefore `AskAiPanel`) — `isAskAiOpen` resets to `false` and a fresh `AskAiPanel` mount means `messages` resets to `[]`, matching the existing pre-task behavior for `isAskAiOpen` and the plan's stated scope boundary.
- Opening Ask AI while the Document Detail or Upload/Edit panel is already open is not reachable via the mouse — both of those panels' full-screen `z-40` backdrops sit over every nav trigger, so a click there closes them instead of reaching Ask AI's toggle; the same is true in reverse. No new mutual-exclusion logic is needed — this already held for the existing stub and continues to hold for the real panel.

- [ ] **Step 7: Commit**

```bash
git add src/components/shell/PortalShell.tsx
git rm src/components/shell/AskAiStubPanel.tsx
git commit -m "feat: wire real AskAiPanel into PortalShell"
```
