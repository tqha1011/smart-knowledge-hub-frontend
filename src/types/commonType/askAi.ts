// A cited source shown inline (as a numbered chip) and repeated in the
// sources list below an assistant answer. No Space field — answers only
// ever cite documents in the currently selected Space (already named in
// the panel header), so there's nothing to disambiguate per citation.
export interface AskAiCitation {
  chipNumber: number;
  documentId: string;
  documentTitle: string;
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
