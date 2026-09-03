// A cited source, listed under an assistant answer (numbered chip +
// title + excerpt). The backend doesn't mark where in the answer text a
// source applies, so citations render as a trailing list, not inline
// markers. No Space field — answers only ever cite documents in the
// currently selected Space (already named in the panel header), so
// there's nothing to disambiguate per citation.
export interface AskAiCitation {
  chipNumber: number;
  documentId: string;
  documentTitle: string;
  excerpt: string;
}

export type FeedbackVote = "helpful" | "not-helpful" | null;

// Empty `citations` means no source was found for the question (the
// backend returns an empty `sources` list — including for small talk,
// where "no source" isn't really a knowledge gap).
export interface AssistantAnswer {
  text: string;
  citations: AskAiCitation[];
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
